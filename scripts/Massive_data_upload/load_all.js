/**
 * Data Loading Script
 * -------------------
 * This script loads demo data from JSON files into MongoDB collections.
 * It is intended for quickly populating the database for development or testing.
 *
 * Steps:
 *   1. Connect to MongoDB
 *   2. Load models
 *   3. Read JSON files for each collection
 *   4. Insert data, linking references as needed
 *   5. Disconnect from MongoDB
 */

import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Support for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
await mongoose.connect("mongodb://localhost:27017/ProyectoFinal", {
  dbName: "ProyectoFinal",
});
console.log("Connected to MongoDB");

// Load models
import "../../models/mdl_Profesional.js";
import "../../models/mdl_Empleador.js";
import "../../models/mdl_Vacante.js";
import "../../models/mdl_Expediente.js";
import "../../models/mdl_Titulo.js";

const Profesional = mongoose.model("Profesional");
const Empleador = mongoose.model("Empleador");
const Vacante = mongoose.model("Vacante");
const Expediente = mongoose.model("Expediente");
const Titulo = mongoose.model("Titulo");

/**
 * Helper function to read JSON data from file
 */
const readJSON = async (filename) => {
  const fullPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "DEMO_PROYECTOFINAL",
    "JSON_MONGO_DATA",
    filename
  );
  const data = await fs.readFile(fullPath, "utf-8");
  return JSON.parse(data);
};

// Clear all collections before inserting
await Profesional.deleteMany({});
await Empleador.deleteMany({});
await Vacante.deleteMany({});
await Expediente.deleteMany({});
await Titulo.deleteMany({});
console.log("Cleared all collections");

// 1. Insert professionals
const profesionalesData = await readJSON("profesionales.json");
const profesionalesInsertados = await Profesional.insertMany(profesionalesData);
console.log(`Inserted ${profesionalesInsertados.length} profesionales`);

// 2. Insert employers
const empleadoresData = await readJSON("empleadores.json");
const empleadoresInsertados = await Empleador.insertMany(empleadoresData);
console.log(`Inserted ${empleadoresInsertados.length} empleadores`);

// 3. Insert vacancies and assign random employer
const vacantesData = await readJSON("vacantes.json");
const vacantesConEmpresa = vacantesData.map((v) => ({
  ...v,
  empresa:
    empleadoresInsertados[
      Math.floor(Math.random() * empleadoresInsertados.length)
    ]._id,
}));
const vacantesInsertadas = await Vacante.insertMany(vacantesConEmpresa);
console.log(`Inserted ${vacantesInsertadas.length} vacantes`);

// 4. Insert expedientes and assign professionals (1-to-1)
const expedientesData = await readJSON("expedientes.json");
const maxExpedientes = Math.min(
  expedientesData.length,
  profesionalesInsertados.length
);
const profsShuffled = [...profesionalesInsertados].sort(
  () => Math.random() - 0.5
);
const expedientesConProfesional = [];
for (let i = 0; i < maxExpedientes; i++) {
  expedientesConProfesional.push({
    ...expedientesData[i],
    profesional: profsShuffled[i]._id,
  });
}
const expedientesInsertados = await Expediente.insertMany(
  expedientesConProfesional
);
console.log(
  `Inserted ${expedientesInsertados.length} expedientes (1 per professional)`
);

// 5. Insert titles and assign random expedientes
const titulosData = await readJSON("titulos.json");
const titulosConExpediente = titulosData.map((t) => ({
  ...t,
  expediente:
    expedientesInsertados[
      Math.floor(Math.random() * expedientesInsertados.length)
    ]._id,
}));
const titulosInsertados = await Titulo.insertMany(titulosConExpediente);
console.log(`Inserted ${titulosInsertados.length} títulos`);

// Disconnect from MongoDB
await mongoose.disconnect();
console.log("Disconnected from MongoDB");

console.log("All data loaded");
