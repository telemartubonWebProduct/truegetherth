"use client";

import { Plus } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

export type NavLinkView = {
  id: string;
  label: string;
  href: string;
  external: boolean;
  current: boolean;
  /** Encoded content binding for the Mirror editor. */
  binding?: string;
};

export type NavGroupView = { id: string; label: string; binding?: string; link?: NavLinkView; children: NavLinkView[] };

export type NavbarView = {
  brand: { href: string; name: string; logo: { src: string; width: number; height: number }; binding?: string };
  labels: { menu: string; navigation: string; newTab: string };
  /** Short links beside the menu on wide screens. */
  shortcuts: NavLinkView[];
  /** The whole menu, as the panel lists it. */
  groups: NavGroupView[];
  /** The pill on the right. */
  cta: NavLinkView;
  /** The same page in each language. */
  languages: { locale: string; name: string; href: string; current: boolean; label: string };
};

function NavAnchor({ link, className, newTab, onClick, children }: { link: NavLinkView; className?: string; newTab: string; onClick?: () => void; children: ReactNode }) {
  const shared = { className, onClick, "data-edit": link.binding, "aria-current": link.current ? ("page" as const) : undefined };
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" {...shared}>
        {children}
        <span className="sr-only"> ({newTab})</span>
      </a>
    );
  }
  return link.href.startsWith("/") ? (
    <Link href={link.href} {...shared}>
      {children}
    </Link>
  ) : (
    <a href={link.href} {...shared}>
      {children}
    </a>
  );
}

/**
 * The site's navigation on every page: pills that float over the page (the bar
 * itself lets clicks through). The Menu pill opens a panel with the whole
 * menu and the language switch; its name stays the same while aria-expanded
 * and the turning mark say whether it is open. Over a dark section the black pill would
 * vanish, so the bar notes what it is over (data-nav on <html>) and the styles
 * turn it white there.
 */
function NavPills({ view }: { view: NavbarView }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  // Which tone lies under the bar: sections say so with data-tone="ink" (and the footer with tm-on-ink).
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let tone = "";
    const update = () => {
      frame = 0;
      const dark = Array.from(document.querySelectorAll<HTMLElement>('[data-tone="ink"], .tm-on-ink')).some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= 36 && rect.bottom >= 36;
      });
      const next = dark ? "ink" : "paper";
      if (next !== tone) {
        tone = next;
        root.dataset.nav = next;
      }
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      delete root.dataset.nav;
    };
  }, []);

  const close = () => setOpen(false);
  const { labels } = view;

  return (
    <motion.header className="nav" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: EASE }}>
      <div className="nav-left">
        <Link className="nav-logo" href={view.brand.href} aria-label={view.brand.name} data-edit={view.brand.binding}>
          <Image src={view.brand.logo.src} alt="" width={view.brand.logo.width} height={view.brand.logo.height} priority />
        </Link>
        <div className="nav-menu-wrap" ref={wrap}>
          <button type="button" className="nav-menu" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
            <span className="nav-menu-dot" data-open={open || undefined}>
              <Plus size={12} strokeWidth={3} aria-hidden="true" />
            </span>
            <span>{labels.menu}</span>
          </button>
          <AnimatePresence>
            {open ? (
              <motion.nav
                id={panelId}
                className="nav-panel"
                aria-label={labels.navigation}
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <ul role="list">
                  {view.groups.map((group, index) => (
                    <motion.li key={group.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * index + 0.05, duration: 0.45, ease: EASE }}>
                      {group.link ? (
                        <NavAnchor link={group.link} className="nav-panel-link" newTab={labels.newTab} onClick={close}>
                          <span className="nav-panel-n">{String(index + 1).padStart(2, "0")}</span>
                          {group.label}
                        </NavAnchor>
                      ) : (
                        <>
                          <p className="nav-panel-group" data-edit={group.binding}>
                            <span className="nav-panel-n">{String(index + 1).padStart(2, "0")}</span>
                            {group.label}
                          </p>
                          <ul role="list" className="nav-panel-children">
                            {group.children.map((child) => (
                              <li key={child.id}>
                                <NavAnchor link={child} className="nav-panel-link nav-panel-child" newTab={labels.newTab} onClick={close}>
                                  {child.label}
                                </NavAnchor>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </motion.li>
                  ))}
                </ul>
                {/* Plain anchors: the two languages are separate root layouts, so a client-side transition cannot cross between them. */}
                <p className="nav-panel-lang" aria-label={view.languages.label}>
                  <a href={view.languages.href} lang={view.languages.locale} hrefLang={view.languages.locale}>
                    {view.languages.name}
                  </a>
                </p>
              </motion.nav>
            ) : null}
          </AnimatePresence>
        </div>
        {view.shortcuts.length > 0 ? (
          <div className="nav-tags">
            {view.shortcuts.map((link) => (
              <NavAnchor key={link.id} link={{ ...link, binding: undefined }} newTab={labels.newTab}>
                {link.label}
              </NavAnchor>
            ))}
          </div>
        ) : null}
      </div>
      <NavAnchor link={view.cta} className="nav-right" newTab={labels.newTab}>
        <span className="nav-grid" aria-hidden="true">
          <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="3" cy="9" r="1.5" />
            <circle cx="9" cy="9" r="1.5" />
          </svg>
        </span>
        <span className="nav-right-label">{view.cta.label}</span>
      </NavAnchor>
    </motion.header>
  );
}

/** The navigation, with entrances that respect "reduce motion": the bar and its panel still fade in, nothing slides or scales. */
export function Navbar({ view }: { view: NavbarView }) {
  return (
    <MotionConfig reducedMotion="user">
      <NavPills view={view} />
    </MotionConfig>
  );
}
