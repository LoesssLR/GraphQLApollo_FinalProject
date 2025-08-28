/**
 * Profesional Model (Professional)
 * --------------------------------
 * This file defines the Mongoose schema for the Profesional (Professional) collection.
 * Each field is documented for clarity and easy understanding.
 *
 * Fields:
 *   - cedula: Unique ID for the professional
 *   - nombre: Full name
 *   - genero: Gender
 *   - profesiones: Array of professions/areas
 *   - postulaciones: Array of job applications
 *       - vacanteId: Reference to the vacancy
 *       - fecha: Date of application
 */

import mongoose from "mongoose";

const profesionalSchema = new mongoose.Schema(
  {
    cedula: { type: String, required: true }, // Unique ID for the professional
    nombre: { type: String, required: true }, // Full name
    genero: { type: String, required: true }, // Gender
    profesiones: [{ type: String, required: true }], // Array of professions/areas
    postulaciones: [
      {
        vacanteId: { type: mongoose.Schema.Types.ObjectId, ref: "Vacante" }, // Reference to the vacancy
        fecha: { type: Date, required: true }, // Date of application
      },
    ],
  },
  { collection: "Profesionales" }
);

// Register the schema as the "Profesional" model in Mongoose
mongoose.model("Profesional", profesionalSchema);
export default mongoose.model("Profesional");
