import Image from "next/image";

import { formatPhone, telHref } from "@/lib/content/render";
import type { ContactPage } from "@/lib/content/schema";

import type { RenderContext } from "./context";
import { CallIcon, MailIcon } from "./icons";
import { ContactLink } from "./links";

type Channel = ContactPage["channels"]["items"][number];

function ChannelAction({ ctx, channel }: { ctx: RenderContext; channel: Channel }) {
  const { ui, contact } = ctx.site;

  switch (channel.channel) {
    case "line-sales":
    case "line-service": {
      const qr = ctx.media(contact.lineQr);
      return (
        <div className="flex flex-wrap items-center gap-5">
          <Image
            src={qr.src}
            width={qr.width}
            height={qr.height}
            alt={ctx.t(qr.alt)}
            className="h-28 w-28 rounded-tm-control border border-tm-line"
            {...ctx.bind("site", "contact", "lineQr")}
          />
          <div>
            <p className="text-tm-small text-tm-muted">{ctx.t(ui.lineId)}</p>
            <p className="text-tm-lead font-semibold" {...ctx.bind("site", "contact", "lineId")}>
              {contact.lineId}
            </p>
            <ContactLink
              ctx={ctx}
              channel={channel.channel}
              ctaId={`contact-${channel.id}`}
              className="tm-button tm-button-primary mt-3"
              bind={ctx.bind("site", "contact", channel.channel === "line-sales" ? "lineSales" : "lineService")}
            >
              {ctx.t(ui.chatOnLine)}
            </ContactLink>
          </div>
        </div>
      );
    }
    case "phone-sales":
      return (
        <ul className="grid gap-2">
          {contact.phones.map((phone, index) => (
            <li key={phone.number}>
              <a
                href={telHref(phone.number)}
                data-cta={`contact-${channel.id}`}
                className="tm-button tm-button-secondary w-full justify-between sm:w-auto sm:min-w-[16rem]"
                {...ctx.bind("site", "contact", "phones", index)}
              >
                <span className="inline-flex items-center gap-2">
                  <CallIcon className="text-[1.15em]" />
                  <span className="sr-only">{ctx.t(ui.call)} </span>
                  <span className="tm-num">{formatPhone(phone.number)}</span>
                </span>
                <span className="text-tm-small font-normal">{ctx.t(phone.label)}</span>
              </a>
            </li>
          ))}
        </ul>
      );
    case "email":
      return (
        <a
          href={`mailto:${contact.email}`}
          data-cta={`contact-${channel.id}`}
          className="tm-link inline-flex items-center gap-2 break-all text-tm-lead font-semibold"
          {...ctx.bind("site", "contact", "email")}
        >
          <MailIcon className="shrink-0" />
          {contact.email}
        </a>
      );
    case "facebook":
      return (
        <ContactLink
          ctx={ctx}
          channel="facebook"
          ctaId={`contact-${channel.id}`}
          className="tm-button tm-button-secondary"
          bind={ctx.bind("site", "contact", "facebook")}
        >
          {ctx.t(ui.facebook)}
        </ContactLink>
      );
  }
}

export function ContactChannels({ ctx, page }: { ctx: RenderContext; page: ContactPage }) {
  const { channels } = page;
  return (
    <section aria-labelledby="channels-heading" className="py-12 lg:py-16" data-tone={channels.tone} {...ctx.bind("page:contact", "channels")}>
      <div className="tm-container">
        <h2 id="channels-heading" className="text-tm-h2 font-semibold" {...ctx.bind("page:contact", "channels", "heading")}>
          {ctx.t(channels.heading)}
        </h2>
        <ul role="list" className="mt-8 grid gap-px overflow-hidden rounded-tm-panel border border-tm-line bg-tm-line md:grid-cols-2">
          {channels.items.map((channel) => (
            <li key={channel.id} className="flex flex-col items-start gap-5 bg-tm-canvas p-6 lg:p-8" {...ctx.bind("page:contact", "channels", "items", channel.id)}>
              <div>
                <h3 className="text-tm-h3 font-semibold" {...ctx.bind("page:contact", "channels", "items", channel.id, "title")}>
                  {ctx.t(channel.title)}
                </h3>
                <p className="mt-1 text-tm-muted" {...ctx.bind("page:contact", "channels", "items", channel.id, "description")}>
                  {ctx.t(channel.description)}
                </p>
              </div>
              <ChannelAction ctx={ctx} channel={channel} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
