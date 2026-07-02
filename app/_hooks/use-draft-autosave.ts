import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SerializedImageItem } from "../_lib/draft-utils";
import {
  deserializeImageMap,
  normalizeConsecutiveImageBlocks,
  serializeAutosaveImageMap,
} from "../_lib/draft-utils";
import type { ShowToast } from "./use-toast";

const DRAFT_DB_NAME = "wx-draft-db";
const DRAFT_DB_VERSION = 1;
const DRAFT_STORE_NAME = "drafts";
const CURRENT_DRAFT_KEY = "current";

type SavedDraft = {
  id: typeof CURRENT_DRAFT_KEY;
  inputText: string;
  images: SerializedImageItem[];
  imageCounter: number;
  updatedAt: string;
};

type DraftSaveStatus = "restoring" | "idle" | "saving" | "saved" | "error";

type UseDraftAutosaveParams = {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  imageMap: Map<string, string>;
  setImageMap: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  imageCounterRef: React.MutableRefObject<number>;
  showToast: ShowToast;
};

const openDraftDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("当前浏览器不支持草稿自动保存"));
      return;
    }

    const request = indexedDB.open(DRAFT_DB_NAME, DRAFT_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        db.createObjectStore(DRAFT_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("草稿数据库打开失败"));
  });

const withDraftStore = async <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const db = await openDraftDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE_NAME, mode);
    const request = callback(tx.objectStore(DRAFT_STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("草稿读写失败"));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("草稿事务失败"));
    };
  });
};

const readDraft = () =>
  withDraftStore<SavedDraft | undefined>("readonly", (store) => store.get(CURRENT_DRAFT_KEY));

const writeDraft = (draft: SavedDraft) =>
  withDraftStore<IDBValidKey>("readwrite", (store) => store.put(draft));

const writeDraftWithTextFallback = async (draft: SavedDraft) => {
  try {
    await writeDraft(draft);
    return { savedImages: true };
  } catch (error) {
    if (draft.images.length === 0) throw error;
    await writeDraft({ ...draft, images: [] });
    return { savedImages: false };
  }
};

const getMaxImageCounter = (imageMap: Map<string, string>, savedCounter: number) => {
  const maxImageId = Array.from(imageMap.keys()).reduce((max, id) => {
    const match = id.match(/^img-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return Math.max(savedCounter || 0, maxImageId);
};

export function useDraftAutosave({
  inputText,
  setInputText,
  imageMap,
  setImageMap,
  imageCounterRef,
  showToast,
}: UseDraftAutosaveParams) {
  const [status, setStatus] = useState<DraftSaveStatus>("restoring");
  const [savedAt, setSavedAt] = useState<string>("");
  const restoredRef = useRef(false);
  const hasShownErrorRef = useRef(false);
  const hasShownImageFallbackRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    readDraft()
      .then((draft) => {
        if (cancelled) return;
        if (draft?.inputText) {
          const restoredImages = deserializeImageMap(draft.images);
          setInputText(normalizeConsecutiveImageBlocks(draft.inputText));
          setImageMap(restoredImages);
          imageCounterRef.current = getMaxImageCounter(restoredImages, draft.imageCounter);
          setSavedAt(draft.updatedAt || "");
        }
        restoredRef.current = true;
        setStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        restoredRef.current = true;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [imageCounterRef, setImageMap, setInputText]);

  useEffect(() => {
    if (!restoredRef.current) return;

    const timer = window.setTimeout(() => {
      const updatedAt = new Date().toISOString();
      const normalizedInputText = normalizeConsecutiveImageBlocks(inputText);
      setStatus("saving");
      writeDraftWithTextFallback({
        id: CURRENT_DRAFT_KEY,
        inputText: normalizedInputText,
        images: serializeAutosaveImageMap(imageMap, normalizedInputText),
        imageCounter: imageCounterRef.current,
        updatedAt,
      })
        .then(({ savedImages }) => {
          setSavedAt(updatedAt);
          setStatus("saved");
          hasShownErrorRef.current = false;
          if (savedImages) {
            hasShownImageFallbackRef.current = false;
            return;
          }
          if (!hasShownImageFallbackRef.current) {
            showToast(
              "\u521d\u7a3f\u6587\u5b57\u5df2\u4fdd\u5b58\uff0c\u56fe\u7247\u6570\u636e\u8fc7\u5927\u672a\u7eb3\u5165\u81ea\u52a8\u4fdd\u5b58",
              "error",
            );
            hasShownImageFallbackRef.current = true;
          }
        })
        .catch(() => {
          setStatus("error");
          if (!hasShownErrorRef.current) {
            showToast("初稿自动保存失败，请检查浏览器存储空间", "error");
            hasShownErrorRef.current = true;
          }
        });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [imageCounterRef, imageMap, inputText, showToast]);

  const statusText = useMemo(() => {
    if (status === "restoring") return "正在恢复草稿";
    if (status === "saving") return "保存中";
    if (status === "error") return "保存失败";
    if (savedAt) {
      return `已自动保存 ${new Date(savedAt).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return "自动保存已开启";
  }, [savedAt, status]);

  return {
    draftSaveStatus: status,
    draftSaveStatusText: statusText,
  };
}
