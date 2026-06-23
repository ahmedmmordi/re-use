import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  Loader2,
  AlertCircle,
  FileDown,
  RefreshCw,
} from "lucide-react";

import {
  getAdminDashboard,
  type DashboardPeriod,
  type DashboardResponse,
  type SalesByCategory,
} from "../services/adminAnalyticsService";

// ── Brand palette ───────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#7C3AED",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
];

const MAX_PIE_SLICES = 5;

function topCategories(data: SalesByCategory[]): SalesByCategory[] {
  if (data.length <= MAX_PIE_SLICES) return data;
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  const top = sorted.slice(0, MAX_PIE_SLICES);
  const other = sorted.slice(MAX_PIE_SLICES);
  top.push({
    categoryName: "Other",
    orderCount: other.reduce((s, c) => s + c.orderCount, 0),
    revenue: other.reduce((s, c) => s + c.revenue, 0),
    percentage: other.reduce((s, c) => s + c.percentage, 0),
  });
  return top;
}

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "Last7Days", label: "7d" },
  { value: "Last30Days", label: "30d" },
  { value: "Last90Days", label: "3m" },
  { value: "ThisYear", label: "1y" },
  { value: "AllTime", label: "All" },
];

type Tab = "sales" | "activity" | "products" | "sellers";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function csvEscape(val: unknown): string {
  let s = String(val ?? "");
  if (/^[=+\-@]/.test(s)) {
    s = `'${s}`;
  }
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF";
  const content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

// ── Custom tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}:{" "}
          {typeof entry.value === "number"
            ? entry.name === "Revenue"
              ? formatCurrencyFull(entry.value)
              : formatNumber(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

const REFRESH_SECONDS = 600;

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("Last7Days");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("sales");
  const [productPage, setProductPage] = useState(0);
  const [sellerPage, setSellerPage] = useState(0);
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  const requestId = useRef(0);

  const load = async (p: DashboardPeriod, pp = 0, sp = 0) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminDashboard(p, pp, 10, sp, 10);
      if (id !== requestId.current) return;
      setData(result);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(getErrorMessage(err));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setCountdown(REFRESH_SECONDS);
      }
    }
  };

  useEffect(() => {
    setProductPage(0);
    setSellerPage(0);
  }, [period]);

  useEffect(() => {
    load(period, productPage, sellerPage);
  }, [period, productPage, sellerPage]);

  useEffect(() => {
    if (loading) return;
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          load(period, productPage, sellerPage);
          return REFRESH_SECONDS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [loading, period, productPage, sellerPage]);

  // ── CSV exports ──────────────────────────────────────────────────────────

  const exportSalesReport = () => {
    if (!data) return;
    const rows = data.revenueTrend.map((r) => [r.month, String(r.revenue)]);
    downloadCsv(`sales-report-${period}.csv`, ["Month", "Revenue"], rows);
  };

  const exportUserActivity = () => {
    if (!data) return;
    const rows = data.userActivity.map((u) => [u.week, String(u.newUsers)]);
    downloadCsv(`user-activity-${period}.csv`, ["Week", "New Users"], rows);
  };

  const exportProductPerformance = () => {
    if (!data) return;
    const rows = data.productPerformance.items.map((p) => [
      String(p.rank),
      csvEscape(p.productName),
      csvEscape(p.category),
      String(p.sales),
      String(p.revenue),
      String(p.views),
      csvEscape(p.conversion),
    ]);
    downloadCsv(
      `product-performance-${period}.csv`,
      ["Rank", "Product Name", "Category", "Sales", "Revenue", "Views", "Conversion"],
      rows
    );
  };

  const exportTopSellers = () => {
    if (!data) return;
    const rows = data.topSellers.items.map((s) => [
      String(s.rank),
      csvEscape(s.sellerName),
      String(s.productCount),
      String(s.totalSales),
      String(s.revenue),
      String(s.rating),
      csvEscape(s.performance),
    ]);
    downloadCsv(
      `top-sellers-${period}.csv`,
      ["Rank", "Seller Name", "Products", "Total Sales", "Revenue", "Rating", "Performance"],
      rows
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Reports</h1>
            <p className="text-gray-600 text-base">Sales, activity, and performance reports</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => load(period, productPage, sellerPage)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
              </span>
            </button>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setPeriod(opt.value);
                  setProductPage(0);
                  setSellerPage(0);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  period === opt.value
                    ? "bg-[#3d2e7c] text-white shadow-sm"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="p-16 text-center bg-white border border-gray-100 rounded-xl">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading dashboard data…</p>
          </div>
        )}
        {error && !loading && (
          <div className="p-16 text-center bg-white border border-red-200 rounded-xl">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
              <SummaryCard
                label="Total Revenue"
                value={formatCurrency(data.summary.totalRevenue)}
                icon={<DollarSign className="w-5 h-5 text-[#7C3AED]" />}
              />
              <SummaryCard
                label="Total Orders"
                value={formatNumber(data.summary.totalOrders)}
                icon={<ShoppingCart className="w-5 h-5 text-[#3B82F6]" />}
              />
              <SummaryCard
                label="Avg Order Value"
                value={formatCurrency(data.summary.avgOrderValue)}
                icon={<TrendingUp className="w-5 h-5 text-[#10B981]" />}
              />
              <SummaryCard
                label="Total Users"
                value={formatNumber(data.summary.totalUsers)}
                icon={<Users className="w-5 h-5 text-[#F59E0B]" />}
              />
              <SummaryCard
                label="Active Products"
                value={formatNumber(data.summary.activeProducts)}
                icon={<Package className="w-5 h-5 text-[#8B5CF6]" />}
              />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(
                [
                  { id: "sales" as Tab, label: "Sales Report" },
                  { id: "activity" as Tab, label: "User Activity" },
                  { id: "products" as Tab, label: "Product Performance" },
                  { id: "sellers" as Tab, label: "Top Sellers" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === t.id
                      ? "bg-[#3d2e7c] text-white shadow-sm"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sales Report */}
            {tab === "sales" && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={exportSalesReport}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {/* Revenue Trend */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                  {data.revenueTrend.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#7C3AED"
                          strokeWidth={2}
                          dot={{ fill: "#7C3AED", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Order Volume + Sales by Category side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Volume</h3>
                    {data.orderVolume.length === 0 ? (
                      <EmptyChart />
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.orderVolume}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} />
                          <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar
                            dataKey="orders"
                            name="Orders"
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
                    {data.salesByCategory.length === 0 ? (
                      <EmptyChart />
                    ) : (
                      <div className="overflow-visible">
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={topCategories(data.salesByCategory)}
                              dataKey="revenue"
                              nameKey="categoryName"
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={110}
                              paddingAngle={3}
                              label={({ percent }: { percent?: number }) =>
                                `${((percent ?? 0) * 100).toFixed(0)}%`
                              }
                            >
                              {topCategories(data.salesByCategory).map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User Activity */}
            {tab === "activity" && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={exportUserActivity}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">New Users Per Week</h3>
                  {data.userActivity.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={data.userActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B7280" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="newUsers"
                          name="New Users"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Product Performance */}
            {tab === "products" && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={exportProductPerformance}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {data.productPerformance.totalCount === 0 ? (
                  <div className="p-12 text-center bg-white border border-gray-100 rounded-xl">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No product performance data available</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <Th>Rank</Th>
                            <Th>Product Name</Th>
                            <Th>Category</Th>
                            <Th>Sales</Th>
                            <Th>Revenue</Th>
                            <Th>Views</Th>
                            <Th>Conversion</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.productPerformance.items.map((row) => (
                            <tr
                              key={row.rank}
                              className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                            >
                              <Td>{row.rank}</Td>
                              <Td className="font-medium text-gray-900">{row.productName}</Td>
                              <Td>{row.category}</Td>
                              <Td>{formatNumber(row.sales)}</Td>
                              <Td>{formatCurrencyFull(row.revenue)}</Td>
                              <Td>{formatNumber(row.views)}</Td>
                              <Td>
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-[#7C3AED]/10 text-[#7C3AED]">
                                  {row.conversion}
                                </span>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      page={data.productPerformance.page}
                      totalPages={data.productPerformance.totalPages}
                      onChange={setProductPage}
                    />
                  </>
                )}
              </div>
            )}

            {/* Top Sellers */}
            {tab === "sellers" && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={exportTopSellers}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {data.topSellers.totalCount === 0 ? (
                  <div className="p-12 text-center bg-white border border-gray-100 rounded-xl">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No seller data available</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <Th>Rank</Th>
                            <Th>Seller Name</Th>
                            <Th>Products</Th>
                            <Th>Total Sales</Th>
                            <Th>Revenue</Th>
                            <Th>Rating</Th>
                            <Th>Performance</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topSellers.items.map((row) => (
                            <tr
                              key={row.rank}
                              className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                            >
                              <Td>{row.rank}</Td>
                              <Td className="font-medium text-gray-900">{row.sellerName}</Td>
                              <Td>{row.productCount}</Td>
                              <Td>{formatNumber(row.totalSales)}</Td>
                              <Td>{formatCurrencyFull(row.revenue)}</Td>
                              <Td>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                    row.rating >= 4.5
                                      ? "bg-green-100 text-green-700"
                                      : row.rating >= 4.0
                                        ? "bg-blue-100 text-blue-700"
                                        : row.rating >= 3.0
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {row.rating.toFixed(1)}
                                </span>
                              </Td>
                              <Td>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                                    row.performance === "Excellent"
                                      ? "bg-green-100 text-green-700"
                                      : row.performance === "Good"
                                        ? "bg-blue-100 text-blue-700"
                                        : row.performance === "Average"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {row.performance}
                                </span>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      page={data.topSellers.page}
                      totalPages={data.topSellers.totalPages}
                      onChange={setSellerPage}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 font-medium text-sm">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-gray-600 ${className ?? ""}`}>{children}</td>;
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
      No data available for this period
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            i === page
              ? "bg-[#3d2e7c] text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}
