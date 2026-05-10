import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .max(128, 'La contraseña es demasiado larga')
    .regex(/[A-Z]/, 'Debe contener al menos 1 mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos 1 minúscula')
    .regex(/[0-9]/, 'Debe contener al menos 1 número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos 1 carácter especial'),
})

export type LoginInput = z.infer<typeof loginSchema>

export function validateLogin(input: unknown): { success: true; data: LoginInput } | { success: false; errors: string[] } {
  const result = loginSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  }
}
