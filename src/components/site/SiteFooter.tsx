import Image from "next/image";

import { formatPhone, isCurrent, telHref } from "@/lib/content/render";

import { ConsentSettingsButton } from "./consent/ConsentBanner";
import type { RenderContext } from "./context";
import { CallIcon, MailIcon } from "./icons";
import { LanguageSwitch } from "./LanguageSwitch";
import { ContactLink, TargetLink } from "./links";

export function SiteFooter({ ctx, path }: { ctx: RenderContext; path: string }) {
  const { site } = ctx;
  const { ui, contact } = site;
  const qr = ctx.media(contact.lineQr);
  const year = new Date().getFullYear();

  return (
    <footer className="tm-on-ink bg-tm-ink text-tm-on-ink">
      <div className="tm-container grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.25fr)] lg:gap-10">
        <div>
          <p className="text-tm-h4 font-semibold" {...ctx.bind("site", "brand", "name")}>
            {ctx.t(site.brand.name)}
          </p>
          <p className="mt-3 max-w-[22rem] text-tm-small text-tm-on-ink-muted" {...ctx.bind("site", "footer", "about")}>
            {ctx.t(site.footer.about)}
          </p>
        </div>

        {site.footer.groups.map((group) => (
          <nav key={group.id} aria-labelledby={`footer-${group.id}`}>
            <h2
              id={`footer-${group.id}`}
              className="text-tm-small font-semibold text-tm-on-ink-muted"
              {...ctx.bind("site", "footer", "groups", group.id, "heading")}
            >
              {ctx.t(group.heading)}
            </h2>
            <ul className="mt-3 grid gap-1">
              {group.links.map((entry) => (
                <li key={entry.id}>
                  <TargetLink
                    ctx={ctx}
                    target={entry.target}
                    current={isCurrent(entry.target, path)}
                    bind={ctx.bind("site", "footer", "groups", group.id, "links", entry.id)}
                    className="inline-flex min-h-tm-control items-center py-1 hover:underline hover:decoration-tm-red hover:decoration-2 hover:underline-offset-[0.35em] aria-[current=page]:underline aria-[current=page]:underline-offset-[0.35em]"
                  >
                    {ctx.t(entry.label)}
                  </TargetLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact" className="text-tm-small font-semibold text-tm-on-ink-muted" {...ctx.bind("site", "ui", "footerContact")}>
            {ctx.t(ui.footerContact)}
          </h2>
          <div className="mt-4 flex items-start gap-4">
            <Image
              src={qr.src}
              width={qr.width}
              height={qr.height}
              alt={ctx.t(qr.alt)}
              className="h-24 w-24 shrink-0 rounded-tm-control bg-tm-canvas p-1"
              {...ctx.bind("site", "contact", "lineQr")}
            />
            <div>
              <p className="text-tm-small text-tm-on-ink-muted" {...ctx.bind("site", "ui", "lineId")}>
                {ctx.t(ui.lineId)}
              </p>
              <p className="text-tm-lead font-semibold" {...ctx.bind("site", "contact", "lineId")}>
                {contact.lineId}
              </p>
              <ContactLink
                ctx={ctx}
                channel="line-sales"
                ctaId="footer-line"
                className="tm-button tm-button-secondary mt-2"
                bind={ctx.bind("site", "contact", "lineSales")}
              >
                {ctx.t(ui.chatOnLine)}
              </ContactLink>
            </div>
          </div>
          <ul className="mt-6 grid gap-1">
            {contact.phones.map((phone, index) => (
              <li key={phone.number}>
                <a
                  href={telHref(phone.number)}
                  data-cta="footer-call"
                  className="inline-flex min-h-tm-control items-center gap-2 hover:underline"
                  {...ctx.bind("site", "contact", "phones", index)}
                >
                  <CallIcon className="text-[1.1em]" />
                  <span className="sr-only">{ctx.t(ui.call)} </span>
                  <span className="tm-num font-semibold">{formatPhone(phone.number)}</span>
                  <span className="text-tm-small text-tm-on-ink-muted">{ctx.t(phone.label)}</span>
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${contact.email}`}
                data-cta="footer-email"
                className="inline-flex min-h-tm-control items-center gap-2 break-all hover:underline"
                {...ctx.bind("site", "contact", "email")}
              >
                <MailIcon className="shrink-0 text-[1.1em]" />
                <span className="sr-only">{ctx.t(ui.email)} </span>
                {contact.email}
              </a>
            </li>
            <li>
              <ContactLink
                ctx={ctx}
                channel="facebook"
                ctaId="footer-facebook"
                className="inline-flex min-h-tm-control items-center hover:underline"
                bind={ctx.bind("site", "contact", "facebook")}
              >
                {ctx.t(ui.facebook)}
              </ContactLink>
            </li>
          </ul>
        </section>
      </div>

      <div className="border-t border-tm-muted">
        <div className="tm-container flex flex-col-reverse gap-4 py-6 text-tm-small text-tm-on-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p {...ctx.bind("site", "footer", "copyright")}>
            © {year} {ctx.t(site.footer.copyright)}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ConsentSettingsButton
              label={ctx.t(site.consent.settingsLink)}
              className="min-h-tm-control font-medium text-tm-on-ink underline decoration-tm-red decoration-2 underline-offset-4"
              bind={ctx.bind("site", "consent", "settingsLink")}
            />
            <LanguageSwitch locale={ctx.locale} path={path} label={ctx.t(ui.languageSwitch)} tone="ink" />
          </div>
        </div>
      </div>
    </footer>
  );
}
