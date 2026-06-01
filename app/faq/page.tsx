import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about 18PDF: privacy, limits, formats, how files are processed, and more.",
  alternates: { canonical: "/faq" },
};

const FAQ: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Privacy and security",
    items: [
      {
        q: "Are my files uploaded to a server?",
        a: "No. Every operation runs entirely in your browser using WebAssembly. Your files never leave your device. You can verify this by opening the browser network panel; you will see no file uploads.",
      },
      {
        q: "Do you log or track anything I do?",
        a: "No. There is no analytics, no cookies, no fingerprinting, and no telemetry. The only state stored on your device is your chosen accent color and dark or light mode, both kept in local storage.",
      },
      {
        q: "Can anyone at 18PDF see my files?",
        a: "No one can. The files never reach our infrastructure. There is no backend that ingests, processes, or stores user content.",
      },
      {
        q: "Is 18PDF safe to use on a public or shared computer?",
        a: "Yes. Because nothing is stored, closing the tab is enough to clear the work from memory. There is no account to log out of.",
      },
    ],
  },
  {
    category: "Pricing and limits",
    items: [
      {
        q: "Is 18PDF really free?",
        a: "Yes. All 18 tools are free to use, with no signup, no file size limit, and no watermarks on output. There is no paid tier.",
      },
      {
        q: "What file size limits exist?",
        a: "There are no artificial limits. The only constraint is the memory of your device, since processing happens locally. We have tested with PDFs over 500 pages on a 16GB laptop.",
      },
      {
        q: "Why is it free? Who pays for it?",
        a: "18PDF is built and maintained by a solo developer. It runs on cheap static hosting. There is no funding ask, but a tip on the Buy Me a Coffee page is appreciated if the tool saved you time.",
      },
    ],
  },
  {
    category: "Tools and features",
    items: [
      {
        q: "Which PDF operations are supported?",
        a: "Merge, split, rotate, reorder, convert to and from images, extract text, OCR scanned documents, add page numbers, add watermarks, edit metadata, fill AcroForm fields, crop pages, extract selected pages, batch process, view, and compare PDFs. 18 tools in total.",
      },
      {
        q: "Does the OCR tool work on scanned PDFs?",
        a: "Yes. The OCR tool renders every page to an image and runs Tesseract.js locally. It supports English out of the box and works on any modern device with a few seconds per page.",
      },
      {
        q: "Can I fill a PDF form that does not have AcroForm fields?",
        a: "No. Only AcroForm PDFs are supported by the Fill Forms tool. If your form is a flat image, you will need to use a tool that creates real form fields, or convert it to a fillable PDF first.",
      },
      {
        q: "Why does the Producer metadata field not change?",
        a: "Producer is a technical field set by the PDF library used to generate the output. The library overwrites this field on every save. All other metadata fields, including title, author, subject, keywords, and creator, can be edited normally.",
      },
    ],
  },
  {
    category: "Offline and devices",
    items: [
      {
        q: "Can I use 18PDF offline?",
        a: "After the page loads, navigation and most tools continue to work without a network connection. The OCR tool requires the Tesseract worker, which is cached after the first use.",
      },
      {
        q: "Which browsers are supported?",
        a: "Any modern desktop or mobile browser. iOS, Android, Windows, macOS, Linux, ChromeOS. The app requires JavaScript and WebAssembly support, which means a browser released after 2017.",
      },
      {
        q: "Does 18PDF work on iPad and iPhone?",
        a: "Yes. Every tool is verified on iPhone 15 viewport. Touch interactions are first class: tap to select pages, drag to reorder, and pinch to zoom in the viewer.",
      },
    ],
  },
  {
    category: "Troubleshooting",
    items: [
      {
        q: "A tool seems stuck or slow. What can I do?",
        a: "Large PDFs and the OCR tool use the most memory. If a tool stalls, try with a smaller file first, or close other tabs to free memory. If the problem persists, open an issue on GitHub with the file size and tool name.",
      },
      {
        q: "The extracted text is empty or garbled.",
        a: "The PDF likely does not have a text layer. Scanned documents and image only PDFs need to be run through the OCR tool instead.",
      },
      {
        q: "The download did not start.",
        a: "Some browsers block multiple downloads in quick succession. Click the action button again, or check the browser download settings to allow downloads from this site.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <header className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Everything you need to know about 18PDF.
        </p>
      </header>

      <div className="space-y-10">
        {FAQ.map(({ category, items }) => (
          <section key={category}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
              {category}
            </h2>
            <div className="space-y-2">
              {items.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/60 backdrop-blur overflow-hidden"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[var(--bg-elevated)] transition-colors">
                    <span>{q}</span>
                    <span className="text-[var(--text-muted)] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed">{a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-soft)]/50 to-transparent text-center">
        <p className="text-sm font-medium mb-2">Still have questions?</p>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Open an issue on GitHub and we will get back to you.
        </p>
        <a
          href="https://github.com/moayaan1911/pdftools/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Open an issue
        </a>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          ← Back to all tools
        </Link>
      </div>
    </div>
  );
}
