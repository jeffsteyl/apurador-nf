import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon } from './icons/UploadCloudIcon';

interface FileUploaderProps {
  onFileUpload: (files: FileList | File[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

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
    if (e.dataTransfer.files?.length) {
      onFileUpload(Array.from(e.dataTransfer.files));
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileUpload(Array.from(e.target.files));
    }
  };

  const dragDropClasses = isDragging 
    ? 'border-brand-primary bg-base-200/50 scale-105' 
    : 'border-base-300 bg-base-200 hover:border-brand-secondary';

  return (
    <div className="flex items-center justify-center p-4">
      <div 
        onClick={() => fileInputRef.current?.click()} 
        onDragEnter={handleDragEnter} 
        onDragLeave={handleDragLeave} 
        onDragOver={handleDragOver} 
        onDrop={handleDrop} 
        className={`relative w-full max-w-2xl p-10 border-2 border-dashed rounded-xl text-center transition-all duration-300 cursor-pointer ${dragDropClasses}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          onChange={handleFileChange} 
          accept=".xml,.zip" 
          multiple 
          {...({
            webkitdirectory: "",
            mozdirectory: "",
            directory: ""
          } as any)}
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <UploadCloudIcon />
          <p className="text-xl font-semibold">Arraste e solte seus arquivos, pastas ou um arquivo .zip aqui</p>
          <p className="text-gray-400">ou</p>
          <span className="px-6 py-2 bg-brand-primary text-white rounded-md font-semibold transition-transform hover:scale-105">
            Selecione arquivos ou uma pasta
          </span>
          <p className="text-xs text-gray-500 mt-2">Arquivos .xml e .zip são aceitos</p>
        </div>
      </div>
    </div>
  );
};
