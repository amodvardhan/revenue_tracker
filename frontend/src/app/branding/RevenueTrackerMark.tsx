import React, { useId } from "react";

export interface RevenueTrackerMarkProps {
  /** Edge length in CSS pixels. */
  size?: number;
  /** Accessible name when the mark stands alone; omit when purely decorative next to a wordmark. */
  title?: string;
  className?: string;
}

/**
 * Brand mark: ascending pillars + forward arc inside a precision tile — reads at favicon size and scales up.
 * Concept: momentum you can trust — rising bars meet a single trajectory (forecast + reality aligned).
 */
export function RevenueTrackerMark({ size = 32, title, className }: RevenueTrackerMarkProps): JSX.Element {
  const rawId = useId().replace(/:/g, "");
  const gid = `rtm-fill-${rawId}`;
  const gidSoft = `rtm-soft-${rawId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={gid} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0a84ff" />
          <stop offset="52%" stopColor="#0071e3" />
          <stop offset="100%" stopColor="#004494" />
        </linearGradient>
        <linearGradient id={gidSoft} x1="4" y1="22" x2="28" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="28" height="28" rx="8" fill={`url(#${gid})`} />
      <rect x="2" y="2" width="28" height="28" rx="8" fill={`url(#${gidSoft})`} />

      {/* Rising pillars — revenue cadence */}
      <rect x="8.5" y="18" width="4.2" height="8" rx="1.15" fill="#ffffff" fillOpacity={0.42} />
      <rect x="13.9" y="13.5" width="4.2" height="12.5" rx="1.15" fill="#ffffff" fillOpacity={0.72} />
      <rect x="19.3" y="8.5" width="4.2" height="17.5" rx="1.15" fill="#ffffff" />

      {/* Trajectory — single forward curve across peaks */}
      <path
        d="M 7.5 21.5 C 11.5 18.5 14.5 14.5 18 12.5 C 21 10.8 24 9.2 26.5 8"
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.55}
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26.5" cy="8" r="1.35" fill="#ffffff" fillOpacity={0.95} />
    </svg>
  );
}
