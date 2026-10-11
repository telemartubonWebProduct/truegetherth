import type { NextConfig } from "next";

// Public pages have a root layout per language: src/app/(th) holds the Thai
// pages at the site's existing, unprefixed URLs and src/app/(en) the English
// ones under /en, so no request is rewritten. The back office (src/app/admin)
// has a root layout of its own; unknown paths end at global-not-found.
// Pictures uploaded from the editor live in the project's Storage bucket `media` (R4).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const localSupabase = supabaseUrl !== null && ["127.0.0.1", "localhost"].includes(supabaseUrl.hostname);

const week = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Several root layouts and no shared one, so unmatched URLs need the
    // routing-level 404 in src/app/global-not-found.tsx.
    globalNotFound: true,
    // Picture uploads (8 MB at most, see media-actions.ts) plus the form's own bytes.
    serverActions: { bodySizeLimit: "9mb" },
    // inlineCss was tried (2026-10-11) and left off: on a throttled phone it brought the first paint 0.1 s forward
    // and added 200 to 370 ms of blocked main thread to every page measured.
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/media/**",
          },
        ]
      : [],
    // Only the local test stack serves Storage from 127.0.0.1; never true for a hosted project.
    dangerouslyAllowLocalIP: localSupabase,
  },
  async headers() {
    return [
      // The home page's picture (the painting's sky and its cut-out figures). A
      // new version goes in a new folder (hero-v5), so visitors can keep these a week.
      { source: "/media/:cut(hero-v\\d+)/:path*", headers: week },
    ];
  },
  async redirects() {
    return [
      // The site's former domain: every address goes, for good, to the same address on the one domain the site
      // has now. It takes effect when the former domain is attached to this project on Vercel.
      ...["telemartubon.com", "www.telemartubon.com"].map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://www.truegetherth.com/:path*",
        permanent: true,
      })),
      // /th/... would duplicate the unprefixed Thai URLs.
      { source: "/th", destination: "/", permanent: true },
      { source: "/th/:path*", destination: "/:path*", permanent: true },
      // Unfinished "not ready" placeholder from the old site; nothing links to it.
      { source: "/SoonContent", destination: "/", permanent: true },
      { source: "/en/SoonContent", destination: "/en", permanent: true },
    ];
  },
};

export default nextConfig;
