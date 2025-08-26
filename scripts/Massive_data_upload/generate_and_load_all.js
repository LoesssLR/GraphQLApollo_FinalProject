import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { faker } from '@faker-js/faker';

// Soporte para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const DATA_DIR = path.join(__dirname, "..", "..", "..", "DEMO_PROYECTOFINAL", "JSON_MONGO_DATA");

// Generadores de datos

const generateProfesionales = (n = 100) => Array.from({ length: n }, () => ({
  cedula: faker.string.uuid(),
  nombre: faker.person.firstName(),
  apellido: faker.person.lastName(),
  correo: faker.internet.email(),
  telefono: faker.phone.number('(###) ###-####'),
  area: faker.helpers.arrayElement([
    "Industrial", "Computers", "Clothing", "Automotive", "Health",
    "Tools", "Outdoors", "Home", "Electronics", "Beauty"
  ]),
  genero: faker.helpers.arrayElement([
    "Male", "Female", "Non-binary", "Genderqueer", "Genderfluid"
  ])
}));

const generateEmpleadores = (n = 20) => Array.from({ length: n }, () => ({
  cedula: faker.string.uuid(),
  nombre: faker.company.name(),
  tipo: faker.helpers.arrayElement(["FISICA", "JURIDICA"]),
  correo: faker.internet.email(),
  telefono: faker.phone.number('(###) ###-####'),
  area: faker.helpers.arrayElement([
    "Health", "Clothing", "Beauty", "Tools", "Shoes", "Baby",
    "Jewelry", "Home", "Books", "Kids", "Grocery"
  ])
}));

const generateVacantes = (n = 50) => Array.from({ length: n }, () => ({
  titulo: faker.person.jobTitle(), // Added titulo field
  nombre: faker.person.jobTitle(),
  area: faker.helpers.arrayElement([
    "Industrial", "Computers", "Clothing", "Automotive", "Health",
    "Tools", "Outdoors", "Home", "Electronics", "Beauty"
  ]),
  descripcion: faker.lorem.sentence(),
  salario: faker.number.int({ min: 300000, max: 2000000 }),
  requisitos: [faker.lorem.word(), faker.lorem.word()]
}));

const generateExpedientes = (n = 100) => Array.from({ length: n }, () => ({
  descripcion: faker.lorem.sentence(),
  fecha: faker.date.past().toISOString()
}));

const generateTitulos = (n = 200) => Array.from({ length: n }, () => ({
  nombre: faker.person.jobType(),
  institucion: faker.company.name(),
  fecha: faker.date.past().toISOString()
}));

// Guardar JSON
async function saveJSON(filename, data) {
  await fs.mkdir(DATA_DIR, {recursive: true});
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// Flujo principal
async function main() {
  // 1. Generar datos y guardar JSON
  const profesionales = generateProfesionales(1000); // Updated to generate 1000 records
  const empleadores = generateEmpleadores(1000); // Updated to generate 1000 records
  const vacantes = generateVacantes(1000); // Updated to generate 1000 records
  const expedientes = generateExpedientes(1000); // Updated to generate 1000 records
  const titulos = generateTitulos(1000); // Updated to generate 1000 records

  await saveJSON("profesionales.json", profesionales);
  await saveJSON("empleadores.json", empleadores);
  await saveJSON("vacantes.json", vacantes);
  await saveJSON("expedientes.json", expedientes);
  await saveJSON("titulos.json", titulos);

  // 2. Insertar en MongoDB
  await mongoose.connect("mongodb://localhost:27017/ProyectoFinal", {dbName: "ProyectoFinal"});
  console.log("Connected to MongoDB");

  await Profesional.deleteMany({});
  await Empleador.deleteMany({});
  await Vacante.deleteMany({});
  await Expediente.deleteMany({});
  await Titulo.deleteMany({});
  console.log("Cleared all collections");

  const profesionalesInsertados = await Profesional.insertMany(profesionales);
  console.log(`Inserted ${profesionalesInsertados.length} profesionales`);

  const empleadoresInsertados = await Empleador.insertMany(empleadores);
  console.log(`Inserted ${empleadoresInsertados.length} empleadores`);

  // Vacantes con empresa aleatoria
  const vacantesConEmpresa = vacantes.map(v => ({
    ...v,
    empresa: empleadoresInsertados[Math.floor(Math.random() * empleadoresInsertados.length)]._id
  }));
  const vacantesInsertadas = await Vacante.insertMany(vacantesConEmpresa);
  console.log(`Inserted ${vacantesInsertadas.length} vacantes`);

  // Expedientes con profesional 1–a–1
  const maxExpedientes = Math.min(expedientes.length, profesionalesInsertados.length);
  const profsShuffled = [...profesionalesInsertados].sort(() => Math.random() - 0.5);
  const expedientesConProfesional = [];
  for (let i = 0; i < maxExpedientes; i++) {
    expedientesConProfesional.push({
      ...expedientes[i],
      profesional: profsShuffled[i]._id
    });
  }
  const expedientesInsertados = await Expediente.insertMany(expedientesConProfesional);
  console.log(`Inserted ${expedientesInsertados.length} expedientes (1 por profesional)`);

  // Titulos con expediente aleatorio
  const titulosConExpediente = titulos.map(t => ({
    ...t,
    expediente: expedientesInsertados[Math.floor(Math.random() * expedientesInsertados.length)]._id
  }));
  const titulosInsertados = await Titulo.insertMany(titulosConExpediente);
  console.log(`Inserted ${titulosInsertados.length} títulos`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
  console.log("All data generated and loaded");
}

main().catch(e => {console.error(e); process.exit(1);});
