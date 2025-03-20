import React, { useState, useEffect, useCallback } from "react";
import {
  DocumentTextIcon,
  PlusCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  PencilIcon
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
  const [previewName, setPreviewName] = useState("documento.pdf");

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

  // Gerar uma prévia dinâmica com valores de exemplo para cada coluna
  const generateDynamicPreview = useCallback(() => {
    if (!format) return "Digite um formato para ver a prévia";
    
    // Valores de exemplo para diferentes tipos de colunas comuns
    const exampleValues: {[key: string]: string} = {
      nome: "João Silva",
      matricula: "12345",
      cpf: "123.456.789-00",
      data: "2023-01-15",
      cargo: "Analista",
      departamento: "TI",
      extensao: "pdf"
    };
    
    // Para qualquer coluna que não temos valor predefinido, criar um valor genérico
    let result = format;
    const placeholders = format.match(/{([^}]+)}/g) || [];
    
    for (const placeholder of placeholders) {
      const fieldName = placeholder.substring(1, placeholder.length - 1);
      const value = exampleValues[fieldName] || `valor_${fieldName}`;
      result = result.replace(placeholder, value);
    }
    
    return result + (result.includes(".") ? "" : ".pdf");
  }, [format]);

  // Gera modelos recomendados baseados nas colunas disponíveis
  const generateRecommendedModels = useCallback(() => {
    const models = [];
    
    // Verifica colunas comuns para identificar funcionários
    const hasName = availableColumns.some(col => 
      col.toLowerCase().includes('nome') || 
      col.toLowerCase().includes('colaborador'));
      
    const hasId = availableColumns.some(col => 
      col.toLowerCase().includes('id') || 
      col.toLowerCase().includes('matricula') || 
      col.toLowerCase().includes('matrícula'));
      
    const hasCpf = availableColumns.some(col => 
      col.toLowerCase().includes('cpf') || 
      col.toLowerCase().includes('documento'));
      
    const hasCargo = availableColumns.some(col => 
      col.toLowerCase().includes('cargo') || 
      col.toLowerCase().includes('função') || 
      col.toLowerCase().includes('funcao'));
      
    const hasDepartamento = availableColumns.some(col => 
      col.toLowerCase().includes('departamento') || 
      col.toLowerCase().includes('setor') || 
      col.toLowerCase().includes('área') || 
      col.toLowerCase().includes('area'));
      
    const hasData = availableColumns.some(col => 
      col.toLowerCase().includes('data'));

    // Encontra o nome das colunas
    const nameColumn = availableColumns.find(col => 
      col.toLowerCase().includes('nome') || 
      col.toLowerCase().includes('colaborador'));
      
    const idColumn = availableColumns.find(col => 
      col.toLowerCase().includes('id') || 
      col.toLowerCase().includes('matricula') || 
      col.toLowerCase().includes('matrícula'));
      
    const cpfColumn = availableColumns.find(col => 
      col.toLowerCase().includes('cpf') || 
      col.toLowerCase().includes('documento'));
      
    const cargoColumn = availableColumns.find(col => 
      col.toLowerCase().includes('cargo') || 
      col.toLowerCase().includes('função') || 
      col.toLowerCase().includes('funcao'));
      
    const departamentoColumn = availableColumns.find(col => 
      col.toLowerCase().includes('departamento') || 
      col.toLowerCase().includes('setor') || 
      col.toLowerCase().includes('área') || 
      col.toLowerCase().includes('area'));
      
    const dataColumn = availableColumns.find(col => 
      col.toLowerCase().includes('data'));

    // Criar modelos baseados nas colunas encontradas
    if (hasName) {
      models.push({
        name: "Nome do colaborador",
        format: `{${nameColumn}}`,
        description: "João Silva.pdf",
        recommended: true
      });
    }
    
    if (hasName && hasId) {
      models.push({
        name: "Nome - Matrícula",
        format: `{${nameColumn}} - {${idColumn}}`,
        description: "João Silva - 12345.pdf",
        recommended: true,
        priority: 1
      });
      
      models.push({
        name: "Matrícula - Nome",
        format: `{${idColumn}} - {${nameColumn}}`,
        description: "12345 - João Silva.pdf",
        recommended: true
      });
      
      models.push({
        name: "Nome (Matrícula)",
        format: `{${nameColumn}} ({${idColumn}})`,
        description: "João Silva (12345).pdf",
        recommended: true
      });
    }
    
    if (hasName && hasCargo) {
      models.push({
        name: "Nome - Cargo",
        format: `{${nameColumn}} - {${cargoColumn}}`,
        description: "João Silva - Analista.pdf",
        recommended: true
      });
    }
    
    if (hasName && hasDepartamento) {
      models.push({
        name: "Nome - Departamento",
        format: `{${nameColumn}} - {${departamentoColumn}}`,
        description: "João Silva - RH.pdf",
        recommended: true
      });
    }
    
    if (hasId && hasName && hasDepartamento) {
      models.push({
        name: "Completo",
        format: `{${idColumn}} - {${nameColumn}} - {${departamentoColumn}}`,
        description: "12345 - João Silva - RH.pdf",
        recommended: true
      });
    }
    
    if (hasCpf && hasName) {
      models.push({
        name: "CPF - Nome",
        format: `{${cpfColumn}} - {${nameColumn}}`,
        description: "123.456.789-00 - João Silva.pdf",
        recommended: true
      });
    }
    
    if (hasData && hasName) {
      models.push({
        name: "Data - Nome",
        format: `{${dataColumn}} - {${nameColumn}}`,
        description: "2023-01-15 - João Silva.pdf",
        recommended: true
      });
    }
    
    // Se não encontrou modelos específicos, cria alguns modelos básicos com as primeiras 2-3 colunas
    if (models.length === 0 && availableColumns.length > 0) {
      if (availableColumns.length >= 1) {
        models.push({
          name: `${availableColumns[0]}`,
          format: `{${availableColumns[0]}}`,
          description: `Usando ${availableColumns[0]}.pdf`,
          recommended: false
        });
      }
      
      if (availableColumns.length >= 2) {
        models.push({
          name: `${availableColumns[0]} - ${availableColumns[1]}`,
          format: `{${availableColumns[0]}} - {${availableColumns[1]}}`,
          description: `Combina ${availableColumns[0]} e ${availableColumns[1]}.pdf`,
          recommended: false
        });
      }
      
      if (availableColumns.length >= 3) {
        models.push({
          name: `Combinação de três campos`,
          format: `{${availableColumns[0]}} - {${availableColumns[1]}} - {${availableColumns[2]}}`,
          description: `Combina três campos.pdf`,
          recommended: false
        });
      }
    }
    
    // Ordena os modelos para que os prioritários apareçam primeiro
    models.sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      if (a.priority && b.priority) return a.priority - b.priority;
      return 0;
    });
    
    return models;
  }, [availableColumns]);

  // Exemplos de formatos
  const formatExamples = generateRecommendedModels();

  return (
    <div className="space-y-4">
      {/* Modelos recomendados (mostrados primeiro) */}
      {formatExamples.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-sm">
          <div className="p-3 border-b border-slate-700">
            <h3 className="text-sm font-medium text-slate-200 flex items-center">
              <SparklesIcon className="w-4 h-4 text-yellow-400 mr-2" />
              Modelos recomendados
            </h3>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {formatExamples.map((example, index) => (
                <div
                  key={index}
                  className={`border ${example.recommended ? 'border-blue-600 bg-blue-900/20' : 'border-slate-600'} rounded p-2 hover:bg-slate-700 cursor-pointer transition-colors`}
                  onClick={() => setFormat(example.format)}
                >
                  <h4 className="font-medium text-slate-300 text-xs">
                    {example.name}
                  </h4>
                  <p className="text-xs text-blue-400 font-mono mt-1">
                    {example.format}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {example.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center">
            <DocumentTextIcon className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-slate-200">
              Formato de renomeação
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-slate-400 hover:text-slate-300 flex items-center"
          >
            {showHelp ? "Ocultar ajuda" : "Ajuda"} <InformationCircleIcon className="w-4 h-4 ml-1" />
          </button>
        </div>

        {showHelp && (
          <div className="p-3 bg-slate-700 border-b border-slate-600">
            <div className="flex items-center text-sm text-slate-300 mb-2">
              <InformationCircleIcon className="w-4 h-4 text-blue-400 mr-1" /> 
              Escolha um dos modelos acima ou crie seu próprio formato
            </div>
            <div className="bg-slate-800 p-2 rounded border border-slate-600">
              <div className="text-xs">
                <p className="text-slate-300 mb-1">Exemplo: escolher <span className="text-blue-400">{"{nome}"} - {"{matricula}"}</span> resulta em <span className="text-green-400">João Silva - 12345.pdf</span></p>
              </div>
            </div>
          </div>
        )}

        <div className="p-3">
          <div className="mb-3">
            <label
              htmlFor="formatInput"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Digite o formato:
            </label>
            <div className="flex mb-2 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PencilIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                id="formatInput"
                value={format}
                onChange={handleFormatChange}
                placeholder="Escolha um modelo acima ou digite aqui"
                className="flex-1 block w-full rounded-md border border-slate-500 bg-slate-700 text-white text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-slate-600 focus:outline-none cursor-text pl-9 pr-3 py-2 transition-colors"
                style={{caretColor: 'white'}}
              />
            </div>
            <div className="p-2 bg-slate-700 rounded border border-slate-600">
              <p className="text-xs text-slate-300">Prévia: <span className="font-mono text-sm text-white">{generateDynamicPreview()}</span></p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Adicionar campos:
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColumns.map((column) => (
                <button
                  key={column}
                  type="button"
                  onClick={() => addPlaceholder(column)}
                  className="inline-flex items-center px-2 py-1 border border-slate-600 text-xs font-medium rounded text-slate-300 bg-slate-700 hover:bg-slate-600"
                >
                  <PlusCircleIcon className="w-3 h-3 mr-1 text-blue-400" />
                  {column}
                </button>
              ))}
              <button
                type="button"
                onClick={() => addPlaceholder("extensao")}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircleIcon className="w-3 h-3 mr-1" />
                extensao
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormatConfigurator;
