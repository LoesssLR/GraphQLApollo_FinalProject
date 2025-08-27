/**
 * Expediente Model (Professional Record)
 * --------------------------------------
 * This file defines the Mongoose schema for the Expediente (Professional Record) collection.
 * Each field is documented for clarity and easy understanding.
 *
 * Fields:
 *   - profesional: Reference to the professional (unique)
 *   - experiencias: Array of work experiences
 *       - empresa: Company name
 *       - descripcion: Description of the work
 *       - anios: Number of years
 */

import mongoose from "mongoose";

const expedienteSchema = new mongoose.Schema(
  {
    profesional: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the professional
      ref: "Profesional",
      required: true,
      unique: true,
    },
    experiencias: [
      {
        empresa: { type: String, required: true }, // Company name
        descripcion: { type: String, required: true }, // Description of the work
        anios: { type: Number, min: 0, required: true }, // Number of years
      },
    ],
  },
  {
    collection: "Expedientes",
    timestamps: true,
  }
);

// Register the schema as the "Expediente" model in Mongoose
mongoose.model("Expediente", expedienteSchema);
export default mongoose.model("Expediente");
