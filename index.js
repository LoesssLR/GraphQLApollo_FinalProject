/**
 * Main Entry Point - GraphQL & Express Server
 * -------------------------------------------
 * This file starts the GraphQL API server using Apollo Server and Mongoose,
 * and also runs a minimal Express server for image uploads.
 *
 * Features:
 *   - Connects to MongoDB
 *   - Loads all models, schema, and resolvers
 *   - Starts Apollo GraphQL server on port 4000
 *   - Starts Express server for image uploads on port 4001
 *   - Handles image uploads for Titulo documents
 *
 * All code is documented for clarity and maintainability.
 */

// --- Apollo Server & Mongoose ---
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import mongoose from "mongoose";

// Connect to MongoDB
await mongoose.connect("mongodb://localhost:27017/ProyectoFinal", {
  dbName: "ProyectoFinal",
});
console.log("Connected to MongoDB");

// Load all Mongoose models
import "./models/mdl_Profesional.js";
import "./models/mdl_Empleador.js";
import "./models/mdl_Vacante.js";
import "./models/mdl_Expediente.js";
import "./models/mdl_Titulo.js";

// Import GraphQL schema and resolvers
import { typeDefs } from "./data/schema_db.js";
import { resolvers } from "./data/resolversMongo.js";

// Create and start Apollo GraphQL server
const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`GraphQL ready at ${url}`);

// ============================
//  Mini Express Server for Image Uploads
// ============================

import express from "express";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import multer from "multer";
import mongoosePkg from "mongoose";

// Get Titulo model and create Express app
const Titulo = mongoosePkg.model("Titulo");
const app = express();

// Directory for uploaded images
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Serve uploaded files at http://localhost:4001/uploads/<filename>
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

// Multer disk storage: saves incoming files to UPLOAD_DIR with a UUID-based filename
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

// Multer middleware with limits and MIME-type filter (PNG/JPG/JPEG/WEBP only; max 5MB)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) {
      return cb(new Error("Tipo de imagen no permitido"));
    }
    cb(null, true);
  },
});

/**
 * POST /api/titulos/:id/imagen
 * Upload an image file and persist ONLY its relative path in the Titulo document.
 * Stores the path in MongoDB, deletes previous image if present.
 */
app.post("/api/titulos/:id/imagen", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoosePkg.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid ObjectId" });
    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

    // Delete previous image file if it exists
    const prev = await Titulo.findById(id).select("imagenPath");
    if (prev?.imagenPath) {
      const absPrev = path.join(
        process.cwd(),
        prev.imagenPath.replace(/^\//, "")
      );
      if (fs.existsSync(absPrev)) fs.unlink(absPrev, () => {});
    }

    const relPath = `/uploads/${req.file.filename}`;
    await Titulo.findByIdAndUpdate(id, {
      imagenPath: relPath,
      imagenBase64: null, // Clear legacy Base64 field if present
    });

    res.json({
      ok: true,
      path: relPath,
      size: req.file.size,
      mime: req.file.mimetype,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error guardando imagen" });
  }
});

// Multer error handler that returns JSON responses
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code });
  }
  if (err) return res.status(500).json({ error: err.message });
  return res.end();
});

// Start Express server for uploads and log endpoints ---> npm start
app.listen(4001, () => {
  console.log("POST imagen en /api/titulos/:id/imagen (form-data: key 'file')");
  console.log("Uploads en http://localhost:4001/uploads/<filename>");
});
