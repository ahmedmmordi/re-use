import { useCallback, useEffect, useRef, useState } from "react";
import {
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Target,
  MessageSquare,
  Filter,
  Eye,
  Edit,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Pagination } from "./ui/Pagination";

import {
  getBroadcasts,
  getBroadcastStats,
  createDraft,
  updateDraft,
  sendBroadcast,
  scheduleBroadcast,
  deleteBroadcast,
  type BroadcastResponse,
  type BroadcastStatus,
  type BroadcastAudience,
  type BroadcastSummaryStats,
} from "../services/broadcastService";
import { AuthError } from "../services/authService";

// ── helpers ──────────────────────────────────────────────────────────────────

function getErrorMessage(err: unknown): string {
  if (err instanceof AuthError) {
    if (err.errors) {
      if (typeof err.errors === "string") return err.errors;
      const first = Object.values(err.errors).flat()[0];
      if (first) return first;
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong.";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format a Date as a YYYY-MM-DD string using LOCAL date fields (not UTC).
 * Used to pre-fill <input type="date">, which expects local-calendar values.
 * Using `toISOString()` here would shift the date for any user whose local
 * offset from UTC crosses midnight relative to the stored instant.
 */
function formatDateInputLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date as a HH:MM string using LOCAL time fields, to pair with
 * formatDateInputLocal so the date and time inputs always agree on the
 * same local instant.
 */
function formatTimeInputLocal(d: Date): string {
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

const PAGE_SIZE = 10;

// ── status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BroadcastStatus }) {
  switch (status) {
    case "Sent":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Sent
        </Badge>
      );
    case "Scheduled":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Clock className="w-3 h-3 mr-1" />
          Scheduled
        </Badge>
      );
    case "Draft":
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          <Edit className="w-3 h-3 mr-1" />
          Draft
        </Badge>
      );
    case "Processing":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case "Failed":
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
}

function AudienceBadge({ audience }: { audience: BroadcastAudience }) {
  const colors: Record<BroadcastAudience, string> = {
    All: "bg-purple-100 text-purple-700",
    Users: "bg-blue-100 text-blue-700",
    Admins: "bg-red-100 text-red-700",
  };
  return (
    <Badge className={`${colors[audience]} hover:${colors[audience]}`}>
      <Target className="w-3 h-3 mr-1" />
      {audience}
    </Badge>
  );
}

// ── empty form ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  body: "",
  targetAudience: "All" as BroadcastAudience,
  scheduleType: "now" as "now" | "schedule",
  scheduleDate: "",
  scheduleTime: "",
};

// ── toast system ─────────────────────────────────────────────────────────────

type NotificationType = "success" | "error";

interface Toast {
  id: number;
  type: NotificationType;
  message: string;
  removing: boolean;
}

function useToasts(autoDismissMs = 4000) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  /** Begin exit animation, then remove from state after animation completes. */
  const startRemove = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
  }, []);

  const removeNow = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type: NotificationType, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message, removing: false }]);
      setTimeout(() => startRemove(id), autoDismissMs);
    },
    [autoDismissMs, startRemove]
  );

  return { toasts, showNotification: show, startRemove, removeNow };
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: number) => void;
  onRemoveNow: (id: number) => void;
}

function ToastItem({ toast, onDismiss, onRemoveNow }: ToastItemProps) {
  const isSuccess = toast.type === "success";
  const Icon = isSuccess ? CheckCircle : XCircle;

  const containerClass = isSuccess
    ? "bg-green-50 border border-green-200 text-green-800"
    : "bg-red-50 border border-red-200 text-red-800";
  const iconClass = isSuccess ? "text-green-500" : "text-red-500";
  const dismissClass = isSuccess
    ? "text-green-500 hover:text-green-700 hover:bg-green-100"
    : "text-red-500 hover:text-red-700 hover:bg-red-100";

  return (
    <div
      role="alert"
      aria-live="polite"
      onAnimationEnd={() => {
        if (toast.removing) onRemoveNow(toast.id);
      }}
      className={[
        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium shadow-md",
        "duration-300",
        toast.removing
          ? "animate-out fade-out slide-out-to-right-2"
          : "animate-in fade-in slide-in-from-top-2",
        containerClass,
      ].join(" ")}
    >
      <Icon className={`w-5 h-5 shrink-0 ${iconClass}`} />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className={`p-1 rounded-md transition-colors ${dismissClass}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
  onRemoveNow: (id: number) => void;
}

function ToastContainer({ toasts, onDismiss, onRemoveNow }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} onRemoveNow={onRemoveNow} />
        </div>
      ))}
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export function NotificationBroadcastPage() {
  const [activeTab, setActiveTab] = useState("compose");

  // toast queue
  const { toasts, showNotification, startRemove, removeNow } = useToasts(4000);

  // stats
  const [stats, setStats] = useState<BroadcastSummaryStats | null>(null);

  // history list
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [historyState, setHistoryState] = useState<{
    broadcasts: BroadcastResponse[];
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  }>({ broadcasts: [], totalPages: 1, isLoading: false, error: null });

  // compose form
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // edit draft
  const [editingDraft, setEditingDraft] = useState<BroadcastResponse | null>(null);

  // delete dialog
  const [deleteTarget, setDeleteTarget] = useState<BroadcastResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // view dialog
  const [viewTarget, setViewTarget] = useState<BroadcastResponse | null>(null);

  // ── fetch stats ──────────────────────────────────────────────────────────
  useEffect(() => {
    getBroadcastStats()
      .then(setStats)
      .catch(() => {
        /* stats are non-critical */
      });
  }, []);

  // ── fetch history ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "history") return;

    let cancelled = false;

    const fetchBroadcasts = async () => {
      setHistoryState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const statusParam = filterStatus === "all" ? undefined : (filterStatus as BroadcastStatus);

        const res = await getBroadcasts({
          pageNumber: currentPage,
          pageSize: PAGE_SIZE,
          status: statusParam,
        });

        if (cancelled) return;

        setHistoryState({
          broadcasts: res.data,
          totalPages: res.totalPages,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;

        setHistoryState((prev) => ({
          ...prev,
          isLoading: false,
          error: getErrorMessage(err),
        }));
      }
    };

    fetchBroadcasts();

    return () => {
      cancelled = true;
    };
  }, [activeTab, currentPage, filterStatus]);

  // ── helpers ───────────────────────────────────────────────────────────────

  function buildScheduledAt(): string | null {
    if (formData.scheduleType !== "schedule") return null;
    if (!formData.scheduleDate || !formData.scheduleTime) return null;
    return new Date(`${formData.scheduleDate}T${formData.scheduleTime}`).toISOString();
  }

  function resetForm() {
    setFormData(EMPTY_FORM);
    setEditingDraft(null);
  }

  function refreshHistory() {
    setActiveTab("history");
    // trigger re-fetch via useEffect dependency
    setCurrentPage(1);
    getBroadcastStats()
      .then(setStats)
      .catch(() => {});
  }

  // ── compose actions ───────────────────────────────────────────────────────
  const isScheduleDateTimeMissing =
    formData.scheduleType === "schedule" && (!formData.scheduleDate || !formData.scheduleTime);

  async function handleSend() {
    if (isScheduleDateTimeMissing) {
      showNotification("error", "Choose a date and time before scheduling.");
      return;
    }
    setIsSending(true);
    try {
      const request = {
        title: formData.title,
        body: formData.body,
        targetAudience: formData.targetAudience,
        scheduledAt: buildScheduledAt(),
      };

      if (formData.scheduleType === "now") {
        await sendBroadcast(request);
        showNotification("success", "Broadcast sent successfully!");
      } else {
        await scheduleBroadcast(request);
        showNotification("success", "Broadcast scheduled successfully!");
      }

      // If this content came from an existing draft, remove that draft now
      // that it has gone out as a new broadcast. Otherwise the original
      // draft is left behind in history, looking unactioned, and someone
      // could accidentally resend its (now stale) content later.
      if (editingDraft) {
        try {
          await deleteBroadcast(editingDraft.id);
        } catch {
          // Non-critical: the broadcast itself sent/scheduled successfully.
          // The leftover draft can still be removed manually from History.
        }
      }

      resetForm();
      refreshHistory();
    } catch (err) {
      showNotification("error", getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  async function handleSaveDraft() {
    setIsSavingDraft(true);
    try {
      const request = {
        title: formData.title,
        body: formData.body,
        targetAudience: formData.targetAudience,
        scheduledAt: buildScheduledAt(),
      };

      if (editingDraft) {
        await updateDraft(editingDraft.id, request);
        showNotification("success", "Draft updated successfully!");
      } else {
        await createDraft(request);
        showNotification("success", "Draft saved successfully!");
      }

      resetForm();
      refreshHistory();
    } catch (err) {
      showNotification("error", getErrorMessage(err));
    } finally {
      setIsSavingDraft(false);
    }
  }

  // ── history actions ───────────────────────────────────────────────────────

  function handleEditDraft(broadcast: BroadcastResponse) {
    setEditingDraft(broadcast);
    const scheduledAt = broadcast.scheduledAt ? new Date(broadcast.scheduledAt) : null;
    setFormData({
      title: broadcast.title,
      body: broadcast.body,
      targetAudience: broadcast.targetAudience,
      scheduleType: scheduledAt ? "schedule" : "now",
      scheduleDate: scheduledAt ? formatDateInputLocal(scheduledAt) : "",
      scheduleTime: scheduledAt ? formatTimeInputLocal(scheduledAt) : "",
    });
    setActiveTab("compose");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBroadcast(deleteTarget.id);
      showNotification("success", "Broadcast deleted.");
      setDeleteTarget(null);
      setCurrentPage(1);
      getBroadcastStats()
        .then(setStats)
        .catch(() => {});
      // re-fetch list
      const statusParam = filterStatus === "all" ? undefined : (filterStatus as BroadcastStatus);
      const res = await getBroadcasts({ pageNumber: 1, pageSize: PAGE_SIZE, status: statusParam });
      setHistoryState({
        broadcasts: res.data,
        totalPages: res.totalPages,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      showNotification("error", getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  // ── delivery rate helper ──────────────────────────────────────────────────
  const deliveryRate =
    stats && stats.totalRecipients > 0
      ? ((stats.totalDelivered / stats.totalRecipients) * 100).toFixed(1)
      : null;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Notification Broadcast</h1>
          <p className="text-gray-600 text-lg">Send notifications and announcements to users</p>
        </div>

        {/* Toast container — fixed top-right, non-blocking */}
        <ToastContainer toasts={toasts} onDismiss={startRemove} onRemoveNow={removeNow} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Total Sent</span>
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats ? stats.totalSent : "—"}</p>
            <p className="text-sm text-gray-500 mt-2">All time</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Scheduled</span>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats ? stats.totalScheduled : "—"}</p>
            <p className="text-sm text-blue-600 mt-2">Pending delivery</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Total Recipients</span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats ? stats.totalRecipients.toLocaleString() : "—"}
            </p>
            <p className="text-sm text-gray-500 mt-2">All time</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Delivery Rate</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {deliveryRate ? `${deliveryRate}%` : "—"}
            </p>
            {deliveryRate && (
              <p className="text-sm text-green-600 mt-2">
                {Number(deliveryRate) >= 95
                  ? "Excellent"
                  : Number(deliveryRate) >= 80
                    ? "Good"
                    : "Needs attention"}
              </p>
            )}
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white border border-gray-100">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200 px-6">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="compose"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#3d2e7c]"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {editingDraft ? "Edit Draft" : "Compose"}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#3d2e7c]"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── Compose Tab ──────────────────────────────────────────────── */}
            <TabsContent value="compose" className="p-8 space-y-6">
              {editingDraft && (
                <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  <Edit className="w-4 h-4 shrink-0" />
                  Editing draft: <span className="font-semibold">{editingDraft.title}</span>
                  <button
                    onClick={resetForm}
                    className="ml-auto text-yellow-600 hover:text-yellow-800 underline text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Notification Title
                </Label>
                <Input
                  id="title"
                  placeholder="Enter notification title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="body" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Message
                </Label>
                <Textarea
                  id="body"
                  placeholder="Type your message here..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">{formData.body.length} characters</p>
              </div>

              <div>
                <Label
                  htmlFor="audience"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Target Audience
                </Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value: BroadcastAudience) =>
                    setFormData({ ...formData, targetAudience: value })
                  }
                >
                  <SelectTrigger id="audience" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Users</SelectItem>
                    <SelectItem value="Users">Regular Users</SelectItem>
                    <SelectItem value="Admins">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Delivery Time
                </Label>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="now"
                      name="scheduleType"
                      value="now"
                      checked={formData.scheduleType === "now"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          scheduleType: e.target.value as "now" | "schedule",
                        })
                      }
                      className="w-4 h-4 text-[#3d2e7c]"
                    />
                    <Label htmlFor="now" className="font-normal cursor-pointer">
                      Send immediately
                    </Label>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="radio"
                        id="schedule"
                        name="scheduleType"
                        value="schedule"
                        checked={formData.scheduleType === "schedule"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scheduleType: e.target.value as "now" | "schedule",
                          })
                        }
                        className="w-4 h-4 text-[#3d2e7c]"
                      />
                      <Label htmlFor="schedule" className="font-normal cursor-pointer">
                        Schedule for later
                      </Label>
                    </div>

                    {formData.scheduleType === "schedule" && (
                      <div className="ml-7 grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="date" className="text-xs text-gray-600 mb-1 block">
                            Date
                          </Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.scheduleDate}
                            onChange={(e) =>
                              setFormData({ ...formData, scheduleDate: e.target.value })
                            }
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="time" className="text-xs text-gray-600 mb-1 block">
                            Time
                          </Label>
                          <Input
                            id="time"
                            type="time"
                            value={formData.scheduleTime}
                            onChange={(e) =>
                              setFormData({ ...formData, scheduleTime: e.target.value })
                            }
                            className="h-10"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button
                  onClick={handleSend}
                  disabled={
                    !formData.title ||
                    !formData.body ||
                    isScheduleDateTimeMissing ||
                    isSending ||
                    isSavingDraft
                  }
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white rounded-xl hover:shadow-xl transition-all duration-200 font-medium"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {formData.scheduleType === "now" ? "Send Now" : "Schedule Broadcast"}
                </Button>

                <Button
                  onClick={handleSaveDraft}
                  disabled={
                    !formData.title ||
                    !formData.body ||
                    isScheduleDateTimeMissing ||
                    isSending ||
                    isSavingDraft
                  }
                  variant="outline"
                  className="flex items-center gap-2 px-8 py-3"
                >
                  {isSavingDraft ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingDraft ? "Update Draft" : "Save Draft"}
                </Button>
              </div>
            </TabsContent>

            {/* ── History Tab ───────────────────────────────────────────────── */}
            <TabsContent value="history" className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Broadcast History</h3>
                <Select
                  value={filterStatus}
                  onValueChange={(val) => {
                    setCurrentPage(1);
                    setFilterStatus(val);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loading */}
              {historyState.isLoading && (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mr-3" />
                  <span>Loading broadcasts…</span>
                </div>
              )}

              {/* Error */}
              {!historyState.isLoading && historyState.error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {historyState.error}
                </div>
              )}

              {/* List */}
              {!historyState.isLoading && !historyState.error && (
                <>
                  <div className="space-y-4">
                    {historyState.broadcasts.map((broadcast) => (
                      <Card
                        key={broadcast.id}
                        className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="text-lg font-bold text-gray-900">{broadcast.title}</h4>
                              <StatusBadge status={broadcast.status} />
                              <AudienceBadge audience={broadcast.targetAudience} />
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{broadcast.body}</p>

                            <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {broadcast.recipientCount.toLocaleString()} recipients
                              </div>
                              {broadcast.status === "Sent" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    {broadcast.deliveredCount.toLocaleString()} delivered
                                  </div>
                                  {broadcast.failedCount > 0 && (
                                    <div className="flex items-center gap-1 text-red-600">
                                      <XCircle className="w-4 h-4" />
                                      {broadcast.failedCount} failed
                                    </div>
                                  )}
                                </>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {broadcast.sentAt
                                  ? formatDateTime(broadcast.sentAt)
                                  : broadcast.scheduledAt
                                    ? `Scheduled: ${formatDateTime(broadcast.scheduledAt)}`
                                    : `Created: ${formatDate(broadcast.createdAt)}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewTarget(broadcast)}
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {broadcast.status === "Draft" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditDraft(broadcast)}
                                  title="Edit draft"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteTarget(broadcast)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {historyState.broadcasts.length === 0 && (
                    <div className="text-center py-16">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No broadcasts found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your filter</p>
                    </div>
                  )}

                  <Pagination
                    currentPage={currentPage}
                    totalPages={historyState.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* ── View Dialog ──────────────────────────────────────────────────────── */}
      <AlertDialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {viewTarget && <StatusBadge status={viewTarget.status} />}
              {viewTarget?.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="text-gray-700">{viewTarget?.body}</p>
                <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
                  <span className="text-gray-500">Audience</span>
                  <span className="font-medium">{viewTarget?.targetAudience}</span>
                  <span className="text-gray-500">Recipients</span>
                  <span className="font-medium">{viewTarget?.recipientCount.toLocaleString()}</span>
                  {viewTarget?.status === "Sent" && (
                    <>
                      <span className="text-gray-500">Delivered</span>
                      <span className="font-medium text-green-600">
                        {viewTarget.deliveredCount.toLocaleString()}
                      </span>
                      <span className="text-gray-500">Failed</span>
                      <span className="font-medium text-red-600">{viewTarget.failedCount}</span>
                    </>
                  )}
                  <span className="text-gray-500">Created by</span>
                  <span className="font-medium">{viewTarget?.createdBy}</span>
                  <span className="text-gray-500">Created at</span>
                  <span className="font-medium">{formatDateTime(viewTarget?.createdAt)}</span>
                  {viewTarget?.sentAt && (
                    <>
                      <span className="text-gray-500">Sent at</span>
                      <span className="font-medium">{formatDateTime(viewTarget.sentAt)}</span>
                    </>
                  )}
                  {viewTarget?.scheduledAt && (
                    <>
                      <span className="text-gray-500">Scheduled at</span>
                      <span className="font-medium">{formatDateTime(viewTarget.scheduledAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Dialog ─────────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the draft{" "}
              <span className="font-semibold">"{deleteTarget?.title}"</span>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
