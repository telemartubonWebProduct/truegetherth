import type { ReactNode } from "react";

import { ContactBand } from "./ContactBand";
import type { RenderContext } from "./context";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type PageShellProps = {
  ctx: RenderContext;
  /** Unprefixed path of the page, used for the current menu item and the language switch. */
  path: string;
  children: ReactNode;
  /** The contact page already is the contact band. */
  contactBand?: boolean;
  /** The page starts under the floating navigation (the home page's hero fills the screen). */
  flush?: boolean;
};

/** Navigation, main landmark, closing contact band and footer shared by every public page. */
export function PageShell({ ctx, path, children, contactBand = true, flush = false }: PageShellProps) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-tm-ink focus:px-4 focus:py-3 focus:text-tm-on-ink"
      >
        {ctx.t(ctx.site.ui.skipToContent)}
      </a>
      <SiteHeader ctx={ctx} path={path} />
      <main id="main" tabIndex={-1} className={`focus-visible:outline-none ${flush ? "" : "tm-main-offset"}`.trim()}>
        {children}
      </main>
      {contactBand ? <ContactBand ctx={ctx} /> : null}
      <SiteFooter ctx={ctx} path={path} />
    </>
  );
}
