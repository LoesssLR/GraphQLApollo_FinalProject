/**
 * Empleador Model (Employer)
 * -------------------------
 * This file defines the Mongoose schema for the Empleador (Employer) collection.
 * Each field is documented for clarity and easy understanding.
 *
 * Fields:
 *   - cedula: Unique ID for the employer
 *   - nombre: Employer name
 *   - tipo: Type of employer (FISICA or JURIDICA)
 *   - puestosOfertados: Array of job vacancies offered by the employer
 */

import mongoose from "mongoose";

const empleadorSchema = new mongoose.Schema(
  {
    cedula: { type: String, required: true }, // Unique ID for the employer
    nombre: { type: String, required: true }, // Employer name
    tipo: { type: String, enum: ["FISICA", "JURIDICA"], required: true }, // Type: FISICA (individual) or JURIDICA (company)
    puestosOfertados: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Vacante" },
    ], // Job vacancies offered
  },
  { collection: "Empleadores" }
);

// Register the schema as the "Empleador" model in Mongoose
mongoose.model("Empleador", empleadorSchema);
export default mongoose.model("Empleador");
