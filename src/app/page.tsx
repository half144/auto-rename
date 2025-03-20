"use client";

import React, { useState, useCallback } from "react";
import FileUploader from "./components/FileUploader";
import FormatConfigurator from "./components/FormatConfigurator";
import ProcessFiles from "./components/ProcessFiles";
import ReferenceColumnSelector from "./components/ReferenceColumnSelector";
import {
  CheckCircleIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/solid";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [format, setFormat] = useState("");
  const [matchColumn, setMatchColumn] = useState("");
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1]);

  const handleFilesUploaded = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
  }, []);

  const handleReferenceFileUploaded = useCallback((file: File) => {
    if (file) {
      setReferenceFile(file);
    } else {
      setReferenceFile(null);
      setActiveStep(1);
      setExpandedSteps([1]);
    }
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

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return !!referenceFile && files.length > 0;
      case 3:
        return !!matchColumn && availableColumns.length > 0;
      case 4:
        return !!format;
      default:
        return false;
    }
  };

  const handleStepChange = (step: number) => {
    if (step >= 1 && step <= 4 && canProceedToStep(step)) {
      setActiveStep(step);
      setExpandedSteps([step]);
    }
  };

  const toggleStep = (stepNumber: number) => {
    if (stepNumber <= activeStep) {
      setExpandedSteps(prev => 
        prev.includes(stepNumber) 
          ? prev.filter(step => step !== stepNumber)
          : [...prev, stepNumber]
      );
    }
  };

  const renderStepIndicator = (stepNumber: number, title: string) => {
    const isActive = activeStep >= stepNumber;
    const isCompleted = activeStep > stepNumber;
    const isExpanded = expandedSteps.includes(stepNumber);
    const canProceed = canProceedToStep(stepNumber);

    return (
      <div 
        className={`flex items-center ${canProceed ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
        onClick={() => canProceed && handleStepChange(stepNumber)}
      >
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isActive ? "bg-blue-600 text-white" : canProceed ? "bg-slate-700 text-slate-400" : "bg-slate-800 text-slate-500"
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
            isActive ? "text-slate-200 font-medium" : canProceed ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {title}
        </span>
        {isActive && (
          <div className="ml-2">
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderNavigationButtons = (currentStep: number) => {
    return (
      <div className="flex justify-between mt-6">
        {currentStep > 1 && (
          <button
            onClick={() => handleStepChange(currentStep - 1)}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-200 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Anterior
          </button>
        )}
        {currentStep < 4 && canProceedToStep(currentStep + 1) && (
          <button
            onClick={() => handleStepChange(currentStep + 1)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors ml-auto"
          >
            Próximo
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex justify-center items-center mb-2">
            <DocumentDuplicateIcon className="h-12 w-12 text-blue-500" />
            <span className="text-blue-400 text-4xl ml-2 font-bold">RC</span>
            <span className="text-blue-600 text-4xl font-bold">Docs</span>
          </div>

          <p className="mt-3 text-center text-xl text-slate-400 max-w-2xl mx-auto">
            Simplifique o processo de renomeação de arquivos em massa com base
            em dados de referência
          </p>
        </div>

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

        <div
          className={`transition-all duration-300 overflow-hidden ${
            !expandedSteps.includes(1) ? 'max-h-0' : 'max-h-[2000px]'
          }`}
        >
          <div className={`p-6 border-b border-slate-700 bg-slate-800 ${
            activeStep > 1 ? "bg-slate-800/80" : ""
          }`}>
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
            {renderNavigationButtons(1)}
          </div>
        </div>

        {referenceFile && (
          <div
            className={`transition-all duration-300 overflow-hidden ${
              !expandedSteps.includes(2) ? 'max-h-0' : 'max-h-[2000px]'
            }`}
          >
            <div className={`p-6 border-b border-slate-700 ${
              activeStep > 2 ? "bg-slate-800/80" : "bg-slate-800"
            }`}>
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
              {renderNavigationButtons(2)}
            </div>
          </div>
        )}

        {matchColumn && availableColumns.length > 0 && (
          <div
            className={`transition-all duration-300 overflow-hidden ${
              !expandedSteps.includes(3) ? 'max-h-0' : 'max-h-[2000px]'
            }`}
          >
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
              {renderNavigationButtons(3)}
            </div>
          </div>
        )}

        {referenceFile && availableColumns.length > 0 && matchColumn && format && (
          <div
            className={`transition-all duration-300 overflow-hidden ${
              !expandedSteps.includes(4) ? 'max-h-0' : 'max-h-[2000px]'
            }`}
          >
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
              {renderNavigationButtons(4)}
            </div>
          </div>
        )}

        {(!referenceFile || availableColumns.length === 0) && (
          <div className="p-6 text-center bg-slate-800/50">
            <p className="text-blue-400">
              Carregue um arquivo de referência para continuar com a configuração.
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-slate-400">
            Desenvolvido com ❤️ para facilitar sua vida
          </p>
        </div>
      </div>
    </div>
  );
}
