// Shared class lists for back-office controls, built on the site's design tokens.

export const primaryButton =
  "inline-flex min-h-tm-control w-full items-center justify-center rounded-tm-control bg-tm-red px-5 text-tm-body font-semibold text-tm-on-red transition-colors duration-tm-fast ease-tm-out hover:bg-tm-red-press disabled:cursor-progress disabled:opacity-70";

export const secondaryButton =
  "inline-flex min-h-tm-control items-center justify-center rounded-tm-control border border-tm-ink bg-tm-canvas px-4 text-tm-small font-semibold text-tm-ink transition-colors duration-tm-fast ease-tm-out hover:bg-tm-surface";

export const inverseButton =
  "inline-flex min-h-tm-control items-center justify-center rounded-tm-control border border-white/60 px-4 text-tm-small font-semibold text-tm-on-ink transition-colors duration-tm-fast ease-tm-out hover:border-white hover:bg-white/10";

export const textLink =
  "font-medium text-tm-ink underline decoration-tm-red decoration-2 underline-offset-4 transition-colors duration-tm-fast hover:text-tm-red-press";

export const textInput =
  "block min-h-tm-control w-full rounded-tm-control border border-tm-line bg-tm-canvas px-3 text-tm-body text-tm-ink transition-colors duration-tm-fast placeholder:text-tm-muted hover:border-tm-muted focus:border-tm-ink aria-[invalid=true]:border-tm-danger";

export const pageTitle = "text-tm-h2 font-semibold tracking-tight";
