import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  Row,
  Cell,
  Header,
  Table
} from "@tanstack/react-table";
import {
  TableCellsIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface ReferenceColumnSelectorProps {
  referenceFile: File | null;
  onMatchColumnChange: (column: string) => void;
  onAvailableColumnsChange: (columns: string[]) => void;
}

type DataType = Record<string, any>;

const ReferenceColumnSelector: React.FC<ReferenceColumnSelectorProps> = ({
  referenceFile,
  onMatchColumnChange,
  onAvailableColumnsChange,
}) => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<DataType[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const possibleMatchColumns = useMemo(() => [
    // Identificadores numéricos
    "id",
    "matricula",
    "matrícula",
    "código",
    "codigo",
    "registro",
    "identificador",
    "chave",
    "número",
    "numero",
    // Identificadores de nome
    "nome",
    "name",
    "nome completo",
    "nome_completo",
    "nomecompleto",
    "fullname",
    "full_name",
    "full name",
    // CPF e outros documentos
    "cpf",
    "rg",
    "documento",
    "document",
    // Email como identificador
    "email",
    "e-mail",
    "correio",
    // Outros identificadores comuns
    "user",
    "usuario",
    "usuário",
    "login",
  ], []);

  const tableColumns = useMemo(() => {
    if (columns.length === 0) return [];

    const columnHelper = createColumnHelper<DataType>();

    return columns.map((column) =>
      columnHelper.accessor(column, {
        header: () => (
          <div className="flex items-center">
            <span className="font-medium">{column}</span>
            {column === selectedColumn && (
              <CheckCircleIcon className="w-4 h-4 ml-1 text-green-500" />
            )}
          </div>
        ),
        cell: (info) => (
          <div
            className={`${
              column === selectedColumn
                ? "font-medium text-blue-600 dark:text-blue-400"
                : ""
            }`}
          >
            {info.getValue()?.toString() || ""}
          </div>
        ),
      })
    );
  }, [columns, selectedColumn]);

  const table = useReactTable({
    data: previewData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const findBestMatchColumn = useCallback((columnNames: string[]) => {
    // Primeiro, procura por correspondência exata
    const exactMatch = columnNames.find(col => 
      possibleMatchColumns.includes(col.toLowerCase())
    );
    if (exactMatch) return exactMatch;

    // Se não encontrar correspondência exata, procura por correspondência parcial
    const partialMatch = columnNames.find(col => 
      possibleMatchColumns.some(possible => 
        col.toLowerCase().includes(possible.toLowerCase())
      )
    );
    if (partialMatch) return partialMatch;

    // Se não encontrar nenhuma correspondência, retorna a primeira coluna
    return columnNames[0];
  }, [possibleMatchColumns]);

  const readExcelFile = async (file: File): Promise<DataType[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Falha ao ler o arquivo."));
            return;
          }

          const workbook = XLSX.read(data, {
            type: file.name.endsWith(".csv") ? "binary" : "array",
            cellDates: true,
            cellNF: false,
            cellText: false
          });

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,
            defval: "",
            blankrows: false
          });

          resolve(jsonData as DataType[]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Erro ao ler o arquivo."));
      };

      if (file.name.endsWith(".csv")) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  useEffect(() => {
    if (!referenceFile) return;

    let isMounted = true;
    setIsLoading(true);

    const loadReferenceFile = async () => {
      try {
        const data = await readExcelFile(referenceFile);
        if (!isMounted) return;

        if (data && data.length > 0) {
          const columnNames = Object.keys(data[0]);
          setColumns(columnNames);
          onAvailableColumnsChange(columnNames);

          // Encontra a melhor coluna de correspondência
          const bestMatch = findBestMatchColumn(columnNames);
          setSelectedColumn(bestMatch);
          onMatchColumnChange(bestMatch);

          // Define os dados de preview
          setPreviewData(data.slice(0, 5));
          setShowPreview(true);
          setError(null);
        } else {
          setError("Nenhum dado encontrado no arquivo de referência.");
        }
      } catch (err) {
        if (isMounted) {
          setError(
            `Erro ao processar o arquivo: ${
              err instanceof Error ? err.message : "Erro desconhecido"
            }`
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReferenceFile();

    return () => {
      isMounted = false;
    };
  }, [referenceFile, onAvailableColumnsChange, onMatchColumnChange, findBestMatchColumn]);

  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const column = e.target.value;
    setSelectedColumn(column);
    onMatchColumnChange(column);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  useEffect(() => {
    if (referenceFile) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [referenceFile]);

  // Sugestão de colunas comuns para correspondência
  const commonMatchColumns = useMemo(() => [
    "id", "matricula", "matrícula", "código", "codigo",
    "registro", "identificador", "chave", "cpf", "nome", "colaborador"
  ], []);

  // Descreve o tipo de cada coluna de correspondência para ajudar o usuário
  const getColumnTypeDescription = useCallback((columnName: string) => {
    const lowerName = columnName.toLowerCase();
    
    if (lowerName.includes("id") || lowerName.includes("código") || 
        lowerName.includes("codigo") || lowerName.includes("matricula") || 
        lowerName.includes("matrícula") || lowerName.includes("registro")) {
      return "Identificador único";
    }
    
    if (lowerName.includes("cpf") || lowerName.includes("cnpj")) {
      return "Documento";
    }
    
    if (lowerName.includes("nome") || lowerName.includes("colaborador")) {
      return "Nome completo";
    }
    
    return "Valor único";
  }, []);

  return (
    <div
      className={`space-y-4 ${
        isVisible ? "opacity-100" : "opacity-0"
      } transition-opacity duration-300`}
    >
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center">
            <TableCellsIcon className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-slate-200">
              Selecione a coluna de identificação
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs text-slate-400 hover:text-slate-300 flex items-center"
            >
              {showHelp ? "Ocultar ajuda" : "Ajuda"} <InformationCircleIcon className="w-4 h-4 ml-1" />
            </button>
            {previewData.length > 0 && (
              <button
                type="button"
                onClick={togglePreview}
                className="text-xs text-slate-400 hover:text-slate-300 flex items-center"
              >
                {showPreview ? (
                  <>
                    <EyeSlashIcon className="w-4 h-4 mr-1" />
                    Ocultar tabela
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Mostrar tabela
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {showHelp && (
          <div className="p-3 bg-slate-700 border-b border-slate-600">
            <div className="flex items-center text-sm text-slate-300 mb-2">
              <InformationCircleIcon className="w-4 h-4 text-blue-400 mr-1" /> 
              Como selecionar a coluna de identificação
            </div>
            <div className="bg-slate-800 p-2 rounded border border-slate-600">
              <div className="text-xs">
                <p className="text-slate-300 mb-1">Selecione a coluna que contém informações que permitem identificar cada arquivo (como nome, CPF, matrícula, etc).</p>
                <p className="text-slate-300 mb-1">Essa coluna será usada para combinar os dados da planilha com seus arquivos.</p>
                <p className="text-slate-300">Exemplo: se seus arquivos têm nomes como <span className="text-blue-400">Relatório - João Silva.pdf</span>, selecione a coluna <span className="text-green-400">Nome</span> que contenha "João Silva".</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 min-h-[150px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="text-slate-400 text-sm">
                Carregando dados...
              </span>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-900/20 text-red-400 rounded-md text-sm">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-700 p-3 rounded border border-slate-600">
                <label
                  htmlFor="matchColumn"
                  className="block text-sm font-medium text-slate-200 mb-2"
                >
                  Coluna que identifica cada arquivo:
                </label>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1">
                    <select
                      id="matchColumn"
                      value={selectedColumn}
                      onChange={handleColumnChange}
                      className="block w-full rounded-md border-slate-600 bg-slate-800 text-white text-sm py-2 focus:border-blue-500 focus:ring-blue-500"
                    >
                      {columns.map((column) => {
                        const isRecommended = commonMatchColumns.some(common => 
                          column.toLowerCase().includes(common.toLowerCase()));
                        
                        return (
                          <option key={column} value={column}>
                            {column} {isRecommended ? "✓" : ""}
                          </option>
                        );
                      })}
                    </select>
                    
                    {selectedColumn && (
                      <div className="mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                        <p className="text-xs text-green-400">
                          {getColumnTypeDescription(selectedColumn)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-none text-xs text-slate-400 md:text-right bg-slate-800 p-2 rounded border border-slate-600 md:max-w-xs">
                    O sistema buscará <span className="text-blue-400">{selectedColumn || "este valor"}</span> no nome dos seus arquivos
                  </div>
                </div>
              </div>

              {showPreview && previewData.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-medium text-slate-300 flex items-center">
                      <TableCellsIcon className="w-4 h-4 text-blue-500 mr-1" />
                      Dados da planilha (a coluna selecionada está destacada)
                    </h4>
                  </div>
                  <div className="border border-slate-700 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800">
                          <tr>
                            {table.getFlatHeaders().map((header: Header<DataType, unknown>) => (
                              <th
                                key={header.id}
                                className={`px-3 py-2 text-left text-xs font-medium text-slate-300 ${
                                  header.column.id === selectedColumn
                                    ? "bg-blue-900/40 border-b-2 border-blue-500"
                                    : ""
                                }`}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-slate-800 divide-y divide-slate-700">
                          {table.getRowModel().rows.map((row: Row<DataType>) => (
                            <tr key={row.id} className="hover:bg-slate-700">
                              {row.getVisibleCells().map((cell: Cell<DataType, unknown>) => (
                                <td
                                  key={cell.id}
                                  className={`px-3 py-2 text-xs text-slate-300 ${
                                    cell.column.id === selectedColumn
                                      ? "bg-blue-900/20 border-l-2 border-r-2 border-blue-500"
                                      : ""
                                  }`}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {previewData.length > 5 && (
                      <div className="px-3 py-2 flex items-center justify-between border-t border-slate-700 bg-slate-800">
                        <div className="flex">
                          <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className={`px-2 py-1 border border-slate-600 text-xs rounded-l ${
                              !table.getCanPreviousPage()
                                ? "text-slate-500 cursor-not-allowed"
                                : "text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className={`px-2 py-1 border-t border-b border-r border-slate-600 text-xs rounded-r ${
                              !table.getCanNextPage()
                                ? "text-slate-500 cursor-not-allowed"
                                : "text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">
                            Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                            {Math.min(
                              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                              previewData.length
                            )}
                            {" "}de{" "}
                            {previewData.length}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceColumnSelector;
