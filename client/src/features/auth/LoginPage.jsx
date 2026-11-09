import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormError } from '@/components/common/FormError';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { applyFieldErrors } from '@/lib/errors';
import { PasswordInput } from './PasswordInput';
import { useLogin } from './hooks';
import { loginSchema } from './schemas';

export function Component() {
  useDocumentTitle('Sign in');
  const login = useLogin();

  // register() makes these inputs UNCONTROLLED: the browser owns the value and RHF reads it through a ref,
  // so typing never re-renders the form.
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = (values) => login.mutate(values, { onError: (error) => applyFieldErrors(error, setError, ['email', 'password']) });
  const bannerError = login.error && !Object.keys(login.error.fieldErrors).length ? login.error.message : null;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to book a session or review your scorecards.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        <FormError message={bannerError} />
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="you@college.edu" {...register('email')} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...register('password')} />
        </FormField>
        <Button type="submit" className="w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        New here?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
