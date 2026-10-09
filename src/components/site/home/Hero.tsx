"use client";

import { ArrowDown } from "lucide-react";
import { motion, MotionConfig } from "motion/react";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import type { Files, HeroLayer, HeroPack, HeroTableau } from "./hero-art";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Marks an element as the view of one content field in the Mirror editor; empty on the public site. */
type Binding = { "data-edit"?: string };

export type HeroView = {
  eyebrow: { text: string; bind: Binding };
  /** The main heading, a line each. */
  heading: { text: string; bind: Binding }[];
  /** The buttons under the heading, rendered by the page. */
  actions: ReactNode;
  /** The pills and the picture's note beside the heading, rendered by the page. */
  side: ReactNode;
  /** The painting's sky as the content has it: the picture a visitor is told about, and the one the editor changes. */
  picture: { src: string; width: number; height: number; alt: string; bind: Binding };
  art: HeroTableau;
  /** Where the arrow under the opening leads, and its name for screen readers. */
  next: { href: string; label: string };
};

/** A phone or an upright tablet: the tall arrangement stands above the headline (the same query is in landing.css). */
const TALL = "(max-aspect-ratio: 4/5)";

type Variables = CSSProperties & Record<`--${string}`, string | number>;

const percent = (share: number) => `${(share * 100).toFixed(2)}%`;
const srcSet = (files: Files) => files.map((file) => `${file.src} ${file.width}w`).join(", ");

/** One cut-out of the painting, with the signal frame hung on it. */
function Layer({ layer, index, pack, art }: { layer: HeroLayer; index: number; pack: "wide" | "tall"; art: HeroTableau }) {
  const place: Variables = {
    "--x": percent(layer.x),
    "--y": percent(layer.y),
    "--w": percent(layer.w),
    "--h": percent(layer.h),
    "--depth": layer.depth,
    "--bob": layer.bob,
    "--turn": `${layer.turn}deg`,
    "--sway": layer.sway,
    "--time": `${layer.time || 8}s`,
    // Each starts somewhere else in its float, so no two rise together.
    "--delay": `${(-1.7 * index).toFixed(1)}s`,
  };
  const largest = layer.files[layer.files.length - 1];
  // The tall arrangement fills the screen's width, the wide one may be wider than the screen.
  const sizes = `${Math.ceil(layer.w * (pack === "tall" ? 100 : 125))}vw`;
  const frame = layer.frame;
  const box: Variables | undefined = frame && { "--bx": percent(frame.box[0]), "--by": percent(frame.box[1]), "--bw": percent(frame.box[2]), "--bh": percent(frame.box[3]) };
  return (
    <div className="hero-layer" data-layer={layer.id} style={place}>
      <div className="hero-float">
        {frame?.mark ? <span className="hero-glow" style={box} /> : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- the layers are already the right sizes (scripts/media/hero-tableau.mjs), so the browser picks one from each list; lazy, so the arrangement that is not shown is never downloaded */}
        <img alt="" src={largest.src} srcSet={srcSet(layer.files)} sizes={sizes} width={largest.width} height={Math.round((largest.width * layer.h * art.packs[pack].height) / (layer.w * art.packs[pack].width))} loading="lazy" decoding="async" />
        {frame ? (
          <span className="hero-box" data-mark={frame.mark ? "" : undefined} style={box}>
            {frame.mark ? (
              // eslint-disable-next-line @next/next/no-img-element -- a small fixed mark
              <img className="hero-mark" alt="" src={art.mark.src} width={art.mark.width} height={art.mark.height} loading="lazy" decoding="async" />
            ) : (
              <b className="num">{frame.reading}</b>
            )}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Pack({ name, pack, art }: { name: "wide" | "tall"; pack: HeroPack; art: HeroTableau }) {
  return (
    <div className={`hero-pack hero-pack-${name}`}>
      {pack.layers.map((layer, index) => (
        <Layer key={layer.id} layer={layer} index={index} pack={name} art={art} />
      ))}
    </div>
  );
}

/**
 * The opening screen. Behind: an oil painting in layers, a goddess lifting the
 * True router over her head with cherubs, a sea god and a muse around her. The
 * sky is one picture and every figure a cut-out placed over it, so each can
 * float a little on its own and shift against the sky as the pointer moves
 * (and, on any screen, as the page scrolls: the --hero-* properties, written by
 * ScrollDriver). Thin frames with a reading hang on the figures, as if the
 * router's signal had found them. In front, at the bottom: one line of
 * context, the headline and two buttons, each sliding in on its own delay.
 *
 * There are two arrangements of the same figures, wide and tall; both are in
 * the page and landing.css shows one. All of it is plain pictures in the page:
 * without scripts, with reduced motion and in the Mirror editor's preview (no
 * data-motion) the painting is simply there, still, and every word can be
 * clicked.
 */
function HeroStage({ view }: { view: HeroView }) {
  const { art } = view;
  const scene = useRef<HTMLDivElement>(null);

  // The pointer moves the layers a little, nearer ones more (landing.css, under data-motion). Only where there is a pointer that hovers.
  useEffect(() => {
    const root = document.documentElement;
    const box = scene.current;
    if (!box || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    const aim = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    const step = () => {
      frame = 0;
      now.x += (aim.x - now.x) * 0.08;
      now.y += (aim.y - now.y) * 0.08;
      box.style.setProperty("--px", now.x.toFixed(4));
      box.style.setProperty("--py", now.y.toFixed(4));
      if (Math.abs(aim.x - now.x) + Math.abs(aim.y - now.y) > 0.002) frame = requestAnimationFrame(step);
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };
    const onMove = (event: PointerEvent) => {
      // Nothing to move where the page lies still, or once the opening has scrolled away.
      if (!root.hasAttribute("data-motion") || root.hasAttribute("data-hero-away")) return;
      aim.x = (event.clientX / window.innerWidth) * 2 - 1;
      aim.y = (event.clientY / window.innerHeight) * 2 - 1;
      request();
    };
    const onLeave = () => {
      aim.x = 0;
      aim.y = 0;
      request();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("mouseleave", onLeave);
      box.style.removeProperty("--px");
      box.style.removeProperty("--py");
    };
  }, []);

  const { wide, tall } = art.packs;
  const shapes: Variables = { "--wide": (wide.width / wide.height).toFixed(4), "--tall": (tall.width / tall.height).toFixed(4) };
  // The sky comes in the sizes the script wrote as long as the content still names its picture.
  const ownSky = wide.sky.some((file) => file.src === view.picture.src);

  return (
    <div className="hero" id="top">
      <div className="hero-art">
        <motion.div className="hero-art-inner" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.8, ease: EASE }}>
          <div className="hero-scene" ref={scene} style={shapes}>
            <picture>
              <source media={TALL} srcSet={srcSet(tall.sky)} sizes="100vw" />
              {/* The page's first picture, at its own sizes: the image optimizer has nothing to add. */}
              <img
                className="hero-sky"
                src={view.picture.src}
                srcSet={ownSky ? srcSet(wide.sky) : undefined}
                sizes={ownSky ? "(min-aspect-ratio: 16/9) 100vw, 180vh" : undefined}
                alt={view.picture.alt}
                width={view.picture.width}
                height={view.picture.height}
                fetchPriority="high"
                decoding="async"
                {...view.picture.bind}
              />
            </picture>
            <div aria-hidden="true">
              <Pack name="wide" pack={wide} art={art} />
              <Pack name="tall" pack={tall} art={art} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* The ink tone: white words and white buttons, on the painting's shade. */}
      <motion.div className="hero-foot" data-tone="ink" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1, ease: EASE }}>
        <div className="hero-type">
          <motion.p className="hero-sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease: EASE }}>
            <span className="dot" aria-hidden="true" />
            <span {...view.eyebrow.bind}>{view.eyebrow.text}</span>
          </motion.p>
          <motion.h1 className="hero-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8, ease: EASE }}>
            {view.heading.map((line, index) => (
              <span key={index} className="hero-line" {...line.bind}>
                {line.text}{" "}
              </span>
            ))}
          </motion.h1>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8, ease: EASE }}>
            {view.actions}
          </motion.div>
        </div>
        <div className="hero-side">{view.side}</div>
      </motion.div>

      <a className="hero-scroll" href={view.next.href} aria-label={view.next.label}>
        <ArrowDown size={14} strokeWidth={2.5} aria-hidden="true" />
      </a>
    </div>
  );
}

/** The hero, with an entrance that respects "reduce motion": things still fade in, nothing slides or scales. */
export function Hero({ view }: { view: HeroView }) {
  return (
    <MotionConfig reducedMotion="user">
      <HeroStage view={view} />
    </MotionConfig>
  );
}
