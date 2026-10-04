"use client";

import { ArrowDown } from "lucide-react";
import { motion, MotionConfig } from "motion/react";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import { HERO_ASPECT, type Files, type HeroArt } from "./hero-art";
import type { HeroScene } from "./scene";

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
  /** The router as a still: there from the first paint, under the live scene. */
  still: { src: string; width: number; height: number; alt: string; bind: Binding };
  art: HeroArt;
  /** Where the arrow under the opening leads, and its name for screen readers. */
  next: { href: string; label: string };
  /** The page's backdrop behind the picture: the canvas is cleared to it, so it has no edge. */
  backdrop: string;
};

/** If the live scene is not drawn by now, the arm starts its reach over the still instead. */
const PATIENCE = 2600;

/**
 * Whether this device draws WebGL on a graphics chip. Where it would be drawn in
 * software (no chip, or a blocked driver) the live scene would stutter, so the
 * still stays; three.js is then not even downloaded. The browser is asked to
 * refuse a slow context, and since some hand one out anyway, the renderer's
 * name is checked for the software ones too.
 */
function drawsOnGraphicsChip() {
  try {
    const context = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!context) return false;
    const names = context.getExtension("WEBGL_debug_renderer_info");
    const renderer = names ? String(context.getParameter(names.UNMASKED_RENDERER_WEBGL)) : "";
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

const percent = (share: number) => `${(share * 100).toFixed(3)}%`;

/**
 * The opening screen. Behind: a True fibre router, drawn live in 3D (three.js,
 * loaded only when the page is allowed to move), over a still of the same view
 * that is there from the first paint. In front: a robot arm that slides in from
 * the left, its hand closing from open to pointing, until the finger is on one
 * of the router's antennas; at the touch the router's status lights come on,
 * and it taps again every few seconds. At the bottom, one line of context, the
 * headline and two buttons, each sliding in on its own delay.
 *
 * The arm, the spark and the rings are placed on the antenna's position in the
 * picture (--touch-x, --touch-y), which the scene keeps up to date as its camera
 * drifts. Scrolling swings the camera up over the router, draws the arm back,
 * and frames the picture while the headline lifts away (the --hero-*
 * properties, written by ScrollDriver).
 *
 * In the Mirror editor's preview nothing here moves (there is no data-motion):
 * the still, the arm at rest and every word are simply there to be clicked.
 */
function HeroStage({ view }: { view: HeroView }) {
  const { art } = view;
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const box = frame.current;
    const surface = canvas.current;
    if (!box || !surface) return;
    // data-hero-still is set by scripts/media/hero-poster.mjs: draw one frame, lights on, nothing moving.
    const still = root.hasAttribute("data-hero-still");
    // Without motion there is nothing to do: the still shows the router, and the arm rests on it.
    if (!root.hasAttribute("data-motion") && !still) return;

    let scene: HeroScene | null = null;
    let gone = false;
    let touched = false;
    const arm = box.querySelector<HTMLElement>(".hero-arm");
    // The arm's own animation says when the finger lands: the lights answer it.
    const onLanded = (event: AnimationEvent) => {
      if (event.animationName !== "reach") return;
      touched = true;
      box.setAttribute("data-touched", "");
      scene?.powerOn();
    };
    const onTap = (event: AnimationEvent) => {
      if (event.animationName === "tap") scene?.tap();
    };
    arm?.addEventListener("animationend", onLanded);
    arm?.addEventListener("animationiteration", onTap);

    const overStill = () => box.setAttribute("data-live", "still");
    const stop = () => {
      gone = true;
      arm?.removeEventListener("animationend", onLanded);
      arm?.removeEventListener("animationiteration", onTap);
      scene?.dispose();
      box.removeAttribute("data-live");
      box.removeAttribute("data-touched");
      // Back to where the antenna is in the still (React set these once and will not set them again).
      box.style.setProperty("--touch-x", percent(art.touch.x));
      box.style.setProperty("--touch-y", percent(art.touch.y));
    };
    if (!still && !drawsOnGraphicsChip()) {
      overStill();
      return stop;
    }

    const patience = window.setTimeout(overStill, PATIENCE);
    import("./scene")
      .then(({ createHeroScene }) =>
        createHeroScene(surface, {
          files: art.scene,
          backdrop: view.backdrop,
          still,
          progress: () => Number(root.style.getPropertyValue("--hero-progress")) || 0,
          onTouchPoint(x, y) {
            box.style.setProperty("--touch-x", percent(x));
            box.style.setProperty("--touch-y", percent(y));
          },
        }),
      )
      .then((made) => {
        if (gone) return made.dispose();
        scene = made;
        window.clearTimeout(patience);
        box.setAttribute("data-live", "scene");
        if (touched) made.powerOn();
      })
      // No WebGL after all, or the model did not arrive: the still stays, and the arm reaches over it.
      .catch(() => {
        window.clearTimeout(patience);
        if (!gone) overStill();
      });

    return () => {
      window.clearTimeout(patience);
      stop();
    };
  }, [art.scene, art.touch.x, art.touch.y, view.backdrop]);

  // The arm is sized against the picture, and hung by its fingertip on the touch point.
  const armHeight = art.arm.span * (art.arm.height / art.arm.width) * HERO_ASPECT;
  const geometry = {
    "--touch-x": percent(art.touch.x),
    "--touch-y": percent(art.touch.y),
    "--arm-width": percent(art.arm.span),
    "--arm-height": percent(armHeight),
    "--arm-tip-x": art.arm.tip.x,
    "--arm-tip-y": art.arm.tip.y,
  } as CSSProperties;
  // The arm's files are already the right sizes (scripts/media/hero-arm.mjs), so the browser picks one from each list.
  const armSizes = `(max-width: 767px) ${Math.round(165 * art.arm.span)}vw, ${Math.round(100 * art.arm.span)}vw`;
  const armSource = (files: Files) => ({
    src: files[files.length - 1].src,
    srcSet: files.map((file) => `${file.src} ${file.width}w`).join(", "),
    sizes: armSizes,
    width: art.arm.width,
    height: art.arm.height,
    decoding: "async" as const,
  });

  return (
    <div className="hero" id="top">
      <div className="hero-art">
        <motion.div className="hero-art-inner" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.8, ease: EASE }}>
          <div className="hero-frame" ref={frame} style={geometry}>
            {/* eslint-disable @next/next/no-img-element -- the page's first picture, at its own size, and the arm's pre-sized files: the image optimizer has nothing to add */}
            <img className="hero-poster" src={view.still.src} alt={view.still.alt} width={view.still.width} height={view.still.height} fetchPriority="high" decoding="async" {...view.still.bind} />
            <canvas className="hero-canvas" ref={canvas} aria-hidden="true" />
            <div className="hero-arm-rig" aria-hidden="true">
              <div className="hero-arm">
                <img className="hero-arm-open" alt="" {...armSource(art.arm.open)} />
                <img className="hero-arm-point" alt="" {...armSource(art.arm.point)} />
              </div>
            </div>
            {/* eslint-enable @next/next/no-img-element */}
            <span className="hero-rings" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        </motion.div>
      </div>

      <motion.div className="hero-foot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1, ease: EASE }}>
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
