# Family Place (`family-pet`)

Plataforma web comunitária voltada para ajudar **famílias com crianças, tutores de pets, pessoas idosas e Pessoas com Deficiência (PCD)** a encontrarem estabelecimentos locais acolhedores e inclusivos, com **avaliação multicritério em 4 pilares**, listas de favoritos por critério e redirecionamento direto para o contato oficial do estabelecimento (sem intermediação financeira).

**Disciplinas Integradas:** Engenharia de Software (Prof. Fernando Marlon Soares Figueiredo) & Front-end (React)

---

## Estrutura Separada para as Duas Apresentações

| Pasta | Finalidade | Stack e Escopo |
| :--- | :--- | :--- |
| [docs/](docs/DOCUMENTO_FINAL_FAMILY_PLACE.md) | **Apresentação 1 (24/11) — Eng. de Software** | Documento Mestre Único (9 seções) e Pacote Completo de Artefatos Visuais/CSV |
| [mvp/](mvp/) | **Apresentação 1 (24/11) — MVP Opcional** | React + Vite isolado (`localStorage`), cobrindo exclusivamente as **9 histórias `Must` (`RF001–RF009`)** |
| [projeto-completo/](projeto-completo/) | **Apresentação 2 (Dezembro) — Projeto Completo** | **React + API Node.js + Banco de Dados SQLite**, cobrindo `RF001–RF014` (*Must + Should + Could*), Timeline, Cupons e Assistente IA |

---

## 1. Como Executar o MVP (Pasta `mvp/` — Apresentação 24/11)

```powershell
cd mvp
npm install
npm run dev
```

Acesse `http://localhost:5173`. Para testar rapidamente, clique em **Entrar / Cadastrar** e use **Entrar como Cliente Demo** ou **Entrar como Estabelecimento Demo**.

---

## 2. Como Executar o Projeto Completo (Pasta `projeto-completo/` — React + SQLite)

Requisitos: **Node.js 22+ ou 24+** (utiliza o módulo nativo `node:sqlite`, sem necessidade de compilar drivers nativos).

```powershell
cd projeto-completo
npm --prefix web install
npm run dev
```

- **Front-end React:** `http://localhost:5174`
- **API REST + Banco SQLite (`server/family-place.db`):** `http://localhost:3001`
- **Testes automatizados da API SQLite:** `npm --prefix projeto-completo run test:api`
- **Build de produção:** `npm --prefix projeto-completo run build`

---

## Documentação e Artefatos de Engenharia de Software

- **Documento Mestre Único (9 Seções):** [DOCUMENTO_FINAL_FAMILY_PLACE.md](docs/DOCUMENTO_FINAL_FAMILY_PLACE.md)
- **TAP e Escopo:** [PMCanvas (Markdown)](docs/artefatos/pmcanvas-family-place.md) · [PMCanvas (Visual SVG)](docs/artefatos/pmcanvas-family-place.svg)
- **Elicitação e Protótipos:** [Questionário, Roteiro e LGPD](docs/artefatos/elicitacao-questionario-roteiro.md) · [Wireframes Baixa Fidelidade (SVG)](docs/artefatos/wireframes-baixa-fidelidade.svg)
- **Requisitos:** [Planilha Versionada (CSV)](docs/artefatos/requisitos-family-place.csv)
- **EAP e Cronograma:** [EAP (draw.io)](docs/artefatos/eap-family-place.drawio) · [EAP (SVG)](docs/artefatos/eap-family-place.svg) · [Cronograma (CSV)](docs/artefatos/cronograma-family-place.csv) · [Gantt (SVG)](docs/artefatos/gantt-family-place.svg)
- **Backlog e Rastreabilidade:** [Backlog/Kanban (CSV)](docs/artefatos/backlog-kanban-planning-poker.csv) · [Kanban (SVG)](docs/artefatos/kanban-family-place.svg) · [Matriz de Rastreabilidade (CSV)](docs/artefatos/matriz-rastreabilidade.csv)
- **Atas e Roteiro:** [Atas de Reunião](docs/artefatos/atas-reuniao.md) · [Roteiro 12 min (24/11)](docs/artefatos/roteiro-apresentacao-12min.md)
