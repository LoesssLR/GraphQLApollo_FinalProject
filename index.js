import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import mongoose from "mongoose";

// Conexión a Mongo
await mongoose.connect('mongodb://localhost:27017/ProyectoFinal', { dbName: 'ProyectoFinal' });
console.log('Connected to MongoDB');

// Modelos
import './models/mdl_Profesional.js';
import './models/mdl_Empleador.js';
import './models/mdl_Vacante.js';
import './models/mdl_Expediente.js';
import './models/mdl_Titulo.js';

// Schema & resolvers
import { typeDefs } from './data/schema_db.js';
import { resolvers } from './data/resolversMongo.js';

// Apollo standalone
const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`GraphQL ready at ${url}`);

// ============================
//  Mini servidor Express
// ============================

import express from "express";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import multer from "multer";
import mongoosePkg from "mongoose";

const Titulo = mongoosePkg.model("Titulo");
const app = express();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Servir archivos: http://localhost:4001/uploads/<filename>
app.use("/uploads", express.static(UPLOAD_DIR, {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=86400");
  }
}));

// Multer: almacenamiento en disco con nombre seguro
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) {
      return cb(new Error("Tipo de imagen no permitido"));
    }
    cb(null, true);
  }
});

// SUBIR imagen como archivo -> guarda solo la ruta
app.post("/api/titulos/:id/imagen", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoosePkg.isValidObjectId(id)) return res.status(400).json({ error: "Invalid ObjectId" });
    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

    // opcional: borrar archivo anterior si existe
    const prev = await Titulo.findById(id).select("imagenPath");
    if (prev?.imagenPath) {
      const p = path.join(process.cwd(), prev.imagenPath.replace(/^\//, ""));
      fs.existsSync(p) && fs.unlink(p, () => {});
    }

    const relPath = `/uploads/${req.file.filename}`; // guardamos la RUTA relativa
    await Titulo.findByIdAndUpdate(id, { imagenPath: relPath, imagenBase64: null });

    res.json({ ok: true, path: relPath, size: req.file.size, mime: req.file.mimetype });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error guardando imagen" });
  }
});

app.get("/api/titulos/:id/imagen", async (req, res) => {
  const { id } = req.params;
  if (!mongoosePkg.isValidObjectId(id)) {
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

app.listen(4001, () => {
  console.log("Images at http://localhost:4001/api/titulos/:id/imagen");
});
