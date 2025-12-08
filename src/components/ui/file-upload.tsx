'use client';

import { useRef, useState, useCallback } from 'react';
import { Button } from './button';
import { EVIDENCE_CATEGORIES, MAX_FILE_SIZE } from '@/lib/validations/evidence';

export interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  file: File;
}

export interface FileUploadProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function FileUpload({
  files,
  onChange,
  maxFiles = 10,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not supported. Please upload PDF, images, CSV, or Excel files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds the maximum size of 10MB.`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;

      setError(null);
      const newFiles: UploadedFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const validationError = validateFile(file);

        if (validationError) {
          setError(validationError);
          continue;
        }

        if (files.length + newFiles.length >= maxFiles) {
          setError(`Maximum ${maxFiles} files allowed.`);
          break;
        }

        newFiles.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          category: 'general',
          file,
        });
      }

      if (newFiles.length > 0) {
        onChange([...files, ...newFiles]);
      }
    },
    [files, onChange, maxFiles, disabled]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    onChange(files.filter((f) => f.id !== fileId));
  };

  const updateCategory = (fileId: string, category: string) => {
    onChange(
      files.map((f) => (f.id === fileId ? { ...f, category } : f))
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed p-6 text-center transition-colors ${
          dragActive
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        <div className="space-y-2">
          <div className="text-4xl">+</div>
          <p className="text-sm font-medium">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            PDF, Images, CSV, Excel (max 10MB per file)
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 border p-3 rounded-md"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.fileName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatFileSize(file.fileSize)}
                </p>
              </div>
              <select
                value={file.category}
                onChange={(e) => updateCategory(file.id, e.target.value)}
                className="text-sm border rounded px-2 py-1"
                disabled={disabled}
              >
                {EVIDENCE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id)}
                disabled={disabled}
              >
                X
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
