import React, { useRef, useState } from 'react';
import { useArtifactUpload, type UploadScope } from '../hooks/useArtifactUpload';
import { formatFileSize } from '../utils/fileUtils';

interface FileUploadWidgetProps {
  conversationId?: number;
  projectId?: number;
  onUploadComplete?: (fileCount: number) => void;
  maxFileSizeMB?: number;
  className?: string;
}

export function FileUploadWidget({
  conversationId,
  projectId,
  onUploadComplete,
  maxFileSizeMB = 50,
  className = '',
}: FileUploadWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scope, setScope] = useState<UploadScope>('conversation');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { upload, uploading, progress, error, clearError } = useArtifactUpload({
    maxFileSizeMB,
    onError: (err) => {
      console.error('Upload error:', err);
    },
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      e.currentTarget.value = ''; // Reset input
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    let uploadedCount = 0;

    for (const file of selectedFiles) {
      const result = await upload(file, scope, conversationId, projectId);
      if (result) {
        uploadedCount++;
      }
    }

    if (uploadedCount > 0) {
      setSelectedFiles([]);
      onUploadComplete?.(uploadedCount);
    }
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const isValid = selectedFiles.length > 0 && !uploading;

  return (
    <div className={`upload-widget ${className}`}>
      <div className="space-y-4">
        {/* Scope Selector */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scope"
              value="conversation"
              checked={scope === 'conversation'}
              onChange={(e) => setScope(e.target.value as UploadScope)}
              disabled={uploading}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Conversation Scope</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scope"
              value="project"
              checked={scope === 'project'}
              onChange={(e) => setScope(e.target.value as UploadScope)}
              disabled={uploading}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Project Scope</span>
          </label>
        </div>

        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            disabled={uploading}
            className="hidden"
          />
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <p className="text-sm font-medium text-gray-700">Click to select files</p>
          <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
          <p className="text-xs text-gray-400 mt-2">Max {maxFileSizeMB}MB per file</p>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  {progress[file.name] !== undefined && (
                    <div className="flex-shrink-0 ml-2 w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress[file.name]}%` }}
                      />
                    </div>
                  )}
                  {progress[file.name] === undefined && (
                    <button
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading}
                      className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total: {formatFileSize(totalSize)}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={!isValid}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
