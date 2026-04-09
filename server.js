import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

import fs from "fs";
import cors from "cors";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";

import { scanOrganizer } from "./src/helpers.js"; 

// get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json()); // to parse JSON bodies

// Setup uploads folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});
const upload = multer({ storage });

// Setup scans folder for user-specific JSON
const scansDir = path.join(__dirname, "scans");
if (!fs.existsSync(scansDir)) fs.mkdirSync(scansDir);

/* 
// Document AI client
const client = new DocumentProcessorServiceClient({
  keyFilename: "driver-app-481520-46f4e28d5e0e.json",
});

// Processor version
const processorVersion =
  "projects/863291234374/locations/us/processors/1b3f1c50c9e016a5/processorVersions/pretrained-foundation-model-v1.5-pro-2025-06-20";
*/
// Helper functions
function getUserScansFile(userId) {
  return path.join(scansDir, `${userId}.json`);
}

function loadUserScans(userId) {
  const file = getUserScansFile(userId);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file));
}

function saveUserScans(userId, scans) {
  fs.writeFileSync(getUserScansFile(userId), JSON.stringify(scans, null, 2));
}

// // OCR endpoint
// app.post("/ocr", upload.single("file"), async (req, res) => {
//   const { userId } = req.body; // user must send their ID
//   if (!userId) return res.status(400).send("No userId provided");
//   if (!req.file) return res.status(400).send("No file uploaded");

//   const pdfUrl = `/uploads/${req.file.filename}`;

//   try {
//     const fileBuffer = fs.readFileSync(req.file.path);

//     const request = {
//       name: processorVersion,
//       rawDocument: {
//         content: fileBuffer.toString("base64"),
//         mimeType: req.file.mimetype,
//       },
//     };

//     const [result] = await client.processDocument(request);

//     // Store the scan in the user-specific JSON
//     const userScans = loadUserScans(userId);
//     const newScan = {
//       id: Date.now().toString(),
//       pdf: pdfUrl,
//       text: result.document.text,
//       entities: result.document.entities,
//       formatted: scanOrganizer(result.document.entities),
//       createdAt: new Date().toISOString(),
//     };
//     userScans.push(newScan);
//     saveUserScans(userId, userScans);

//     // Remove the uploaded file from uploads (optional)
//     // fs.unlinkSync(req.file.path);

//     res.json(newScan);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Document AI processing failed");
//   }
// });

// Get all scans for a user
app.get("/scans", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).send("No userId provided");

  const scans = loadUserScans(userId);
  res.json(scans);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
