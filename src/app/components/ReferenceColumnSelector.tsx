import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  TableCellsIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface ReferenceColumnSelectorProps {
  referenceFile: File | null;
  onMatchColumnChange: (column: string) => void;
  onAvailableColumnsChange: (columns: string[]) => void;
}

const ReferenceColumnSelector: React.FC<ReferenceColumnSelectorProps> = ({
  referenceFile,
  onMatchColumnChange,
  onAvailableColumnsChange,
}) => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Função auxiliar para verificar se o selectedColumn está na lista de colunas atual
  const isColumnValid = useCallback((col: string, columnList: string[]) => {
    return col && columnList.includes(col);
  }, []);

  // Função para selecionar uma coluna automaticamente APENAS na primeira vez
  const [hasSelectedInitialColumn, setHasSelectedInitialColumn] =
    useState(false);

  // Memoize as funções de callback para evitar recriações a cada renderização
  const handleMatchColumnChange = useCallback(
    (column: string) => {
      setSelectedColumn(column);
      onMatchColumnChange(column);
    },
    [onMatchColumnChange]
  );

  const handleAvailableColumnsChange = useCallback(
    (columns: string[]) => {
      onAvailableColumnsChange(columns);
    },
    [onAvailableColumnsChange]
  );

  const tableColumns = useMemo(() => {
    if (columns.length === 0) return [];

    const columnHelper = createColumnHelper<Record<string, any>>();

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

  // Efeito para carregar os dados do arquivo de referência
  useEffect(() => {
    if (!referenceFile) return;

    // Usar uma variável para controlar se o componente ainda está montado
    let isMounted = true;

    // Definir um pequeno atraso antes de mostrar o indicador de carregamento
    // para evitar flashes rápidos de loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted) setIsLoading(true);
    }, 200);

    const loadReferenceFile = async () => {
      if (isMounted) setError(null);

      try {
        const data = await readExcelFile(referenceFile);
        // Verificar se o componente ainda está montado antes de atualizar o estado
        if (!isMounted) return;

        if (data && data.length > 0) {
          // Extrair os nomes das colunas do primeiro objeto
          const columnNames = Object.keys(data[0]);
          setColumns(columnNames);
          onAvailableColumnsChange(columnNames);

          // Seleção automática da coluna APENAS se não tiver sido selecionada uma coluna ainda
          if (
            !hasSelectedInitialColumn ||
            !isColumnValid(selectedColumn, columnNames)
          ) {
            // Tentar encontrar uma coluna de correspondência adequada
            const possibleMatchColumns = [
              "id",
              "matricula",
              "matrícula",
              "código",
              "codigo",
              "registro",
              "identificador",
              "chave",
            ];

            // Procurar por uma coluna que corresponda a um dos possíveis nomes
            const matchColumn = columnNames.find((col) =>
              possibleMatchColumns.includes(col.toLowerCase())
            );

            if (matchColumn) {
              setSelectedColumn(matchColumn);
              onMatchColumnChange(matchColumn);
              setHasSelectedInitialColumn(true);
            } else if (columnNames.length > 0) {
              // Se não encontrar, usar a primeira coluna
              setSelectedColumn(columnNames[0]);
              onMatchColumnChange(columnNames[0]);
              setHasSelectedInitialColumn(true);
            }
          }

          // Definir os dados de visualização
          setPreviewData(data.slice(0, 10)); // Mostrar apenas as primeiras 10 linhas
          setShowPreview(true);
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

    // Função de limpeza para evitar atualizações de estado após o componente ser desmontado
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [
    referenceFile,
    onAvailableColumnsChange,
    onMatchColumnChange,
    selectedColumn,
    hasSelectedInitialColumn,
    isColumnValid,
  ]);

  // Função para ler o arquivo Excel
  const readExcelFile = async (file: File): Promise<Record<string, any>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Falha ao ler o arquivo."));
            return;
          }

          let workbook;
          if (file.name.endsWith(".csv")) {
            // Para arquivos CSV
            workbook = XLSX.read(data, { type: "binary" });
          } else {
            // Para arquivos Excel
            workbook = XLSX.read(data, { type: "array" });
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 2,
            defval: "",
          });

          resolve(jsonData as Record<string, any>[]);
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

  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const column = e.target.value;
    setSelectedColumn(column);
    setHasSelectedInitialColumn(true);
    onMatchColumnChange(column);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Efeito para controlar a visibilidade do componente
  useEffect(() => {
    if (referenceFile) {
      // Pequeno atraso para garantir uma transição suave
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [referenceFile]);

  return (
    <div
      className={`space-y-6 ${
        isVisible ? "opacity-100" : "opacity-0"
      } transition-opacity duration-300`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center">
            <TableCellsIcon className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Configuração da coluna de correspondência
            </h3>
          </div>
          {previewData.length > 0 && (
            <button
              type="button"
              onClick={togglePreview}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showPreview ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        <div className="p-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 h-full">
              <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Carregando dados do arquivo...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="matchColumn"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Selecione a coluna que contém o identificador para
                  correspondência:
                </label>
                <select
                  id="matchColumn"
                  value={selectedColumn}
                  onChange={handleColumnChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                >
                  {columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Esta coluna será usada para corresponder os arquivos com os
                  dados de referência.
                </p>
              </div>

              {showPreview && previewData.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prévia dos dados (
                      {previewData.length > 10
                        ? "10 primeiras linhas"
                        : `${previewData.length} linhas`}
                      ):
                    </h4>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-slate-800">
                          <tr>
                            {table.getFlatHeaders().map((header) => (
                              <th
                                key={header.id}
                                className={`px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider ${
                                  header.column.id === selectedColumn
                                    ? "bg-blue-50 dark:bg-blue-900/20"
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
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-700">
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className={`px-4 py-2 text-sm text-slate-200 ${
                                    cell.column.id === selectedColumn
                                      ? "bg-blue-50 dark:bg-blue-900/10"
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

                    {/* Paginação */}
                    {previewData.length > 5 && (
                      <div className="px-4 py-3 flex items-center justify-between border-t border-slate-700 bg-slate-800 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                              !table.getCanPreviousPage()
                                ? "text-slate-400 bg-slate-800 cursor-not-allowed"
                                : "text-slate-200 bg-slate-800 hover:bg-slate-700"
                            }`}
                          >
                            Anterior
                          </button>
                          <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                              !table.getCanNextPage()
                                ? "text-slate-400 bg-slate-800 cursor-not-allowed"
                                : "text-slate-200 bg-slate-800 hover:bg-slate-700"
                            }`}
                          >
                            Próximo
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-slate-200">
                              Mostrando{" "}
                              <span className="font-medium">
                                {table.getState().pagination.pageIndex *
                                  table.getState().pagination.pageSize +
                                  1}
                              </span>{" "}
                              a{" "}
                              <span className="font-medium">
                                {Math.min(
                                  (table.getState().pagination.pageIndex + 1) *
                                    table.getState().pagination.pageSize,
                                  previewData.length
                                )}
                              </span>{" "}
                              de{" "}
                              <span className="font-medium">
                                {previewData.length}
                              </span>{" "}
                              resultados
                            </p>
                          </div>
                          <div>
                            <nav
                              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                              aria-label="Pagination"
                            >
                              <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                                  !table.getCanPreviousPage()
                                    ? "text-slate-400 bg-slate-800 cursor-not-allowed"
                                    : "text-slate-400 bg-slate-800 hover:bg-slate-700"
                                }`}
                              >
                                <span className="sr-only">Anterior</span>
                                <ChevronLeftIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </button>
                              <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                                  !table.getCanNextPage()
                                    ? "text-slate-400 bg-slate-800 cursor-not-allowed"
                                    : "text-slate-400 bg-slate-800 hover:bg-slate-700"
                                }`}
                              >
                                <span className="sr-only">Próximo</span>
                                <ChevronRightIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </button>
                            </nav>
                          </div>
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
