import React, { useState, useEffect, useCallback } from "react";
import {
  DocumentTextIcon,
  PlusCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface FormatConfiguratorProps {
  onFormatChange: (format: string) => void;
  initialFormat?: string;
  availableColumns: string[];
}

const FormatConfigurator: React.FC<FormatConfiguratorProps> = ({
  onFormatChange,
  initialFormat = "",
  availableColumns = [],
}) => {
  const [format, setFormat] = useState(initialFormat);
  const [showHelp, setShowHelp] = useState(false);

  // Atualizar o formato quando o initialFormat mudar
  useEffect(() => {
    setFormat(initialFormat);
  }, [initialFormat]);

  const handleFormatChangeCallback = useCallback(
    (newFormat: string) => {
      onFormatChange(newFormat);
    },
    [onFormatChange]
  );

  useEffect(() => {
    handleFormatChangeCallback(format);
  }, [format, handleFormatChangeCallback]);

  const handleFormatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormat(e.target.value);
    },
    []
  );

  const addPlaceholder = useCallback((placeholder: string) => {
    setFormat((prevFormat) => {
      const input = document.getElementById("formatInput") as HTMLInputElement;
      if (input) {
        const startPos = input.selectionStart || prevFormat.length;
        const endPos = input.selectionEnd || prevFormat.length;
        const beforeText = prevFormat.substring(0, startPos);
        const afterText = prevFormat.substring(endPos);
        return `${beforeText}{${placeholder}}${afterText}`;
      }
      return `${prevFormat}{${placeholder}}`;
    });
  }, []);

  // Exemplos de formatos
  const formatExamples = [
    {
      name: "Nome - Matrícula",
      format: "{nome} - {matricula}",
      description: "Ex: João Silva - 12345",
    },
    {
      name: "Matrícula_Nome",
      format: "{matricula}_{nome}",
      description: "Ex: 12345_JoãoSilva",
    },
    {
      name: "Data - Nome",
      format: "{data} - {nome}",
      description: "Ex: 2023-01-01 - João Silva",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center">
            <DocumentTextIcon className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Formato de renomeação
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
        </div>

        {showHelp && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-blue-700 dark:text-blue-400 text-sm mb-2">
              Como funciona:
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Digite o formato desejado para os nomes dos arquivos. Use{" "}
              {"{coluna}"} para inserir valores das colunas do arquivo de
              referência.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Exemplo: Para um arquivo com nome "documento.pdf" e uma linha na
              planilha com nome "João" e matrícula "12345", o formato{" "}
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                {"{matricula}"}_{"{nome}"}
              </span>{" "}
              resultará em "12345_João.pdf"
            </p>
          </div>
        )}

        <div className="p-4">
          <div className="mb-4">
            <label
              htmlFor="formatInput"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Digite o formato:
            </label>
            <div className="flex">
              <input
                type="text"
                id="formatInput"
                value={format}
                onChange={handleFormatChange}
                placeholder="Ex: {nome} - {matricula}"
                className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {format
                ? `Prévia: ${format.replace(/{([^}]+)}/g, "valor_da_$1")}`
                : "Digite um formato para ver a prévia"}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Colunas disponíveis:
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColumns.map((column) => (
                <button
                  key={column}
                  type="button"
                  onClick={() => addPlaceholder(column)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircleIcon className="w-4 h-4 mr-1 text-blue-500" />
                  {column}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exemplos de formato */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-800 border-b border-slate-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Exemplos de formato
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formatExamples.map((example, index) => (
              <div
                key={index}
                className="border border-slate-700 rounded-lg p-3 hover:bg-slate-700 cursor-pointer"
                onClick={() => setFormat(example.format)}
              >
                <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                  {example.name}
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-1">
                  {example.format}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {example.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormatConfigurator;
