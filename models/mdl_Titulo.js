/**
 * Titulo Model (Degree/Title)
 * --------------------------
 * This file defines the Mongoose schema for the Titulo (Degree/Title) collection.
 * Each field is documented for clarity and easy understanding.
 *
 * Fields:
 *   - nombre: Title name
 *   - imagenPath: Path to the image file (optional)
 *   - expediente: Reference to the professional record (Expediente)
 */

import mongoose from "mongoose";

const tituloSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true }, // Title name
    // imagenBase64: { type: String, default: null },
    imagenPath: { type: String, default: null }, // Path to image file (optional)
    expediente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expediente",
      required: true,
    }, // Reference to professional record
  },
  { collection: "Titulos", timestamps: true }
);

// Register the schema as the "Titulo" model in Mongoose
mongoose.model("Titulo", tituloSchema);
export default mongoose.model("Titulo");
