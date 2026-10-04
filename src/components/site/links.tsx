import Link from "next/link";
import type { ReactNode } from "react";

import { resolveLink, type ResolvedLink } from "@/lib/content/render";
import type { Cta, LinkTarget } from "@/lib/content/schema";

import type { RenderContext } from "./context";

type Binding = { "data-edit"?: string };

type SmartLinkProps = Binding & {
  link: ResolvedLink;
  className?: string;
  children: ReactNode;
  /** Stable CTA id for analytics (M5); independent of the visible label. */
  ctaId?: string;
  newTabLabel: string;
  "aria-current"?: "page";
};

/** Internal links navigate inside the site; external ones open a new tab. */
export function SmartLink({ link, className, children, ctaId, newTabLabel, ...rest }: SmartLinkProps) {
  if (!link.external) {
    const internal = link.href.startsWith("/");
    return internal ? (
      <Link href={link.href} className={className} data-cta={ctaId} {...rest}>
        {children}
      </Link>
    ) : (
      <a href={link.href} className={className} data-cta={ctaId} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <a href={link.href} className={className} data-cta={ctaId} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      <span className="sr-only"> ({newTabLabel})</span>
    </a>
  );
}

type CtaLinkProps = {
  ctx: RenderContext;
  cta: Cta;
  className?: string;
  /** Extra words for screen readers, such as the package the button is for. */
  context?: string;
  bind?: Binding;
};

export function CtaLink({ ctx, cta, className = "", context, bind }: CtaLinkProps) {
  return (
    <SmartLink
      link={resolveLink(cta.target, ctx.locale, ctx.site)}
      ctaId={cta.id}
      newTabLabel={ctx.t(ctx.site.ui.opensInNewTab)}
      className={`tm-button ${cta.style === "primary" ? "tm-button-primary" : "tm-button-secondary"} ${className}`}
      {...bind}
    >
      {ctx.t(cta.label)}
      {context ? <span className="sr-only">: {context}</span> : null}
    </SmartLink>
  );
}

type TargetLinkProps = {
  ctx: RenderContext;
  target: LinkTarget;
  className?: string;
  children: ReactNode;
  current?: boolean;
  bind?: Binding;
};

export function TargetLink({ ctx, target, className, children, current, bind }: TargetLinkProps) {
  return (
    <SmartLink
      link={resolveLink(target, ctx.locale, ctx.site)}
      newTabLabel={ctx.t(ctx.site.ui.opensInNewTab)}
      className={className}
      aria-current={current ? "page" : undefined}
      {...bind}
    >
      {children}
    </SmartLink>
  );
}

/** A site-settings contact channel (LINE, phone, email, Facebook) as a link. */
export function ContactLink({
  ctx,
  channel,
  className,
  children,
  ctaId,
  bind,
}: {
  ctx: RenderContext;
  channel: Extract<LinkTarget, { kind: "contact" }>["channel"];
  className?: string;
  children: ReactNode;
  ctaId: string;
  bind?: Binding;
}) {
  return (
    <SmartLink
      link={resolveLink({ kind: "contact", channel }, ctx.locale, ctx.site)}
      ctaId={ctaId}
      newTabLabel={ctx.t(ctx.site.ui.opensInNewTab)}
      className={className}
      {...bind}
    >
      {children}
    </SmartLink>
  );
}
