"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Toast = { message: string; tone: "success" | "error" };
type ToastContextValue = { showToast: (message: string, tone?: Toast["tone"]) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 w-[min(22rem,calc(100vw-2rem))]" aria-live="polite" aria-atomic="true">
        {toast && (
          <div role={toast.tone === "error" ? "alert" : "status"} className={`pointer-events-auto border bg-white px-4 py-3 text-sm shadow-lg ${toast.tone === "error" ? "border-red-300 text-red-900" : "border-green-300 text-green-900"}`}>
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useAdminToast must be used inside AdminToastProvider");
  return context;
}
