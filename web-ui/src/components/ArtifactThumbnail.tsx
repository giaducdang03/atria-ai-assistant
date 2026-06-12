import { useState } from 'react';
import type { Artifact } from '../types';
import { formatFileSize, isImageFile } from '../utils/fileUtils';

interface ArtifactThumbnailProps {
  artifact: Artifact;
  onDelete?: (artifactId: number) => void;
  onPreview?: (artifact: Artifact) => void;
  className?: string;
}

export function ArtifactThumbnail({
  artifact,
  onDelete,
  onPreview,
  className = '',
}: ArtifactThumbnailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = isImageFile(artifact.title || artifact.payload_ref || '');
  const scopeColor = artifact.conversation_id ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
  const scopeLabel = artifact.conversation_id ? 'Conversation' : 'Project';

  const handleDelete = () => {
    onDelete?.(artifact.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`artifact-thumbnail relative group border border-gray-200 rounded-lg overflow-hidden bg-white transition-all hover:shadow-md hover:border-gray-300 ${className}`}
      onMouseLeave={() => setShowDeleteConfirm(false)}
    >
      {/* Preview Area */}
      <div
        className="w-full aspect-square bg-gray-100 overflow-hidden cursor-pointer"
        onClick={() => onPreview?.(artifact)}
      >
        {isImage && artifact.preview && !imageError ? (
          <img
            src={artifact.preview}
            alt={artifact.title || 'Artifact'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {artifact.title || 'Untitled'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatFileSize(artifact.preview ? artifact.preview.length : 0)}
            </p>
          </div>
        </div>

        {/* Scope Badge */}
        <div className={`inline-block text-xs font-medium px-2 py-1 rounded ${scopeColor}`}>
          {scopeLabel}
        </div>

        {/* Type Badge */}
        <div className="inline-block ml-2 text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded">
          {artifact.type}
        </div>
      </div>

      {/* Hover Delete Button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            title="Delete artifact"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        ) : (
          <div className="absolute top-0 right-0 bg-white border border-red-200 rounded-lg shadow-lg p-2 whitespace-nowrap">
            <p className="text-xs text-gray-700 mb-2">Delete?</p>
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Created Date Tooltip */}
      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-xs text-gray-600 bg-white bg-opacity-90 px-2 py-1 rounded">
          {new Date(artifact.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
