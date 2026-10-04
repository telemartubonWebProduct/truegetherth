import type { ReactNode } from "react";

const tones = {
  danger: "border-tm-danger bg-tm-danger-wash text-tm-danger",
  success: "border-tm-success bg-tm-success-wash text-tm-success",
} as const;

export function FormAlert({
  tone,
  children,
  className = "",
}: {
  tone: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`border-l-4 px-4 py-3 text-tm-small font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
