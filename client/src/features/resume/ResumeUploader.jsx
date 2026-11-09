import { useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { FormError } from '@/components/common/FormError';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useUploadResume } from './hooks';
import { MAX_RESUMES, resumeFileSchema } from './schemas';

// A file input cannot be controlled in React (its value is read-only), so this is the textbook UNCONTROLLED
// input: the DOM node owns the value and we read it through a ref when something changes.
export function ResumeUploader({ count }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const upload = useUploadResume();
  const full = count >= MAX_RESUMES;

  const choose = (picked) => {
    const result = resumeFileSchema.safeParse(picked);
    setFile(result.success ? result.data : null);
    setError(result.success ? '' : result.error.issues[0].message);
  };

  const clear = () => {
    setFile(null);
    setError('');
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!full && event.dataTransfer.files?.[0]) choose(event.dataTransfer.files[0]);
  };

  const submit = () =>
    upload.mutate(
      { file, onProgress: setProgress },
      {
        onSuccess: () => {
          toast.success('Resume uploaded');
          clear();
        },
        onError: (err) => setError(err.message),
      },
    );

  return (
    <section aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="sr-only">
        Upload a resume
      </h2>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn('rounded-xl border border-dashed px-6 py-8 text-center transition-colors', dragging ? 'border-primary bg-primary/5' : 'bg-card/40', full && 'opacity-60')}
      >
        <FileUp className="mx-auto size-7 text-primary" aria-hidden="true" />
        <p className="mt-3 font-medium">{full ? 'You have reached the limit' : 'Drop a PDF here'}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {full ? `Delete a resume to upload another (${MAX_RESUMES} maximum).` : 'or choose one from your computer. PDF only, up to 5 MB.'}
        </p>
        <input ref={inputRef} id="resume-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={() => choose(inputRef.current.files?.[0])} disabled={full} />
        <Button type="button" variant="outline" className="mt-4" disabled={full || upload.isPending} onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>
      </div>

      <div className="mt-3 space-y-3" aria-live="polite">
        <FormError message={error} />
        {file && (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="size-9" onClick={clear} disabled={upload.isPending} aria-label="Remove selected file">
                <X />
              </Button>
              <Button type="button" onClick={submit} loading={upload.isPending}>
                Upload
              </Button>
            </div>
            {upload.isPending && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
