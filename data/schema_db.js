// GraphQL schema definition for ProyectoFinal database
export const typeDefs = `#graphql

type Profesional {
  _id: ID!
  cedula: String!
  nombre: String!
  genero: String!
  profesiones: [String!]!
  postulaciones: [Postulacion]!
  expediente: Expediente
}

type Postulacion {
  vacanteId: ID!
  fecha: String!
}

type Empleador {
  _id: ID!
  cedula: String!
  nombre: String!
  tipo: String!    # FISICA o JURIDICA
  puestosOfertados: [Vacante]!
}

type Vacante {
  _id: ID!
  titulo: String!
  area: String!
  descripcion: String!
  empresa: Empleador!
  fechaPublicacion: String!
}

type Expediente {
  _id: ID!
  profesional: Profesional!
  titulos: [Titulo]
  experiencias: [Experiencia]!
}

type Titulo {
  _id: ID!                
  nombre: String!
  imagenBase64: String    
  imagenUrl: String       
}

type Experiencia {
  empresa: String!
  descripcion: String!
  anios: Int!
}

type Query {
  # Profesionales
  profesionales: [Profesional]!
  profesional(cedula: String!): Profesional

  # Empleadores
  empleadores: [Empleador]!
  empleador(cedula: String!): Empleador

  # Vacantes
  vacantes: [Vacante]!
  vacantePorArea(area: String!): [Vacante]!

  # Reportes
  profesionalesPorArea(area: String!): [Profesional]!
  conteoPorGenero: [GeneroConteo]!
  conteoPorArea: [AreaConteo]!

  tituloPorId(id: ID!): Titulo
}

type GeneroConteo {
  genero: String!
  total: Int!
}

type AreaConteo {
  area: String!
  total: Int!
  porcentaje: Float!
}

type Mutation {
  # Registros
  agregarProfesional(cedula: String!, nombre: String!, genero: String!, profesiones: [String!]!): Profesional
  agregarEmpleador(cedula: String!, nombre: String!, tipo: String!): Empleador
  agregarVacante(titulo: String!, area: String!, descripcion: String!, empresaCedula: String!): Vacante
  agregarExpediente(profesionalCedula: String!, titulos: [TituloInput!]!, experiencias: [ExperienciaInput!]!): Expediente

  # Postulación (validación: máximo 3 por mes)
  postularVacante(profesionalId: ID!, vacanteId: ID!): Profesional
}

input TituloInput {
  nombre: String!
  imagenBase64: String!
}

input ExperienciaInput {
  empresa: String!
  descripcion: String!
  anios: Int!
}
`;
