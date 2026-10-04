"use client";

import { Component, useCallback, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";

import { renderContext } from "@/components/site/context";
import { PageView } from "@/components/site/pages/PageView";
import { isCollectionDocument, isDocumentId, isTombstone, pageIdForPath, readDocument, writeDocument, type PageDocumentId } from "@/lib/content/documents";
import type { SiteContent } from "@/lib/content/schema";
import { themeVariables } from "@/lib/content/theme";
import { splitLocale, type Locale } from "@/lib/i18n/locales";

import { bindingLabel } from "./labels";
import { previewPath, toPreview, type ToEditor } from "./protocol";

// The page as visitors get it, rendered from the editor's working content with
// the same components, CSS and fonts as the public site (ARCHITECTURE.md §3).
// Inside the editor frame it follows the editor's messages; opened on its own
// it shows the saved drafts. Either way nothing leaves the preview: links,
// calls, LINE and forms are caught and reported instead of followed.

type View = { pageId: PageDocumentId; locale: Locale; edit: boolean };

type PreviewCanvasProps = {
  initialContent: SiteContent;
  initialPage: PageDocumentId;
  initialLocale: Locale;
  /** Channel of the editor that framed this preview; null when opened on its own. */
  channel: string | null;
};

function selectorFor(binding: string): string {
  return `[data-edit="${CSS.escape(binding)}"]`;
}

function visible(element: Element): boolean {
  const box = element.getBoundingClientRect();
  return box.width > 0 || box.height > 0;
}

/** Opens closed <details> around an element, so a selected FAQ answer can be seen. */
function reveal(element: Element) {
  for (let details = element.closest("details"); details; details = details.parentElement?.closest("details") ?? null) {
    if (!details.open) details.open = true;
  }
}

function scrollToBinding(binding: string) {
  const element = Array.from(document.querySelectorAll(selectorFor(binding))).find(visible);
  if (!element) return;
  reveal(element);
  const box = element.getBoundingClientRect();
  if (box.top < 88 || box.bottom > window.innerHeight - 16) element.scrollIntoView({ block: "center", behavior: "smooth" });
}

function isContent(value: Record<string, unknown>): value is SiteContent {
  const record = (key: string) => typeof value[key] === "object" && value[key] !== null;
  return record("site") && record("pages") && record("media") && record("benefits") && Array.isArray(value.catalog);
}

type GuardProps = { resetKey: unknown; fallback: (error: Error) => ReactNode; onError?: (error: Error) => void; children: ReactNode };
type GuardState = { error: Error | null; key: unknown };

/** Keeps a render error in the working content from blanking the whole preview. */
class RenderGuard extends Component<GuardProps, GuardState> {
  state: GuardState = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<GuardState> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  static getDerivedStateFromProps(props: GuardProps, state: GuardState): Partial<GuardState> | null {
    return props.resetKey === state.key ? null : { error: null, key: props.resetKey };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

/** Runs after its siblings rendered without an error. */
function Rendered({ content, onRendered }: { content: SiteContent; onRendered: (content: SiteContent) => void }) {
  useEffect(() => onRendered(content), [content, onRendered]);
  return null;
}

type Box = { x: number; y: number; width: number; height: number; kind: "hover" | "selected" };

/** Outlines drawn over the page, so selecting a field never moves the layout. */
function SelectionOverlay({ selected, hovered, label }: { selected: string | null; hovered: Element | null; label: string }) {
  const [boxes, setBoxes] = useState<Box[]>([]);

  // Follows the page every frame while things move (scrolling, re-renders,
  // images loading), then checks only a few times a second once it is still.
  useEffect(() => {
    let frame = 0;
    let timer = 0;
    let still = 0;
    let last = "";
    const measure = () => {
      const next: Box[] = [];
      const push = (element: Element, kind: Box["kind"]) => {
        const box = element.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) return;
        next.push({ x: Math.round(box.left), y: Math.round(box.top), width: Math.round(box.width), height: Math.round(box.height), kind });
      };
      if (selected) document.querySelectorAll(selectorFor(selected)).forEach((element) => push(element, "selected"));
      if (hovered?.isConnected && hovered.getAttribute("data-edit") !== selected) push(hovered, "hover");
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        still = 0;
        setBoxes(next);
      } else {
        still += 1;
      }
      if (still > 30) timer = window.setTimeout(() => (frame = requestAnimationFrame(measure)), 250);
      else frame = requestAnimationFrame(measure);
    };
    const wake = () => {
      still = 0;
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    window.addEventListener("scroll", wake, { capture: true, passive: true });
    window.addEventListener("resize", wake);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", wake, { capture: true });
      window.removeEventListener("resize", wake);
    };
  }, [selected, hovered]);

  const first = boxes.find((box) => box.kind === "selected");
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2147483000]">
      {boxes.map((box, index) => (
        <div
          key={index}
          className={`absolute left-0 top-0 rounded-[3px] ${box.kind === "selected" ? "outline outline-2 outline-[#2563eb]" : "outline-dashed outline-2 outline-[#2563eb]/70"}`}
          style={{ transform: `translate(${box.x - 3}px, ${box.y - 3}px)`, width: box.width + 6, height: box.height + 6 }}
        />
      ))}
      {first && label ? (
        <div
          className="absolute left-0 top-0 max-w-[16rem] truncate rounded-[3px] bg-[#2563eb] px-1.5 py-0.5 font-sans text-[12px] font-medium leading-4 text-white"
          style={{ transform: `translate(${Math.max(first.x - 3, 0)}px, ${Math.max(first.y - 24, 0)}px)` }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}

export function PreviewCanvas({ initialContent, initialPage, initialLocale, channel }: PreviewCanvasProps) {
  const [content, setContent] = useState(initialContent);
  const [stable, setStable] = useState(initialContent);
  const [view, setView] = useState<View>({ pageId: initialPage, locale: initialLocale, edit: channel !== null });
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Element | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Typing in the editor stays responsive while the page re-renders.
  const shown = useDeferredValue(content);

  const post = useCallback(
    (message: ToEditor) => {
      if (channel && window.parent !== window) window.parent.postMessage(message, window.location.origin);
    },
    [channel],
  );

  // Messages from the editor that framed this preview.
  useEffect(() => {
    if (!channel || window.parent === window) return;
    const editor = window.parent;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== editor) return;
      const parsed = toPreview.safeParse(event.data);
      if (!parsed.success || parsed.data.channel !== channel) return;
      const message = parsed.data;
      switch (message.type) {
        case "content":
          if (isContent(message.content)) setContent(message.content);
          break;
        case "document": {
          const { documentId, body } = message;
          if (!isDocumentId(documentId)) return;
          setContent((current) => {
            // Packages, pictures and benefits can be new or removed (a tombstone); other documents always exist.
            const value = isTombstone(body) ? undefined : body;
            const exists = readDocument(current, documentId) !== undefined;
            if (!exists && (value === undefined || !isCollectionDocument(documentId))) return current;
            return writeDocument(current, documentId, value);
          });
          break;
        }
        case "view":
          setView({ pageId: message.pageId, locale: message.locale, edit: message.edit });
          if (!message.edit) setHovered(null);
          break;
        case "select":
          setSelected(message.binding);
          if (message.binding && message.scroll) requestAnimationFrame(() => scrollToBinding(message.binding!));
          break;
      }
    };
    window.addEventListener("message", onMessage);
    post({ type: "ready", channel });
    return () => window.removeEventListener("message", onMessage);
  }, [channel, post]);

  // Clicks select fields while editing; links never leave the preview.
  useEffect(() => {
    const say = (text: string) => {
      setNotice(text);
      window.setTimeout(() => setNotice((current) => (current === text ? null : current)), 4000);
    };
    const followLink = (anchor: HTMLAnchorElement) => {
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin && !url.pathname.startsWith("/admin")) {
        const { locale, path } = splitLocale(url.pathname);
        const pageId = pageIdForPath(path);
        if (pageId) {
          if (pageId === view.pageId && locale === view.locale && url.hash) {
            document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ behavior: "smooth" });
          } else if (channel) {
            post({ type: "navigate", channel, pageId, locale });
          } else {
            window.location.assign(previewPath(pageId, locale));
          }
          return;
        }
      }
      if (channel) post({ type: "link", channel, href: anchor.href });
      else say(`ลิงก์นี้ไปที่ ${anchor.href} (หน้าตัวอย่างไม่เปิดลิงก์ออกนอกเว็บ)`);
    };
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      const leaves = anchor !== null && !anchor.getAttribute("href")?.startsWith("#");
      // Middle clicks would open the link in a new tab.
      if (leaves) event.preventDefault();
      if (event.type !== "click") return;
      if (view.edit) {
        const binding = event.target.closest("[data-edit]")?.getAttribute("data-edit");
        if (binding && channel) {
          setSelected(binding);
          post({ type: "select", channel, binding });
        }
      } else if (leaves) {
        followLink(anchor);
      }
    };
    const onSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      say("หน้าตัวอย่างไม่ส่งฟอร์มจริง");
    };
    const onOver = (event: MouseEvent) => {
      if (view.edit && event.target instanceof Element) setHovered(event.target.closest("[data-edit]"));
    };
    const onLeave = () => setHovered(null);
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("mouseover", onOver, true);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("mouseover", onOver, true);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [view, channel, post]);

  useEffect(() => {
    document.documentElement.lang = view.locale;
  }, [view.locale]);

  // Another page or language starts at the top, as a page load would.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view.pageId, view.locale]);

  const ctx = useMemo(() => renderContext(shown, view.locale, { edit: view.edit, leads: "preview" }), [shown, view]);
  // The same element while only `stable` changes, so the page renders once per edit.
  const page = useMemo(() => <PageView ctx={ctx} pageId={view.pageId} />, [ctx, view.pageId]);
  const stableCtx = useMemo(() => renderContext(stable, view.locale, { edit: view.edit, leads: "preview" }), [stable, view]);
  const theme = useMemo(() => {
    try {
      return themeVariables(shown.site.theme);
    } catch {
      return {};
    }
  }, [shown.site.theme]);

  const onError = useCallback(
    (error: Error) => {
      if (channel) post({ type: "render-error", channel, message: error.message.slice(0, 500) });
    },
    [channel, post],
  );

  return (
    <div className={`tm-site${view.edit ? " tm-preview-edit" : ""}`} lang={view.locale} style={theme} data-preview={view.edit ? "edit" : "view"}>
      <RenderGuard
        resetKey={shown}
        onError={onError}
        fallback={(error) => (
          <>
            <p role="alert" className="sticky top-0 z-50 bg-[#fef3c7] px-4 py-2 text-center text-tm-small text-[#78350f]">
              เนื้อหาที่กำลังแก้แสดงผลไม่ได้ ({error.message}) กำลังแสดงฉบับล่าสุดที่แสดงได้
            </p>
            <RenderGuard resetKey={stable} fallback={() => <p className="p-8">แสดงตัวอย่างไม่ได้</p>}>
              <PageView ctx={stableCtx} pageId={view.pageId} />
            </RenderGuard>
          </>
        )}
      >
        {page}
        <Rendered content={shown} onRendered={setStable} />
      </RenderGuard>
      {view.edit ? <SelectionOverlay selected={selected} hovered={hovered} label={selected ? bindingLabel(shown, selected) : ""} /> : null}
      {notice ? (
        <p role="status" className="fixed inset-x-4 bottom-4 z-[2147483001] mx-auto max-w-[36rem] rounded-tm-panel bg-tm-ink px-4 py-3 text-tm-small text-tm-on-ink">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
