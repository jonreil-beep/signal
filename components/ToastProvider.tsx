"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

/* ── Context ─────────────────────────────────────────────────────────── */
interface ToastContextValue {
  showToast: () => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

/* ── Provider + Toast display ────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(() => {
    // Reset timer if already visible (debounce multiple fast copies)
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast — fixed bottom-right pill */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 50,
          pointerEvents: "none",
          transition: visible
            ? "opacity 200ms ease-out, transform 200ms ease-out"
            : "opacity 150ms ease-in, transform 150ms ease-in",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(to bottom right, #2C2C2E, #1A1A1A)",
            color: "white",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "9999px",
            padding: "8px 16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            userSelect: "none",
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Copied to clipboard
        </div>
      </div>
    </ToastContext.Provider>
  );
}
