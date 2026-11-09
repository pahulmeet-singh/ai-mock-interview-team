import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ResumeList } from './ResumeList';
import { ResumeUploader } from './ResumeUploader';
import { useResumes } from './hooks';
import { MAX_RESUMES } from './schemas';

export function Component() {
  useDocumentTitle('Resumes');
  const { data: resumes, isPending, error, refetch } = useResumes();

  return (
    <>
      <PageHeader title="Resumes" description={`Keep up to ${MAX_RESUMES} PDF resumes here and attach one when you book. Files are private to your account.`} />
      <div className="max-w-3xl space-y-8">
        <ResumeUploader count={resumes?.length ?? 0} />
        <section aria-labelledby="your-resumes">
          <h2 id="your-resumes" className="mb-3 font-display text-xl font-semibold">
            Your resumes
          </h2>
          {isPending ? <LoadingState rows={2} label="Loading resumes" /> : error ? <ErrorState error={error} onRetry={refetch} /> : <ResumeList resumes={resumes} />}
        </section>
      </div>
    </>
  );
}
