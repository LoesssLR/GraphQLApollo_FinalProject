import mongoose from "mongoose";

// Cargar modelos
const Profesional = mongoose.model("Profesional");
const Empleador = mongoose.model("Empleador");
const Vacante = mongoose.model("Vacante");
const Expediente = mongoose.model("Expediente");
const Titulo = mongoose.model("Titulo");

// URL base para servir imágenes
const BASE_IMG = (process.env.IMAGES_BASE_URL ?? "http://localhost:4001").replace(/\/$/, "");
const vacantesCollection = Vacante.collection.name; // evita hardcodear "Vacantes" o "vacantes"

export const resolvers = {
  Query: {
    // Profesionales
    profesionales: async () => await Profesional.find(),
    profesional: async (_, { cedula }) => await Profesional.findOne({ cedula }),

    // Empleadores
    empleadores: async () => await Empleador.find(),
    empleador: async (_, { cedula }) => await Empleador.findOne({ cedula }),

    // Vacantes
    vacantes: async () => await Vacante.find().populate("empresa"),
    vacantePorArea: async (_, { area }) => await Vacante.find({ area }).populate("empresa"),

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
                cond: { $eq: ["$$p", area] }
              }
            }
          }
        }
      ]);

      // Si no hay resultados, devuelve []
      return rows; 
    },

    postulantesPorArea: async (_,{ area }) => {
      return await Profesional.aggregate([
        { $unwind: "$postulaciones" },
        {
          $lookup: {
            from: vacantesCollection,
            localField: "postulaciones.vacanteId",
            foreignField: "_id",
            as: "vac"
          }
        },
        { $unwind: "$vac" },
        { $match: { "vac.area": area } },
        {
          $lookup: {
            from: Empleador.collection.name,  // nombre real de la colección de empleadores
            localField: "vac.empresa",
            foreignField: "_id",
            as: "empresa"
          }
        },
        { $unwind: "$empresa" },
        {
          $group: {
            _id: "$_id",
            cedula: { $first: "$cedula" },
            nombre: { $first: "$nombre" },
            empresas: { $addToSet: "$empresa.nombre" } // si un postulante aplica a varias empresas
          }
        },
        { $project: { _id: 0, cedula: 1, nombre: 1, empresas: 1 } },
        { $sort: { nombre: 1 } }
      ]).collation({ locale: "es", strength: 1 });
    },

    conteoPorGenero: async () => {
      const result = await Profesional.aggregate([
        { $group: { _id: "$genero", total: { $sum: 1 } } },
        { $project: { genero: "$_id", total: 1, _id: 0 } }
      ]);
      return result;
    },

    conteoPorArea: async () => {
      const totalProfesionales = await Profesional.countDocuments();

      const rows = await Profesional.aggregate([
        { $unwind: "$profesiones" },
        {
          $group: {
            _id: "$profesiones",
            personas: { $addToSet: "$_id" } // evita duplicados del mismo profesional
          }
        },
        {
          $project: {
            _id: 0,
            area: "$_id",
            total: { $size: "$personas" }
          }
        },
        { $sort: { total: -1, area: 1 } }
      ]);

      // porcentaje respecto al total de profesionales
      return rows.map(r => ({
        ...r,
        porcentaje: totalProfesionales ? (r.total / totalProfesionales) * 100 : 0
      }));
    }
  },

  Mutation: {
    // Crear Profesional (evita cédula duplicada)
    agregarProfesional: async (_, args) => {
      const cedula = String(args.cedula).trim();
      const yaExiste = await Profesional.exists({ cedula });
      if (yaExiste) throw new Error("Ya existe un profesional con esa cédula.");

      const nuevo = new Profesional({ ...args, cedula });
      return await nuevo.save();
    },

    // Crear Empleador (evita cédula duplicada)
    agregarEmpleador: async (_, args) => {
      const cedula = String(args.cedula).trim();
      const yaExiste = await Empleador.exists({ cedula });
      if (yaExiste) throw new Error("Ya existe un empleador con esa cédula.");

      const nuevo = new Empleador({ ...args, cedula });
      return await nuevo.save();
    },

    // Crear Vacante
    agregarVacante: async (_, { titulo, area, descripcion, empresaCedula }) => {
      const empleador = await Empleador.findOne({ cedula: empresaCedula });
      if (!empleador) throw new Error("Empleador no encontrado con esa cédula.");

      const nueva = new Vacante({
        titulo,
        area,
        descripcion,
        empresa: empleador._id
      });

      return await nueva.save();
    },

    // Crear Expediente
    agregarExpediente: async (_, { profesionalCedula, titulos, experiencias }) => {

      const profesional = await Profesional.findOne({ cedula: profesionalCedula });
      if (!profesional) throw new Error("Profesional no encontrado con esa cédula.");

      const existente = await Expediente.findOne({ profesional: profesional._id });
      if (existente) throw new Error("El profesional ya tiene un expediente.");

      // 1. Crear el expediente con experiencias
      const nuevo = new Expediente({
        profesional: profesional._id,
        experiencias
      });
      await nuevo.save();

      // 2. Insertar los títulos (asegurándote que se guarde el ObjectId, no como string)
      await Promise.all(titulos.map(async (titulo) => {
        await new Titulo({
          nombre: titulo.nombre,
          expediente: nuevo._id
        }).save();
      }));

      // 3. Retornar con populate
      return await Expediente.findById(nuevo._id);
    },

    // Postulación con validación de máximo 3 por mes y sin duplicados por vacante
    postularVacante: async (_, { profesionalId, vacanteId }) => {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      const profesional = await Profesional.findById(profesionalId);
      if (!profesional) throw new Error("Profesional no encontrado.");

      // ❌ No permitir postular dos veces a la misma vacante (en cualquier fecha)
      const yaPostuloMismaVacante = profesional.postulaciones
        .some(p => String(p.vacanteId) === String(vacanteId));
      if (yaPostuloMismaVacante) {
        throw new Error("Ya estás postulado a esta vacante.");
      }

      // ⛔ Límite: máximo 3 postulaciones por mes (a vacantes distintas)
      const postulacionesMes = profesional.postulaciones.filter(p => {
        const fecha = new Date(p.fecha);
        return fecha >= inicioMes && fecha <= finMes;
      });
      if (postulacionesMes.length >= 3) {
        throw new Error("Solo se permiten 3 postulaciones por mes.");
      }

      profesional.postulaciones.push({ vacanteId, fecha: hoy });
      await profesional.save();
      return profesional;
    }
  },

  // Relación: Empleador -> Vacantes
  Empleador: {
    puestosOfertados: async (parent) => {
      return await Vacante.find({ empresa: parent._id });
    }
  },

  // Relación: Vacante -> Empleador
  Vacante: {
    empresa: async (parent) => {
      return await Empleador.findById(parent.empresa);
    }
  },

  // Relación: Expediente -> Profesional
  Expediente: {
    profesional: async (parent) => {
      return await Profesional.findById(parent.profesional);
    },
    titulos: async (parent) => {
      return await Titulo.find({ expediente: parent._id });
    }
  },

  Profesional: {
    expediente: async (parent) => {
      return await Expediente.findOne({ profesional: parent._id });
    },
    postulaciones: async (parent) => {
      return await Promise.all(
        parent.postulaciones.map(async (p) => {
          const vacante = await Vacante.findById(p.vacanteId).populate("empresa");
          return {
            fecha: p.fecha,
            vacante
          };
        })
      );
    }
  },

  Titulo: {
    imagenUrl: (parent) =>
      parent.imagenPath ? `${BASE_IMG}${parent.imagenPath}` : null
  }
};
