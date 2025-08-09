// routes/titulos.js
import express from "express";
import mongoose from "mongoose";

const Titulo = mongoose.model("Titulo");
const router = express.Router();

router.get("/:id/imagen", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).send("Invalid ObjectId");
  }

  const doc = await Titulo.findById(id);
  if (!doc) return res.status(404).send("Not found");

  // Soporta data URL o base64 “crudo”
  let mime = "image/jpeg";
  let b64 = doc.imagenBase64 || "";
  const m = b64.match(/^data:(.+);base64,(.*)$/);
  if (m) { mime = m[1]; b64 = m[2]; }

  try {
    const buf = Buffer.from(b64, "base64");
    res.set("Content-Type", mime);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buf);
  } catch {
    res.status(400).send("Invalid base64");
  }
});

export default router;
