# LensScore

LensScore e uma aplicacao web para criacao, leitura e correcao de provas de multipla escolha com apoio a leitura OMR, gestao de turmas, lancamento de notas e relatorios de desempenho.

O projeto foi estruturado como frontend em Next.js e consome APIs externas para autenticacao, dados academicos e processamento do scanner. Para desenvolvimento local, ele tambem oferece um modo mock que elimina boa parte dessas dependencias e permite testar o fluxo principal com dados locais.

## Visao geral

O fluxo principal da aplicacao e:

1. O usuario faz login.
2. A aplicacao carrega turmas disponiveis e turmas confirmadas.
3. O instrutor pode se candidatar a turmas, lancar notas ou abrir o fluxo de correcao.
4. Na area de camera, o usuario pode criar provas, selecionar uma prova ativa, abrir o scanner, revisar a leitura e consultar relatorios.
5. As informacoes de provas, turmas locais e submissoes ficam persistidas no navegador para manter a experiencia entre recargas de pagina.

## Funcionalidades atuais

- Login com autenticacao real por API ou com usuarios mockados.
- Dashboard de provas com criacao, exclusao, impressao e relatorios.
- Cadastro manual de gabaritos com 1 a 50 questoes.
- Impressao de folha de resposta e prova completa.
- Gestao de turmas com listagem de candidaturas e turmas confirmadas.
- Lancamento de notas por turma.
- Fluxo de correcao com contexto pendente transferido por `sessionStorage`, sem expor dados sensiveis na URL.
- Persistencia local com Zustand e `localStorage`.
- Modo mock para usuarios, turmas, alunos, candidaturas, resultados e provas.

## Stack tecnica

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- Zustand
- Zod
- Lucide React

## Rotas principais

- `/`
  Redireciona automaticamente para `/turmas`.
- `/login`
  Tela de autenticacao.
- `/turmas`
  Lista turmas disponiveis, turmas confirmadas e abre o modal de atribuicao/correcao de notas.
- `/camera`
  Reune dashboard, criacao de prova, criacao de turma, scanner, impressao e relatorios.

## Estrutura do projeto

```text
app/
  layout.tsx              Shell raiz da aplicacao
  page.tsx                Redirect inicial para /turmas
  login/page.tsx          Tela de login
  turmas/page.tsx         Gestao de turmas e lancamento de notas
  camera/page.tsx         Dashboard principal de provas e scanner

components/
  dashboard/              Cards, tabs e acoes do painel principal
  exam/                   Criacao de provas, impressao e gabaritos
  scanner/                Captura, processamento e revisao da leitura
  turmas/                 Modal de atribuicao e correcao de notas
  layout/                 Cabecalho e logo da aplicacao
  ui/                     Componentes base reutilizaveis

lib/
  auth.ts                 Sessao, token e autenticacao
  api-config.ts           Resolucao de URLs das APIs e chave de mock
  turmas.ts               Integracao de turmas, alunos e resultados
  mock-data.ts            Dados e operacoes locais para ambiente mock
  types.ts                Tipos principais do dominio

store/
  exam-store.ts           Estado persistido de provas, turmas locais e submissoes

public/
  images/                 Assets estaticos do projeto
```

## Requisitos

- Node.js 20.15 ou superior
- npm 10 ou superior

Observacao: o build de producao foi validado com Node 20.15. Versoes mais antigas de Node podem falhar com Next.js 16.

## Como rodar localmente

### 1. Instale as dependencias

```bash
npm install
```

### 2. Configure o ambiente

Crie um arquivo `.env.local` com base em `env-example`:

```bash
cp env-example .env.local
```

Exemplo:

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_SCAN_API_BASE_URL=https://scanner.example.com
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

### 3. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

### 4. Gere o build de producao

```bash
npm run build
```

### 5. Suba o build localmente

```bash
npm run start
```

## Variaveis de ambiente

| Variavel | Obrigatoria | Descricao |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Sim | Quando `true`, a aplicacao usa dados locais para autenticacao, turmas, alunos, candidaturas, resultados de turma e provas. |
| `NEXT_PUBLIC_API_BASE_URL` | Sim em modo real | Base URL da API principal da aplicacao. |
| `NEXT_PUBLIC_SCAN_API_BASE_URL` | Sim para usar o scanner | Base URL do servico de processamento OMR. |

## Modo mock

Quando `NEXT_PUBLIC_USE_MOCK_DATA=true`, o projeto passa a usar dados locais para:

- Login
- Sessao do usuario
- Listagem de turmas
- Informacoes do instrutor
- Listagem de alunos por turma
- Candidatura como instrutor ou trainee
- Salvamento de resultados de turma
- Listagem de provas
- Criacao de provas
- Exclusao de provas

### Credenciais de teste

Use qualquer um dos acessos abaixo:

| Perfil | Usuario ou email | Senha | Observacao |
| --- | --- | --- | --- |
| Instrutora principal | `ana.ribeiro` ou `ana.ribeiro@lensscore.test` | `teste123` | Fluxo completo de turmas e camera |
| Usuario com camera restrita | `carlos.menezes` ou `carlos.menezes@lensscore.test` | `teste123` | Redirecionado de `/camera` para `/turmas` |

### Importante sobre o modo mock

Mesmo com o modo mock ativo, ainda existem pontos que dependem de APIs externas:

- O scanner continua enviando a imagem para `POST /processar` na API configurada em `NEXT_PUBLIC_SCAN_API_BASE_URL`.
- A revisao final do scanner ainda chama `POST /api/salvar-nota` na API principal.

Ou seja: o modo mock cobre dados de negocio e catalogos principais, mas nao simula o OCR nem o endpoint de salvamento individual vindo do fluxo de scanner.

## Persistencia local no navegador

O projeto usa `localStorage` e `sessionStorage` para manter estado entre navegacoes.

### localStorage

- `lensscore.user-session`
  Dados do usuario autenticado.
- `lensscore.auth-token`
  Token usado para considerar a sessao autenticada.
- `lensscore-storage`
  Estado persistido do Zustand com provas, turmas locais, selecoes ativas e submissoes.
- `lensscore.mock-exams.<userId>`
  Catalogo de provas mock por usuario autenticado.

### sessionStorage

- `lensscore.pending-grade-context`
  Contexto temporario da correcao pendente entre `/turmas` e `/camera`, evitando expor nome, matricula, inscricao, status e nota na query string.

## Scripts disponiveis

| Script | Descricao |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento com Next.js. |
| `npm run build` | Gera o build de producao. |
| `npm run start` | Sobe a aplicacao a partir do build gerado. |

## Contrato das APIs externas

### API principal (`NEXT_PUBLIC_API_BASE_URL`)

Endpoints atualmente esperados pelo frontend:

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/api/login` | Login do usuario |
| `GET` | `/api/v1/getUser` | Dados do usuario autenticado |
| `POST` | `/api/v1/curso/turmas-instrutor?page={page}` | Listagem de turmas |
| `GET` | `/api/v1/instrutor/get-curso-instrutor-user` | Cursos/permissoes do instrutor |
| `GET` | `/api/v1/curso/{turmaId}/alunos` | Lista de alunos da turma |
| `GET` | `/api/v1/curso/{turmaId}/aprovar-estudantes` | Dados auxiliares de aprovacao/lancamento |
| `POST` | `/api/v1/instrutor/adiciona-turma-instrutor` | Candidatura em turma |
| `POST` | `/api/v1/inscricao/alterar-certificados` | Salvamento em lote dos resultados da turma |
| `GET` | `/api/listar-provas` | Carregamento de provas |
| `POST` | `/api/salvar-info-prova` | Criacao de prova |
| `POST` | `/api/delete-prova` | Exclusao de prova |
| `POST` | `/api/salvar-nota` | Salvamento da nota vindo do scanner |

### API do scanner (`NEXT_PUBLIC_SCAN_API_BASE_URL`)

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/processar` | Envia a imagem da prova para leitura OMR |

O frontend envia um `FormData` com os campos:

- `img`
- `id_tipo_curso`
- `tipo_prova`

## Regras de negocio relevantes no frontend

- Usuarios com `B2BouInstrutor === 104` sao considerados com camera restrita e nao podem acessar `/camera`.
- O titulo da prova e gerado automaticamente a partir do curso e do numero da prova.
- Em modo mock, as provas ficam isoladas por usuario autenticado.
- Ao trocar a prova ativa, o dashboard e o scanner passam a operar sobre o gabarito selecionado no estado persistido.
- Quando uma correcao e iniciada a partir de uma turma, o contexto e transportado por `sessionStorage` ate a tela de camera.

## Fluxos importantes

### Criacao de prova

1. O usuario informa curso, numero da prova e gabarito.
2. O titulo e gerado automaticamente.
3. Em modo mock, a prova e salva em `localStorage` por usuario.
4. Em modo real, a prova e enviada para a API principal.

### Correcao de prova

1. O usuario acessa `/camera`.
2. Seleciona a prova ativa.
3. Captura a imagem no scanner.
4. A imagem e enviada ao servico de OCR.
5. O resultado e revisado manualmente.
6. A nota e enviada para a API principal.

### Lancamento por turma

1. O usuario abre a turma em `/turmas`.
2. Visualiza alunos, status e nota atual.
3. Ajusta os resultados e salva em lote.
4. Em modo mock, o salvamento atualiza os dados locais.
5. Em modo real, o salvamento vai para a API principal.

## Limitacoes atuais

- O repositorio nao inclui o backend principal nem o servico de OCR; ambos sao integracoes externas.
- O script de lint ainda nao esta funcional sem configuracao adicional do ESLint.
- O fluxo do scanner ainda depende de APIs reais mesmo com o modo mock ativo.

## Sugestoes para evolucao

- Adicionar ESLint e padrao de formatacao oficial do projeto.
- Criar um mock completo para o fluxo do scanner, inclusive OCR e salvamento da nota.
- Adicionar testes automatizados para auth, turmas e fluxo de provas.
- Introduzir um backend adapter para facilitar a troca entre ambientes real e mock.

## Publicacao

Para publicar o projeto em outro ambiente, o minimo necessario e:

1. Configurar as variaveis de ambiente corretas.
2. Garantir Node 20+ no ambiente de build.
3. Decidir se o deploy vai usar `NEXT_PUBLIC_USE_MOCK_DATA=true` ou APIs reais.
4. Validar `npm run build` antes de publicar.

---

Se este repositorio for usado como base publica, vale manter este README sincronizado sempre que houver mudanca em endpoints, chaves de storage ou cobertura do modo mock.