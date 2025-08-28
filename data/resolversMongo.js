/**
 * GraphQL Resolvers for Final Project
 * -----------------------------------
 * This file implements all resolvers for GraphQL queries and mutations.
 * It connects the API to MongoDB using Mongoose models.
 *
 * Each resolver is documented to help any developer or student understand
 * the logic, relationships, and data flow. All sections are clearly marked.
 *
 * Models used:
 *   - Profesional: Professional users
 *   - Empleador: Employers
 *   - Vacante: Job vacancies
 *   - Expediente: Professional records (CV)
 *   - Titulo: Titles/degrees
 */
import mongoose from "mongoose";

// --- MONGOOSE MODELS ---
const Profesional = mongoose.model("Profesional"); // Professional users
const Empleador = mongoose.model("Empleador"); // Employers
const Vacante = mongoose.model("Vacante"); // Job vacancies
const Expediente = mongoose.model("Expediente"); // Professional records
const Titulo = mongoose.model("Titulo"); // Titles/degrees

// --- CONSTANTS ---
// Base URL for serving images (used in Titulo resolver)
const BASE_IMG = (
  process.env.IMAGES_BASE_URL ?? "http://localhost:4001"
).replace(/\/$/, "");
// Get the actual collection name for Vacantes to avoid hardcoding
const vacantesCollection = Vacante.collection.name;

// Main resolvers object for GraphQL
/**
 * Main resolvers object for GraphQL
 * ---------------------------------
 * Contains all Query, Mutation, and type relationship resolvers.
 */
export const resolvers = {
  Query: {
    // =====================
    //        QUERIES
    // =====================

    /**
     * Get all professionals in the database.
     * @returns {Array<Profesional>}
     */
    profesionales: async () => await Profesional.find(),

    /**
     * Get a professional by their ID (cedula).
     * @param {String} cedula - Professional's ID
     * @returns {Profesional|null}
     */
    profesional: async (_, { cedula }) => await Profesional.findOne({ cedula }),

    /**
     * Get all employers in the database.
     * @returns {Array<Empleador>}
     */
    empleadores: async () => await Empleador.find(),

    /**
     * Get an employer by their ID (cedula).
     * @param {String} cedula - Employer's ID
     * @returns {Empleador|null}
     */
    empleador: async (_, { cedula }) => await Empleador.findOne({ cedula }),

    /**
     * Get all job vacancies, including employer info.
     * @returns {Array<Vacante>}
     */
    vacantes: async () => await Vacante.find().populate("empresa"),

    /**
     * Get vacancies by area, including employer info.
     * @param {String} area - Area of expertise
     * @returns {Array<Vacante>}
     */
    vacantePorArea: async (_, { area }) =>
      await Vacante.find({ area }).populate("empresa"),

    /**
     * Get professionals by area of expertise.
     * @param {String} area - Area of expertise
     * @returns {Array<Profesional>}
     */
    profesionalesPorArea: async (_, { area }) => {
      const rows = await Profesional.aggregate([
        { $match: { profesiones: area } },
        {
          $project: {
            cedula: 1,
            nombre: 1,
            profesiones: {
              $filter: {
                input: "$profesiones",
                as: "p",
                cond: { $eq: ["$$p", area] },
              },
            },
          },
        },
      ]);
      // Returns empty array if no results
      return rows;
    },

    /**
     * Get professionals who applied to vacancies in a specific area.
     * @param {String} area - Area of expertise
     * @returns {Array<Profesional>} Professionals and companies they applied to
     */
    postulantesPorArea: async (_, { area }) => {
      return await Profesional.aggregate([
        { $unwind: "$postulaciones" },
        {
          $lookup: {
            from: vacantesCollection,
            localField: "postulaciones.vacanteId",
            foreignField: "_id",
            as: "vac",
          },
        },
        { $unwind: "$vac" },
        { $match: { "vac.area": area } },
        {
          $lookup: {
            from: Empleador.collection.name,
            localField: "vac.empresa",
            foreignField: "_id",
            as: "empresa",
          },
        },
        { $unwind: "$empresa" },
        {
          $group: {
            _id: "$_id",
            cedula: { $first: "$cedula" },
            nombre: { $first: "$nombre" },
            empresas: { $addToSet: "$empresa.nombre" },
          },
        },
        { $project: { _id: 0, cedula: 1, nombre: 1, empresas: 1 } },
        { $sort: { nombre: 1 } },
      ]).collation({ locale: "es", strength: 1 });
    },

    /**
     * Get count of professionals by gender.
     * @returns {Array<{genero: String, total: Number}>}
     */
    conteoPorGenero: async () => {
      const result = await Profesional.aggregate([
        { $group: { _id: "$genero", total: { $sum: 1 } } },
        { $project: { genero: "$_id", total: 1, _id: 0 } },
      ]);
      return result;
    },

    /**
     * Get count and percentage of professionals by area.
     * @returns {Array<{area: String, total: Number, porcentaje: Number}>}
     */
    conteoPorArea: async () => {
      const totalProfesionales = await Profesional.countDocuments();
      const rows = await Profesional.aggregate([
        { $unwind: "$profesiones" },
        {
          $group: {
            _id: "$profesiones",
            personas: { $addToSet: "$_id" },
          },
        },
        {
          $project: {
            _id: 0,
            area: "$_id",
            total: { $size: "$personas" },
          },
        },
        { $sort: { total: -1, area: 1 } },
      ]);
      // Calculate percentage for each area
      return rows.map((r) => ({
        ...r,
        porcentaje: totalProfesionales
          ? (r.total / totalProfesionales) * 100
          : 0,
      }));
    },
  },

  Mutation: {
    // =====================
    //       MUTATIONS
    // =====================

    /**
     * Add a new professional (checks for duplicate ID).
     * @param {Object} args - Professional data
     * @returns {Profesional}
     */
    agregarProfesional: async (_, args) => {
      const cedula = String(args.cedula).trim();
      const yaExiste = await Profesional.exists({ cedula });
      if (yaExiste) throw new Error("Ya existe un profesional con esa cédula.");
      const nuevo = new Profesional({ ...args, cedula });
      return await nuevo.save();
    },

    /**
     * Add a new employer (checks for duplicate ID).
     * @param {Object} args - Employer data
     * @returns {Empleador}
     */
    agregarEmpleador: async (_, args) => {
      const cedula = String(args.cedula).trim();
      const yaExiste = await Empleador.exists({ cedula });
      if (yaExiste) throw new Error("Ya existe un empleador con esa cédula.");
      const nuevo = new Empleador({ ...args, cedula });
      return await nuevo.save();
    },

    /**
     * Add a new job vacancy (links to employer by ID).
     * @param {Object} args - Vacancy data
     * @returns {Vacante}
     */
    agregarVacante: async (_, { titulo, area, descripcion, empresaCedula }) => {
      const empleador = await Empleador.findOne({ cedula: empresaCedula });
      if (!empleador)
        throw new Error("Empleador no encontrado con esa cédula.");
      const nueva = new Vacante({
        titulo,
        area,
        descripcion,
        empresa: empleador._id,
      });
      return await nueva.save();
    },

    /**
     * Add a new professional record (expediente) and related titles.
     * @param {Object} args - Record data
     * @returns {Expediente}
     */
    agregarExpediente: async (
      _,
      { profesionalCedula, titulos, experiencias }
    ) => {
      const profesional = await Profesional.findOne({
        cedula: profesionalCedula,
      });
      if (!profesional)
        throw new Error("Profesional no encontrado con esa cédula.");
      const existente = await Expediente.findOne({
        profesional: profesional._id,
      });
      if (existente) throw new Error("El profesional ya tiene un expediente.");
      // 1. Create the record with experiences
      const nuevo = new Expediente({
        profesional: profesional._id,
        experiencias,
      });
      await nuevo.save();
      // 2. Insert titles (ensure ObjectId is saved)
      await Promise.all(
        titulos.map(async (titulo) => {
          await new Titulo({
            nombre: titulo.nombre,
            expediente: nuevo._id,
          }).save();
        })
      );
      // 3. Return with populate
      return await Expediente.findById(nuevo._id);
    },

    /**
     * Apply to a vacancy (max 3 per month, no duplicate applications).
     * @param {String} profesionalId - Professional's MongoDB ID
     * @param {String} vacanteId - Vacancy's MongoDB ID
     * @returns {Profesional}
     */
    postularVacante: async (_, { profesionalId, vacanteId }) => {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      const profesional = await Profesional.findById(profesionalId);
      if (!profesional) throw new Error("Profesional no encontrado.");
      // Prevent duplicate applications to the same vacancy
      const yaPostuloMismaVacante = profesional.postulaciones.some(
        (p) => String(p.vacanteId) === String(vacanteId)
      );
      if (yaPostuloMismaVacante) {
        throw new Error("Ya estás postulado a esta vacante.");
      }
      // Limit: max 3 applications per month
      const postulacionesMes = profesional.postulaciones.filter((p) => {
        const fecha = new Date(p.fecha);
        return fecha >= inicioMes && fecha <= finMes;
      });
      if (postulacionesMes.length >= 3) {
        throw new Error("Solo se permiten 3 postulaciones por mes.");
      }
      profesional.postulaciones.push({ vacanteId, fecha: hoy });
      await profesional.save();
      return profesional;
    },
  },

  // =====================
  //   RELATION RESOLVERS
  // =====================

  /**
   * Empleador type: Get all vacancies offered by an employer.
   */
  Empleador: {
    puestosOfertados: async (parent) => {
      return await Vacante.find({ empresa: parent._id });
    },
  },

  /**
   * Vacante type: Get employer info for a vacancy.
   */
  Vacante: {
    empresa: async (parent) => {
      return await Empleador.findById(parent.empresa);
    },
  },

  /**
   * Expediente type: Get professional and titles for a record.
   */
  Expediente: {
    profesional: async (parent) => {
      return await Profesional.findById(parent.profesional);
    },
    titulos: async (parent) => {
      return await Titulo.find({ expediente: parent._id });
    },
  },

  /**
   * Profesional type: Get expediente and all applications for a professional.
   */
  Profesional: {
    expediente: async (parent) => {
      return await Expediente.findOne({ profesional: parent._id });
    },
    postulaciones: async (parent) => {
      return await Promise.all(
        parent.postulaciones.map(async (p) => {
          const vacante = await Vacante.findById(p.vacanteId).populate(
            "empresa"
          );
          return {
            fecha: p.fecha,
            vacante,
          };
        })
      );
    },
  },

  /**
   * Titulo type: Get image URL for a title.
   */
  Titulo: {
    imagenUrl: (parent) =>
      parent.imagenPath ? `${BASE_IMG}${parent.imagenPath}` : null,
  },
};
