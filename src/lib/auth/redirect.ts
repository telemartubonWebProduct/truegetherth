// Post-authentication redirects only ever go to back-office paths on this
// origin. `next` values come from query strings and form fields, so anything
// that could leave the site (protocol-relative URLs, backslashes, encoded
// slashes, dot segments) falls back to the default.

export const ADMIN_HOME = "/admin";

const PLACEHOLDER_ORIGIN = "http://internal.invalid";
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

// Pages that would loop back into the sign-in flow if used as a destination.
const NON_DESTINATIONS = ["/admin/login", "/admin/forgot-password"];

export function safeAdminPath(value: unknown, fallback: string = ADMIN_HOME): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || CONTROL_CHARACTERS.test(value)) return fallback;

  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;

  const { pathname } = url;
  const isAdminPath = pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`);
  if (!isAdminPath || /%2f|%5c/i.test(pathname)) return fallback;
  if (NON_DESTINATIONS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return fallback;
  }

  return `${pathname}${url.search}`;
}
