import { z } from "zod";

import { pageDocumentIds } from "@/lib/content/documents";
import { locales } from "@/lib/i18n/locales";

// Messages between the Mirror editor (parent window) and its preview (iframe).
// Both sides check the origin, the window the message came from and the
// channel of this editor session, then validate the message itself; anything
// else is ignored (ARCHITECTURE.md §3).

const binding = z.string().min(1).max(300);
const channel = z.uuid();
const pageId = z.enum(pageDocumentIds);
const locale = z.enum(locales);

export const toPreview = z.discriminatedUnion("type", [
  /** The editor's whole working content: sent once the preview is ready. */
  z.object({ type: z.literal("content"), channel, content: z.record(z.string(), z.unknown()) }),
  /** One document changed in the editor. */
  z.object({ type: z.literal("document"), channel, documentId: z.string().max(96), body: z.unknown() }),
  /** What to show: page, language, and whether clicks select fields. */
  z.object({ type: z.literal("view"), channel, pageId, locale, edit: z.boolean() }),
  /** Highlight a field (null clears it); `scroll` brings it into view. */
  z.object({ type: z.literal("select"), channel, binding: binding.nullable(), scroll: z.boolean() }),
]);
export type ToPreview = z.infer<typeof toPreview>;

export const toEditor = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready"), channel }),
  /** A field was clicked in edit mode. */
  z.object({ type: z.literal("select"), channel, binding }),
  /** A link to another page of the site was clicked while viewing. */
  z.object({ type: z.literal("navigate"), channel, pageId, locale }),
  /** A link that leaves the site (LINE, phone, another website) was clicked while viewing. */
  z.object({ type: z.literal("link"), channel, href: z.string().max(2000) }),
  /** The preview could not render the current content. */
  z.object({ type: z.literal("render-error"), channel, message: z.string().max(500) }),
]);
export type ToEditor = z.infer<typeof toEditor>;

/** A random id per editor session, so two open editors never talk to each other's preview. */
export function newChannel(): string {
  return crypto.randomUUID();
}

export function isChannel(value: unknown): value is string {
  return channel.safeParse(value).success;
}

/** URL of the preview of one page; the editor adds its channel. */
export function previewPath(page: z.infer<typeof pageId>, lang: z.infer<typeof locale>, withChannel?: string): string {
  const path = `/admin/preview/${lang}/${page}`;
  return withChannel ? `${path}?channel=${withChannel}` : path;
}
