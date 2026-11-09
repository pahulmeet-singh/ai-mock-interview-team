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
import { useRegister } from './hooks';
import { registerSchema } from './schemas';

const FIELDS = ['name', 'email', 'targetRole', 'password'];

export function Component() {
  useDocumentTitle('Create account');
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', targetRole: '', password: '', confirmPassword: '' },
  });

  const onSubmit = ({ confirmPassword: _confirm, ...payload }) =>
    registerUser.mutate(payload, { onError: (error) => applyFieldErrors(error, setError, FIELDS) });
  const bannerError = registerUser.error && !Object.keys(registerUser.error.fieldErrors).length ? registerUser.error.message : null;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">It takes a minute. Your first practice session is a few clicks away.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        <FormError message={bannerError} />
        <FormField id="name" label="Full name" error={errors.name?.message}>
          <Input autoComplete="name" {...register('name')} />
        </FormField>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </FormField>
        <FormField id="targetRole" label="Role you are preparing for" optional error={errors.targetRole?.message}>
          <Input placeholder="e.g. Frontend developer" {...register('targetRole')} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
          <PasswordInput autoComplete="new-password" {...register('password')} />
        </FormField>
        <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
        </FormField>
        <Button type="submit" className="w-full" loading={registerUser.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
