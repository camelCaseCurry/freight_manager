import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

import {parseLighthouse} from "./src/parsers.js"

import pdf from "pdf-parse";
import fs from "fs";
import cors from "cors";

import { scanOrganizer } from "./src/helpers.js"; 

// get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json()); // to parse JSON bodies

app.use(express.static(path.join(__dirname, "src")));

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

 app.post("/ocr", upload.single("file"), async (req, res) => {
  try {


    const { userId } = req.body;
    if (!userId) return res.status(400).send("No userId provided");
    if (!req.file) return res.status(400).send("No file uploaded");

    const pdfUrl = `/uploads/${req.file.filename}`;

    // ✅ Read file
    const fileBuffer = fs.readFileSync(req.file.path);

    // ✅ Parse PDF → text
    const data = await pdf(fileBuffer); 
    const text = await data.text;
    

    console.log("Extracted text:", text);

    // ✅ Your parsing logic
    const extracted = scanOrganizer(parseLighthouse(text));

    // ✅ Store the scan
    const userScans = loadUserScans(userId);

    const newScan = {
      id: Date.now().toString(),
      pdf: pdfUrl,
      text: text,              // ✅ FIXED
      extracted: extracted,    // ✅ ADD THIS
      createdAt: new Date().toISOString(),
    };

    userScans.push(newScan);
    saveUserScans(userId, userScans);

    // ✅ Optional cleanup
    fs.unlinkSync(req.file.path);

    res.json(newScan);

  } catch (err) {
    console.error(err);
    res.status(500).send("PDF processing failed");
  }
});
// Get all scans for a user
app.get("/scans", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).send("No userId provided");

  const scans = loadUserScans(userId);
  res.json(scans);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
