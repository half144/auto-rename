import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface FileUploaderProps {
  onFilesUploaded: (files: File[]) => void;
  onReferenceFileUploaded: (file: File) => void;
  acceptedReferenceFormats: string[];
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUploaded,
  onReferenceFileUploaded,
  acceptedReferenceFormats,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);

  const handleFilesUploaded = useCallback(
    (newFiles: File[]) => {
      onFilesUploaded(newFiles);
    },
    [onFilesUploaded]
  );

  const handleReferenceFileUploaded = useCallback(
    (file: File) => {
      onReferenceFileUploaded(file);
    },
    [onReferenceFileUploaded]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, ...acceptedFiles];
        handleFilesUploaded(updatedFiles);
        return updatedFiles;
      });
    },
    [handleFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const onReferenceFileDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setReferenceFile(acceptedFiles[0]);
        handleReferenceFileUploaded(acceptedFiles[0]);
      }
    },
    [handleReferenceFileUploaded]
  );

  const {
    getRootProps: getReferenceRootProps,
    getInputProps: getReferenceInputProps,
    isDragActive: isReferenceDragActive,
  } = useDropzone({
    onDrop: onReferenceFileDrop,
    accept: acceptedReferenceFormats.reduce((acc, format) => {
      acc[format] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: 1,
  });

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        newFiles.splice(index, 1);
        handleFilesUploaded(newFiles);
        return newFiles;
      });
    },
    [handleFilesUploaded]
  );

  const removeReferenceFile = useCallback(() => {
    setReferenceFile(null);
    handleReferenceFileUploaded(null as unknown as File);
  }, [handleReferenceFileUploaded]);

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }`}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Arraste e solte arquivos aqui, ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Adicione os arquivos que deseja renomear
        </p>
      </div>

      <div
        {...getReferenceRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isReferenceDragActive
            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
            : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }`}
      >
        <input {...getReferenceInputProps()} />
        <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Arquivo de referência (Excel ou CSV)
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Adicione o arquivo com as colunas de nome e matrícula
        </p>
      </div>

      {(files.length > 0 || referenceFile) && (
        <div className="mt-6 space-y-4">
          {referenceFile && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Arquivo de referência:
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {referenceFile.name} (
                      {(referenceFile.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeReferenceFile}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Arquivos a serem renomeados ({files.length})
          </h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {files.map((file, index) => (
              <li key={index} className="p-3 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1 truncate">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
