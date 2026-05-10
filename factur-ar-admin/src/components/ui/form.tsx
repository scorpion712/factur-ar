import type { FormFieldProps } from '../../types/forms';

export function FormField({ name, label, error, children }: FormFieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = errorId;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div>{children}</div>
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-describedby={describedBy}
        >
          {error}
        </p>
      )}
    </div>
  );
}