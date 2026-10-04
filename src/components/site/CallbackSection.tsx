import { formatPhone, resolveLink, telHref } from "@/lib/content/render";
import type { ContactPage } from "@/lib/content/schema";
import { requestablePackages, serviceOf } from "@/lib/leads/packages";
import { provinceOptions } from "@/lib/leads/provinces";

import type { RenderContext } from "./context";
import { CallIcon } from "./icons";
import { bindAll, localize } from "./lead-text";
import { LeadForm } from "./LeadForm";
import { ContactLink } from "./links";

/**
 * The contact page's call-back request (M5). Visitors fill in the form; when
 * this deployment cannot store requests (no Supabase or secret key), they get
 * LINE and the phone instead. The editor preview always shows the form, which
 * never sends there (ctx.leads).
 */
export function CallbackSection({ ctx, page }: { ctx: RenderContext; page: ContactPage }) {
  const { callback } = page;
  const { site } = ctx;
  const phone = site.contact.phones[0];
  const packages = Object.fromEntries(requestablePackages(ctx.content).map((item) => [item.id, { name: ctx.t(item.name), service: serviceOf(item) }]));

  return (
    <section id="callback" aria-labelledby="callback-heading" data-tone={callback.tone} {...ctx.bind("page:contact", "callback")}>
      <div className="tm-container grid gap-10 py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-16">
        <div>
          <h2 id="callback-heading" className="text-tm-h2 font-semibold" {...ctx.bind("page:contact", "callback", "heading")}>
            {ctx.t(callback.heading)}
          </h2>
          <p className="mt-3 max-w-[34rem] text-tm-lead text-tm-muted" {...ctx.bind("page:contact", "callback", "description")}>
            {ctx.t(callback.description)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ContactLink ctx={ctx} channel="line-sales" ctaId="callback-line" className="tm-button tm-button-secondary" bind={ctx.bind("site", "ui", "chatOnLine")}>
              {ctx.t(site.ui.chatOnLine)}
            </ContactLink>
            <a href={telHref(phone.number)} data-cta="callback-call" className="tm-button tm-button-secondary" {...ctx.bind("site", "contact", "phones", 0)}>
              <CallIcon className="text-[1.15em]" />
              {ctx.t(site.ui.call)} <span className="tm-num">{formatPhone(phone.number)}</span>
            </a>
          </div>
        </div>
        {ctx.leads !== "off" ? (
          <LeadForm
            text={localize(site.leadForm, ctx.locale)}
            binds={ctx.edit ? bindAll(site.leadForm, (...path) => ctx.bind("site", ...path), ["leadForm"]) : undefined}
            locale={ctx.locale}
            provinces={provinceOptions(ctx.locale)}
            packages={packages}
            policyHref={resolveLink({ kind: "page", path: "/termsAndPrivacy", hash: "data-collection" }, ctx.locale, site).href}
            mode={ctx.leads === "live" ? "live" : "preview"}
            formId="contact-callback"
          />
        ) : (
          <p className="self-start rounded-tm-panel border border-tm-line bg-tm-canvas p-6 text-tm-lead" data-lead-form-unavailable="">
            {ctx.t(site.leadForm.errors.unavailable)}
          </p>
        )}
      </div>
    </section>
  );
}
