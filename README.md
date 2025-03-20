# Renomeador Automático de Arquivos (NameIt)

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.2.0-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Tauri-2.3.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri" />
</div>

## 📋 Sobre o Projeto

Aplicação desenvolvida para facilitar o processo de renomeação em lote de múltiplos arquivos utilizando uma planilha de referência no formato Excel (.xlsx) ou CSV (.csv). Ideal para professores, profissionais administrativos, gerentes de documentos e qualquer pessoa que precise lidar com grande volume de arquivos que precisam seguir um padrão específico de nomenclatura.

Disponível como aplicação web e como aplicativo desktop multiplataforma (Windows, macOS e Linux) através do Tauri.

## ✨ Funcionalidades

- ⬆️ Upload de múltiplos arquivos para renomeação
- 📊 Upload de um arquivo de referência (Excel ou CSV) contendo informações para renomeação
- 🔍 Seleção inteligente da coluna de correspondência para identificar os arquivos
- ✏️ Personalização avançada do formato de renomeação usando placeholders
- 👁️ Prévia em tempo real dos arquivos renomeados antes do processamento
- 📦 Download dos arquivos renomeados em um arquivo ZIP compactado
- 🔄 Processamento totalmente no navegador (sem envio de dados para o servidor)
- 📱 Interface responsiva para uso em dispositivos móveis e desktop
- 🖥️ Versão desktop nativa com Tauri para melhor desempenho e experiência do usuário

## 🚀 Como Usar

### 1. Selecione os Arquivos

- Faça upload dos arquivos que deseja renomear usando o botão de upload ou arraste-os para a área demarcada
- Importe o arquivo de referência (Excel ou CSV) contendo os dados para a renomeação
- Formatos suportados para a tabela de referência: `.xlsx`, `.xls`, `.csv`

### 2. Configure a Correspondência

- Selecione a coluna do arquivo de referência que será usada para identificar os arquivos
- A aplicação analisará inteligentemente e tentará encontrar correspondências entre os nomes dos arquivos e os valores na coluna selecionada
- Ajuste manualmente as correspondências caso necessário

### 3. Configure o Formato de Renomeação

- Use placeholders entre chaves como `{nome}`, `{matricula}`, etc. para personalizar o formato
- Os placeholders disponíveis serão mostrados com base nas colunas presentes no arquivo de referência
- Use `{extensao}` para manter a extensão original do arquivo
- Exemplo: `{nome}_{matricula}.{extensao}` → `JoaoSilva_12345.pdf`

### 4. Processe os Arquivos

- Visualize a prévia dos arquivos renomeados para confirmar as alterações
- Clique em "Processar e Baixar Arquivos" para gerar o arquivo ZIP
- O arquivo ZIP conterá todos os arquivos com seus novos nomes

## 🔧 Exemplo Prático

**Cenário:** Um professor precisa renomear 50 trabalhos de alunos para seguir um padrão institucional.

1. O professor faz upload dos 50 PDFs recebidos (com nomes como "Trabalho_Final.pdf", "Projeto João.pdf", etc.)
2. Importa uma planilha Excel contendo colunas como "Nome", "Matrícula", "Turma" e "Nota"
3. Seleciona a coluna "Nome" para fazer a correspondência com os arquivos
4. Define o formato de renomeação: `{matricula}_{nome}_turma{turma}.{extensao}`
5. Visualiza a prévia e faz ajustes se necessário
6. Baixa o ZIP com todos os arquivos renomeados segundo o padrão (ex: "12345_JoaoSilva_turmaA.pdf")

## 💻 Tecnologias Utilizadas

- **Next.js**: Framework React para renderização do lado do servidor e geração de sites estáticos
- **React**: Biblioteca JavaScript para construção de interfaces de usuário
- **TypeScript**: Superset tipado de JavaScript que compila para JavaScript puro
- **Tailwind CSS**: Framework CSS utilitário para design responsivo
- **XLSX**: Biblioteca para processamento de arquivos Excel/CSV no navegador
- **JSZip**: Biblioteca para geração de arquivos ZIP no navegador
- **React Dropzone**: Componente React para facilitar upload de arquivos
- **Tauri**: Framework para criar aplicativos desktop nativos usando tecnologias web

## 📱 Versão Desktop com Tauri

O projeto inclui uma versão desktop nativa construída com Tauri, oferecendo várias vantagens:

- **Desempenho nativo**: Execução mais rápida comparada a aplicações Electron
- **Tamanho reduzido**: Instaladores muito menores (geralmente menos de 10MB)
- **Segurança aprimorada**: Modelo de segurança mais restrito por padrão
- **Acesso ao sistema de arquivos**: Interação direta com arquivos locais
- **Experiência de usuário nativa**: Interface integrada ao sistema operacional

### Instalação da Versão Desktop

Baixe o instalador apropriado para seu sistema operacional na seção de [Releases](https://github.com/half144/rc-docs/releases) do GitHub.

Disponível para:

- Windows (.msi, .exe)
- macOS (.dmg, .app)
- Linux (.AppImage, .deb, .rpm)

## 🧰 Desenvolvimento

### Requisitos

- Node.js 18.0.0 ou superior
- npm ou yarn
- Rust (para desenvolvimento da versão Tauri)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/half144/rc-docs.git
cd rc-docs

# Instalar dependências
npm install
# ou
yarn install

# Iniciar servidor de desenvolvimento web
npm run dev
# ou
yarn dev

# Iniciar aplicação Tauri em modo de desenvolvimento
npm run tauri dev
# ou
yarn tauri dev
```

A aplicação web estará disponível em [http://localhost:3000](http://localhost:3000).

### Build para Produção

```bash
# Gerar build de produção web
npm run build
# ou
yarn build

# Iniciar servidor de produção web
npm start
# ou
yarn start

# Gerar instaladores da versão desktop (Tauri)
npm run tauri build
# ou
yarn tauri build
```

Os instaladores da versão desktop serão gerados na pasta `src-tauri/target/release/bundle`.

## 📝 Estrutura do Projeto

```
rc-docs/
├── src/                              # Código fonte frontend (Next.js/React)
│   ├── app/
│   │   ├── components/               # Componentes React
│   │   ├── page.tsx                  # Página principal da aplicação
│   │   ├── layout.tsx                # Layout da aplicação
│   │   └── globals.css               # Estilos globais
├── src-tauri/                        # Código fonte backend (Rust/Tauri)
│   ├── src/                          # Código Rust
│   ├── Cargo.toml                    # Dependências Rust
│   └── tauri.conf.json               # Configuração do Tauri
├── public/                           # Arquivos estáticos
├── package.json                      # Dependências e scripts
└── README.md                         # Este arquivo
```

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📧 Contato

Se você tiver dúvidas ou sugestões, por favor, entre em contato.

---

<div align="center">
  <p>Desenvolvido com ❤️ para simplificar o gerenciamento de arquivos</p>
</div>
