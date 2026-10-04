import type { SVGProps } from "react";

// Line icons drawn for this site: black strokes with one red accent, sized by
// the parent's font size unless width/height are given.

type IconProps = SVGProps<SVGSVGElement>;

const accent = "var(--tm-color-red)";

function Svg({ children, viewBox = "0 0 24 24", ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </svg>
  );
}

export function RouterIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <rect x="7" y="27" width="34" height="11" rx="3" />
      <path d="M13 27V15M35 27V15" />
      <path d="M13 32.5h.01M18 32.5h.01" strokeWidth={3} />
      <path d="M19.5 14.5a6.5 6.5 0 0 1 9 0M16 10.5a11.5 11.5 0 0 1 16 0" stroke={accent} />
    </Svg>
  );
}

export function RouterUpgradeIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <rect x="7" y="27" width="34" height="11" rx="3" />
      <path d="M13 27V17M35 27V17" />
      <path d="M13 32.5h.01M18 32.5h.01" strokeWidth={3} />
      <path d="M24 22V8M18.5 13.5 24 8l5.5 5.5" stroke={accent} />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <rect x="14" y="6" width="20" height="36" rx="4" />
      <path d="M21.5 36.5h5" />
      <path d="M20 24v2M24 21v5M28 18v8" stroke={accent} />
    </Svg>
  );
}

export function SolarIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <path d="M9 40 14 24h26l-5 16H9Z" />
      <path d="M11.5 32h26M22 24l-3.5 16M31 24l-3.5 16" />
      <circle cx="16" cy="11" r="4" stroke={accent} />
      <path d="M16 3.5v1.5M9.5 11H8M23.5 11H22M11.3 6.3l1 1M20.7 6.3l-1 1" stroke={accent} />
    </Svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CallIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Svg>
  );
}

export const serviceIcons = {
  router: RouterIcon,
  "router-upgrade": RouterUpgradeIcon,
  phone: PhoneIcon,
  solar: SolarIcon,
} as const;
