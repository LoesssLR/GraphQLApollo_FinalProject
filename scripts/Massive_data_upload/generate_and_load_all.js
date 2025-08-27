/**
 * Data Generation and Loading Script
 * ----------------------------------
 * This script generates random demo data for all collections and loads it into MongoDB.
 * It uses Faker.js for realistic fake data and Mongoose for database operations.
 *
 * Steps:
 *   1. Generate data for each collection (Profesional, Empleador, Vacante, Expediente, Titulo)
 *   2. Save generated data as JSON files
 *   3. Insert data into MongoDB, linking references as needed
 *
 * Usage:
 *   Run this script to quickly populate the database for development or testing.
 */

import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { faker } from "@faker-js/faker";

// Support for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Directory to save generated JSON data
const DATA_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "DEMO_PROYECTOFINAL",
  "JSON_MONGO_DATA"
);

// --- DATA GENERATORS ---

/**
 * Generate random professionals
 */
const generateProfesionales = (n = 100) =>
  Array.from({ length: n }, () => ({
    cedula: faker.string.uuid(),
    nombre: faker.person.firstName(),
    apellido: faker.person.lastName(),
    correo: faker.internet.email(),
    telefono: faker.phone.number("(###) ###-####"),
    area: faker.helpers.arrayElement([
      "Industrial",
      "Computers",
      "Clothing",
      "Automotive",
      "Health",
      "Tools",
      "Outdoors",
      "Home",
      "Electronics",
      "Beauty",
    ]),
    genero: faker.helpers.arrayElement([
      "Male",
      "Female",
      "Non-binary",
      "Genderqueer",
      "Genderfluid",
    ]),
  }));

/**
 * Generate random employers
 */
const generateEmpleadores = (n = 20) =>
  Array.from({ length: n }, () => ({
    cedula: faker.string.uuid(),
    nombre: faker.company.name(),
    tipo: faker.helpers.arrayElement(["FISICA", "JURIDICA"]),
    correo: faker.internet.email(),
    telefono: faker.phone.number("(###) ###-####"),
    area: faker.helpers.arrayElement([
      "Health",
      "Clothing",
      "Beauty",
      "Tools",
      "Shoes",
      "Baby",
      "Jewelry",
      "Home",
      "Books",
      "Kids",
      "Grocery",
    ]),
  }));

/**
 * Generate random job vacancies
 */
const generateVacantes = (n = 50) =>
  Array.from({ length: n }, () => ({
    titulo: faker.person.jobTitle(),
    nombre: faker.person.jobTitle(),
    area: faker.helpers.arrayElement([
      "Industrial",
      "Computers",
      "Clothing",
      "Automotive",
      "Health",
      "Tools",
      "Outdoors",
      "Home",
      "Electronics",
      "Beauty",
    ]),
    descripcion: faker.lorem.sentence(),
    salario: faker.number.int({ min: 300000, max: 2000000 }),
    requisitos: [faker.lorem.word(), faker.lorem.word()],
  }));

/**
 * Generate random professional records (expedientes)
 */
const generateExpedientes = (n = 100) =>
  Array.from({ length: n }, () => ({
    descripcion: faker.lorem.sentence(),
    fecha: faker.date.past().toISOString(),
  }));

/**
 * Generate random degrees/titles
 */
const generateTitulos = (n = 200) =>
  Array.from({ length: n }, () => ({
    nombre: faker.person.jobType(),
    institucion: faker.company.name(),
    fecha: faker.date.past().toISOString(),
  }));

/**
 * Save data as JSON file in the data directory
 */
async function saveJSON(filename, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2)
  );
}

/**
 * Main flow: Generate, save, and load data
 */
async function main() {
  // 1. Generate data and save as JSON
  const profesionales = generateProfesionales(1000);
  const empleadores = generateEmpleadores(1000);
  const vacantes = generateVacantes(1000);
  const expedientes = generateExpedientes(1000);
  const titulos = generateTitulos(1000);

  await saveJSON("profesionales.json", profesionales);
  await saveJSON("empleadores.json", empleadores);
  await saveJSON("vacantes.json", vacantes);
  await saveJSON("expedientes.json", expedientes);
  await saveJSON("titulos.json", titulos);

  // 2. Insert data into MongoDB
  await mongoose.connect("mongodb://localhost:27017/ProyectoFinal", {
    dbName: "ProyectoFinal",
  });
  console.log("Connected to MongoDB");

  // Clear all collections before inserting
  await Profesional.deleteMany({});
  await Empleador.deleteMany({});
  await Vacante.deleteMany({});
  await Expediente.deleteMany({});
  await Titulo.deleteMany({});
  console.log("Cleared all collections");

  // Insert professionals
  const profesionalesInsertados = await Profesional.insertMany(profesionales);
  console.log(`Inserted ${profesionalesInsertados.length} profesionales`);

  // Insert employers
  const empleadoresInsertados = await Empleador.insertMany(empleadores);
  console.log(`Inserted ${empleadoresInsertados.length} empleadores`);

  // Insert vacancies with random employer
  const vacantesConEmpresa = vacantes.map((v) => ({
    ...v,
    empresa:
      empleadoresInsertados[
        Math.floor(Math.random() * empleadoresInsertados.length)
      ]._id,
  }));
  const vacantesInsertadas = await Vacante.insertMany(vacantesConEmpresa);
  console.log(`Inserted ${vacantesInsertadas.length} vacantes`);

  // Insert expedientes with shuffled professionals (1-to-1)
  const maxExpedientes = Math.min(
    expedientes.length,
    profesionalesInsertados.length
  );
  const profsShuffled = [...profesionalesInsertados].sort(
    () => Math.random() - 0.5
  );
  const expedientesConProfesional = [];
  for (let i = 0; i < maxExpedientes; i++) {
    expedientesConProfesional.push({
      ...expedientes[i],
      profesional: profsShuffled[i]._id,
    });
  }
  const expedientesInsertados = await Expediente.insertMany(
    expedientesConProfesional
  );
  console.log(
    `Inserted ${expedientesInsertados.length} expedientes (1 per professional)`
  );

  // Insert titles with random expedientes
  const titulosConExpediente = titulos.map((t) => ({
    ...t,
    expediente:
      expedientesInsertados[
        Math.floor(Math.random() * expedientesInsertados.length)
      ]._id,
  }));
  const titulosInsertados = await Titulo.insertMany(titulosConExpediente);
  console.log(`Inserted ${titulosInsertados.length} títulos`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
  console.log("All data generated and loaded");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
