import { requireActiveAdmin } from "@/lib/auth/access";

// The Mirror editor and its preview use the whole window, without the console
// navigation. Both pages repeat the Admin check themselves, as do the Server
// Actions that save drafts; this layout only guards rendering.
export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  await requireActiveAdmin("/admin/editor");
  return children;
}
