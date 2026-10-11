import type { Metadata } from "next";

import { CatalogWorkspace } from "@/components/catalog/CatalogWorkspace";
import { requireActiveAdmin } from "@/lib/auth/access";
import { loadDraftContent } from "@/lib/content/drafts";
import { getPublishedContent } from "@/lib/content/published";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "แพ็กเกจและโปร" };

// Packages and promos: the published content with the Admins' saved drafts,
// read through RLS with the signed-in Admin's session on every request, as the
// Mirror editor reads it. ?package=<id> opens that package (the editor's link).
export default async function CatalogPage({ searchParams }: PageProps<"/admin/catalog">) {
  await requireActiveAdmin("/admin/catalog");
  const { package: packageId } = await searchParams;

  const content = await getPublishedContent();
  const { content: working, drafts, problems, available } = await loadDraftContent(await createClient(), content);
  return (
    <CatalogWorkspace
      published={content}
      working={working}
      drafts={drafts.map((draft) => ({ documentId: draft.documentId, revision: draft.revision }))}
      problems={problems}
      draftsAvailable={available}
      initialPackage={typeof packageId === "string" ? packageId : undefined}
    />
  );
}
