import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  getFavorites,
  addToFavorites as apiAdd,
  removeFromFavorites as apiRemove,
} from "../services/favoriteService";

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isFavorited: (productId: string) => boolean;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAuthenticated) {
        if (!cancelled) setFavoriteIds(new Set());
        return;
      }
      const ids = new Set<string>();
      let pageNumber = 1;
      const pageSize = 100;
      let hasNext = true;
      while (hasNext) {
        const page = await getFavorites({ pageNumber, pageSize });
        page.data.forEach((p) => ids.add(p.id));
        hasNext = page.hasNext;
        pageNumber += 1;
      }
      if (!cancelled) setFavoriteIds(ids);
    };
    load().catch(() => {
      if (!cancelled) setFavoriteIds(new Set());
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isFavorited = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  const add = useCallback(async (productId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
    try {
      await apiAdd(productId);
    } catch (err) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      throw err;
    }
  }, []);

  const remove = useCallback(async (productId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    try {
      await apiRemove(productId);
    } catch (err) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.add(productId);
        return next;
      });
      throw err;
    }
  }, []);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorited, add, remove }}>
      {children}
    </FavoritesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
