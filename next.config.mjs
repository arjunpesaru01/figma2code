/**
 * Content-Security-Policy for the Finebank dashboard.
 *
 * This is a static, UI-only app (no backend/API, no external data fetching, no
 * user input) whose every asset is served same-origin. The policy therefore
 * locks resource loading to `'self'` and blocks framing, plugins, and base-URI
 * hijacking outright.
 *
 * `'unsafe-inline'` is required on `script-src` and `style-src` because Next.js
 * 14 (App Router) injects inline bootstrap/hydration scripts and `next/font`
 * (plus Recharts' rendered SVG) emit inline styles, and this build uses no
 * per-request nonce infrastructure. `'unsafe-eval'` is deliberately NOT granted
 * (the production build does not rely on eval).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/**
 * Baseline hardening headers applied to every response (all routes, the `/`
 * redirect, the 404, and static assets). These are additive, defense-in-depth
 * response headers only — no custom server, no API, no rewrites/redirects, and
 * no proxying — so the config stays within the AAP's "minimal Next config"
 * mandate (AAP §0.3.2 / §0.9.3) while closing the QA-reported header gaps:
 *   - X-Content-Type-Options: nosniff        (prevents MIME-type sniffing)
 *   - X-Frame-Options: DENY                   (legacy clickjacking defense)
 *   - Content-Security-Policy: frame-ancestors 'none' (modern clickjacking defense)
 *   - Referrer-Policy: strict-origin-when-cross-origin (referrer minimization)
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not disclose the framework in the `X-Powered-By` response header
  // (reduces targeted-exploit fingerprinting).
  poweredByHeader: false,
  // Apply the hardening headers above to every path.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
