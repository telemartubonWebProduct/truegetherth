import type { NextConfig } from "next";

// Public pages have a root layout per language: src/app/(th) holds the Thai
// pages at the site's existing, unprefixed URLs and src/app/(en) the English
// ones under /en, so no request is rewritten. The back office (src/app/admin)
// has a root layout of its own; unknown paths end at global-not-found.
// Pictures uploaded from the editor live in the project's Storage bucket `media` (R4).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const localSupabase = supabaseUrl !== null && ["127.0.0.1", "localhost"].includes(supabaseUrl.hostname);

const forGood = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

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
      // The home page's pictures: the painting's sky and its cut-out figures, and
      // the small paintings of the steps. A picture that changes goes in a new
      // folder (hero-v5, steps-v2) and no file here is written again under its
      // name (the scripts in scripts/media refuse to), so visitors keep these
      // for good, as they do the build's own files.
      { source: "/media/:cut((?:hero|steps)-v\\d+)/:path*", headers: forGood },
    ];
  },
  async redirects() {
    return [
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
