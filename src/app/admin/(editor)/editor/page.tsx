import { randomUUID } from "node:crypto";

import type { Metadata } from "next";

import { MirrorEditor } from "@/components/editor/MirrorEditor";
import { requireActiveAdmin } from "@/lib/auth/access";
import { isPageDocumentId } from "@/lib/content/documents";
import { loadDraftContent } from "@/lib/content/drafts";
import { getPublishedContent } from "@/lib/content/published";
import { isLocale } from "@/lib/i18n/locales";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "แก้ไขหน้าเว็บ" };

// Mirror editor: the published content with the Admins' saved drafts, read
// through RLS with the signed-in Admin's session on every request.
export default async function EditorPage({ searchParams }: PageProps<"/admin/editor">) {
  await requireActiveAdmin("/admin/editor");
  const { page, locale } = await searchParams;
  const pageId = typeof page === "string" && isPageDocumentId(page) ? page : "home";
  const lang = typeof locale === "string" && isLocale(locale) ? locale : "th";

  const content = await getPublishedContent();
  const { content: working, drafts, problems, available } = await loadDraftContent(await createClient(), content);
  return (
    <MirrorEditor
      published={content}
      working={working}
      drafts={drafts.map((draft) => ({ documentId: draft.documentId, revision: draft.revision }))}
      problems={problems}
      draftsAvailable={available}
      initialPage={pageId}
      initialLocale={lang}
      channel={randomUUID()}
    />
  );
}
