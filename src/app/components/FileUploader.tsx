import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  ArrowUpTrayIcon,
  XMarkIcon,
  DocumentIcon,
  TableCellsIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, ...acceptedFiles];
        setTimeout(() => {
          onFilesUploaded(updatedFiles);
        }, 0);
        return updatedFiles;
      });
    },
    [onFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const onReferenceFileDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setReferenceFile(acceptedFiles[0]);
        setTimeout(() => {
          onReferenceFileUploaded(acceptedFiles[0]);
        }, 0);
      }
    },
    [onReferenceFileUploaded]
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
        setTimeout(() => {
          onFilesUploaded(newFiles);
        }, 0);
        return newFiles;
      });
    },
    [onFilesUploaded]
  );

  const removeReferenceFile = useCallback(() => {
    setReferenceFile(null);
    setTimeout(() => {
      onReferenceFileUploaded(null as unknown as File);
    }, 0);
  }, [onReferenceFileUploaded]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Área de upload do arquivo de referência */}
        <div className="flex flex-col h-full">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <TableCellsIcon className="w-5 h-5 mr-1 text-blue-500" />
            Arquivo de referência
            {referenceFile && (
              <span className="ml-2 text-green-500 flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                <span className="text-xs">Carregado</span>
              </span>
            )}
          </div>
          <div
            {...getReferenceRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer flex-1 flex flex-col justify-center ${
              isReferenceDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : referenceFile
                ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                : "border-slate-700 hover:bg-slate-700 hover:border-slate-600"
            }`}
          >
            <input {...getReferenceInputProps()} />
            <TableCellsIcon
              className={`w-12 h-12 mx-auto ${
                referenceFile ? "text-green-500" : "text-gray-400"
              }`}
            />
            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {referenceFile
                ? "Trocar arquivo de referência"
                : "Excel ou CSV com dados de referência"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {referenceFile
                ? `${referenceFile.name} (${(referenceFile.size / 1024).toFixed(
                    2
                  )} KB)`
                : "Este arquivo deve conter as colunas para renomeação"}
            </p>
          </div>
        </div>

        {/* Área de upload dos arquivos a serem renomeados */}
        <div className="flex flex-col h-full">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <DocumentDuplicateIcon className="w-5 h-5 mr-1 text-indigo-500" />
            Arquivos para renomear
            {files.length > 0 && (
              <span className="ml-2 text-indigo-500 flex items-center">
                <span className="text-xs">{files.length} arquivo(s)</span>
              </span>
            )}
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer flex-1 flex flex-col justify-center ${
              isDragActive
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : files.length > 0
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10"
                : "border-slate-700 hover:bg-slate-700 hover:border-slate-600"
            }`}
          >
            <input {...getInputProps()} />
            <DocumentDuplicateIcon
              className={`w-12 h-12 mx-auto ${
                files.length > 0 ? "text-indigo-500" : "text-gray-400"
              }`}
            />
            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {files.length > 0
                ? "Adicionar mais arquivos"
                : "Arraste e solte arquivos aqui"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {files.length > 0
                ? `${files.length} arquivo(s) selecionado(s)`
                : "Ou clique para selecionar os arquivos que deseja renomear"}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-800 border-b border-slate-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <DocumentIcon className="w-4 h-4 mr-1 text-gray-500" />
              Arquivos a serem renomeados ({files.length})
            </h3>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <li key={index} className="p-3 hover:bg-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <DocumentIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 truncate">
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Remover arquivo"
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
