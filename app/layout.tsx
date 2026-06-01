import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/Toaster";
import { DownloadCompleteModal } from "@/components/DownloadCompleteModal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pdftoolkit.app";
const SITE_NAME = "PDF Toolkit";
const TITLE = "PDF Toolkit: 18 Free Browser PDF Tools, No Upload, No Signup";
const DESC =
  "Free online PDF tools that run in your browser. Merge, split, rotate, convert, edit, watermark, OCR, and more. 18 tools, zero server, 100 percent private. No signup, no upload, no limits.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#08080d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESC,
  applicationName: SITE_NAME,
  keywords: [
    "pdf tools",
    "free pdf editor",
    "merge pdf",
    "split pdf",
    "rotate pdf",
    "pdf to images",
    "images to pdf",
    "extract text from pdf",
    "ocr pdf",
    "watermark pdf",
    "browser pdf tool",
    "no upload pdf",
    "client side pdf",
    "online pdf editor free",
    "pdf toolkit",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Productivity",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESC,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME}: 18 free browser PDF tools`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/opengraph-image"],
    creator: "@pdftoolkit",
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "application-name": SITE_NAME,
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": SITE_NAME,
    "theme-color": "#6366f1",
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  description: DESC,
  sameAs: [
    "https://github.com/pdf-toolkit",
    "https://twitter.com/pdftoolkit",
  ],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DESC,
  inLanguage: "en-US",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const appLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: DESC,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any (browser)",
  browserRequirements: "Modern browser with JavaScript and WebAssembly support",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Merge PDF",
    "Split PDF",
    "Rotate PDF pages",
    "Reorder PDF pages",
    "PDF to images",
    "Images to PDF",
    "Extract text from PDF",
    "HTML to PDF",
    "Add page numbers",
    "Add watermark",
    "Edit PDF metadata",
    "Fill PDF forms",
    "Crop PDF pages",
    "Extract PDF pages",
    "Batch process PDFs",
    "PDF viewer",
    "Compare PDFs",
    "OCR scanned PDF",
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is PDF Toolkit really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All 18 tools are free to use, with no signup, no file size limit, and no watermarks on output.",
      },
    },
    {
      "@type": "Question",
      name: "Are my files uploaded to a server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Every operation runs entirely in your browser using WebAssembly. Your files never leave your device.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to create an account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. There is no signup, no login, and no tracking. Open the tool and start working immediately.",
      },
    },
    {
      "@type": "Question",
      name: "What file size limits exist?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There are no artificial limits. The only constraint is the memory of your device, since processing happens locally.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="icon" href="/icon" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-hero">
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-[var(--border)] py-6 px-4 text-center text-xs text-[var(--text-muted)]">
              <p className="flex items-center justify-center gap-1.5 flex-wrap">
                <span>© {new Date().getFullYear()}</span>
                <a
                  href="https://moayaan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors underline-offset-2 hover:underline"
                >
                  Built by moayaan.eth
                </a>
                <span>· All processing happens in your browser. Built with pdf-lib, PDF.js, jsPDF and Tesseract.js.</span>
              </p>
            </footer>
          </div>
          <Toaster />
          <DownloadCompleteModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
