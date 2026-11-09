import { toast } from 'sonner';

// Map the server's { fieldErrors } onto react-hook-form fields. Returns true if at least one field was set.
export function applyFieldErrors(error, setError, knownFields) {
  let applied = false;
  for (const [field, message] of Object.entries(error?.fieldErrors ?? {})) {
    if (knownFields.includes(field)) {
      setError(field, { type: 'server', message });
      applied = true;
    }
  }
  return applied;
}

export const toastError = (error, fallback = 'Something went wrong.') => toast.error(error?.message ?? fallback);
