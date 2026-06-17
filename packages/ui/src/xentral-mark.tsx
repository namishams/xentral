import * as React from "react";

/** Official Xentral mark — twin gradient waves (matches the live app's logo). */
export function XentralMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="xg1" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0064d9" /><stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="xg2" x1="64" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3A6" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path d="M16 14c6 0 10 3 16 12 6-9 10-12 16-12" stroke="url(#xg1)" strokeWidth="8" strokeLinecap="round" />
      <path d="M16 50c6 0 10-3 16-12 6 9 10 12 16 12" stroke="url(#xg2)" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
