import { useCallback, useEffect, useState } from "react";
import type { PosterLibraryItem } from "../_types/formatter";
import type { ShowToast } from "./use-toast";

const DB_NAME = "wx-media-db";
const STORE_NAME = "posters";
const DB_VERSION = 1;
const MAX_POSTERS = 50;

const openMediaDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | undefined,
) => {
  const db = await openMediaDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = action(store);
    if (request) {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
    tx.oncomplete = () => {
      db.close();
      if (!request) resolve(undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
};

const sortPosters = (items: PosterLibraryItem[]) =>
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export function usePosterLibrary(showToast: ShowToast) {
  const [posters, setPosters] = useState<PosterLibraryItem[]>([]);
  const [isLoadingPosters, setIsLoadingPosters] = useState(true);

  const refreshPosters = useCallback(async () => {
    try {
      const result = (await withStore("readonly", (store) => store.getAll())) as
        | PosterLibraryItem[]
        | undefined;
      setPosters(sortPosters(result || []));
    } catch {
      showToast("贴图库读取失败", "error");
    } finally {
      setIsLoadingPosters(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshPosters();
  }, [refreshPosters]);

  const savePoster = useCallback(
    async (poster: PosterLibraryItem) => {
      try {
        await withStore("readwrite", (store) => store.put(poster));
        const result = (await withStore("readonly", (store) => store.getAll())) as
          | PosterLibraryItem[]
          | undefined;
        const sorted = sortPosters(result || []);
        const overflow = sorted.slice(MAX_POSTERS);
        if (overflow.length > 0) {
          await Promise.all(overflow.map((item) => withStore("readwrite", (store) => store.delete(item.id))));
        }
        setPosters(sorted.slice(0, MAX_POSTERS));
      } catch {
        showToast("贴图已生成，但本地图库保存失败", "error");
      }
    },
    [showToast],
  );

  const deletePoster = useCallback(
    async (id: string) => {
      try {
        await withStore("readwrite", (store) => store.delete(id));
        setPosters((current) => current.filter((item) => item.id !== id));
        showToast("贴图已删除");
      } catch {
        showToast("贴图删除失败", "error");
      }
    },
    [showToast],
  );

  const clearPosters = useCallback(async () => {
    try {
      await withStore("readwrite", (store) => store.clear());
      setPosters([]);
      showToast("贴图库已清空");
    } catch {
      showToast("清空贴图库失败", "error");
    }
  }, [showToast]);

  return {
    posters,
    isLoadingPosters,
    savePoster,
    deletePoster,
    clearPosters,
    refreshPosters,
  };
}
