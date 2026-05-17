import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderTree,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  ChevronRight,
  Package,
  TrendingUp,
  Grid,
  Save,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Input } from "./ui/input";
import {
  getAdminCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryIcon,
  type CategoryResponse,
} from "../services/categoryService";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

interface SubcategoryFormState {
  name: string;
  slug: string;
}

type Banner = { kind: "success"; message: string } | { kind: "error"; message: string } | null;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rollupCount(node: CategoryResponse): number {
  const subSum = (node.subcategories ?? []).reduce((sum, s) => sum + rollupCount(s), 0);
  return node.productCount + subSum;
}

function countSubcategories(node: CategoryResponse): number {
  return (node.subcategories ?? []).length;
}

function totalSubcategoriesAcrossTree(roots: CategoryResponse[]): number {
  let total = 0;
  const walk = (n: CategoryResponse) => {
    total += (n.subcategories ?? []).length;
    (n.subcategories ?? []).forEach(walk);
  };
  roots.forEach(walk);
  return total;
}

function findById(roots: CategoryResponse[], id: string): CategoryResponse | undefined {
  for (const r of roots) {
    if (r.id === id) return r;
    const sub = findById(r.subcategories ?? [], id);
    if (sub) return sub;
  }
  return undefined;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function CategoryManagementPage() {
  const navigate = useNavigate();

  const [tree, setTree] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [banner, setBanner] = useState<Banner>(null);
  const bannerTimer = useRef<number | null>(null);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addSubOpen, setAddSubOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [subForm, setSubForm] = useState<SubcategoryFormState>({
    name: "",
    slug: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Icon upload state per category
  const [iconUploadingId, setIconUploadingId] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const iconTargetIdRef = useRef<string | null>(null);

  const selected = useMemo(
    () => (selectedId ? findById(tree, selectedId) : undefined),
    [tree, selectedId]
  );

  // ── Load tree ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getAdminCategoryTree()
      .then((data) => {
        if (cancelled) return;
        setTree(data);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLoadError(err.message);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadTree = async () => {
    try {
      const data = await getAdminCategoryTree();
      setTree(data);
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
    }
  };

  // ── Banner ─────────────────────────────────────────────────────────────

  const showBanner = (b: Banner) => {
    setBanner(b);
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    };
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────

  const filteredRoots = useMemo(() => {
    let result = tree;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = tree.filter((cat) => cat.name.toLowerCase().includes(q));
    }
    // Sort so inactive categories are at the bottom
    return [...result].sort((a, b) => {
      if (a.isActive === b.isActive) return 0;
      return a.isActive ? -1 : 1;
    });
  }, [tree, searchQuery]);

  const stats = useMemo(() => {
    const totalCategories = tree.length;
    const activeCount = tree.filter((c) => c.isActive).length;
    const totalProducts = tree.reduce((sum, c) => sum + rollupCount(c), 0);
    const mostPopular = [...tree].sort((a, b) => rollupCount(b) - rollupCount(a))[0];
    const totalSubcategories = totalSubcategoriesAcrossTree(tree);
    return {
      totalCategories,
      activeCount,
      totalProducts,
      mostPopular,
      mostPopularCount: mostPopular ? rollupCount(mostPopular) : 0,
      totalSubcategories,
    };
  }, [tree]);

  // ── Toggle expand / menu ───────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Dialog openers ─────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (cat: CategoryResponse) => {
    setSelectedId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      isActive: cat.isActive,
    });
    setFormError(null);
    setEditOpen(true);
    setOpenMenuId(null);
  };

  const openDelete = (cat: CategoryResponse) => {
    setSelectedId(cat.id);
    setDeleteOpen(true);
    setOpenMenuId(null);
  };

  const openAddSub = (cat: CategoryResponse) => {
    setSelectedId(cat.id);
    setSubForm({ name: "", slug: "" });
    setFormError(null);
    setAddSubOpen(true);
    setOpenMenuId(null);
  };

  // ── Validation ─────────────────────────────────────────────────────────

  const validateForm = (f: { name: string; slug: string; description?: string }): string | null => {
    if (!f.name.trim()) return "Name is required";
    if (f.name.length > 100) return "Name must be 100 characters or fewer";
    if (!f.slug.trim()) return "Slug is required";
    if (!SLUG_PATTERN.test(f.slug))
      return "Slug must be lowercase, hyphen-separated (e.g. fashion-apparel)";
    if (f.slug.length > 100) return "Slug must be 100 characters or fewer";
    if (f.description && f.description.length > 500)
      return "Description must be 500 characters or fewer";
    return null;
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────

  const handleCreate = async () => {
    const error = validateForm(form);
    if (error) {
      setFormError(error);
      return;
    }
    setIsSubmitting(true);
    try {
      await createCategory({
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
        parentId: null,
      });
      setCreateOpen(false);
      await reloadTree();
      showBanner({ kind: "success", message: "Category created" });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    const error = validateForm(form);
    if (error) {
      setFormError(error);
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCategory(selected.id, {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
      });
      setEditOpen(false);
      await reloadTree();
      showBanner({ kind: "success", message: "Category updated" });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(selected.id);
      setDeleteOpen(false);
      await reloadTree();
      showBanner({ kind: "success", message: "Category deleted" });
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubcategory = async () => {
    if (!selected) return;
    const error = validateForm(subForm);
    if (error) {
      setFormError(error);
      return;
    }
    setIsSubmitting(true);
    try {
      await createCategory({
        name: subForm.name.trim(),
        slug: subForm.slug.trim(),
        parentId: selected.id,
        isActive: true,
      });
      setAddSubOpen(false);
      setExpandedIds((prev) => new Set(prev).add(selected.id));
      await reloadTree();
      showBanner({ kind: "success", message: "Subcategory added" });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (cat: CategoryResponse) => {
    try {
      await updateCategory(cat.id, { isActive: !cat.isActive });
      await reloadTree();
      showBanner({
        kind: "success",
        message: `Category ${cat.isActive ? "deactivated" : "activated"}`,
      });
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
    }
  };

  // ── Icon upload ────────────────────────────────────────────────────────

  const triggerIconUpload = (categoryId: string) => {
    iconTargetIdRef.current = categoryId;
    iconInputRef.current?.click();
    setOpenMenuId(null);
  };

  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = iconTargetIdRef.current;
    e.target.value = ""; // reset so same file can be re-picked
    if (!file || !targetId) return;

    setIconUploadingId(targetId);
    try {
      await uploadCategoryIcon(targetId, file);
      await reloadTree();
      showBanner({ kind: "success", message: "Icon updated" });
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
    } finally {
      setIconUploadingId(null);
      iconTargetIdRef.current = null;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <input
        ref={iconInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleIconFileChange}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Category Management
              </h1>
              <p className="text-gray-600 text-base md:text-lg">
                Organize and manage product categories
              </p>
            </div>

            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white rounded-xl hover:shadow-xl transition-all duration-200 font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Category
            </button>
          </div>
        </div>

        {/* Banner */}
        {banner && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 ${
              banner.kind === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {banner.kind === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{banner.message}</span>
            <button
              onClick={() => setBanner(null)}
              className="ml-auto text-current/60 hover:text-current"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard
            label="Total Categories"
            value={stats.totalCategories.toString()}
            hint={`${stats.activeCount} active`}
            icon={<FolderTree className="w-5 h-5 text-purple-600" />}
          />
          <StatCard
            label="Total Products"
            value={stats.totalProducts.toLocaleString()}
            hint="Across all categories"
            icon={<Package className="w-5 h-5 text-blue-600" />}
          />
          <StatCard
            label="Most Popular"
            value={stats.mostPopular?.name ?? "—"}
            hint={`${stats.mostPopularCount.toLocaleString()} products`}
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            valueSmall
          />
          <StatCard
            label="Subcategories"
            value={stats.totalSubcategories.toString()}
            hint="Across all categories"
            icon={<Grid className="w-5 h-5 text-orange-600" />}
          />
        </div>

        {/* Search */}
        <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-xl shadow-sm mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="p-16 text-center bg-white border border-gray-100 rounded-xl">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading categories…</p>
          </div>
        ) : loadError ? (
          <div className="p-16 text-center bg-white border border-red-200 rounded-xl">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">{loadError}</p>
          </div>
        ) : filteredRoots.length === 0 ? (
          <div className="p-16 text-center bg-white border border-gray-100 rounded-xl">
            <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No categories found</p>
            <p className="text-gray-400 text-sm">
              {searchQuery
                ? "Try adjusting your search"
                : "Create your first category to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRoots.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                expanded={expandedIds.has(category.id)}
                onToggleExpand={() => toggleExpand(category.id)}
                onToggleActive={() => toggleActive(category)}
                onEdit={() => openEdit(category)}
                onDelete={() => openDelete(category)}
                onAddSubcategory={() => openAddSub(category)}
                onUploadIcon={() => triggerIconUpload(category.id)}
                onViewProducts={() => navigate(`/category/${category.slug}`)}
                isMenuOpen={openMenuId === category.id}
                onToggleMenu={() =>
                  setOpenMenuId((prev) => (prev === category.id ? null : category.id))
                }
                onCloseMenu={() => setOpenMenuId(null)}
                iconUploading={iconUploadingId === category.id}
                onNavigateSub={(subSlug) => navigate(`/category/${subSlug}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Modal
        open={createOpen}
        onClose={() => !isSubmitting && setCreateOpen(false)}
        title="Create New Category"
        description="Add a new category to organize products on the marketplace."
      >
        <CategoryForm value={form} onChange={setForm} />
        <FormError message={formError} />
        <ModalFooter>
          <SecondaryButton onClick={() => setCreateOpen(false)} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={handleCreate}
            disabled={isSubmitting || !form.name || !form.slug}
            loading={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            Create Category
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      {/* Edit dialog */}
      <Modal
        open={editOpen}
        onClose={() => !isSubmitting && setEditOpen(false)}
        title="Edit Category"
        description="Update category information and settings."
      >
        <CategoryForm value={form} onChange={setForm} />
        <FormError message={formError} />
        <ModalFooter>
          <SecondaryButton onClick={() => setEditOpen(false)} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={handleUpdate}
            disabled={isSubmitting || !form.name || !form.slug}
            loading={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            Update Category
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      {/* Add subcategory dialog */}
      <Modal
        open={addSubOpen}
        onClose={() => !isSubmitting && setAddSubOpen(false)}
        title="Add Subcategory"
        description={
          selected ? `Add a new subcategory under "${selected.name}".` : "Add a new subcategory."
        }
      >
        <div className="space-y-4 py-2">
          <Field label="Subcategory Name">
            <Input
              placeholder="e.g. Women's Clothing"
              value={subForm.name}
              onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
            />
          </Field>
          <Field label="Slug (URL)">
            <Input
              placeholder="e.g. womens-clothing"
              value={subForm.slug}
              onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })}
            />
          </Field>
        </div>
        <FormError message={formError} />
        <ModalFooter>
          <SecondaryButton onClick={() => setAddSubOpen(false)} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={handleAddSubcategory}
            disabled={isSubmitting || !subForm.name || !subForm.slug}
            loading={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            Add Subcategory
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      {/* Delete confirmation dialog */}
      <Modal
        open={deleteOpen}
        onClose={() => !isSubmitting && setDeleteOpen(false)}
        title="Delete Category"
        description={
          selected
            ? `Are you sure you want to delete "${selected.name}"? This action cannot be undone and will affect ${rollupCount(selected).toLocaleString()} product(s).`
            : ""
        }
      >
        <ModalFooter>
          <SecondaryButton onClick={() => setDeleteOpen(false)} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete Category
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  valueSmall?: boolean;
}

function StatCard({ label, value, hint, icon, valueSmall }: StatCardProps) {
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 font-medium">{label}</span>
        {icon}
      </div>
      <p className={`font-bold text-gray-900 ${valueSmall ? "text-lg" : "text-3xl"}`}>{value}</p>
      {hint && <p className="text-sm text-gray-500 mt-2">{hint}</p>}
    </div>
  );
}

interface CategoryRowProps {
  category: CategoryResponse;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubcategory: () => void;
  onUploadIcon: () => void;
  onViewProducts: () => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  iconUploading: boolean;
  onNavigateSub: (subcategorySlug: string) => void;
}

function CategoryRow({
  category,
  expanded,
  onToggleExpand,
  onToggleActive,
  onEdit,
  onDelete,
  onAddSubcategory,
  onUploadIcon,
  onViewProducts,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  iconUploading,
  onNavigateSub,
}: CategoryRowProps) {
  const subcategories = category.subcategories ?? [];
  const totalProducts = rollupCount(category);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0">
            <button
              onClick={onToggleExpand}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <ChevronRight
                className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                  expanded ? "rotate-90" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={onUploadIcon}
              className="relative flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-white shadow-md group"
              title="Click to change icon"
            >
              {iconUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : category.iconUrl ? (
                <img
                  src={category.iconUrl}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FolderTree className="w-6 h-6" />
              )}
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </span>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                  {category.name}
                </h3>
                <Pill variant="outline">{category.slug}</Pill>
                <Pill variant={category.isActive ? "success" : "neutral"}>
                  {category.isActive ? (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Pill>
              </div>
              {category.description && (
                <p className="text-gray-600 text-sm truncate">{category.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 md:flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#3d2e7c]">{totalProducts.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Products</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{countSubcategories(category)}</p>
              <p className="text-xs text-gray-500">Subcategories</p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={category.isActive}
                onChange={onToggleActive}
                ariaLabel={`Toggle ${category.name} active`}
              />

              <div className="relative">
                <button
                  onClick={onToggleMenu}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="More actions"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                {isMenuOpen && (
                  <>
                    {/* Click-away overlay */}
                    <div className="fixed inset-0 z-40" onClick={onCloseMenu} aria-hidden="true" />
                    <div className="absolute right-0 mt-2 w-52 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                      <MenuItem
                        icon={<Eye className="w-4 h-4" />}
                        label="View Products"
                        onClick={() => {
                          onCloseMenu();
                          onViewProducts();
                        }}
                      />
                      <MenuItem
                        icon={<Plus className="w-4 h-4" />}
                        label="Add Subcategory"
                        onClick={onAddSubcategory}
                      />
                      <MenuItem
                        icon={<Upload className="w-4 h-4" />}
                        label="Change Icon"
                        onClick={onUploadIcon}
                      />
                      <MenuItem
                        icon={<Edit className="w-4 h-4" />}
                        label="Edit Category"
                        onClick={onEdit}
                      />
                      <div className="my-1 border-t border-gray-100" />
                      <MenuItem
                        icon={<Trash2 className="w-4 h-4" />}
                        label="Delete Category"
                        onClick={onDelete}
                        danger
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {expanded && subcategories.length > 0 && (
        <div className="px-4 md:px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700 mb-3">Subcategories:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onNavigateSub(sub.slug)}
                className="text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-[#3d2e7c] hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 mb-1 truncate">{sub.name}</p>
                    <p className="text-sm text-gray-600">
                      {rollupCount(sub).toLocaleString()} products
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {expanded && subcategories.length === 0 && (
        <div className="px-4 md:px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-sm text-gray-500 mb-3">No subcategories yet.</p>
          <button
            onClick={onAddSubcategory}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#3d2e7c] hover:text-[#4a3689]"
          >
            <Plus className="w-4 h-4" />
            Add subcategory
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Form parts ──────────────────────────────────────────────────────────────

interface CategoryFormProps {
  value: CategoryFormState;
  onChange: (next: CategoryFormState) => void;
}

function CategoryForm({ value, onChange }: CategoryFormProps) {
  return (
    <div className="space-y-4 py-2">
      <Field label="Category Name">
        <Input
          placeholder="e.g. Fashion & Apparel"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </Field>
      <Field label="Slug (URL)" hint="Lowercase, hyphen-separated">
        <Input
          placeholder="e.g. fashion-apparel"
          value={value.slug}
          onChange={(e) => onChange({ ...value, slug: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <textarea
          placeholder="Brief description of the category…"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={3}
          maxLength={500}
          className="flex w-full min-w-0 rounded-md border border-input bg-input-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
      </Field>
      <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer select-none">
        <Switch
          checked={value.isActive}
          onChange={() => onChange({ ...value, isActive: !value.isActive })}
          ariaLabel="Active"
        />
        <span>{value.isActive ? "Active" : "Inactive"}</span>
      </label>
      <p className="text-xs text-gray-500">
        Icons are uploaded directly on the category row after creation.
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
}

// ─── Modal primitive ─────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Modal({ open, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[550px] bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">{children}</div>
  );
}

// ─── Small UI primitives (local to this page) ────────────────────────────────

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
    >
      {children}
    </button>
  );
}

function Pill({
  variant,
  children,
}: {
  variant: "outline" | "success" | "neutral";
  children: React.ReactNode;
}) {
  const styles =
    variant === "success"
      ? "bg-green-100 text-green-700 border-green-200"
      : variant === "neutral"
        ? "bg-gray-100 text-gray-700 border-gray-200"
        : "bg-white text-gray-700 border-gray-300";
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md border ${styles}`}
    >
      {children}
    </span>
  );
}

function Switch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-[#3d2e7c]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
