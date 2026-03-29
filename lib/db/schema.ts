import {
  pgTable, pgEnum, uuid, varchar, text,
  boolean, numeric, integer, date, timestamp
} from 'drizzle-orm/pg-core'

// Enums
export const estadoInscripcionEnum = pgEnum('estado_inscripcion', [
  'activo', 'vencido', 'suspendido', 'cancelado'
])
export const rolUsuarioEnum = pgEnum('rol_usuario', [
  'admin', 'recepcionista'
])
export const metodoPagoEnum = pgEnum('metodo_pago', [
  'efectivo', 'transferencia', 'tarjeta', 'otro'
])

// Tablas
export const usuarios = pgTable('usuarios', {
  id:            uuid('id').primaryKey().defaultRandom(),
  nombre:        varchar('nombre', { length: 100 }).notNull(),
  email:         varchar('email', { length: 150 }).notNull().unique(),
  passwordHash:  text('password_hash').notNull(),
  rol:           rolUsuarioEnum('rol').notNull().default('recepcionista'),
  activo:        boolean('activo').notNull().default(true),
  creadoEn:      timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
})

export const planes = pgTable('planes', {
  id:            uuid('id').primaryKey().defaultRandom(),
  nombre:        varchar('nombre', { length: 100 }).notNull(),
  descripcion:   text('descripcion'),
  duracionDias:  integer('duracion_dias').notNull(),
  precio:        numeric('precio', { precision: 10, scale: 2 }).notNull(),
  activo:        boolean('activo').notNull().default(true),
  creadoEn:      timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
})

export const miembros = pgTable('miembros', {
  id:              uuid('id').primaryKey().defaultRandom(),
  nombre:          varchar('nombre', { length: 100 }).notNull(),
  apellido:        varchar('apellido', { length: 100 }).notNull(),
  ci:              varchar('ci', { length: 20 }).notNull().unique(),
  telefono:        varchar('telefono', { length: 20 }),
  email:           varchar('email', { length: 150 }),
  fechaNacimiento: date('fecha_nacimiento'),
  fotoUrl:         text('foto_url'),
  notas:           text('notas'),
  activo:          boolean('activo').notNull().default(true),
  creadoEn:        timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn:   timestamp('actualizado_en').notNull().defaultNow(),
})

export const inscripciones = pgTable('inscripciones', {
  id:               uuid('id').primaryKey().defaultRandom(),
  miembroId:        uuid('miembro_id').notNull().references(() => miembros.id),
  planId:           uuid('plan_id').notNull().references(() => planes.id),
  registradoPor:    uuid('registrado_por').notNull().references(() => usuarios.id),
  fechaInicio:      date('fecha_inicio').notNull(),
  fechaVencimiento: date('fecha_vencimiento').notNull(),
  estado:           estadoInscripcionEnum('estado').notNull().default('activo'),
  notas:            text('notas'),
  creadoEn:         timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn:    timestamp('actualizado_en').notNull().defaultNow(),
})

export const pagos = pgTable('pagos', {
  id:             uuid('id').primaryKey().defaultRandom(),
  inscripcionId:  uuid('inscripcion_id').notNull().references(() => inscripciones.id),
  monto:          numeric('monto', { precision: 10, scale: 2 }).notNull(),
  metodo:         metodoPagoEnum('metodo').notNull().default('efectivo'),
  referencia:     varchar('referencia', { length: 200 }),
  registradoPor:  uuid('registrado_por').notNull().references(() => usuarios.id),
  fecha:          timestamp('fecha').notNull().defaultNow(),
  creadoEn:       timestamp('creado_en').notNull().defaultNow(),
})