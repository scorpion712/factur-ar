import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

// Infer form data type from Zod schema
export type InferFormData<T extends z.ZodType> = z.infer<T>;

// FormField component props
export interface FormFieldProps {
  name: string;
  label?: string;
  error?: string;
  children: React.ReactNode;
}

// useFormWithZod return type
export type UseFormWithZodReturn<T extends z.ZodType> = UseFormReturn<z.infer<T>>;