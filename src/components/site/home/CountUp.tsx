"use client";

import { useEffect, useRef } from "react";

// A number that counts up to its value when it comes into view (after
// React Bits' CountUp, https://reactbits.dev, MIT + Commons Clause; rewritten
// here without an animation library, which the page would have had to fetch
// before anything else for this alone). The final number is in the server's
// HTML: prices must be readable without JavaScript and by search engines.
// Visitors who ask for reduced motion keep that number instead of a count,
// and the count lands on the number exactly when its time is up (a price must
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
  const decimals = Math.max(decimalPlaces(from), decimalPlaces(to));

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const show = (value: number) => {
      element.textContent = format(value, decimals, separator);
    };
    let frame = 0;
    let timer = 0;

    const count = () => {
      const began = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - began) / (duration * 1000));
        // Fast at first, slowing into the number.
        show(t < 1 ? from + (to - from) * (1 - (1 - t) ** 4) : to);
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    // The browser says whether the number is on the screen, so nothing is measured here (a measurement while the
    // page starts up makes it lay itself out there and then). Off screen it goes back to `from`, and it counts
    // when it comes into view.
    const seen = new IntersectionObserver(([entry]) => {
      show(from);
      if (!entry.isIntersecting) return;
      seen.disconnect();
      timer = window.setTimeout(count, delay * 1000);
    });
    seen.observe(element);

    return () => {
      seen.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      show(to);
    };
  }, [to, from, delay, duration, decimals, separator]);

  return (
    <span className={className} ref={ref}>
      {format(to, decimals, separator)}
    </span>
  );
}
