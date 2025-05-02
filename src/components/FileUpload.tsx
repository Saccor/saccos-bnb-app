'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  existingImages?: string[];
  onRemoveExisting?: (index: number) => void;
}

export default function FileUpload({ 
  onFileSelect, 
  maxFiles = 5,
  existingImages = [],
  onRemoveExisting
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = Array.from(e.target.files || []);
    
    // Check if adding these files would exceed max files
    if (files.length + selectedFiles.length + existingImages.length > maxFiles) {
      setError(`Du kan inte ladda upp mer än ${maxFiles} bilder totalt.`);
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Endast bildfiler är tillåtna.');
        return false;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Bilder får inte vara större än 5MB.');
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Create previews for valid files
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    onFileSelect([...selectedFiles, ...validFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    // Release object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onFileSelect(newFiles);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={selectedFiles.length + existingImages.length >= maxFiles}
        >
          Ladda upp bilder
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Klicka för att ladda upp bilder (max {maxFiles} st, max 5MB per bild)
        </p>
      </div>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      
      {(existingImages.length > 0 || previews.length > 0) && (
        <div>
          <h3 className="font-medium mb-2">Valda bilder:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Existing images */}
            {existingImages.map((src, i) => (
              <div key={`existing-${i}`} className="relative">
                <div className="relative h-32 w-full rounded overflow-hidden">
                  <Image 
                    src={src} 
                    alt={`Existing image ${i + 1}`} 
                    fill 
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            {/* New image previews */}
            {previews.map((src, i) => (
              <div key={`preview-${i}`} className="relative">
                <div className="relative h-32 w-full rounded overflow-hidden">
                  <Image 
                    src={src} 
                    alt={`Preview ${i + 1}`} 
                    fill 
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-sm text-gray-500">
        {selectedFiles.length + existingImages.length} av {maxFiles} bilder valda
      </p>
    </div>
  );
} 