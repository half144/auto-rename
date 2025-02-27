"use client";

import React, { useState, useCallback, useEffect } from "react";
import FileUploader from "./components/FileUploader";
import FormatConfigurator from "./components/FormatConfigurator";
import ProcessFiles from "./components/ProcessFiles";
import ReferenceColumnSelector from "./components/ReferenceColumnSelector";
import {
  CheckCircleIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [format, setFormat] = useState("");
  const [matchColumn, setMatchColumn] = useState("");
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(1);

  const handleFilesUploaded = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
  }, []);

  const handleReferenceFileUploaded = useCallback((file: File) => {
    if (file) {
      setReferenceFile(file);
      setTimeout(() => {
        setActiveStep(2);
      }, 100);
    } else {
      setReferenceFile(null);
      setActiveStep(1);
    }
  }, []);

  const handleFormatChange = useCallback(
    (newFormat: string) => {
      setFormat(newFormat);
      if (newFormat && matchColumn) {
        setTimeout(() => {
          setActiveStep(4);
        }, 100);
      }
    },
    [matchColumn]
  );

  const handleMatchColumnChange = useCallback(
    (column: string) => {
      setMatchColumn(column);
      if (column && availableColumns.length > 0) {
        setTimeout(() => {
          setActiveStep(3);
        }, 100);
      }
    },
    [availableColumns]
  );

  const handleAvailableColumnsChange = useCallback((columns: string[]) => {
    setAvailableColumns(columns);
  }, []);

  const renderStepIndicator = (stepNumber: number, title: string) => {
    const isActive = activeStep >= stepNumber;
    const isCompleted = activeStep > stepNumber;

    return (
      <div className="flex items-center">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isActive ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400"
          }`}
        >
          {isCompleted ? (
            <CheckCircleIcon className="w-6 h-6" />
          ) : (
            <span>{stepNumber}</span>
          )}
        </div>
        <span
          className={`ml-2 ${
            isActive ? "text-slate-200 font-medium" : "text-slate-400"
          }`}
        >
          {title}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex justify-center items-center mb-2">
            <DocumentDuplicateIcon className="h-12 w-12 text-blue-500" />
            <span className="text-blue-400 text-4xl ml-2 font-bold">Name</span>
            <span className="text-blue-600 text-4xl font-bold">It</span>
          </div>

          <p className="mt-3 text-center text-xl text-slate-400 max-w-2xl mx-auto">
            Simplifique o processo de renomeação de arquivos em massa com base
            em dados de referência
          </p>
        </div>

        {/* Indicador de progresso */}
        <div className="mb-8 max-w-3xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {renderStepIndicator(1, "Arquivos")}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRightIcon className="w-4 h-4 text-slate-400" />
            </div>
            {renderStepIndicator(2, "Correspondência")}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRightIcon className="w-4 h-4 text-slate-400" />
            </div>
            {renderStepIndicator(3, "Formato")}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRightIcon className="w-4 h-4 text-slate-400" />
            </div>
            {renderStepIndicator(4, "Processar")}
          </div>
        </div>

        <div className="shadow-lg rounded-xl overflow-hidden">
          {/* Etapa 1: Seleção de arquivos */}
          <div
            className={`p-6 border-b border-slate-700 bg-slate-800 ${
              activeStep > 1 ? "bg-slate-800/80" : ""
            }`}
          >
            <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white mr-3 text-sm">
                1
              </span>
              Selecione os arquivos
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

          {/* Etapa 2: Configuração de correspondência */}
          {referenceFile && (
            <div
              className={`p-6 border-b border-slate-700 ${
                activeStep > 2 ? "bg-slate-800/80" : "bg-slate-800"
              }`}
            >
              <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white mr-3 text-sm">
                  2
                </span>
                Configure a correspondência
              </h2>
              <ReferenceColumnSelector
                referenceFile={referenceFile}
                onMatchColumnChange={handleMatchColumnChange}
                onAvailableColumnsChange={handleAvailableColumnsChange}
              />
            </div>
          )}

          {/* Etapa 3: Configuração de formato */}
          {referenceFile && availableColumns.length > 0 && (
            <div className="p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white mr-3 text-sm">
                  3
                </span>
                Configure o formato de renomeação
              </h2>
              <FormatConfigurator
                onFormatChange={handleFormatChange}
                initialFormat=""
                availableColumns={availableColumns}
              />
            </div>
          )}

          {/* Etapa 4: Processamento de arquivos */}
          {referenceFile &&
            availableColumns.length > 0 &&
            matchColumn &&
            format && (
              <div className="p-6 bg-slate-800">
                <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white mr-3 text-sm">
                    4
                  </span>
                  Processar arquivos
                </h2>
                <ProcessFiles
                  files={files}
                  referenceFile={referenceFile}
                  format={format}
                  matchColumn={matchColumn}
                />
              </div>
            )}

          {/* Mensagens de orientação */}
          {(!referenceFile || availableColumns.length === 0) && (
            <div className="p-6 text-center bg-slate-800/50">
              <p className="text-blue-400">
                Carregue um arquivo de referência para continuar com a
                configuração.
              </p>
            </div>
          )}

          {referenceFile &&
            availableColumns.length > 0 &&
            matchColumn &&
            !format && (
              <div className="p-6 text-center bg-slate-800/50">
                <p className="text-blue-400">
                  Configure o formato de renomeação para visualizar a prévia dos
                  arquivos.
                </p>
              </div>
            )}
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-400">
            Desenvolvido com ❤️ para facilitar sua vida
          </p>
        </div>
      </div>
    </div>
  );
}
