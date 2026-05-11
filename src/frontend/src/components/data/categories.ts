import {
  getCategoryTree,
  getCategoryById as apiGetCategoryById,
} from "../../services/categoryService";
import type { CategoryResponse } from "../../services/categoryService";

export interface NestedSubcategory {
  id: string;
  slug: string;
  label: string;
}

export interface Subcategory {
  id: string;
  slug: string;
  label: string;
  productCount: number;
  nestedItems?: NestedSubcategory[];
}

export interface Category {
  id: string;
  slug: string;
  parentId: string | null;
  label: string;
  iconName: string;
  iconUrl?: string;
  productCount: number;
  description: string;
  subcategories: Subcategory[];
}

const ICON_FALLBACKS = [
  "ShoppingBag",
  "Smartphone",
  "Shirt",
  "User2",
  "Lamp",
  "Dice5",
  "BookOpen",
  "Trophy",
  "Briefcase",
  "PawPrint",
  "Wrench",
  "Sparkles",
  "Gamepad2",
  "Tent",
  "Scissors",
  "Baby",
  "Mic2",
];

function pickIconName(index: number): string {
  return ICON_FALLBACKS[index % ICON_FALLBACKS.length];
}

function mapNested(node: CategoryResponse): NestedSubcategory[] | undefined {
  if (!node.subcategories || node.subcategories.length === 0) return undefined;
  return node.subcategories.map((c) => ({ id: c.id, slug: c.slug, label: c.name }));
}

function mapSubcategory(node: CategoryResponse): Subcategory {
  return {
    id: node.id,
    slug: node.slug,
    label: node.name,
    productCount: node.productCount,
    nestedItems: mapNested(node),
  };
}

function mapCategory(node: CategoryResponse, index: number): Category {
  return {
    id: node.id,
    slug: node.slug,
    parentId: node.parentId,
    label: node.name,
    iconName: pickIconName(index),
    iconUrl: node.iconUrl ?? undefined,
    productCount: node.productCount,
    description: node.description ?? "",
    subcategories: (node.subcategories ?? []).map(mapSubcategory),
  };
}

export let categories: Category[] = [];

let loadPromise: Promise<Category[]> | null = null;

export async function loadCategories(): Promise<Category[]> {
  if (categories.length > 0) return categories;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const tree = await getCategoryTree();
    categories = tree.map((node, i) => mapCategory(node, i));
    return categories;
  })();

  return loadPromise;
}

export function rollupProductCount(cat: Category): number {
  const childSum = cat.subcategories.reduce((sum, s) => sum + s.productCount, 0);
  return cat.productCount + childSum;
}

function findInTree(predicate: (c: Category | Subcategory) => boolean): Category | undefined {
  for (const top of categories) {
    if (predicate(top)) return top;
    for (const sub of top.subcategories) {
      if (predicate(sub)) {
        return {
          id: sub.id,
          slug: sub.slug,
          parentId: top.id,
          label: sub.label,
          iconName: top.iconName,
          iconUrl: top.iconUrl,
          productCount: sub.productCount,
          description: "",
          subcategories: [],
        };
      }
    }
  }
  return undefined;
}

export function getCategoryById(id: string): Category | undefined {
  return findInTree((c) => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return findInTree((c) => c.slug === slug);
}

export function findCategoryBySlugOrId(slugOrId: string): Category | undefined {
  return getCategoryBySlug(slugOrId) ?? getCategoryById(slugOrId);
}

export function getParentCategory(cat: Category): Category | undefined {
  if (!cat.parentId) return undefined;
  return categories.find((c) => c.id === cat.parentId);
}

export function getSubcategoryById(
  categoryId: string,
  subcategoryId: string
): Subcategory | undefined {
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.subcategories.find((s) => s.id === subcategoryId);
}

export async function fetchCategoryBySlugOrId(slugOrId: string): Promise<Category | undefined> {
  await loadCategories();
  const local = findCategoryBySlugOrId(slugOrId);
  if (local) return local;

  try {
    const node = await apiGetCategoryById(slugOrId);
    return mapCategory(node, categories.length);
  } catch {
    return undefined;
  }
}

export async function fetchCategoryById(id: string): Promise<Category | undefined> {
  return fetchCategoryBySlugOrId(id);
}
