import { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/ErrorState';
import { FormField } from '@/components/common/FormField';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/features/categories/hooks';
import { useBookInterview } from '@/features/interviews/hooks';
import { useResumes } from '@/features/resume/hooks';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DIFFICULTIES } from '@/lib/constants';
import { applyFieldErrors, toastError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { BookingSummary } from './BookingSummary';
import { SlotPicker } from './SlotPicker';
import { useSlots } from './hooks';
import { bookingSchema } from './schemas';

const FORM_FIELDS = ['category', 'difficulty', 'scheduledAt', 'resumeId'];

function Step({ number, title, children }) {
  return (
    <section aria-labelledby={`step-${number}`}>
      <h2 id={`step-${number}`} className="mb-4 font-display text-xl font-semibold">
        <span className="mr-2 text-primary">{number}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Component() {
  useDocumentTitle('Book a session');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const categories = useCategories();
  const slots = useSlots();
  const resumes = useResumes();
  const book = useBookInterview();

  // Lifting state up: the chosen day is shared by the day strip and the slot grid, so this page owns it.
  const [pickedDate, setPickedDate] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { category: params.get('category') ?? '', difficulty: 'intermediate', scheduledAt: '', resumeId: '' },
  });
  const form = watch();

  // Derived state: the visible day is computed, not stored. Until the user picks one, show the first day with an open slot.
  const days = slots.data?.days ?? [];
  const activeDate = pickedDate ?? days.find((d) => d.slots.some((s) => s.status === 'open'))?.date ?? days[0]?.date;
  const selectedSlot = days.flatMap((d) => d.slots).find((s) => s.startsAt === form.scheduledAt);
  const slotTaken = Boolean(selectedSlot) && selectedSlot.status !== 'open';

  // A stable reference, so the memoised SlotGrid can skip re-rendering when unrelated form fields change.
  const selectSlot = useCallback((startsAt) => setValue('scheduledAt', startsAt, { shouldValidate: true, shouldDirty: true }), [setValue]);

  const categoryTitle = categories.data?.categories.find((c) => c.id === form.category)?.title;
  const resumeName = resumes.data?.find((r) => r.id === form.resumeId)?.fileName;

  const onSubmit = (values) =>
    book.mutate(
      { ...values, resumeId: values.resumeId || null },
      {
        onSuccess: (interview) => {
          toast.success('Session booked');
          navigate(`/interviews/${interview.id}`);
        },
        onError: (error) => {
          if (error.status === 409) setValue('scheduledAt', '');
          if (!applyFieldErrors(error, setError, FORM_FIELDS)) toastError(error);
        },
      },
    );

  return (
    <>
      <PageHeader title="Book a session" description="Choose what to practise, then pick a time. The slot is yours as soon as you confirm." />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <Step number={1} title="What do you want to practise?">
            <div className="space-y-5">
              <FormField id="category" label="Category" error={errors.category?.message}>
                {(control_) => (
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      // A CONTROLLED component: the Select's value lives in RHF state and flows back in through props.
                      <Select value={field.value} onValueChange={field.onChange} disabled={categories.isPending}>
                        <SelectTrigger {...control_}>
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.data?.categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </FormField>

              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <fieldset>
                    <legend className="mb-1.5 text-sm font-medium">Difficulty</legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {DIFFICULTIES.map((d) => (
                        <label
                          key={d.value}
                          className={cn(
                            'cursor-pointer rounded-lg border px-3.5 py-3 transition-colors hover:border-ring/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                          )}
                        >
                          <input type="radio" name="difficulty" value={d.value} checked={field.value === d.value} onChange={() => field.onChange(d.value)} className="sr-only" />
                          <span className="block text-sm font-medium">{d.label}</span>
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{d.hint}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
              />
            </div>
          </Step>

          <Step number={2} title="Pick a time">
            {slots.isPending ? (
              <LoadingState rows={2} rowClassName="h-20" label="Loading time slots" />
            ) : slots.error ? (
              <ErrorState error={slots.error} onRetry={slots.refetch} title="We couldn't load the time slots" />
            ) : (
              <Controller
                name="scheduledAt"
                control={control}
                render={({ field }) => (
                  <SlotPicker days={days} activeDate={activeDate} onDateChange={setPickedDate} value={field.value} onSelect={selectSlot} slotMinutes={slots.data.slotMinutes} />
                )}
              />
            )}
            {errors.scheduledAt && (
              <p role="alert" className="mt-3 text-sm font-medium text-destructive">
                {errors.scheduledAt.message}
              </p>
            )}
          </Step>

          <Step number={3} title="Attach a resume">
            <FormField id="resumeId" label="Resume" optional error={errors.resumeId?.message} hint="Kept with the booking so you can see which version you practised with.">
              {(control_) => (
                <Controller
                  name="resumeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}>
                      <SelectTrigger {...control_}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {resumes.data?.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.fileName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>
            {resumes.data?.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                No resumes yet.{' '}
                <Link to="/resumes" className="font-medium text-primary hover:underline">
                  Upload one
                </Link>{' '}
                first if you want to attach it.
              </p>
            )}
          </Step>
        </div>

        <BookingSummary
          categoryTitle={categoryTitle}
          difficulty={form.difficulty}
          scheduledAt={form.scheduledAt || undefined}
          slotTaken={slotTaken}
          resumeName={resumeName}
          submitting={book.isPending}
        />
      </form>
    </>
  );
}
