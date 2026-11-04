import { todayInThailand } from "@/lib/content/dates";
import { getPublishedContent } from "@/lib/content/published";
import { llmsText } from "@/lib/seo/llms";

// /llms.txt: the site for AI assistants and answer engines, from the published
// content (src/lib/seo/llms.ts). Made again at most every hour, and on each
// publish with the rest of the content, so packages appear and leave on their days.
export const revalidate = 3600;

export async function GET() {
  const content = await getPublishedContent();
  return new Response(llmsText(content, todayInThailand()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
