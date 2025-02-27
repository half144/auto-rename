"use client";

import React, { useState, useCallback, useEffect } from "react";
import FileUploader from "./components/FileUploader";
import FormatConfigurator from "./components/FormatConfigurator";
import ProcessFiles from "./components/ProcessFiles";
import ReferenceColumnSelector from "./components/ReferenceColumnSelector";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [format, setFormat] = useState("");
  const [matchColumn, setMatchColumn] = useState("");
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  const handleFilesUploaded = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
  }, []);

  const handleReferenceFileUploaded = useCallback((file: File) => {
    setReferenceFile(file);
  }, []);

  const handleFormatChange = useCallback((newFormat: string) => {
    setFormat(newFormat);
  }, []);

  const handleMatchColumnChange = useCallback((column: string) => {
    setMatchColumn(column);
  }, []);

  const handleAvailableColumnsChange = useCallback((columns: string[]) => {
    setAvailableColumns(columns);
  }, []);

  // Não vamos mais definir um formato inicial automaticamente
  // O usuário deverá selecionar os campos desejados

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Renomeador Automático de Arquivos
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Envie seu arquivo de referência e os arquivos que deseja renomear
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              1. Selecione os arquivos
            </h2>
            <FileUploader
              onFilesUploaded={handleFilesUploaded}
              onReferenceFileUploaded={handleReferenceFileUploaded}
              acceptedReferenceFormats={[
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "text/csv",
              ]}
            />
          </div>

          {referenceFile && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                2. Configure a correspondência
              </h2>
              <ReferenceColumnSelector
                referenceFile={referenceFile}
                onMatchColumnChange={handleMatchColumnChange}
                onAvailableColumnsChange={handleAvailableColumnsChange}
              />
            </div>
          )}

          {referenceFile && availableColumns.length > 0 && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                3. Configure o formato de renomeação
              </h2>
              <FormatConfigurator
                onFormatChange={handleFormatChange}
                initialFormat=""
                availableColumns={availableColumns}
              />
            </div>
          )}

          {referenceFile &&
            availableColumns.length > 0 &&
            matchColumn &&
            format && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  4. Processar arquivos
                </h2>
                <ProcessFiles
                  files={files}
                  referenceFile={referenceFile}
                  format={format}
                  matchColumn={matchColumn}
                />
              </div>
            )}

          {(!referenceFile || availableColumns.length === 0) && (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 italic">
                Carregue um arquivo de referência para continuar com a
                configuração.
              </p>
            </div>
          )}

          {referenceFile &&
            availableColumns.length > 0 &&
            matchColumn &&
            !format && (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Configure o formato de renomeação para visualizar a prévia dos
                  arquivos.
                </p>
              </div>
            )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Desenvolvido com ❤️ para facilitar sua vida</p>
        </div>
      </div>
    </div>
  );
}
