# Family Place (`family-pet`)

Plataforma web comunitária voltada para ajudar **famílias com crianças, tutores de pets, pessoas idosas e Pessoas com Deficiência (PCD)** a encontrarem estabelecimentos locais acolhedores e inclusivos, com **avaliação multicritério em 4 pilares**, listas de favoritos por critério e redirecionamento direto para o contato oficial do estabelecimento (sem intermediação financeira).

**Disciplinas Integradas:** Engenharia de Software (Prof. Fernando Marlon Soares Figueiredo) & Front-end (React)

---

## Documento Final e Pacote de Entregáveis

- **Documento Mestre Único (9 Seções):** [DOCUMENTO_FINAL_FAMILY_PLACE.md](docs/DOCUMENTO_FINAL_FAMILY_PLACE.md)

### Artefatos Visuais e Planilhas de Apoio
| Etapa | Artefatos |
| :--- | :--- |
| **TAP e Escopo** | [PMCanvas (Markdown)](docs/artefatos/pmcanvas-family-place.md) · [PMCanvas (Visual SVG)](docs/artefatos/pmcanvas-family-place.svg) |
| **Elicitação** | [Questionário, Roteiro de Entrevista e Registros LGPD](docs/artefatos/elicitacao-questionario-roteiro.md) |
| **Protótipo (Baixa Fidelidade)** | [Wireframes das Telas Essenciais (SVG)](docs/artefatos/wireframes-baixa-fidelidade.svg) |
| **Requisitos** | [Planilha Versionada de Requisitos (CSV)](docs/artefatos/requisitos-family-place.csv) |
| **EAP e Cronograma** | [EAP (draw.io)](docs/artefatos/eap-family-place.drawio) · [EAP (SVG)](docs/artefatos/eap-family-place.svg) · [Cronograma Sommerville +50% (CSV)](docs/artefatos/cronograma-family-place.csv) · [Gantt (SVG)](docs/artefatos/gantt-family-place.svg) |
| **Backlog e Estimativas** | [Backlog, Histórias e Pontos (CSV)](docs/artefatos/backlog-kanban-planning-poker.csv) · [Quadro Kanban (SVG)](docs/artefatos/kanban-family-place.svg) |
| **Coerência e Rastreabilidade** | [Matriz de Rastreabilidade (CSV)](docs/artefatos/matriz-rastreabilidade.csv) |
| **Contribuição Rastreável e Apresentação** | [Atas de Reunião e Planning Poker](docs/artefatos/atas-reuniao.md) · [Roteiro da Apresentação de 12 min (24/11)](docs/artefatos/roteiro-apresentacao-12min.md) |

---

## Como Executar o MVP em React

O MVP funcional cobre 100% das **9 histórias Essenciais (`Must`: `RF001` a `RF009`)**, incluindo busca com filtros combinados em 15 estabelecimentos, avaliação multicritério nos 4 pilares, listas de favoritos por critério, contas Cliente/Estabelecimento, painel de gestão e contato direto via WhatsApp/Site sem intermediação financeira.

```powershell
npm install
npm run dev
```

Para gerar o bundle de produção:

```powershell
npm run build
```

Na janela **Entrar / Cadastrar**, utilize os botões **Entrar como Cliente Demo** ou **Entrar como Estabelecimento Demo** para testar imediatamente todos os fluxos durante a apresentação.

---

## Status do Projeto
- [x] Pacote completo de documentação e artefatos de Engenharia de Software estruturado na branch `main`
- [x] Desenvolvimento do **MVP em React** (histórias `Must` `RF001–RF009`, 31 pontos)
- [ ] Coleta final de campo e preenchimento dos nomes dos demais integrantes (`[Integrante 2–5]`)
