// Which contact channel a link opens, for the GA4 contact events: clicks on
// LINE, phone, email and Facebook links are reported as separate events so
// each can be a key event in GA4 on its own.

export type ContactChannelEvent = "contact_line" | "contact_phone" | "contact_email" | "contact_facebook";

const lineHosts = ["lin.ee", "line.me"];
const facebookHosts = ["facebook.com", "fb.com", "fb.me", "m.me"];

function onHost(hostname: string, hosts: string[]): boolean {
  return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export function contactEventFor(href: string): ContactChannelEvent | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  // A dial code to subscribe (*123#) is not a call to the team.
  if (url.protocol === "tel:") return /[*#]|%2a|%23/i.test(href) ? null : "contact_phone";
  if (url.protocol === "mailto:") return "contact_email";
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (onHost(url.hostname, lineHosts)) return "contact_line";
  if (onHost(url.hostname, facebookHosts)) return "contact_facebook";
  return null;
}
