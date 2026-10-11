import { formatPhone, telHref } from "@/lib/content/render";

import type { RenderContext } from "./context";
import { CallIcon } from "./icons";
import { ContactLink } from "./links";

/** Closing call to action on every page except the contact page itself. */
export function ContactBand({ ctx }: { ctx: RenderContext }) {
  const { site } = ctx;
  const { ui, contactBand } = site;
  const phone = site.contact.phones[0];

  return (
    <section aria-labelledby="contact-band-heading" data-tone={contactBand.tone} {...ctx.bind("site", "contactBand")}>
      <div className="tm-container grid gap-8 py-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:py-24">
        <div className="max-w-[42rem]">
          <h2 id="contact-band-heading" className="text-tm-h1 font-semibold lg:text-tm-display" {...ctx.bind("site", "contactBand", "heading")}>
            {ctx.t(contactBand.heading)}
          </h2>
          <p className="mt-3 text-tm-lead text-tm-muted" {...ctx.bind("site", "contactBand", "description")}>
            {ctx.t(contactBand.description)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ContactLink
            ctx={ctx}
            channel="line-service"
            ctaId="contact-band-line"
            className="tm-button tm-button-primary"
            bind={ctx.bind("site", "ui", "chatOnLine")}
          >
            {ctx.t(ui.chatOnLine)}
          </ContactLink>
          <a href={telHref(phone.number)} data-cta="contact-band-call" className="tm-button tm-button-secondary" {...ctx.bind("site", "contact", "phones", 0)}>
            <CallIcon className="text-[1.15em]" />
            {ctx.t(ui.call)} <span className="tm-num">{formatPhone(phone.number)}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
