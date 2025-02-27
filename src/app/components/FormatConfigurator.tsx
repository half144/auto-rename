import React, { useState, useEffect, useCallback } from "react";

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

  const getExampleValueForColumn = useCallback((columnName: string): string => {
    // Valores de exemplo mais comuns para colunas específicas
    const commonExamples: Record<string, Record<string, string>> = {
      // Colunas de identificação
      id: { example: "12345", type: "id" },
      matricula: { example: "M12345", type: "id" },
      matrícula: { example: "M12345", type: "id" },
      codigo: { example: "COD-123", type: "id" },
      código: { example: "COD-123", type: "id" },
      registro: { example: "REG-789", type: "id" },

      // Colunas de nome
      nome: { example: "Maria Silva", type: "name" },
      name: { example: "John Doe", type: "name" },
      funcionario: { example: "Carlos Santos", type: "name" },
      funcionário: { example: "Carlos Santos", type: "name" },
      aluno: { example: "Pedro Oliveira", type: "name" },
      cliente: { example: "Ana Pereira", type: "name" },

      // Colunas de departamento
      departamento: { example: "TI", type: "dept" },
      setor: { example: "Financeiro", type: "dept" },
      area: { example: "Marketing", type: "dept" },
      área: { example: "Marketing", type: "dept" },

      // Colunas de contato
      email: { example: "exemplo@email.com", type: "contact" },
      telefone: { example: "(11) 98765-4321", type: "contact" },
      celular: { example: "(11) 98765-4321", type: "contact" },

      // Colunas de data
      data: { example: "01/01/2023", type: "date" },
      data_nascimento: { example: "15/05/1990", type: "date" },
      data_cadastro: { example: "10/10/2022", type: "date" },
    };

    // Verificar se temos um exemplo específico para esta coluna
    const lowerColumnName = columnName.toLowerCase();
    if (commonExamples[lowerColumnName]) {
      return commonExamples[lowerColumnName].example;
    }

    // Se não tiver um exemplo específico, criar um exemplo genérico baseado no nome da coluna
    if (lowerColumnName.includes("nome") || lowerColumnName.includes("name")) {
      return "Nome do Usuário";
    } else if (
      lowerColumnName.includes("id") ||
      lowerColumnName.includes("cod") ||
      lowerColumnName.includes("matricula") ||
      lowerColumnName.includes("matrícula")
    ) {
      return "ID123456";
    } else if (
      lowerColumnName.includes("data") ||
      lowerColumnName.includes("date")
    ) {
      return "01/01/2023";
    } else if (
      lowerColumnName.includes("email") ||
      lowerColumnName.includes("mail")
    ) {
      return "usuario@exemplo.com";
    } else if (
      lowerColumnName.includes("tel") ||
      lowerColumnName.includes("fone") ||
      lowerColumnName.includes("celular")
    ) {
      return "(00) 12345-6789";
    }

    // Valor genérico para qualquer outra coluna
    return `Valor de ${columnName}`;
  }, []);

  const getFormattedPreview = useCallback(() => {
    if (!format) {
      return '<span class="text-gray-400">Adicione placeholders para visualizar o formato</span>';
    }

    let preview = format;

    // Substituir todos os placeholders por valores de exemplo
    const placeholders = format.match(/\{([^}]+)\}/g) || [];

    for (const placeholder of placeholders) {
      const columnName = placeholder.substring(1, placeholder.length - 1);

      if (columnName === "extensao") {
        preview = preview.replace(
          placeholder,
          '<span class="text-purple-600 dark:text-purple-400">pdf</span>'
        );
      } else {
        // Usar valores de exemplo para as colunas
        const exampleValue = getExampleValueForColumn(columnName);
        preview = preview.replace(
          placeholder,
          `<span class="text-blue-600 dark:text-blue-400">${exampleValue}</span>`
        );
      }
    }

    return preview;
  }, [format, getExampleValueForColumn]);

  // Sugestões de formato comuns
  const commonFormats = [
    { name: "ID - Nome", format: "{id} - {nome}" },
    { name: "Nome (ID)", format: "{nome} ({id})" },
    { name: "ID_Nome", format: "{id}_{nome}" },
    { name: "Data - Nome", format: "{data} - {nome}" },
  ];

  // Função para aplicar um formato sugerido
  const applyFormat = useCallback((formatString: string) => {
    setFormat(formatString);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="formatInput"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Formato de renomeação
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            id="formatInput"
            type="text"
            value={format}
            onChange={handleFormatChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Selecione os campos para o formato de renomeação"
          />
        </div>

        {format === "" && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm">
            <p>
              <strong>Dica:</strong> Clique nos botões abaixo para adicionar
              campos ao formato de renomeação. Você também pode adicionar texto
              livre entre os campos.
            </p>
            <p className="mt-1">
              Exemplo:{" "}
              <code>
                Documento - {"{nome}"} ({"{id}"}).{"{extensao}"}
              </code>
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => addPlaceholder("extensao")}
            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          >
            + {"{extensao}"}
          </button>

          {availableColumns.length > 0 ? (
            availableColumns.map((column) => (
              <button
                key={column}
                type="button"
                onClick={() => addPlaceholder(column)}
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                + {`{${column}}`}
              </button>
            ))
          ) : (
            <>
              <button
                type="button"
                onClick={() => addPlaceholder("nome")}
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              >
                + {"{nome}"}
              </button>
              <button
                type="button"
                onClick={() => addPlaceholder("matricula")}
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                + {"{matricula}"}
              </button>
            </>
          )}
        </div>

        {availableColumns.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formatos sugeridos:
            </p>
            <div className="flex flex-wrap gap-2">
              {commonFormats.map((fmt, index) => {
                // Substituir os nomes de colunas genéricos pelos reais
                let formatString = fmt.format;

                // Tentar encontrar colunas correspondentes
                const idColumns = [
                  "id",
                  "matricula",
                  "matrícula",
                  "codigo",
                  "código",
                  "registro",
                ];
                const nameColumns = [
                  "nome",
                  "name",
                  "funcionario",
                  "funcionário",
                  "aluno",
                  "cliente",
                ];
                const dateColumns = [
                  "data",
                  "data_cadastro",
                  "data_criacao",
                  "data_criação",
                ];

                // Encontrar colunas correspondentes no arquivo atual
                const idColumn =
                  availableColumns.find((col) =>
                    idColumns.includes(col.toLowerCase())
                  ) || availableColumns[0];

                const nameColumn =
                  availableColumns.find((col) =>
                    nameColumns.includes(col.toLowerCase())
                  ) ||
                  (availableColumns.length > 1
                    ? availableColumns[1]
                    : availableColumns[0]);

                const dateColumn = availableColumns.find((col) =>
                  dateColumns.includes(col.toLowerCase())
                );

                // Substituir os placeholders genéricos pelos reais
                formatString = formatString.replace("{id}", `{${idColumn}}`);
                formatString = formatString.replace(
                  "{nome}",
                  `{${nameColumn}}`
                );

                if (dateColumn && formatString.includes("{data}")) {
                  formatString = formatString.replace(
                    "{data}",
                    `{${dateColumn}}`
                  );
                }

                // Adicionar extensão se não estiver presente
                if (!formatString.includes("{extensao}")) {
                  formatString += ".{extensao}";
                }

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyFormat(formatString)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {fmt.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Visualização:
        </h4>
        <div className="p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
            <span
              dangerouslySetInnerHTML={{
                __html: getFormattedPreview(),
              }}
            />
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>Placeholders disponíveis:</p>
        <ul className="list-disc list-inside mt-1">
          {availableColumns.length > 0 ? (
            availableColumns.map((column) => (
              <li key={column}>
                <code>{`{${column}}`}</code> - Valor da coluna {column} do
                arquivo de referência
              </li>
            ))
          ) : (
            <>
              <li>
                <code>{"{nome}"}</code> - Nome do usuário do arquivo de
                referência
              </li>
              <li>
                <code>{"{matricula}"}</code> - Matrícula do usuário do arquivo
                de referência
              </li>
            </>
          )}
          <li>
            <code>{"{extensao}"}</code> - Extensão original do arquivo
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FormatConfigurator;
