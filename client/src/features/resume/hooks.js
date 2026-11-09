import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { removeById } from '@/lib/immutable';
import { queryKeys } from '@/lib/queryKeys';
import { resumesApi } from './api';

export function useResumes() {
  return useQuery({ queryKey: queryKeys.resumes, queryFn: resumesApi.list });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }) => resumesApi.upload(file, onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.resumes }),
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resumesApi.remove,
    onSuccess: (id) => {
      // Update the cache directly for an instant UI, then confirm with the server.
      queryClient.setQueryData(queryKeys.resumes, (old) => (old ? removeById(old, id) : old));
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.all });
    },
  });
}
