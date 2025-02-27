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
import {
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

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
  const [isDownloading, setIsDownloading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Função para extrair o identificador do nome do arquivo
  const extractIdentifierFromFilename = useCallback(
    (filename: string): string => {
      // Remover a extensão do arquivo
      const nameWithoutExtension = filename.substring(
        0,
        filename.lastIndexOf(".")
      );

      // Se a coluna de correspondência for "Colaborador" ou similar
      if (
        matchColumn.toLowerCase().includes("colaborador") ||
        matchColumn.toLowerCase().includes("nome")
      ) {
        // Retorna o nome completo para fazer a correspondência com o nome do colaborador
        return nameWithoutExtension;
      }

      // Para outros tipos de colunas (como matrícula, ID, etc.)
      // Tentar encontrar um padrão de identificador no nome do arquivo
      // Exemplos: "12345_Nome.pdf", "Nome_12345.pdf", "12345 - Nome.pdf"
      const patterns = [
        /^(\d+)[_\s-]+/,
        /[_\s-]+(\d+)$/,
        /^([A-Za-z0-9]+)[_\s-]+/,
      ];

      for (const pattern of patterns) {
        const match = nameWithoutExtension.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      // Se não encontrar um padrão, retornar o nome sem extensão
      return nameWithoutExtension;
    },
    [matchColumn]
  );

  // Função para gerar o novo nome do arquivo
  const generateNewFilename = useCallback(
    (
      originalFilename: string,
      fileReferenceData: Record<string, string> | undefined
    ): { newName: string; error?: string } => {
      if (!fileReferenceData) {
        return {
          newName: originalFilename,
          error: "Dados de referência não encontrados",
        };
      }

      // Obter a extensão do arquivo original
      const extension = originalFilename.substring(
        originalFilename.lastIndexOf(".")
      );

      // Substituir os placeholders no formato pelo valor correspondente
      let newName = format;

      // Adicionar a extensão se não estiver no formato
      if (!format.includes("{extensao}")) {
        newName += extension;
      } else {
        newName = newName.replace("{extensao}", extension.substring(1));
      }

      // Substituir os placeholders pelos valores do arquivo de referência
      const placeholders = format.match(/\{([^}]+)\}/g) || [];

      for (const placeholder of placeholders) {
        const fieldName = placeholder.substring(1, placeholder.length - 1);

        if (fieldName === "extensao") {
          continue; // Já tratamos a extensão
        }

        const fieldValue = fileReferenceData[fieldName] || "";
        newName = newName.replace(placeholder, fieldValue);
      }

      // Remover caracteres inválidos para nomes de arquivo
      newName = newName.replace(/[<>:"/\\|?*]/g, "_");

      return { newName };
    },
    [format]
  );

  // Efeito para carregar os dados de referência
  useEffect(() => {
    if (!referenceFile || !matchColumn) return;

    const loadReferenceData = async () => {
      try {
        setIsProcessing(true);
        setError(null);

        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const data = e.target?.result;
            if (!data) {
              throw new Error("Falha ao ler o arquivo de referência.");
            }

            let workbook;
            if (referenceFile.name.endsWith(".csv")) {
              // Para arquivos CSV
              workbook = XLSX.read(data, { type: "binary" });
            } else {
              // Para arquivos Excel
              workbook = XLSX.read(data, { type: "array" });
            }

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              defval: "",
            }) as Record<string, string>[];

            // Criar um mapa de dados de referência usando a coluna de correspondência
            const refData: ReferenceData = {};

            // Uma versão normalized para pesquisa mais flexível
            const normalizedRefData: { [key: string]: string } = {};

            jsonData.forEach((row) => {
              const key = row[matchColumn]?.toString().trim();
              if (key) {
                refData[key] = row;

                // Adiciona uma versão normalizada (sem acentos, tudo em minúsculas, sem espaços extras)
                const normalizedKey = key
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/\s+/g, " ")
                  .trim();

                normalizedRefData[normalizedKey] = key;
              }
            });

            setReferenceData(refData);

            // Gerar previews para os arquivos
            if (files.length > 0) {
              const previews: FilePreview[] = [];

              for (const file of files) {
                const identifier = extractIdentifierFromFilename(file.name);

                // Tentar encontrar o valor correspondente na referência
                let fileRefData = refData[identifier];

                // Se não encontrar diretamente, tentar uma busca normalizada
                if (
                  !fileRefData &&
                  matchColumn.toLowerCase().includes("colaborador")
                ) {
                  const normalizedIdentifier = identifier
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, " ")
                    .trim();

                  // Procurar por correspondências próximas
                  const originalKey = normalizedRefData[normalizedIdentifier];
                  if (originalKey) {
                    fileRefData = refData[originalKey];
                  } else {
                    // Tentar encontrar se o nome está contido no identificador ou vice-versa
                    const possibleKeys = Object.keys(normalizedRefData);
                    for (const nKey of possibleKeys) {
                      if (
                        normalizedIdentifier.includes(nKey) ||
                        nKey.includes(normalizedIdentifier)
                      ) {
                        const originalMatchKey = normalizedRefData[nKey];
                        fileRefData = refData[originalMatchKey];
                        break;
                      }
                    }
                  }
                }

                const { newName, error } = generateNewFilename(
                  file.name,
                  fileRefData
                );

                previews.push({
                  originalName: file.name,
                  newName,
                  error,
                  size: file.size,
                });
              }

              setFilePreviews(previews);
              setTotalPages(Math.ceil(previews.length / itemsPerPage));
              setIsPreviewReady(true);
            }
          } catch (error) {
            setError(
              `Erro ao processar o arquivo de referência: ${
                error instanceof Error ? error.message : "Erro desconhecido"
              }`
            );
          } finally {
            setIsProcessing(false);
          }
        };

        reader.onerror = () => {
          setError("Erro ao ler o arquivo de referência.");
          setIsProcessing(false);
        };

        if (referenceFile.name.endsWith(".csv")) {
          reader.readAsBinaryString(referenceFile);
        } else {
          reader.readAsArrayBuffer(referenceFile);
        }
      } catch (error) {
        setError(
          `Erro ao processar o arquivo de referência: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`
        );
        setIsProcessing(false);
      }
    };

    loadReferenceData();
  }, [
    referenceFile,
    matchColumn,
    files,
    extractIdentifierFromFilename,
    generateNewFilename,
    itemsPerPage,
  ]);

  // Efeito para atualizar os previews quando os arquivos ou o formato mudam
  useEffect(() => {
    if (
      !referenceFile ||
      !matchColumn ||
      Object.keys(referenceData).length === 0
    )
      return;

    const updatePreviews = () => {
      const previews: FilePreview[] = [];

      for (const file of files) {
        const identifier = extractIdentifierFromFilename(file.name);
        const fileRefData = referenceData[identifier];
        const { newName, error } = generateNewFilename(file.name, fileRefData);

        previews.push({
          originalName: file.name,
          newName,
          error,
          size: file.size,
        });
      }

      setFilePreviews(previews);
      setTotalPages(Math.ceil(previews.length / itemsPerPage));
      setIsPreviewReady(true);
    };

    updatePreviews();
  }, [
    files,
    format,
    referenceData,
    extractIdentifierFromFilename,
    generateNewFilename,
    itemsPerPage,
    referenceFile,
    matchColumn,
  ]);

  // Definir as colunas da tabela
  const tableColumns = useMemo(() => {
    const columnHelper = createColumnHelper<FilePreview>();

    return [
      columnHelper.accessor("originalName", {
        header: "Nome Original",
        cell: (info) => (
          <div className="flex items-center">
            <DocumentDuplicateIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className="truncate">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor("newName", {
        header: "Novo Nome",
        cell: (info) => {
          const hasError = !!info.row.original.error;
          return (
            <div className="flex items-center">
              {hasError ? (
                <ExclamationCircleIcon className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              )}
              <span
                className={`truncate ${
                  hasError
                    ? "text-red-500"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {info.getValue()}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("size", {
        header: "Tamanho",
        cell: (info) => {
          const size = info.getValue();
          let formattedSize = "";
          if (size < 1024) {
            formattedSize = `${size} B`;
          } else if (size < 1024 * 1024) {
            formattedSize = `${(size / 1024).toFixed(2)} KB`;
          } else {
            formattedSize = `${(size / (1024 * 1024)).toFixed(2)} MB`;
          }
          return (
            <span className="text-gray-500 dark:text-gray-400">
              {formattedSize}
            </span>
          );
        },
      }),
      columnHelper.accessor("error", {
        header: "Status",
        cell: (info) => {
          const error = info.getValue();
          return error ? (
            <span className="text-red-500 text-sm">{error}</span>
          ) : (
            <span className="text-green-500 text-sm">Pronto</span>
          );
        },
      }),
    ];
  }, []);

  // Configurar a tabela
  const table = useReactTable({
    data: filePreviews,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: itemsPerPage,
      },
    },
  });

  // Função para processar os arquivos e criar o ZIP
  const processFiles = async () => {
    if (files.length === 0 || !isPreviewReady) return;

    try {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      setIsDownloading(true);

      const zip = new JSZip();
      const total = files.length;
      let processed = 0;

      // Adicionar cada arquivo ao ZIP com o novo nome
      for (const file of files) {
        const identifier = extractIdentifierFromFilename(file.name);
        const fileRefData = referenceData[identifier];
        const { newName } = generateNewFilename(file.name, fileRefData);

        // Ler o conteúdo do arquivo
        const content = await readFileAsArrayBuffer(file);

        // Adicionar ao ZIP
        zip.file(newName, content);

        // Atualizar o progresso
        processed++;
        setProgress(Math.round((processed / total) * 100));
      }

      // Gerar o arquivo ZIP
      const zipContent = await zip.generateAsync({ type: "blob" });

      // Salvar o arquivo
      saveAs(zipContent, "arquivos_renomeados.zip");

      setIsDownloading(false);
    } catch (error) {
      setError(
        `Erro ao processar os arquivos: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
      setIsDownloading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para ler um arquivo como ArrayBuffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(e.target.result);
        } else {
          reject(new Error("Falha ao ler o arquivo."));
        }
      };

      reader.onerror = () => {
        reject(new Error("Erro ao ler o arquivo."));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  // Função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    table.setPageIndex(page - 1);
  };

  // Função para mudar o número de itens por página
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    table.setPageSize(newItemsPerPage);
    setTotalPages(Math.ceil(filePreviews.length / newItemsPerPage));
  };

  // Função para obter os itens da página atual
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filePreviews.slice(startIndex, endIndex);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-800 border-b border-slate-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <DocumentArrowDownIcon className="w-5 h-5 text-blue-500 mr-2" />
            Prévia dos arquivos renomeados
          </h3>
        </div>

        <div className="p-4">
          {isProcessing && !isDownloading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Processando arquivos...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
              {error}
            </div>
          ) : filePreviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhum arquivo para processar.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-slate-800">
                    <tr>
                      {table.getFlatHeaders().map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider"
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
                            className="px-4 py-2 text-sm text-slate-200"
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
              {filePreviews.length > itemsPerPage && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-slate-700 bg-slate-800 sm:px-6 rounded-b-lg">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className={`relative inline-flex items-center px-4 py-2 border border-slate-700 text-slate-200 text-sm font-medium rounded-md ${
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
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-slate-700 text-slate-200 text-sm font-medium rounded-md ${
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
                            filePreviews.length
                          )}
                        </span>{" "}
                        de{" "}
                        <span className="font-medium">
                          {filePreviews.length}
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
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-700 text-slate-200 text-sm font-medium ${
                            !table.getCanPreviousPage()
                              ? "text-slate-400 bg-slate-800 cursor-not-allowed"
                              : "text-slate-200 bg-slate-800 hover:bg-slate-700"
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
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-700 text-slate-200 text-sm font-medium ${
                            !table.getCanNextPage()
                              ? "text-slate-400 bg-slate-800 cursor-not-allowed"
                              : "text-slate-200 bg-slate-800 hover:bg-slate-700"
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

              {/* Botão para processar */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={processFiles}
                  disabled={isProcessing || filePreviews.length === 0}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isProcessing || filePreviews.length === 0
                      ? "bg-slate-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                      Processando ({progress}%)
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                      Baixar Arquivos Renomeados
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessFiles;
