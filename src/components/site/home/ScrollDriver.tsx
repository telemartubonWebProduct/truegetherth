"use client";

import type Lenis from "lenis";
import { useEffect, useState } from "react";

import "lenis/dist/lenis.css";

// The page's one scroll handler. Every pinned stage is choreographed in CSS
// from custom properties on <html>; this component only measures how far each
// stage has scrolled and writes those numbers. Text in the DOM changes only
// when a stage moves to another phase, never per frame.
//
// Mouse wheels scroll in steps, which would make scroll-driven motion jerk, so
// Lenis eases the scroll position itself (touch screens keep native scrolling).
// It is fetched once the page has painted: the first paint does not wait for it.
// Visitors who ask for reduced motion get none of this, and neither does a
// screen too short to pin a stage in (a phone on its side): the stages lie flat
// in the page (landing.css keys the choreography on html[data-motion], set
// before first paint by the site layout and kept up to date here when the
// screen turns). The Mirror editor's preview is locked flat as well: fields
// have to stay where they can be clicked.

type SlipPhase = { status: string; values: string[] };

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
/** 0..1 across the part of a stage's progress between `from` and `to`. */
const span = (progress: number, from: number, to: number) => clamp((progress - from) / (to - from));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export function ScrollDriver({ locked = false }: { locked?: boolean }) {
  // Counts changes between the choreographed and the flat page, to set the driver up again.
  const [mode, setMode] = useState(0);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tall = window.matchMedia("(min-height: 560px)");
    const decide = () => {
      const root = document.documentElement;
      const wanted = !locked && !calm.matches && tall.matches;
      if (wanted === root.hasAttribute("data-motion")) return;
      root.toggleAttribute("data-motion", wanted);
      setMode((count) => count + 1);
    };
    calm.addEventListener("change", decide);
    tall.addEventListener("change", decide);
    return () => {
      calm.removeEventListener("change", decide);
      tall.removeEventListener("change", decide);
    };
  }, [locked]);

  useEffect(() => {
    const root = document.documentElement;
    const written = new Set<string>();
    const set = (name: string, value: string) => {
      written.add(name);
      root.style.setProperty(name, value);
    };
    const stage = (name: string) => document.querySelector<HTMLElement>(`[data-stage="${name}"]`);
    const hero = stage("hero");
    const manifesto = stage("manifesto");
    const rail = stage("rail");
    const ticket = stage("ticket");
    const season = stage("season");
    // The row of the open tab; RailTabs sends a resize when another tab opens.
    const railTrack = () => rail?.querySelector<HTMLElement>("[data-rail-panel]:not([hidden]) [data-rail-track]") ?? null;
    const cues = Array.from(ticket?.querySelectorAll<HTMLElement>("[data-cue]") ?? []);
    const slipStatus = ticket?.querySelector<HTMLElement>("[data-slip-status]");
    const slipValues = Array.from(ticket?.querySelectorAll<HTMLElement>("[data-slip-value]") ?? []);
    const phases: SlipPhase[] = JSON.parse(ticket?.dataset.phases ?? "[]");
    const chapters = Array.from(season?.querySelectorAll<HTMLElement>("[data-chapter]") ?? []);
    const motion = root.hasAttribute("data-motion");

    let frame = 0;
    let railOverflow = 0;
    let railMeasured = false;
    let phase = -1;
    let chapter = -1;
    let heroAway = false;

    /** 0 when a stage's pin reaches the top of the screen, 1 when it lets go. */
    const progress = (element: HTMLElement | null) => {
      if (!element) return 0;
      const rect = element.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      return distance > 0 ? clamp(-rect.top / distance) : 0;
    };

    const showPhase = (next: number) => {
      if (next === phase || phases.length === 0) return;
      phase = next;
      cues.forEach((cue, index) => cue.toggleAttribute("data-lit", index < next));
      cues.forEach((cue, index) => cue.toggleAttribute("data-now", index === next - 1));
      const current = phases[Math.min(next, phases.length - 1)];
      if (slipStatus) slipStatus.textContent = current.status;
      slipValues.forEach((value, index) => {
        value.textContent = current.values[index] ?? "";
        value.toggleAttribute("data-set", current.values[index] !== "—");
      });
    };

    const showChapter = (next: number) => {
      if (next === chapter) return;
      chapter = next;
      chapters.forEach((item, index) => item.toggleAttribute("data-active", index === next));
    };

    // The row's stage is laid out only when it comes near the screen (landing.css), and measuring the row from
    // afar would lay the stage out there and then: while the page starts, that is before anything has been shown.
    // So it is measured once its stage is within two screens; the observer below says when the row gets its size.
    const measure = () => {
      railMeasured = false;
      if (!rail || rail.getBoundingClientRect().top > window.innerHeight * 2) return;
      const track = railTrack();
      railOverflow = track ? Math.max(0, track.scrollWidth - track.clientWidth) : 0;
      railMeasured = true;
    };

    const update = () => {
      frame = 0;
      if (!motion) return;

      // Everything is measured first and written after: a measurement that follows a write makes the browser
      // work the whole page's styles out again there and then, five times a frame.
      const away = hero ? hero.getBoundingClientRect().bottom <= 0 : false;
      const h = progress(hero);
      const m = progress(manifesto);
      const r = progress(rail);
      const t = progress(ticket);
      const s = progress(season);
      if (!railMeasured && r > 0) measure();

      // 1. Hero: the lockup lifts, shrinks and fades on three separate curves; the picture draws back into a frame.
      //    Once it has left the screen, its own animations rest (landing.css pauses them on this flag).
      if (away !== heroAway) {
        heroAway = away;
        root.toggleAttribute("data-hero-away", away);
      }
      set("--hero-progress", h.toFixed(4));
      set("--hero-type-y", `${(-90 * easeInOut(span(h, 0, 0.85))).toFixed(2)}px`);
      set("--hero-type-scale", (1 - 0.26 * easeOut(span(h, 0, 0.9))).toFixed(4));
      set("--hero-type-alpha", (1 - span(h, 0.12, 0.62)).toFixed(3));
      set("--hero-art-scale", (1 - 0.12 * easeInOut(h)).toFixed(4));
      set("--hero-art-radius", `${(36 * easeOut(span(h, 0, 0.6))).toFixed(1)}px`);
      set("--hero-meta-alpha", (1 - span(h, 0, 0.3)).toFixed(3));

      // 2. Manifesto: ink fills the sentence from the bottom up while it grows a little.
      set("--manifesto-wipe", `${(span(m, 0.06, 0.88) * 100).toFixed(2)}%`);
      set("--manifesto-scale", (1 + 0.05 * m).toFixed(4));

      // 3. Rail: scrolling down walks along the row, by exactly its overflow.
      const along = easeInOut(span(r, 0.08, 0.94));
      set("--rail-x", `${(-along * railOverflow).toFixed(1)}px`);
      set("--rail-meter", along.toFixed(4));

      // 4. Slip: arrives, fills in step by step, then tears along its perforation.
      set("--packet-alpha", span(t, 0, 0.12).toFixed(3));
      set("--packet-enter", `${(38 * (1 - easeOut(span(t, 0, 0.2)))).toFixed(2)}px`);
      set("--packet-scale", (0.78 + 0.22 * easeOut(span(t, 0, 0.28))).toFixed(4));
      set("--packet-cut", easeInOut(span(t, 0.86, 1)).toFixed(4));
      set("--packet-meter", span(t, 0.1, 0.86).toFixed(4));
      set("--packet-copy-x", `${(-18 * t).toFixed(2)}px`);
      showPhase(Math.min(4, Math.floor(span(t, 0.1, 0.86) * 4.999)));

      // 5. Season: the contour plate drifts behind the chapters, which take turns.
      set("--season-y", `${(-4 + 8 * s).toFixed(3)}%`);
      set("--season-scale", (1.1 - 0.045 * s).toFixed(4));
      showChapter(Math.min(chapters.length - 1, Math.floor(s * chapters.length)));
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      request();
    };

    // Everything that rises into place does so once, when it first comes into view.
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          reveal.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll("[data-rev], [data-words]").forEach((element) => reveal.observe(element));

    // What can wait for the first paint: Lenis, and the row's overflow (the row lies in a stage that is not laid
    // out until it is near, so measuring it now would lay that stage out before anything has been shown). A
    // frame is on the screen a little after it is made: a short while after the first one, not the next task.
    let lenis: Lenis | null = null;
    let over = false;
    let later = 0;
    const painted = requestAnimationFrame(() => {
      later = window.setTimeout(() => {
        onResize();
        if (!motion) return;
        void import("lenis").then(({ default: Smooth }) => {
          if (!over) lenis = new Smooth({ autoRaf: true, anchors: true, lerp: 0.11 });
        });
      }, 250);
    });
    const resized = new ResizeObserver(onResize);
    rail?.querySelectorAll("[data-rail-track]").forEach((track) => resized.observe(track));
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", onResize);
    update();
    root.setAttribute("data-ready", "");

    return () => {
      over = true;
      cancelAnimationFrame(painted);
      window.clearTimeout(later);
      cancelAnimationFrame(frame);
      // Leave the page as the flat layout expects it: no stage values, the slip complete.
      written.forEach((name) => root.style.removeProperty(name));
      root.removeAttribute("data-hero-away");
      showPhase(phases.length - 1);
      cues.forEach((cue) => {
        cue.removeAttribute("data-lit");
        cue.removeAttribute("data-now");
      });
      chapters.forEach((item) => item.removeAttribute("data-active"));
      lenis?.destroy();
      reveal.disconnect();
      resized.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", onResize);
    };
  }, [mode]);

  return null;
}
