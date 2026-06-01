import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PDF Toolkit handles your data: the short answer is, we do not. Files are processed locally in your browser and never reach a server.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Last updated: June 2026
        </p>
      </header>

      <div className="prose prose-sm max-w-none space-y-6 text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">The short version</h2>
          <p>
            PDF Toolkit does not collect, store, or transmit your files. Every
            operation runs locally in your browser. We do not have a backend
            that processes user content. There is no account system, no
            analytics, and no tracking.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">What we do not do</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>We do not upload your files to any server.</li>
            <li>We do not store copies of your files anywhere.</li>
            <li>We do not log file names, content, or metadata.</li>
            <li>We do not use third party analytics such as Google Analytics, Plausible, or PostHog.</li>
            <li>We do not use cookies for tracking. The only storage is local storage for your UI preferences.</li>
            <li>We do not fingerprint your device or browser.</li>
            <li>We do not sell or share any data, because we do not collect any.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">What runs in your browser</h2>
          <p>
            PDF Toolkit loads the following libraries into your browser to
            process files locally:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>pdf-lib</strong> for merge, split, rotate, reorder, metadata, watermarks, page numbers, crop, and form filling.</li>
            <li><strong>PDF.js</strong> for rendering page previews and extracting text.</li>
            <li><strong>jsPDF</strong> for HTML to PDF conversion.</li>
            <li><strong>Tesseract.js</strong> for OCR. The OCR tool downloads the English language data file on first use and caches it locally.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Local storage</h2>
          <p>
            We use the browser local storage to remember your UI
            preferences. Specifically:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>The accent color you picked (key: <code>pdf-toolkit-accent</code>).</li>
            <li>The light or dark mode preference (managed by next-themes).</li>
          </ul>
          <p>
            You can clear this at any time from your browser settings. No
            personal or file related data is ever stored.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Network requests</h2>
          <p>
            When you first load the app, your browser fetches the static page
            assets from our hosting provider. After that, the app makes no
            further network requests, except in two cases:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>The OCR tool downloads the Tesseract English language data on first use. Subsequent uses are served from your browser cache.</li>
            <li>If you click an external link such as Buy Me a Coffee, GitHub, or LoomLess, your browser navigates to that site. Their privacy policies apply once you leave PDF Toolkit.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">AI crawlers and search</h2>
          <p>
            Our <code>robots.txt</code> file allows most AI crawlers, including
            GPTBot, ClaudeBot, PerplexityBot, Google Extended, and others, so
            that AI assistants can describe the tools accurately. This is
            opt in on their end; we do not share any data that we do not
            already publish on this site.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Children&apos;s privacy</h2>
          <p>
            PDF Toolkit does not target children under 13 and does not
            knowingly collect any information from children. Since the app
            does not collect any information from anyone, this is a
            non issue in practice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Changes to this policy</h2>
          <p>
            If we ever change this policy in a meaningful way, we will update
            the date at the top of this page. Since we do not collect data,
            changes will only be clarifications.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Contact</h2>
          <p>
            Questions, concerns, or to report a privacy issue, open an issue
            on the GitHub repository.
          </p>
          <p>
            <a
              href="https://github.com/moayaan1911/pdftools/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
            >
              github.com/moayaan1911/pdftools/issues
            </a>
          </p>
        </section>
      </div>

      <div className="mt-10 text-center">
        <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          ← Back to all tools
        </Link>
      </div>
    </div>
  );
}
