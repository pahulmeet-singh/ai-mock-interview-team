import { api } from '@/lib/api';

export const resumesApi = {
  list: () => api.get('/resumes').then((res) => res.data.resumes),
  // multipart/form-data: the browser sets the Content-Type header (with its boundary) for FormData.
  upload: (file, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post('/resumes', form, {
        timeout: 60_000,
        onUploadProgress: (event) => onProgress?.(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
      })
      .then((res) => res.data.resume);
  },
  remove: (id) => api.delete(`/resumes/${id}`).then(() => id),
  downloadUrl: (id) => api.get(`/resumes/${id}/download`).then((res) => res.data),
};
