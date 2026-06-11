import { useCallback, useState } from "react";
import type { ToastState, ToastType } from "../_types/formatter";

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}

export type ShowToast = ReturnType<typeof useToast>["showToast"];
