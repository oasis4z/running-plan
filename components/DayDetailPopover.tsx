"use client";

import { useEffect, useRef } from "react";

interface Props {
  anchorRect: DOMRect;
  onClose: () => void;
  children: React.ReactNode;
}

const POPOVER_W = 340;
const POPOVER_MAX_H = 600;
const GAP = 10;

export default function DayDetailPopover({ anchorRect, onClose, children }: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click-outside — delayed 50ms so the triggering click doesn't immediately close it
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Smart positioning: prefer right of cell; flip left if near right edge
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left: number;
  const rightSpace = vw - anchorRect.right;
  if (rightSpace >= POPOVER_W + GAP) {
    left = anchorRect.right + GAP;
  } else {
    left = anchorRect.left - POPOVER_W - GAP;
  }
  left = Math.max(8, Math.min(left, vw - POPOVER_W - 8));

  const top = Math.max(16, Math.min(anchorRect.top, vh - POPOVER_MAX_H - 16));

  return (
    <>
      {/* Transparent backdrop — click to close */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Popover panel */}
      <div
        ref={popoverRef}
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-y-auto"
        style={{
          width: POPOVER_W,
          maxHeight: POPOVER_MAX_H,
          left,
          top,
          // Subtle entry animation via CSS
          animation: "popover-in 0.12s ease-out",
        }}
      >
        <div className="p-4">
          {children}
        </div>
      </div>

      <style jsx global>{`
        @keyframes popover-in {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
