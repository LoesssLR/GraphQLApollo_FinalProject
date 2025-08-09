// Define the Titulo model schema using Mongoose.
// This schema sets the structure for the Titulos collection in MongoDB.

import mongoose from "mongoose";

const tituloSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  imagenBase64: { type: String, required: true },
  expediente: { type: mongoose.Schema.Types.ObjectId, ref: "Expediente", required: true }
}, { collection: "Titulos" });

// Register the schema as the "Titulo" model in Mongoose.
mongoose.model("Titulo", tituloSchema);
export default mongoose.model("Titulo");
