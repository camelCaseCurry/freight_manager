import express from "express";
import multer from "multer";
import vision from "@google-cloud/vision";
import fs from "fs";
import cors from "cors";


const app = express();
app.use(cors());
const upload = multer({ dest: "uploads/" });

// Google Vision client
const client = new vision.ImageAnnotatorClient({
  keyFilename: "driver-app-481520-46f4e28d5e0e.json"
});

app.use(express.static("public")); // serve your HTML/JS

// Endpoint for OCR
app.post("/ocr", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  try {
    const [result] = await client.textDetection(req.file.path);
    const text = result.textAnnotations[0]?.description || "";

    fs.unlinkSync(req.file.path); // remove temp file
    res.json({ ocrText: text });
  } catch (err) {
    console.error(err);
    res.status(500).send("OCR failed");
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
