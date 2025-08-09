import mongoose from "mongoose";

// Cargar modelos
const Profesional = mongoose.model("Profesional");
const Empleador = mongoose.model("Empleador");
const Vacante = mongoose.model("Vacante");
const Expediente = mongoose.model("Expediente");
const Titulo = mongoose.model("Titulo");

// URL base para servir imágenes
const BASE_IMG = process.env.IMAGES_BASE_URL ?? "http://localhost:4001";

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

    // Reportes
    profesionalesPorArea: async (_, { area }) => {
      return await Profesional.find({ profesiones: area });
    },
    conteoPorGenero: async () => {
      const result = await Profesional.aggregate([
        { $group: { _id: "$genero", total: { $sum: 1 } } },
        { $project: { genero: "$_id", total: 1, _id: 0 } }
      ]);
      return result;
    },
    conteoPorArea: async () => {
      const total = await Profesional.countDocuments();
      const result = await Profesional.aggregate([
        { $unwind: "$profesiones" },
        { $group: { _id: "$profesiones", total: { $sum: 1 } } },
        {
          $project: {
            area: "$_id",
            total: 1,
            porcentaje: {
              $multiply: [
                { $divide: ["$total", total] },
                100
              ]
            },
            _id: 0
          }
        }
      ]);
      return result;
    }
  },

  Mutation: {
    // Crear Profesional
    agregarProfesional: async (_, args) => {
      const nuevo = new Profesional(args);
      return await nuevo.save();
    },

    // Crear Empleador
    agregarEmpleador: async (_, args) => {
      const nuevo = new Empleador(args);
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
          imagenBase64: titulo.imagenBase64,
          expediente: nuevo._id // 👈 clave: mantenerlo como ObjectId
        }).save();
      }));

      // 3. Retornar con populate
      return await Expediente.findById(nuevo._id);
    },

    // Postulación con validación de máximo 3 por mes
    postularVacante: async (_, { profesionalId, vacanteId }) => {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      const profesional = await Profesional.findById(profesionalId);
      if (!profesional) throw new Error("Profesional no encontrado.");

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
    }
  },

  Titulo: {
    imagenUrl: (parent) => `${BASE_IMG}/api/titulos/${parent._id}/imagen`
  }
};
