import { z } from 'zod';

// Zod 3 compatible syntax
export const emailSchema = z.string().email({ message: 'Email inválido' });

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-]{8,20}$/, { message: 'Teléfono inválido' });

export const requiredStringSchema = (minLength = 1) =>
  z.string().min(minLength, { message: `Este campo es requerido` });

export const optionalStringSchema = z.string().optional();

export const urlSchema = z.string().url({ message: 'URL inválida' });

export const positiveNumberSchema = z.number().positive({ message: 'Debe ser positivo' });

export const dateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Fecha inválida' }
);