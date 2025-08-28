/**
 * Vacante Model (Job Vacancy)
 * --------------------------
 * This file defines the Mongoose schema for the Vacante (Job Vacancy) collection.
 * Each field is documented for clarity and easy understanding.
 *
 * Fields:
 *   - titulo: Job title
 *   - area: Area of expertise
 *   - descripcion: Job description
 *   - empresa: Reference to the employer (Empleador)
 *   - fechaPublicacion: Date of publication
 */

import mongoose from "mongoose";

const vacanteSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true }, // Job title
    area: { type: String, required: true }, // Area of expertise
    descripcion: { type: String, required: true }, // Job description
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empleador",
      required: true,
    }, // Reference to employer
    fechaPublicacion: { type: Date, default: Date.now }, // Date of publication
  },
  { collection: "Vacantes" }
);

// Register the schema as the "Vacante" model in Mongoose
mongoose.model("Vacante", vacanteSchema);
export default mongoose.model("Vacante");
