import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "node:fs";

const SRC = "/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf";
const OUT = "/Users/moayaan.eth/pdf-toolkit/public/form-sample.pdf";

const bytes = fs.readFileSync(SRC);
const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
const font = await doc.embedFont(StandardFonts.Helvetica);
const page = doc.getPages()[0];
const { width, height } = page.getSize();

// Draw a label
page.drawText("Full Name:", { x: 50, y: height - 80, size: 12, font });
page.drawText("Email:", { x: 50, y: height - 110, size: 12, font });
page.drawText("Subscribe?", { x: 50, y: height - 140, size: 12, font });
page.drawText("Country:", { x: 50, y: height - 170, size: 12, font });

// Create the form
const form = doc.getForm();
const nameField = form.createTextField("fullName");
nameField.setText("");
nameField.addToPage(page, { x: 150, y: height - 85, width: 250, height: 20, font });

const emailField = form.createTextField("email");
emailField.setText("");
emailField.addToPage(page, { x: 150, y: height - 115, width: 250, height: 20, font });

const subscribeField = form.createCheckBox("subscribe");
subscribeField.addToPage(page, { x: 150, y: height - 142, width: 16, height: 16 });

const countryField = form.createDropdown("country");
countryField.addOptions(["India", "USA", "UK", "UAE", "Other"]);
countryField.select("India");
countryField.addToPage(page, { x: 150, y: height - 175, width: 200, height: 20, font });

const outBytes = await doc.save();
fs.writeFileSync(OUT, outBytes);
console.log(`created ${OUT} (${outBytes.length} bytes)`);
