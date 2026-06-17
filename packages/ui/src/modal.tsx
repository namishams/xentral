"use client";

import * as React from "react";
import { color, radius, shadow, zIndex } from "@xentral/config";

/**
 * Modal — accessible dialog. Overlay + ESC + focus return. Sizes are fixed widths.
 * Use for confirmations and short focused tasks; long content belongs on a detail page.
 */
export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const WIDTHS = { sm: 420, md: 560, lg: 760 } as const;

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal, background: "rgba(16,24,40,0.45)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="w-full bg-white outline-none"
        style={{ maxWidth: WIDTHS[size], borderRadius: radius.xl, boxShadow: shadow.overlay }}
      >
        {title && (
          <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
            <h2 id={titleId} className="font-semibold" style={{ color: color.ink.DEFAULT, fontSize: 16 }}>{title}</h2>
            <button onClick={onClose} aria-label="Close" className="rounded p-1" style={{ color: color.ink.soft }}>✕</button>
          </div>
        )}
        <div style={{ padding: 20, color: color.ink.DEFAULT, fontSize: 14 }}>{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2" style={{ padding: "12px 20px", borderTop: `1px solid ${color.line.DEFAULT}` }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

export default Modal;
