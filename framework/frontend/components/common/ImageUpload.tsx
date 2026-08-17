import React, { useState, useRef, useCallback } from 'react';
import './ImageUpload.css';

export interface ImageUploadProps {
  value?: string;
  onChange: (imageData: string) => void;
  onError?: (error: string) => void;
  onUpload?: (file: File) => Promise<string>;
  maxSize?: number;
  acceptedTypes?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onError,
  onUpload,
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  placeholder = 'Drag and drop an image here, or click to select',
  disabled = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please use: ${acceptedTypes.join(', ')}`;
    }

    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size too large. Maximum size is ${maxSize}MB`;
    }

    return null;
  };

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onError?.(validationError);
      return;
    }

    setIsUploading(true);

    try {
      if (onUpload) {
        const uploadedUrl = await onUpload(file);
        onChange(uploadedUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onChange(result);
          setIsUploading(false);
        };
        reader.onerror = () => {
          onError?.('Failed to read file');
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }
      setIsUploading(false);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to process image');
      setIsUploading(false);
    }
  }, [onChange, onError, onUpload, maxSize, acceptedTypes]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  }, [onChange]);

  const hasImage = value && value.trim() !== '';

  return (
    <div className={`image-upload ${className}`}>
      <div
        className={`image-upload__dropzone ${
          isDragging ? 'image-upload__dropzone--dragging' : ''
        } ${disabled ? 'image-upload__dropzone--disabled' : ''} ${
          hasImage ? 'image-upload__dropzone--has-image' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="image-upload__input"
          disabled={disabled}
          aria-label="Upload image file"
          title="Upload image file"
        />

        {isUploading ? (
          <div className="image-upload__loading">
            <div className="image-upload__spinner"></div>
            <p>Uploading image...</p>
          </div>
        ) : hasImage ? (
          <div className="image-upload__preview">
            <img
              src={value}
              alt="Preview"
              className="image-upload__image"
            />
            <div className="image-upload__overlay">
              <button
                type="button"
                className="image-upload__remove"
                onClick={handleRemove}
                disabled={disabled}
              >
                ✕
              </button>
              <p className="image-upload__change-text">
                Click or drag to change image
              </p>
            </div>
          </div>
        ) : (
          <div className="image-upload__placeholder">
            <div className="image-upload__icon">📷</div>
            <p className="image-upload__text">{placeholder}</p>
            <p className="image-upload__hint">
              Supported formats: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
              <br />
              Maximum size: {maxSize}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
