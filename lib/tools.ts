import type { LucideIcon } from "lucide-react";
import {
  Combine,
  Scissors,
  RotateCw,
  ArrowUpDown,
  Image as ImageIcon,
  FileImage,
  FileText,
  Code2,
  Hash,
  Stamp,
  Info,
  ClipboardList,
  Crop,
  FileOutput,
  Zap,
  Eye,
  GitCompareArrows,
  ScanText,
  Layout,
} from "lucide-react";

export type ToolId =
  | "merge"
  | "split"
  | "rotate"
  | "reorder"
  | "pdf-to-images"
  | "images-to-pdf"
  | "extract-text"
  | "html-to-pdf"
  | "page-numbers"
  | "watermark"
  | "metadata"
  | "forms"
  | "crop"
  | "extract-pages"
  | "batch"
  | "viewer"
  | "compare"
  | "ocr";

export interface Tool {
  id: ToolId;
  name: string;
  desc: string;
  longDesc: string;
  keywords: string[];
  howItWorks: string[];
  useCases: string[];
  faq: { q: string; a: string }[];
  icon: LucideIcon;
  category: "organize" | "convert" | "edit" | "view";
  color: string; // accent hsl hue for the card gradient
}

const BASE_HOW = [
  "Drop your file into the upload area, or paste text or HTML as needed.",
  "Adjust the options specific to this tool; everything runs locally in your browser.",
  "Click the action button and download the result. Nothing is sent to a server.",
];

export const TOOLS: Tool[] = [
  {
    id: "merge",
    name: "Merge PDFs",
    desc: "Combine multiple PDFs into one",
    longDesc:
      "Merge two or more PDF files into a single document, in any order. The merge tool preserves the original page count, fonts, and images of every input file. Ideal for combining invoices, chapters, scans, or signed contracts into one deliverable.",
    keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger", "merge pdf files online free"],
    howItWorks: [
      "Upload two or more PDF files using the dropzone.",
      "Drag the file chips to reorder them; the order on screen is the order in the merged file.",
      "Click Merge and download the combined PDF. The output is generated locally.",
    ],
    useCases: [
      "Combine monthly statements into a single yearly PDF for your accountant.",
      "Merge a signed cover page with the main agreement before sending.",
      "Stitch chapters from multiple sources into one reading document.",
    ],
    faq: [
      { q: "Is there a limit on how many PDFs I can merge?", a: "No. The tool runs in your browser, so you can merge as many files as your device memory allows." },
      { q: "Will the merge change my original files?", a: "No. The originals are untouched. The merged file is a new PDF you download." },
      { q: "Are my files uploaded to a server?", a: "No. All merging happens locally in your browser. Nothing leaves your device." },
    ],
    icon: Combine,
    category: "organize",
    color: "220",
  },
  {
    id: "split",
    name: "Split PDF",
    desc: "Extract pages or ranges into separate files",
    longDesc:
      "Split a PDF by page range or by every single page, and download the result as a ZIP of separate PDFs. Use ranges like 1-3, 5, 7-9 to extract specific pages, or split every page into its own file.",
    keywords: ["split pdf", "extract pdf pages", "pdf splitter", "separate pdf pages", "split pdf online free"],
    howItWorks: [
      "Upload the PDF you want to split.",
      "Choose By range and enter page ranges, or choose Every page to split the entire document.",
      "Click Split and download a ZIP file containing one PDF per range or per page.",
    ],
    useCases: [
      "Pull a few pages out of a long report to share only what matters.",
      "Split a scanned book into chapter-sized PDFs for reading on your phone.",
      "Separate invoice pages from supporting documents before sending.",
    ],
    faq: [
      { q: "What page range formats are supported?", a: "You can use single pages like 5, ranges like 1-3, and combinations like 1-3, 5, 7-9." },
      { q: "How are the output files named?", a: "Single pages are named page-001.pdf; ranges are named pages-1-3.pdf and similar." },
    ],
    icon: Scissors,
    category: "organize",
    color: "265",
  },
  {
    id: "rotate",
    name: "Rotate Pages",
    desc: "Rotate individual or all pages by 90 degrees",
    longDesc:
      "Rotate one, many, or all pages of a PDF in 90 degree increments. Use the per-page rotate buttons for surgical fixes, or select multiple pages and rotate them in batch. The original page content is preserved, only the rotation flag changes.",
    keywords: ["rotate pdf", "rotate pdf pages", "fix pdf orientation", "rotate pdf 90 degrees", "rotate pdf online"],
    howItWorks: [
      "Upload a PDF; thumbnails of every page appear.",
      "Click the rotate arrows on each thumbnail, or select multiple pages and use the batch rotate buttons.",
      "Click Apply and download. The output PDF has the new rotation baked in.",
    ],
    useCases: [
      "Fix the orientation of a scanned document where pages were fed upside down.",
      "Rotate landscape pages in a mostly portrait report for consistent reading.",
      "Straighten pages before printing.",
    ],
    faq: [
      { q: "Does rotating change the page content?", a: "No. Only the rotation is changed; text and images stay in place." },
      { q: "Can I rotate just one page?", a: "Yes. Use the rotate buttons under each thumbnail to rotate a single page at a time." },
    ],
    icon: RotateCw,
    category: "organize",
    color: "155",
  },
  {
    id: "reorder",
    name: "Reorder Pages",
    desc: "Rearrange and delete pages",
    longDesc:
      "Drag and drop to rearrange the page order of a PDF, and remove unwanted pages with a single click. The output preserves the original content exactly, just in the new order. Perfect for cleaning up the structure of a long document before sharing.",
    keywords: ["reorder pdf pages", "rearrange pdf", "delete pdf pages", "organize pdf", "move pdf pages"],
    howItWorks: [
      "Upload a PDF; a list of all pages appears with thumbnails.",
      "Drag the rows to reorder pages, or click the X on a row to remove that page.",
      "Click Apply and download. Pages appear in the new order without the removed ones.",
    ],
    useCases: [
      "Reorder chapters into the final sequence before sending a manuscript.",
      "Remove cover pages or blank pages from a scanned document.",
      "Fix the order of a multi-page form that scanned incorrectly.",
    ],
    faq: [
      { q: "Can I undo a deletion?", a: "Not directly; re-upload the original PDF if you need the removed pages back." },
      { q: "Does reordering change the content?", a: "No. Only the order of pages in the output PDF is changed." },
    ],
    icon: ArrowUpDown,
    category: "organize",
    color: "340",
  },
  {
    id: "pdf-to-images",
    name: "PDF to Images",
    desc: "Export pages as PNG or JPEG",
    longDesc:
      "Convert every page of a PDF into a separate image file, available in PNG or JPEG format. Choose the resolution from screen to print to high quality. All images are bundled into a single ZIP for easy download.",
    keywords: ["pdf to png", "pdf to jpg", "pdf to image", "convert pdf to images", "pdf to image online"],
    howItWorks: [
      "Upload the PDF you want to convert.",
      "Choose PNG or JPEG and a resolution: screen, print, or high.",
      "Click Convert and download a ZIP containing one image per page.",
    ],
    useCases: [
      "Extract a chart or diagram from a PDF as an image for a presentation.",
      "Convert a PDF page to a JPEG for use in a social media post.",
      "Make a high resolution archive of every page as standalone images.",
    ],
    faq: [
      { q: "What resolutions are available?", a: "1x for screen, 2x for print, and up to 4x for high quality archival." },
      { q: "Can I choose a different image format per page?", a: "The whole batch uses the format you select. Convert again with the other format if you need both." },
    ],
    icon: ImageIcon,
    category: "convert",
    color: "35",
  },
  {
    id: "images-to-pdf",
    name: "Images to PDF",
    desc: "Bundle images into a single PDF",
    longDesc:
      "Combine multiple image files (PNG, JPEG, WebP, GIF) into one PDF document. Choose a page size (A4, Letter, or auto-fit to image), portrait or landscape, and how images are sized on the page (fit, fill, or center).",
    keywords: ["images to pdf", "jpg to pdf", "png to pdf", "combine images into pdf", "image to pdf converter"],
    howItWorks: [
      "Upload one or more image files.",
      "Choose the page size, orientation, and image fit option.",
      "Click Create PDF and download the document. One image per page, in the order shown.",
    ],
    useCases: [
      "Turn a set of phone photos into a printable PDF album.",
      "Convert scanned image pages into a single shareable document.",
      "Package screenshots into a PDF for documentation.",
    ],
    faq: [
      { q: "Which image formats are supported?", a: "PNG, JPEG, WebP, and GIF are supported." },
      { q: "What does Auto page size do?", a: "Each page is sized to match its source image exactly, with no margin." },
    ],
    icon: FileImage,
    category: "convert",
    color: "185",
  },
  {
    id: "extract-text",
    name: "Extract Text",
    desc: "Pull out all text from a PDF",
    longDesc:
      "Extract the text content of every page in a PDF, copy it to your clipboard, or download it as a single .txt file. Useful for copying text from reports, research papers, or scanned documents that have a text layer.",
    keywords: ["extract text from pdf", "pdf to text", "copy text from pdf", "pdf text extractor", "pdf text online"],
    howItWorks: [
      "Upload a PDF with a text layer.",
      "Each page is extracted automatically. Switch between pages using the tabs.",
      "Copy all to clipboard, or download the entire document as a .txt file.",
    ],
    useCases: [
      "Pull a quote or paragraph from a PDF for a report or essay.",
      "Convert a long PDF into plain text for searching or archiving.",
      "Extract code or config snippets from a technical PDF.",
    ],
    faq: [
      { q: "Will this work on a scanned PDF?", a: "Only if the PDF has a text layer. For image-only scans, use the OCR tool instead." },
      { q: "Does the extraction preserve formatting?", a: "Text is extracted as plain text; basic line breaks are preserved per page." },
    ],
    icon: FileText,
    category: "convert",
    color: "220",
  },
  {
    id: "html-to-pdf",
    name: "HTML to PDF",
    desc: "Convert HTML snippets into PDFs",
    longDesc:
      "Turn any HTML markup into a PDF. Use one of the built-in templates (invoice, report, letter), paste your own HTML, or upload an .html file. Choose A4, Letter, or Legal page size in portrait or landscape.",
    keywords: ["html to pdf", "html2pdf", "convert html to pdf", "web page to pdf", "html to pdf online free"],
    howItWorks: [
      "Pick a template, paste HTML, or upload an .html file from your device.",
      "Preview the rendered output on the right side of the page.",
      "Choose a page size and orientation, then click Generate PDF and download.",
    ],
    useCases: [
      "Create a quick invoice or receipt from a template.",
      "Snapshot an HTML email or report as a PDF.",
      "Convert a styled HTML page into a printable document.",
    ],
    faq: [
      { q: "Can I use my own CSS?", a: "Yes. Inline styles and a style block in the HTML are both supported." },
      { q: "Is JavaScript executed?", a: "Scripts are not executed; only the static HTML and CSS are rendered." },
    ],
    icon: Code2,
    category: "convert",
    color: "265",
  },
  {
    id: "page-numbers",
    name: "Page Numbers",
    desc: "Stamp page numbers in any position",
    longDesc:
      "Add page numbers to every page of a PDF. Choose the format (1, Page 1, 1 of N, or -1-), the starting number, and a corner position. Useful for reports, contracts, theses, and any document that needs pagination.",
    keywords: ["add page numbers to pdf", "pdf page numbers", "number pdf pages", "paginate pdf", "pdf pagination"],
    howItWorks: [
      "Upload a PDF.",
      "Choose the format, starting number, font size, and a position: top or bottom in any of three corners.",
      "Click Apply and download. Every page gets a number stamped in your chosen position.",
    ],
    useCases: [
      "Paginate a long report before printing or sharing.",
      "Add page numbers to a contract for legal reference.",
      "Number thesis or book chapters in a consistent style.",
    ],
    faq: [
      { q: "Can I start numbering from a specific number?", a: "Yes. Set Start at to any positive integer." },
      { q: "Can I use Roman numerals?", a: "The current formats are 1, Page 1, 1 of N, and -1-. Custom text formatting is not yet supported." },
    ],
    icon: Hash,
    category: "edit",
    color: "155",
  },
  {
    id: "watermark",
    name: "Watermark",
    desc: "Add text or image watermarks",
    longDesc:
      "Stamp a text or image watermark on every page of a PDF, or only on odd or even pages. Adjust color, opacity, rotation, and font size. Use for confidential markings, draft labels, brand stamps, or copyright notices.",
    keywords: ["add watermark to pdf", "pdf watermark", "watermark pdf online free", "stamp pdf", "pdf text watermark"],
    howItWorks: [
      "Upload the PDF you want to watermark.",
      "Choose Text or Image watermark, set color, opacity, rotation, and font size.",
      "Choose which pages to apply: all, odd only, or even only. Click Apply and download.",
    ],
    useCases: [
      "Mark a draft document as CONFIDENTIAL before sharing internally.",
      "Add a brand or company logo as a diagonal watermark to a portfolio PDF.",
      "Stamp a copyright notice on every page of a downloadable report.",
    ],
    faq: [
      { q: "What image formats are supported for the watermark image?", a: "PNG and JPEG are supported." },
      { q: "Can I apply the watermark to only some pages?", a: "Yes. Choose All, Odd pages, or Even pages in the scope selector." },
    ],
    icon: Stamp,
    category: "edit",
    color: "340",
  },
  {
    id: "metadata",
    name: "Edit Metadata",
    desc: "Change title, author, subject, keywords",
    longDesc:
      "Edit the document metadata of a PDF: title, author, subject, keywords, and creator. These fields are visible in the file properties dialog of any PDF viewer and are used by search engines and file managers to index your document.",
    keywords: ["edit pdf metadata", "change pdf title", "pdf author", "pdf keywords", "pdf properties editor"],
    howItWorks: [
      "Upload a PDF. The current metadata is loaded into the form automatically.",
      "Edit any of the five fields: title, author, subject, keywords (comma separated), and creator.",
      "Click Save and download. The output PDF has the new metadata.",
    ],
    useCases: [
      "Set a clean title and author for a paper before submission.",
      "Update keywords on a portfolio PDF so it indexes better in search.",
      "Remove personal information from the metadata of a file you are about to share.",
    ],
    faq: [
      { q: "What is the Producer field?", a: "Producer is the technical tool that generated the PDF. The library used here sets this automatically and it cannot be changed from the UI." },
      { q: "How should I format keywords?", a: "Enter comma separated values, for example: invoice, 2026, Q1." },
    ],
    icon: Info,
    category: "edit",
    color: "35",
  },
  {
    id: "forms",
    name: "Fill Forms",
    desc: "Fill AcroForm fields automatically",
    longDesc:
      "Open a PDF that contains AcroForm fields, fill in text fields, toggle checkboxes, and pick dropdown and radio options. Then download the filled PDF. Works with any standard PDF form created by Adobe, government sites, banks, or office tools.",
    keywords: ["fill pdf form", "acroform fill", "pdf form filler", "fill pdf online", "complete pdf form"],
    howItWorks: [
      "Upload a PDF that contains form fields. Detected fields appear below the dropzone.",
      "Fill each text field, toggle checkboxes, and select dropdown and radio values.",
      "Click Fill and download. The filled PDF is generated locally.",
    ],
    useCases: [
      "Complete a tax or government form before printing and signing.",
      "Fill a job application PDF with your details in one go.",
      "Batch complete standardized forms with the same data.",
    ],
    faq: [
      { q: "What types of form fields are supported?", a: "Text fields, checkboxes, dropdowns, and radio groups are supported." },
      { q: "My PDF does not show any fields. Why?", a: "Only PDFs with AcroForm fields are supported. Some forms are flat images; use the OCR tool for those." },
    ],
    icon: ClipboardList,
    category: "edit",
    color: "185",
  },
  {
    id: "crop",
    name: "Crop Pages",
    desc: "Trim margins or apply aspect ratios",
    longDesc:
      "Crop every page of a PDF by trimming margins, or apply a preset aspect ratio: square, 1:1, 16:9, A4, or Letter. The crop is applied to the media box of every page; the visual content is preserved exactly, only the visible area is reduced.",
    keywords: ["crop pdf", "trim pdf margins", "pdf cropper", "crop pdf pages", "resize pdf page"],
    howItWorks: [
      "Upload a PDF.",
      "Choose Custom and enter the number of points to trim from each side, or choose a preset aspect ratio.",
      "Click Crop and download. Every page is cropped identically.",
    ],
    useCases: [
      "Remove white margins from a scanned book for tighter printing.",
      "Crop slides to a 16:9 aspect ratio for a video export.",
      "Trim the header and footer off a multi-page printout.",
    ],
    faq: [
      { q: "What does Custom crop mean?", a: "You specify the number of points to trim from the top, right, bottom, and left of every page." },
      { q: "Does cropping remove content?", a: "Only the visible area is reduced. Hidden content outside the crop box is still present in the file." },
    ],
    icon: Crop,
    category: "edit",
    color: "220",
  },
  {
    id: "extract-pages",
    name: "Extract Pages",
    desc: "Save selected pages as a new PDF",
    longDesc:
      "Pick specific pages from a PDF by clicking their thumbnails, or enter a page range like 1-3, 5, 7. The selected pages are saved as a new PDF in the original order. Combines well with the rotate and reorder tools for cleanup workflows.",
    keywords: ["extract pages from pdf", "save specific pdf pages", "pull pages from pdf", "extract pdf pages online"],
    howItWorks: [
      "Upload a PDF. Thumbnails of every page appear.",
      "Click thumbnails to select pages, or type a range and click Select.",
      "Click Extract and download a new PDF containing only the chosen pages.",
    ],
    useCases: [
      "Pull just the executive summary pages from a long report.",
      "Save a few important pages from an e-book as a separate file.",
      "Extract the form pages from a multi-document PDF.",
    ],
    faq: [
      { q: "How do I select non-contiguous pages?", a: "Click the thumbnails one by one, or use a comma separated range like 1, 3, 5." },
      { q: "Are the selected pages kept in order?", a: "Yes. Pages in the output PDF follow the original page order." },
    ],
    icon: FileOutput,
    category: "organize",
    color: "265",
  },
  {
    id: "batch",
    name: "Batch Process",
    desc: "Apply a tool to many files at once",
    longDesc:
      "Run a single operation across many PDF files in one go. Currently supports rotating all pages by 90 degrees clockwise, or adding Page N page numbers to every page of every file. The processed files are bundled into a single ZIP.",
    keywords: ["batch pdf", "pdf batch processor", "bulk rotate pdf", "bulk add page numbers", "process many pdfs"],
    howItWorks: [
      "Upload multiple PDF files.",
      "Choose an operation: Rotate 90 degrees clockwise, or Add page numbers (bottom center).",
      "Click Process and download a ZIP with one processed file per input.",
    ],
    useCases: [
      "Rotate every PDF in a folder the same way before merging.",
      "Add page numbers to a batch of reports in one click.",
      "Standardize the rotation of a backlog of scans.",
    ],
    faq: [
      { q: "How many files can I process at once?", a: "There is no hard limit, only your available memory. The tool runs entirely in your browser." },
      { q: "Are the originals modified?", a: "No. Each input file is processed into a new file in the ZIP; the originals on your device are untouched." },
    ],
    icon: Zap,
    category: "organize",
    color: "155",
  },
  {
    id: "viewer",
    name: "PDF Viewer",
    desc: "Read PDFs with zoom and navigation",
    longDesc:
      "Open any PDF in a clean, in-browser reader. Navigate page by page, jump to a specific page, zoom in or out, and fit the page to the window width or the whole page. The viewer is fully client-side and works offline after the first load.",
    keywords: ["pdf viewer", "read pdf online", "open pdf in browser", "pdf reader", "view pdf free"],
    howItWorks: [
      "Upload a PDF.",
      "Use the toolbar to navigate: previous, next, page number input, zoom, fit to width, or fit to page.",
      "Scroll inside the page area to read; everything renders locally.",
    ],
    useCases: [
      "Quickly preview a PDF before deciding which tool to run on it.",
      "Read a PDF on a public computer without installing software.",
      "Inspect the contents of a downloaded PDF without trusting online viewers.",
    ],
    faq: [
      { q: "Can I view password protected PDFs?", a: "Only if you have the password; the viewer does not bypass encryption." },
      { q: "Does the viewer work offline?", a: "After the page and worker are loaded, navigation and zoom continue to work without a network connection." },
    ],
    icon: Eye,
    category: "view",
    color: "340",
  },
  {
    id: "compare",
    name: "Compare PDFs",
    desc: "Side-by-side visual comparison",
    longDesc:
      "Open two PDFs side by side and navigate them in sync. Useful for comparing a draft against a final version, checking two revisions of a contract, or seeing the visual difference between an original scan and a re-scan.",
    keywords: ["compare pdfs", "pdf diff", "compare two pdfs online", "side by side pdf", "pdf comparison"],
    howItWorks: [
      "Upload two PDF files.",
      "Both render side by side, page 1 by default. Use the toolbar to navigate both together.",
      "The total page count is the larger of the two documents.",
    ],
    useCases: [
      "Compare a contract draft against the final signed version.",
      "Check two revisions of a thesis or manuscript for visual changes.",
      "Verify that a re-scan matches the original document.",
    ],
    faq: [
      { q: "Do the two PDFs need the same page count?", a: "No. The viewer handles documents of different lengths and stops at the end of the shorter one." },
      { q: "Is there a text diff?", a: "This is a visual side-by-side viewer, not a text diff. Use the extract text tool if you need text level comparison." },
    ],
    icon: GitCompareArrows,
    category: "view",
    color: "35",
  },
  {
    id: "ocr",
    name: "OCR Text",
    desc: "Recognize text from scanned PDFs",
    longDesc:
      "Run optical character recognition on a scanned or image based PDF. Every page is rendered to an image, recognized by an in-browser OCR engine, and the result is presented as selectable, copyable text. Best for documents that do not have a text layer.",
    keywords: ["ocr pdf", "pdf ocr online", "scanned pdf to text", "extract text from scanned pdf", "ocr scanned document"],
    howItWorks: [
      "Upload a scanned or image based PDF. The first run downloads a small language data file.",
      "Click Recognize text. Each page is processed in turn; the progress bar shows which page is being recognized.",
      "Copy the result, or download the entire document as a .txt file.",
    ],
    useCases: [
      "Make a scanned contract or receipt searchable and copyable.",
      "Convert a stack of scanned pages into plain text for archiving.",
      "Pull text from a photographed document for translation or note taking.",
    ],
    faq: [
      { q: "What languages are supported?", a: "English is supported out of the box. The engine is the standard tesseract.js worker." },
      { q: "How long does OCR take?", a: "About 1 to 3 seconds per page on a modern laptop, depending on page size and complexity." },
    ],
    icon: ScanText,
    category: "view",
    color: "185",
  },
];

export const CATEGORIES: { id: Tool["category"]; label: string }[] = [
  { id: "organize", label: "Organize" },
  { id: "convert", label: "Convert" },
  { id: "edit", label: "Edit" },
  { id: "view", label: "View" },
];
