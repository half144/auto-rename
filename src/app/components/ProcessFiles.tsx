import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface ProcessFilesProps {
  files: File[];
  referenceFile: File | null;
  format: string;
  matchColumn: string;
  disabled?: boolean;
}

interface ReferenceData {
  [key: string]: Record<string, string>;
}

interface FilePreview {
  originalName: string;
  newName: string;
  error?: string;
  size: number;
}

const ProcessFiles: React.FC<ProcessFilesProps> = ({
  files,
  referenceFile,
  format,
  matchColumn,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData>({});
  const [isPreviewReady, setIsPreviewReady] = useState(false);

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const columnHelper = createColumnHelper<FilePreview>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("originalName", {
        header: "Nome original",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("newName", {
        header: "Novo nome",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("size", {
        header: "Tamanho",
        cell: (info) => `${(info.getValue() / 1024).toFixed(2)} KB`,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filePreviews,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  // Memoize as funções para evitar recriações a cada renderização
  const processReferenceFile = useCallback(
    async (file: File): Promise<ReferenceData> => {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = (e) => {
          try {
            const result = e.target?.result;
            const wb = XLSX.read(result, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as Array<
              Record<string, string>
            >;

            if (data.length === 0) {
              throw new Error(
                "Arquivo de referência vazio ou sem dados válidos."
              );
            }

            // Verificar se a coluna de correspondência existe
            if (!data[0].hasOwnProperty(matchColumn)) {
              throw new Error(
                `A coluna "${matchColumn}" não existe no arquivo de referência.`
              );
            }

            const referenceData: ReferenceData = {};

            data.forEach((row, index) => {
              if (!row[matchColumn]) {
                console.warn(
                  `Linha ${
                    index + 1
                  }: Valor ausente na coluna de correspondência "${matchColumn}".`
                );
                return;
              }

              // Usar o valor da coluna de correspondência como chave
              referenceData[row[matchColumn]] = row;
            });

            resolve(referenceData);
          } catch (error) {
            reject(
              `Erro ao processar o arquivo de referência: ${
                error instanceof Error ? error.message : "Erro desconhecido"
              }`
            );
          }
        };

        fileReader.onerror = () => {
          reject("Erro ao ler o arquivo de referência.");
        };

        fileReader.readAsBinaryString(file);
      });
    },
    [matchColumn]
  );

  const extractMatchValue = useCallback(
    (fileName: string): string | null => {
      // Extrair o valor de correspondência do nome do arquivo
      // Remover a extensão
      const nameWithoutExtension = fileName.substring(
        0,
        fileName.lastIndexOf(".")
      );

      // Estratégia 1: Correspondência exata - verificar se alguma chave do referenceData está exatamente no nome do arquivo
      for (const key in referenceData) {
        if (nameWithoutExtension === key || fileName === key) {
          return key;
        }
      }

      // Estratégia 2: Correspondência parcial - verificar se alguma chave está contida no nome do arquivo
      for (const key in referenceData) {
        if (nameWithoutExtension.includes(key)) {
          return key;
        }
      }

      // Estratégia 3: Correspondência por palavras - dividir o nome do arquivo em palavras e verificar cada uma
      const words = nameWithoutExtension.split(/[\s_\-\.]+/); // Dividir por espaços, underscores, hífens e pontos
      for (const word of words) {
        if (word.length > 2) {
          // Ignorar palavras muito curtas
          for (const key in referenceData) {
            if (word === key || key.includes(word) || word.includes(key)) {
              return key;
            }
          }
        }
      }

      // Estratégia 4: Correspondência por números - extrair números do nome do arquivo
      const numbers = nameWithoutExtension.match(/\d+/g);
      if (numbers) {
        for (const number of numbers) {
          if (number.length >= 3) {
            // Considerar apenas números com pelo menos 3 dígitos
            for (const key in referenceData) {
              if (key === number || key.includes(number)) {
                return key;
              }
            }
          }
        }
      }

      return null;
    },
    [referenceData]
  );

  const renameFile = useCallback(
    (
      file: File,
      refData: ReferenceData,
      formatString: string,
      matchValue: string
    ): string => {
      try {
        if (!refData[matchValue]) {
          throw new Error(
            `Valor "${matchValue}" não encontrado na coluna "${matchColumn}" do arquivo de referência.`
          );
        }

        const userData = refData[matchValue];
        const fileExtension = file.name.split(".").pop() || "";

        // Substituir todos os placeholders no formato
        let newFileName = formatString;

        // Encontrar todos os placeholders no formato {coluna}
        const placeholders = formatString.match(/\{([^}]+)\}/g) || [];

        for (const placeholder of placeholders) {
          // Extrair o nome da coluna do placeholder {coluna}
          const columnName = placeholder.substring(1, placeholder.length - 1);

          if (columnName === "extensao") {
            newFileName = newFileName.replace(placeholder, fileExtension);
          } else if (userData[columnName] !== undefined) {
            newFileName = newFileName.replace(
              placeholder,
              userData[columnName]
            );
          } else {
            // Se a coluna não existir, manter o placeholder
            console.warn(
              `Coluna "${columnName}" não encontrada no arquivo de referência.`
            );
          }
        }

        // Garantir que o nome do arquivo tenha a extensão
        if (!newFileName.endsWith(`.${fileExtension}`)) {
          newFileName = `${newFileName}.${fileExtension}`;
        }

        return newFileName;
      } catch (error) {
        throw new Error(
          `Erro ao renomear arquivo ${file.name}: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`
        );
      }
    },
    [matchColumn]
  );

  const generatePreviews = useCallback(
    (refData: ReferenceData) => {
      if (files.length === 0 || Object.keys(refData).length === 0) {
        setFilePreviews([]);
        setIsPreviewReady(false);
        return;
      }

      const previews: FilePreview[] = [];

      for (const file of files) {
        try {
          const matchValue = extractMatchValue(file.name);

          if (!matchValue) {
            previews.push({
              originalName: file.name,
              newName: file.name,
              error: `Não foi possível encontrar correspondência para este arquivo.`,
              size: file.size,
            });
            continue;
          }

          const newFileName = renameFile(file, refData, format, matchValue);

          previews.push({
            originalName: file.name,
            newName: newFileName,
            size: file.size,
          });
        } catch (error) {
          previews.push({
            originalName: file.name,
            newName: file.name,
            error: error instanceof Error ? error.message : "Erro desconhecido",
            size: file.size,
          });
        }
      }

      setFilePreviews(previews);
      setIsPreviewReady(true);

      // Atualizar o total de páginas
      setTotalPages(Math.ceil(previews.length / itemsPerPage));
      // Resetar para a primeira página quando novos previews são gerados
      setCurrentPage(1);
    },
    [files, format, extractMatchValue, renameFile, itemsPerPage]
  );

  // Processar o arquivo de referência quando ele mudar
  useEffect(() => {
    if (referenceFile && matchColumn) {
      processReferenceFile(referenceFile)
        .then((data) => {
          setReferenceData(data);
        })
        .catch((err) => {
          setError(err.toString());
          setFilePreviews([]);
          setIsPreviewReady(false);
        });
    } else {
      setFilePreviews([]);
      setIsPreviewReady(false);
    }
  }, [referenceFile, matchColumn, processReferenceFile]);

  // Gerar previews quando os arquivos, formato ou dados de referência mudarem
  useEffect(() => {
    if (Object.keys(referenceData).length > 0 && files.length > 0) {
      generatePreviews(referenceData);
    }
  }, [referenceData, generatePreviews]);

  // Atualizar o total de páginas quando o número de itens por página mudar
  useEffect(() => {
    if (filePreviews.length > 0) {
      setTotalPages(Math.ceil(filePreviews.length / itemsPerPage));
      // Ajustar a página atual se necessário
      if (currentPage > Math.ceil(filePreviews.length / itemsPerPage)) {
        setCurrentPage(1);
      }
    }
  }, [filePreviews.length, itemsPerPage, currentPage]);

  const processFiles = async () => {
    if (!referenceFile) {
      setError("Arquivo de referência não selecionado.");
      return;
    }

    if (files.length === 0) {
      setError("Nenhum arquivo selecionado para renomear.");
      return;
    }

    if (!matchColumn) {
      setError("Coluna de correspondência não selecionada.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Criar ZIP
      const zip = new JSZip();
      let processedCount = 0;

      // Processar cada arquivo
      for (const preview of filePreviews) {
        const file = files.find((f) => f.name === preview.originalName);

        if (!file) continue;

        if (preview.error) {
          zip.file(`não_processado_${file.name}`, file);
        } else {
          zip.file(preview.newName, file);
        }

        processedCount++;
        setProgress(Math.floor((processedCount / files.length) * 100));
      }

      // Gerar ZIP
      const content = await zip.generateAsync({ type: "blob" });

      // Download ZIP
      saveAs(content, "arquivos_renomeados.zip");

      setProgress(100);
    } catch (error) {
      setError(
        `Erro ao processar arquivos: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Funções para paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Voltar para a primeira página ao mudar o número de itens por página
  };

  // Obter os itens da página atual
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filePreviews.slice(startIndex, endIndex);
  };

  // Renderizar os controles de paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5; // Número máximo de botões de página para mostrar

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Itens por página:
          </span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border border-gray-300 dark:border-gray-700 rounded-md text-sm p-1 dark:bg-gray-800 dark:text-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 text-sm rounded ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
          >
            &laquo;
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 text-sm rounded ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
          >
            &lsaquo;
          </button>

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`px-3 py-1 text-sm rounded ${
                currentPage === number
                  ? "bg-blue-600 text-white"
                  : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
            >
              {number}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 text-sm rounded ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
          >
            &rsaquo;
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 text-sm rounded ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
          >
            &raquo;
          </button>
        </div>

        <div className="text-sm text-gray-700 dark:text-gray-300">
          Página {currentPage} de {totalPages}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}

      {isPreviewReady && filePreviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Prévia da renomeação
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {table.getState().pagination.pageSize} de{" "}
              {filePreviews.length} arquivos
            </div>
          </div>

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
                    <tr
                      key={row.id}
                      className={`table-row ${
                        row.original.error ? "bg-red-50 dark:bg-red-900/10" : ""
                      }`}
                    >
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
                    {[5, 10, 20, 50].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                      className={
                        !table.getCanPreviousPage()
                          ? "pagination-button-disabled"
                          : "pagination-button"
                      }
                      aria-label="Primeira página"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

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

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: table.getPageCount() },
                        (_, i) => i + 1
                      ).map((pageNumber) => {
                        // Show only a few page numbers around the current page
                        if (
                          pageNumber === 1 ||
                          pageNumber === table.getPageCount() ||
                          (pageNumber >=
                            table.getState().pagination.pageIndex + 1 - 1 &&
                            pageNumber <=
                              table.getState().pagination.pageIndex + 1 + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => table.setPageIndex(pageNumber - 1)}
                              className={
                                table.getState().pagination.pageIndex + 1 ===
                                pageNumber
                                  ? "pagination-page-button-active"
                                  : "pagination-page-button"
                              }
                            >
                              {pageNumber}
                            </button>
                          );
                        }

                        // Show ellipsis for skipped pages
                        if (
                          (pageNumber === 2 &&
                            table.getState().pagination.pageIndex + 1 > 3) ||
                          (pageNumber === table.getPageCount() - 1 &&
                            table.getState().pagination.pageIndex + 1 <
                              table.getPageCount() - 2)
                        ) {
                          return (
                            <span
                              key={pageNumber}
                              className="px-2 py-1 text-sm text-gray-500"
                            >
                              ...
                            </span>
                          );
                        }

                        return null;
                      })}
                    </div>

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

                    <button
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
                      disabled={!table.getCanNextPage()}
                      className={
                        !table.getCanNextPage()
                          ? "pagination-button-disabled"
                          : "pagination-button"
                      }
                      aria-label="Última página"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Página {table.getState().pagination.pageIndex + 1} de{" "}
                  {table.getPageCount()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={processFiles}
          disabled={
            disabled ||
            isProcessing ||
            !referenceFile ||
            files.length === 0 ||
            !isPreviewReady
          }
          className={`px-4 py-2 rounded-md font-medium ${
            disabled ||
            isProcessing ||
            !referenceFile ||
            files.length === 0 ||
            !isPreviewReady
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } transition-colors`}
        >
          {isProcessing ? "Processando..." : "Processar e Baixar Arquivos"}
        </button>

        {files.length > 0 && referenceFile && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {files.length} arquivo{files.length !== 1 ? "s" : ""} selecionado
            {files.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isProcessing && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Processando arquivos... {progress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default ProcessFiles;
