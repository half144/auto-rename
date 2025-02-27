# Renomeador Automático de Arquivos

Aplicação web para renomear múltiplos arquivos com base em um arquivo de referência Excel (.xlsx) ou CSV (.csv).

## Funcionalidades

- Upload de múltiplos arquivos para renomeação
- Upload de um arquivo de referência (Excel ou CSV) contendo informações para renomeação
- Seleção da coluna de correspondência para identificar os arquivos
- Personalização do formato de renomeação usando placeholders
- Prévia dos arquivos renomeados antes do processamento
- Download dos arquivos renomeados em um arquivo ZIP

## Como usar

1. **Selecione os arquivos**

   - Faça upload dos arquivos que deseja renomear
   - Faça upload do arquivo de referência (Excel ou CSV)

2. **Configure a correspondência**

   - Selecione a coluna do arquivo de referência que será usada para identificar os arquivos
   - A aplicação tentará encontrar correspondências entre os nomes dos arquivos e os valores na coluna selecionada

3. **Configure o formato de renomeação**

   - Use placeholders como `{nome}`, `{matricula}`, etc. para personalizar o formato
   - Os placeholders disponíveis dependem das colunas presentes no arquivo de referência
   - Use `{extensao}` para manter a extensão original do arquivo

4. **Processe os arquivos**
   - Visualize a prévia dos arquivos renomeados
   - Clique em "Processar e Baixar Arquivos" para gerar o arquivo ZIP com os arquivos renomeados

## Tecnologias utilizadas

- Next.js
- React
- TypeScript
- Tailwind CSS
- XLSX (para processamento de arquivos Excel/CSV)
- JSZip (para geração de arquivos ZIP)
- React Dropzone (para upload de arquivos)

## Desenvolvimento

### Requisitos

- Node.js 18.0.0 ou superior
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

### Build para produção

```bash
# Gerar build de produção
npm run build

# Iniciar servidor de produção
npm start
```
