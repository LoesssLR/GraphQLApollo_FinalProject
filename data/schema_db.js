// This file defines the GraphQL schema for the project.
// It describes all types, queries, and mutations available in the API.
// Each type and field is commented for clarity.
/**
 * GraphQL Schema Definition for the Final Project
 * ------------------------------------------------
 * This schema defines all types, queries, and mutations for the API.
 * Each type and field is documented to clarify its purpose and usage.
 */
export const typeDefs = `#graphql

"""
Represents a professional user in the system.
"""
type Profesional {
  _id: ID!
  cedula: String!
  nombre: String!
  genero: String!
  profesiones: [String!]!
  postulaciones: [Postulacion]!
  expediente: Expediente
  empresas: [String!] 
}

"""
Represents a job application made by a professional.
"""
type Postulacion {
  vacante: Vacante!
  fecha: String!
}

"""
Represents an employer in the system.
"""
type Empleador {
  _id: ID!
  cedula: String!
  nombre: String!
  tipo: String!    # FISICA o JURIDICA
  puestosOfertados: [Vacante]!
}

"""
Represents a job vacancy posted by an employer.
"""
type Vacante {
  _id: ID!
  titulo: String!
  area: String!
  descripcion: String!
  empresa: Empleador!
  fechaPublicacion: String!
  vacante: Vacante
}

"""
Represents a professional's record (CV), including titles and experiences.
"""
type Expediente {
  _id: ID!
  profesional: Profesional!
  titulos: [Titulo]
  experiencias: [Experiencia]!
}

"""
Represents a degree or title obtained by a professional.
"""
type Titulo {
  _id: ID!
  nombre: String!
  imagenUrl: String
}

"""
Represents a work experience entry in a professional's record.
"""
type Experiencia {
  empresa: String!
  descripcion: String!
  anios: Int!
}

"""
Root Query type. Defines all read operations available in the API.
"""
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
  postulantesPorArea(area: String!): [Profesional]!
  conteoPorGenero: [GeneroConteo]!
  conteoPorArea: [AreaConteo]!

  tituloPorId(id: ID!): Titulo

}

"""
Used for reporting: count of professionals by gender.
"""
type GeneroConteo {
  genero: String!
  total: Int!
}

"""
Used for reporting: count and percentage of professionals by area.
"""
type AreaConteo {
  area: String!
  total: Int!
  porcentaje: Float!
}

"""
Root Mutation type. Defines all write operations available in the API.
"""
type Mutation {
  # Registros
  agregarProfesional(cedula: String!, nombre: String!, genero: String!, profesiones: [String!]!): Profesional
  agregarEmpleador(cedula: String!, nombre: String!, tipo: String!): Empleador
  agregarVacante(titulo: String!, area: String!, descripcion: String!, empresaCedula: String!): Vacante
  agregarExpediente(profesionalCedula: String!, titulos: [TituloInput!]!, experiencias: [ExperienciaInput!]!): Expediente

  # Postulación (validación: máximo 3 por mes)
  postularVacante(profesionalId: ID!, vacanteId: ID!): Profesional
}

"""
Input type for adding a new title.
"""
input TituloInput {
  nombre: String!
}

"""
Input type for adding a new work experience.
"""
input ExperienciaInput {
  empresa: String!
  descripcion: String!
  anios: Int!
}
`;
