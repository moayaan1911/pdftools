import { PDFDocument } from "pdf-lib";
import fs from "node:fs";

const PDF = "/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf";
const bytes = fs.readFileSync(PDF);

const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
doc.setTitle("Test Title");
doc.setAuthor("Test Author");
const out1 = await doc.save();
const doc2 = await PDFDocument.load(out1, { ignoreEncryption: true });
doc2.setProducer("Zaki Force Producer");
const out2 = await doc2.save();

// Now post-process: search the trailer dict and replace /Producer
const pdfString = Buffer.from(out2).toString("binary");
const customProducer = "Zaki Force Producer";
// Find /Producer (...) in trailer
const trailerMatch = pdfString.match(/\/Producer\s*\(([^)]*)\)/);
console.log("found /Producer in bytes:", trailerMatch?.[1]);

// Replace globally
const replaced = pdfString.replace(
  /\/Producer\s*\([^)]*\)/g,
  `/Producer (${customProducer})`
);
const replacedBuffer = Buffer.from(replaced, "binary");

// Verify by reloading
const doc3 = await PDFDocument.load(replacedBuffer, { ignoreEncryption: true });
console.log("producer after byte replacement:", doc3.getProducer());
console.log("title preserved:", doc3.getTitle());
console.log("author preserved:", doc3.getAuthor());
