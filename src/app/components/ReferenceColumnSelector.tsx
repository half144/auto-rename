import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

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

  // Memoize as funções de callback para evitar recriações a cada renderização
  const handleMatchColumnChange = useCallback(
    (column: string) => {
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
        header: column,
        cell: (info) => info.getValue() || "-",
      })
    );
  }, [columns]);

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

  const extractColumns = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<
              string,
              any
            >[];

            if (jsonData.length === 0) {
              throw new Error("O arquivo de referência não contém dados.");
            }

            // Extrair nomes das colunas do primeiro objeto
            const extractedColumns = Object.keys(jsonData[0]);

            if (extractedColumns.length === 0) {
              throw new Error(
                "Não foi possível identificar colunas no arquivo de referência."
              );
            }

            setColumns(extractedColumns);
            handleAvailableColumnsChange(extractedColumns);

            // Salvar os primeiros 10 registros para preview
            setPreviewData(jsonData.slice(0, 10));

            // Selecionar a primeira coluna por padrão
            if (extractedColumns.length > 0) {
              // Tentar encontrar colunas comuns para correspondência
              const commonMatchColumns = [
                "matricula",
                "matrícula",
                "id",
                "código",
                "codigo",
                "nome",
                "name",
              ];
              const defaultColumn =
                extractedColumns.find((col) =>
                  commonMatchColumns.includes(col.toLowerCase())
                ) || extractedColumns[0];

              setSelectedColumn(defaultColumn);
              handleMatchColumnChange(defaultColumn);
            }
          } catch (error) {
            setError(
              `Erro ao processar o arquivo: ${
                error instanceof Error ? error.message : "Erro desconhecido"
              }`
            );
            setColumns([]);
            setSelectedColumn("");
            setPreviewData([]);
            handleMatchColumnChange("");
            handleAvailableColumnsChange([]);
          } finally {
            setIsLoading(false);
          }
        };

        reader.onerror = () => {
          setError("Erro ao ler o arquivo.");
          setIsLoading(false);
          setColumns([]);
          setSelectedColumn("");
          setPreviewData([]);
          handleMatchColumnChange("");
          handleAvailableColumnsChange([]);
        };

        reader.readAsBinaryString(file);
      } catch (error) {
        setError(
          `Erro ao processar o arquivo: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`
        );
        setIsLoading(false);
        setColumns([]);
        setSelectedColumn("");
        setPreviewData([]);
        handleMatchColumnChange("");
        handleAvailableColumnsChange([]);
      }
    },
    [handleMatchColumnChange, handleAvailableColumnsChange]
  );

  useEffect(() => {
    if (referenceFile) {
      extractColumns(referenceFile);
    } else {
      setColumns([]);
      setSelectedColumn("");
      setPreviewData([]);
      handleMatchColumnChange("");
      handleAvailableColumnsChange([]);
    }
  }, [
    referenceFile,
    extractColumns,
    handleMatchColumnChange,
    handleAvailableColumnsChange,
  ]);

  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const column = e.target.value;
    setSelectedColumn(column);
    handleMatchColumnChange(column);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  if (!referenceFile) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        Carregue um arquivo de referência para selecionar a coluna de
        correspondência.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="matchColumn"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Coluna para correspondência
        </label>
        <div className="relative">
          <select
            id="matchColumn"
            value={selectedColumn}
            onChange={handleColumnChange}
            disabled={isLoading || columns.length === 0}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:text-white"
          >
            {columns.length === 0 ? (
              <option value="">Nenhuma coluna disponível</option>
            ) : (
              columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))
            )}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Selecione a coluna que será usada para identificar os arquivos a serem
          renomeados.
        </p>
      </div>

      {columns.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Colunas disponíveis para uso nos placeholders:
          </h4>
          <div className="flex flex-wrap gap-2">
            {columns.map((column) => (
              <span
                key={column}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {column}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Use estas colunas no formato de renomeação como {"{nome_da_coluna}"}
            .
          </p>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="mt-4">
          <button
            onClick={togglePreview}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
          >
            {showPreview ? "Ocultar prévia" : "Mostrar prévia"} dos dados de
            referência
            <svg
              className={`ml-1 h-4 w-4 transition-transform ${
                showPreview ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showPreview && (
            <div className="mt-3 space-y-4">
              <div className="table-container">
                <div className="table-wrapper">
                  <table className="table">
                    <thead className="table-header">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              scope="col"
                              className="table-header-cell"
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="table-body">
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="table-row">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="table-cell">
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

                <div className="table-footer">
                  <div className="pagination-container">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Itens por página:
                      </span>
                      <select
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => {
                          table.setPageSize(Number(e.target.value));
                        }}
                        className="border border-gray-300 dark:border-gray-700 rounded-md text-sm p-1 bg-white dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[5, 10].map((pageSize) => (
                          <option key={pageSize} value={pageSize}>
                            {pageSize}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className={
                          !table.getCanPreviousPage()
                            ? "pagination-button-disabled"
                            : "pagination-button"
                        }
                        aria-label="Página anterior"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Página {table.getState().pagination.pageIndex + 1} de{" "}
                        {table.getPageCount()}
                      </span>

                      <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className={
                          !table.getCanNextPage()
                            ? "pagination-button-disabled"
                            : "pagination-button"
                        }
                        aria-label="Próxima página"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Mostrando prévia dos primeiros registros do arquivo de
                referência.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferenceColumnSelector;
