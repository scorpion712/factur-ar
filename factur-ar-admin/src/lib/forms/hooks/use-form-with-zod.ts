import { useForm, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { InferFormData } from '../../../types/forms';

export function useFormWithZod<T extends z.ZodType>(
  schema: T,
  options?: UseFormProps<InferFormData<T>>
): UseFormReturn<InferFormData<T>> {
  return useForm<InferFormData<T>>({
    resolver: zodResolver(schema),
    reValidateMode: 'onBlur',
    criteriaMode: 'firstError',
    ...options,
  });
}