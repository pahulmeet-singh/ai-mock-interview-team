import { useState } from 'react';
import { Download, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { toastError } from '@/lib/errors';
import { formatBytes, formatDate } from '@/lib/format';
import { resumesApi } from './api';
import { useDeleteResume } from './hooks';

// The bucket is private, so we ask the server for a one-minute signed link. The tab is opened first, inside the
// click, because browsers block pop-ups that open after an await.
async function openResume(id) {
  const tab = window.open('', '_blank');
  try {
    const { url } = await resumesApi.downloadUrl(id);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.assign(url);
    }
  } catch (error) {
    tab?.close();
    toastError(error);
  }
}

export function ResumeList({ resumes }) {
  const remove = useDeleteResume();
  const [target, setTarget] = useState(null);

  if (resumes.length === 0) {
    return <EmptyState icon={FileText} title="No resumes yet" description="Upload a PDF and you can attach it when you book a session." />;
  }

  const confirmDelete = () =>
    remove.mutate(target.id, {
      onSuccess: () => {
        toast.success('Resume deleted');
        setTarget(null);
      },
      onError: (error) => {
        toastError(error);
        setTarget(null);
      },
    });

  return (
    <>
      <ul className="divide-y rounded-xl border bg-card">
        {resumes.map((resume) => (
          <li key={resume.id} className="flex items-center gap-4 px-5 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{resume.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {formatBytes(resume.sizeBytes)}, uploaded {formatDate(resume.createdAt)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => openResume(resume.id)}>
              <Download /> Open
            </Button>
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-destructive" onClick={() => setTarget(resume)} aria-label={`Delete ${resume.fileName}`}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title="Delete this resume?"
        description={`"${target?.fileName}" will be removed permanently. Sessions it was attached to keep working.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        destructive
        pending={remove.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
