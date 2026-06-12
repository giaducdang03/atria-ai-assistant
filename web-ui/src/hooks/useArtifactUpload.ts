import { useState, useCallback } from 'react';
import type { Artifact } from '../types';
import { validateFileSize } from '../utils/fileUtils';

export type UploadScope = 'conversation' | 'project';

interface UseArtifactUploadOptions {
  maxFileSizeMB?: number;
  onSuccess?: (artifact: Artifact) => void;
  onError?: (error: string) => void;
}

export function useArtifactUpload(options: UseArtifactUploadOptions = {}) {
  const { maxFileSizeMB = 50, onSuccess, onError } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      file: File,
      scope: UploadScope,
      conversationId?: number,
      projectId?: number,
    ): Promise<Artifact | null> => {
      try {
        setError(null);

        // Validate file
        if (!validateFileSize(file, maxFileSizeMB)) {
          const errorMsg = `File size exceeds ${maxFileSizeMB}MB limit`;
          setError(errorMsg);
          onError?.(errorMsg);
          return null;
        }

        setUploading(true);
        setProgress((prev) => ({ ...prev, [file.name]: 0 }));

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('scope', scope);
        if (conversationId) {
          formData.append('conversation_id', conversationId.toString());
        }
        if (projectId) {
          formData.append('project_id', projectId.toString());
        }

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();

        // Track progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setProgress((prev) => ({
              ...prev,
              [file.name]: Math.round(percentComplete),
            }));
          }
        });

        // Wrap in promise
        const response = await new Promise<any>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed: Network error'));
          });

          xhr.open('POST', '/api/artifacts/upload');
          xhr.send(formData);
        });

        const artifact: Artifact = response.artifact || response;

        setProgress((prev) => {
          const updated = { ...prev };
          delete updated[file.name];
          return updated;
        });
        setUploading(false);
        onSuccess?.(artifact);

        return artifact;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        onError?.(errorMsg);
        setProgress((prev) => {
          const updated = { ...prev };
          delete updated[file.name];
          return updated;
        });
        setUploading(false);
        return null;
      }
    },
    [maxFileSizeMB, onSuccess, onError],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    upload,
    uploading,
    progress,
    error,
    clearError,
  };
}
