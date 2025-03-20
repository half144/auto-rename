import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import levenshtein from "fast-levenshtein";
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
  InformationCircleIcon,
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
  const [showHelp, setShowHelp] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Função para encontrar a melhor correspondência usando distância de Levenshtein
  const findBestMatch = useCallback(
    (identifier: string, referenceKeys: string[]): string | null => {
      // Se encontrar uma correspondência exata, retorna imediatamente
      if (referenceKeys.includes(identifier)) {
        return identifier;
      }

      // Se a coluna de correspondência for relacionada a nomes
      if (
        matchColumn.toLowerCase().includes("colaborador") ||
        matchColumn.toLowerCase().includes("nome")
      ) {
        // Normalizar o identificador para comparação
        const normalizedIdentifier = identifier
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();

        // Valores para controlar a melhor correspondência
        let bestMatch: string | null = null;
        let lowestDistance = Infinity;
        // Aumentar o threshold para nomes mais longos
        const distanceThreshold = Math.min(identifier.length * 0.4, 10); // Limiar mais permissivo

        // Encontrar a melhor correspondência baseada na distância de Levenshtein
        for (const key of referenceKeys) {
          const normalizedKey = key
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          
          // Calcular a distância de Levenshtein
          const distance = levenshtein.get(normalizedIdentifier, normalizedKey);
          
          // Se a distância for menor que a atual melhor e menor que o limiar
          if (distance < lowestDistance && distance <= distanceThreshold) {
            lowestDistance = distance;
            bestMatch = key;
          }
        }

        return bestMatch;
      }

      // Para outros tipos de colunas (como matrícula, ID, etc.)
      // É mais seguro exigir correspondência exata
      return null;
    },
    [matchColumn]
  );

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

            jsonData.forEach((row) => {
              const key = row[matchColumn]?.toString().trim();
              if (key) {
                refData[key] = row;
              }
            });

            setReferenceData(refData);

            // Gerar previews para os arquivos
            if (files.length > 0) {
              const previews: FilePreview[] = [];
              const referenceKeys = Object.keys(refData);

              for (const file of files) {
                const identifier = extractIdentifierFromFilename(file.name);

                // Tentar encontrar o valor correspondente na referência
                let fileRefData = refData[identifier];
                let matchedIdentifier = identifier;

                // Se não encontrar diretamente, usar o algoritmo de Levenshtein para encontrar a melhor correspondência
                if (!fileRefData) {
                  const bestMatch = findBestMatch(identifier, referenceKeys);
                  if (bestMatch) {
                    fileRefData = refData[bestMatch];
                    matchedIdentifier = bestMatch;
                  }
                }

                const { newName, error } = generateNewFilename(
                  file.name,
                  fileRefData
                );

                previews.push({
                  originalName: file.name,
                  newName,
                  error: error ? `${error} (Melhor correspondência: ${matchedIdentifier})` : undefined,
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
    findBestMatch,
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
      const referenceKeys = Object.keys(referenceData);

      for (const file of files) {
        const identifier = extractIdentifierFromFilename(file.name);
        
        // Tentar encontrar o valor correspondente na referência
        let fileRefData = referenceData[identifier];
        let matchedIdentifier = identifier;

        // Se não encontrar diretamente, usar o algoritmo de Levenshtein
        if (!fileRefData) {
          const bestMatch = findBestMatch(identifier, referenceKeys);
          if (bestMatch) {
            fileRefData = referenceData[bestMatch];
            matchedIdentifier = bestMatch;
          }
        }

        const { newName, error } = generateNewFilename(file.name, fileRefData);

        previews.push({
          originalName: file.name,
          newName,
          error: error ? `${error} (Melhor correspondência: ${matchedIdentifier})` : undefined,
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
    findBestMatch,
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
      const referenceKeys = Object.keys(referenceData);

      // Adicionar cada arquivo ao ZIP com o novo nome
      for (const file of files) {
        const identifier = extractIdentifierFromFilename(file.name);
        
        // Tentar encontrar o valor correspondente na referência
        let fileRefData = referenceData[identifier];

        // Se não encontrar diretamente, usar o algoritmo de Levenshtein
        if (!fileRefData) {
          const bestMatch = findBestMatch(identifier, referenceKeys);
          if (bestMatch) {
            fileRefData = referenceData[bestMatch];
          }
        }

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

  // Estatísticas para o resumo
  const getStatusSummary = useCallback(() => {
    if (!filePreviews.length) return { success: 0, error: 0, total: 0 };
    
    const success = filePreviews.filter(preview => !preview.error).length;
    return {
      success,
      error: filePreviews.length - success,
      total: filePreviews.length
    };
  }, [filePreviews]);

  return (
    <div className="space-y-5">
      {getStatusSummary().total > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-sm">
          <div className="p-3 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center">
              <DocumentDuplicateIcon className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-sm font-medium text-slate-200">
                Resumo do processamento
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
                Sobre o processamento de arquivos
              </div>
              <div className="bg-slate-800 p-2 rounded border border-slate-600">
                <div className="text-xs">
                  <p className="text-slate-300 mb-1">O sistema tenta encontrar correspondências entre seus arquivos e os dados da planilha.</p>
                  <p className="text-slate-300 mb-1">Arquivos <span className="text-green-400">com sucesso</span> foram vinculados corretamente aos dados da planilha.</p>
                  <p className="text-slate-300">Arquivos <span className="text-red-400">com erro</span> não foram reconhecidos ou não possuem correspondência na planilha.</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-700 p-3 rounded">
                <span className="text-3xl font-bold text-white block">
                  {getStatusSummary().total}
                </span>
                <span className="text-xs text-slate-400">Total de arquivos</span>
              </div>
              <div className="bg-green-900/30 p-3 rounded border border-green-800">
                <span className="text-3xl font-bold text-green-400 block">
                  {getStatusSummary().success}
                </span>
                <span className="text-xs text-green-400">
                  Com sucesso{' '}
                  <CheckCircleIcon className="w-3 h-3 inline text-green-400" />
                </span>
              </div>
              <div className="bg-red-900/30 p-3 rounded border border-red-800">
                <span className="text-3xl font-bold text-red-400 block">
                  {getStatusSummary().error}
                </span>
                <span className="text-xs text-red-400">
                  Com erro{' '}
                  <ExclamationCircleIcon className="w-3 h-3 inline text-red-400" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center">
            <DocumentArrowDownIcon className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-slate-200">
              Prévia dos arquivos
            </h3>
          </div>
          {isPreviewReady && filePreviews.length > 0 && (
            <button
              type="button"
              onClick={processFiles}
              disabled={isProcessing || filePreviews.length === 0}
              className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white ${
                isProcessing || filePreviews.length === 0
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isDownloading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                  Processando {progress}%
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  Baixar ({getStatusSummary().success}/{getStatusSummary().total})
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-3">
          {isProcessing && !isDownloading ? (
            <div className="flex items-center justify-center py-4">
              <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="text-slate-400 text-sm">
                Processando arquivos...
              </span>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-900/20 text-red-400 rounded-md text-sm">
              {error}
            </div>
          ) : filePreviews.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">
              Nenhum arquivo para processar
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800">
                    <tr>
                      {table.getFlatHeaders().map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-2 text-left text-xs font-medium text-slate-300"
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
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-700">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-3 py-2 text-xs text-slate-300"
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

              {/* Paginação simplificada */}
              {filePreviews.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-slate-700 bg-slate-800 px-3 py-2">
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
                      {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                          {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            filePreviews.length
                          )}
                      {" "}de{" "}
                          {filePreviews.length}
                    </p>
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

export default ProcessFiles;
