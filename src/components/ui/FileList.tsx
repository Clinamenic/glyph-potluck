// FileList component
import type { UploadedFile } from '@/types';

interface FileListProps {
  files: UploadedFile[];
  onRemove: (fileId: string) => void;
}

export function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {/* File preview */}
          <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border">
            <img
              src={file.dataUrl}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              {file.name}
            </h4>
            <p className="text-sm text-gray-500">
              {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
            </p>
            <p className="text-xs text-gray-400">
              Uploaded {file.uploaded.toLocaleTimeString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRemove(file.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
