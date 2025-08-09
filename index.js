// index.js (TU CÓDIGO EXISTENTE)
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
//  EXTRA: Mini servidor Express
// ============================
import express from "express";
import mongoosePkg from "mongoose";
const Titulo = mongoosePkg.model("Titulo"); // ya registrado arriba

const app = express();

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
