"use client";

import { useInView, useMotionValue, useSpring } from "motion/react";
import { useCallback, useEffect, useRef } from "react";

// Animated number counter, from React Bits (https://reactbits.dev, CountUp TS-CSS,
// MIT + Commons Clause). Two changes for this site: the final number is in the
// server's HTML (prices must be readable without JavaScript and by search
// engines; the original rendered an empty span), visitors who ask for
// reduced motion keep that number instead of a count, and the count lands on
// the number when its time is up (a spring's tail is long, and a price must
// not sit a few baht short of itself).

interface CountUpProps {
  to: number;
  from?: number;
  delay?: number;
  duration?: number;
  className?: string;
  separator?: string;
}

function decimalPlaces(value: number): number {
  const [, decimals = ""] = value.toString().split(".");
  return Number.parseInt(decimals || "0", 10) !== 0 ? decimals.length : 0;
}

function format(value: number, decimals: number, separator: string): string {
  const text = Intl.NumberFormat("en-US", { useGrouping: Boolean(separator), minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  return separator ? text.replace(/,/g, separator) : text;
}

export default function CountUp({ to, from = 0, delay = 0, duration = 2, className = "", separator = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);
  const springValue = useSpring(motionValue, { damping: 20 + 40 * (1 / duration), stiffness: 100 * (1 / duration) });
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const decimals = Math.max(decimalPlaces(from), decimalPlaces(to));
  const formatValue = useCallback((latest: number) => format(latest, decimals, separator), [decimals, separator]);

  // Start from `from` only where the count will play: off screen, with motion allowed.
  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { top, bottom } = element.getBoundingClientRect();
    if (bottom < 0 || top > window.innerHeight) element.textContent = formatValue(from);
  }, [from, formatValue]);

  useEffect(() => {
    if (!isInView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = setTimeout(() => motionValue.set(to), delay * 1000);
    const land = setTimeout(() => springValue.jump(to), (delay + duration) * 1000);
    return () => {
      clearTimeout(start);
      clearTimeout(land);
    };
  }, [isInView, motionValue, springValue, to, delay, duration]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  return (
    <span className={className} ref={ref}>
      {formatValue(to)}
    </span>
  );
}
