import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Soporte para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await mongoose.connect("mongodb://localhost:27017/ProyectoFinal", {
  dbName: "ProyectoFinal"
});
console.log("Connected to MongoDB");

// Cargar modelos
import "../../models/mdl_Profesional.js";
import "../../models/mdl_Empleador.js";
import "../../models/mdl_Vacante.js";
import "../../models/mdl_Expediente.js";
import '../../models/mdl_Titulo.js';

const Profesional = mongoose.model("Profesional");
const Empleador = mongoose.model("Empleador");
const Vacante = mongoose.model("Vacante");
const Expediente = mongoose.model("Expediente");
const Titulo = mongoose.model("Titulo");

// Función auxiliar para leer JSON
const readJSON = async (filename) => {
  const fullPath = path.join(__dirname, "..","..","JSON_MONGO_DATA", filename);
  const data = await fs.readFile(fullPath, "utf-8");
  return JSON.parse(data);
};

// Limpiar todas las colecciones
await Profesional.deleteMany({});
await Empleador.deleteMany({});
await Vacante.deleteMany({});
await Expediente.deleteMany({});
console.log("Cleared all collections");

// 1. Insertar Profesionales
const profesionalesData = await readJSON("profesionales.json");
const profesionalesInsertados = await Profesional.insertMany(profesionalesData);
console.log(`Inserted ${profesionalesInsertados.length} profesionales`);

// 2. Insertar Empleadores
const empleadoresData = await readJSON("empleadores.json");
const empleadoresInsertados = await Empleador.insertMany(empleadoresData);
console.log(`Inserted ${empleadoresInsertados.length} empleadores`);

// 3. Insertar Vacantes y asignar empresa aleatoria
const vacantesData = await readJSON("vacantes.json");
const vacantesConEmpresa = vacantesData.map(v => ({
  ...v,
  empresa: empleadoresInsertados[Math.floor(Math.random() * empleadoresInsertados.length)]._id
}));
const vacantesInsertadas = await Vacante.insertMany(vacantesConEmpresa);
console.log(`Inserted ${vacantesInsertadas.length} vacantes`);

// 4. Insertar Expedientes y asignar profesional aleatorio
const expedientesData = await readJSON("expedientes.json");
const expedientesConProfesional = expedientesData.map(e => ({
  ...e,
  profesional: profesionalesInsertados[Math.floor(Math.random() * profesionalesInsertados.length)]._id
}));
const expedientesInsertados = await Expediente.insertMany(expedientesConProfesional);
console.log(`Inserted ${expedientesInsertados.length} expedientes`);

// 5. Insertar Títulos y asignar profesional aleatorio
const titulosData = await readJSON("titulos.json");
const titulosConExpediente = titulosData.map(t => ({
  ...t,
  expediente: expedientesInsertados[Math.floor(Math.random() * expedientesInsertados.length)]._id
}));
const titulosInsertados = await Titulo.insertMany(titulosConExpediente);
console.log(`Inserted ${titulosInsertados.length} títulos`);


await mongoose.disconnect();
console.log("Disconnected from MongoDB");

console.log("All data loaded");