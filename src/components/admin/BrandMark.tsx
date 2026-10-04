import Image from "next/image";

// The lockup is drawn for white surfaces; on ink it gets a white chip, so the
// mark keeps its own colours.
export function BrandMark({ onInk = false }: { onInk?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className={onInk ? "inline-flex shrink-0 rounded-tm-pill bg-tm-canvas px-2.5 py-1.5" : "inline-flex shrink-0"}>
        <Image src="/brand/truegetherth-logo.png" alt="truegetherth" width={1404} height={200} className="h-4 w-auto" priority />
      </span>
      <span className={`whitespace-nowrap text-tm-small font-semibold ${onInk ? "text-white/80" : "text-tm-muted"}`}>หลังบ้าน</span>
    </span>
  );
}
