import { randomBytes, randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../../src/lib/supabase/database.types";

// Helpers for the Admin authentication suite. They only ever talk to the local
// Supabase stack (see scripts/supabase/local-env.sh): users are created per run
// with random passwords and deleted afterwards.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secretKey = process.env.E2E_SUPABASE_SECRET_KEY ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const mailpitUrl = process.env.E2E_MAILPIT_URL ?? "";

function isLocalUrl(value: string) {
  try {
    const { protocol, hostname } = new URL(value);
    return protocol === "http:" && (hostname === "127.0.0.1" || hostname === "localhost");
  } catch {
    return false;
  }
}

export const localStackConfigured =
  isLocalUrl(url) && secretKey.length > 0 && publishableKey.length > 0 && isLocalUrl(mailpitUrl);

export const localStackSkipReason =
  "Needs the local Supabase stack and a build against it: `npm run db:start` then `npm run test:e2e:local`.";

export function serviceClient(): SupabaseClient<Database> {
  if (!localStackConfigured) throw new Error(localStackSkipReason);
  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A client acting as a signed-in user, going through Auth and the Data API like the app does. */
export function publicClient(): SupabaseClient<Database> {
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type TestUser = { id: string; email: string; password: string };

export function strongPassword(): string {
  // Satisfies the 12+ character, lower/upper/digit policy.
  return `Tm${randomBytes(12).toString("base64url")}7x`;
}

export function uniqueEmail(label: string): string {
  return `${label}.${randomUUID().slice(0, 8)}@example.test`;
}

export async function createConfirmedUser(label: string): Promise<TestUser> {
  const email = uniqueEmail(label);
  const password = strongPassword();
  const { data, error } = await serviceClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  return { id: data.user.id, email, password };
}

export async function setMembership(userId: string, state: "active" | "inactive"): Promise<void> {
  const row: Database["public"]["Tables"]["admin_memberships"]["Insert"] =
    state === "active"
      ? { user_id: userId, is_active: true, deactivated_at: null, note: "e2e" }
      : { user_id: userId, is_active: false, deactivated_at: new Date().toISOString(), note: "e2e" };
  const { error } = await serviceClient().from("admin_memberships").upsert(row);
  if (error) throw error;
}

export async function deleteUsers(ids: string[]): Promise<void> {
  const client = serviceClient();
  for (const id of ids) {
    await client.auth.admin.deleteUser(id);
  }
}

type MailpitSummary = { ID: string; Created: string };

/** Waits for the newest email sent to `address` after `since` and returns its HTML. */
export async function waitForEmail(address: string, since: Date): Promise<string> {
  const query = encodeURIComponent(`to:"${address}"`);
  for (let attempt = 0; attempt < 40; attempt++) {
    const response = await fetch(`${mailpitUrl}/api/v1/search?query=${query}`);
    if (response.ok) {
      const { messages = [] } = (await response.json()) as { messages?: MailpitSummary[] };
      const message = messages.find((item) => new Date(item.Created) >= since);
      if (message) {
        const detail = (await (await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`)).json()) as {
          HTML: string;
        };
        return detail.HTML;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No email reached ${address}`);
}

/** Extracts the /auth/confirm link from an invite or recovery email. */
export function confirmLink(html: string): string {
  const match = /href="([^"]*\/auth\/confirm\?[^"]*)"/.exec(html);
  if (!match) throw new Error("Email has no /auth/confirm link");
  return match[1].replaceAll("&amp;", "&");
}
