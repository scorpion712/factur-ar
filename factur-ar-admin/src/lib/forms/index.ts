// Schema utilities
export {
  emailSchema,
  phoneSchema,
  requiredStringSchema,
  optionalStringSchema,
  urlSchema,
  positiveNumberSchema,
  dateSchema,
} from './schemas/field-schemas';

// Hook
export { useFormWithZod } from './hooks/use-form-with-zod';
export type { InferFormData, UseFormWithZodReturn } from '../../types/forms';

/**
 * Example usage:
 *
 * import { z } from 'zod';
 * import { useFormWithZod, emailSchema, requiredStringSchema } from '@/lib/forms';
 *
 * const loginSchema = z.object({
 *   email: emailSchema,
 *   password: requiredStringSchema(8),
 * });
 *
 * type LoginFormData = z.infer<typeof loginSchema>;
 *
 * function LoginForm() {
 *   const { register, handleSubmit, formState: { errors } } = useFormWithZod(loginSchema);
 *
 *   return (
 *     <form onSubmit={handleSubmit(data => console.log(data))}>
 *       <input {...register('email')} />
 *       {errors.email && <span>{errors.email.message}</span>}
 *
 *       <input type="password" {...register('password')} />
 *       {errors.password && <span>{errors.password.message}</span>}
 *
 *       <button type="submit">Login</button>
 *     </form>
 *   );
 * }
 */