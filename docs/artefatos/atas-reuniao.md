# Atas de Reunião e Registro de Contribuição Rastreável — Family Place

Este arquivo registra as reuniões curtas da equipe, decisões tomadas, sessões de Planning Poker e presença dos integrantes, servindo como evidência de **Contribuição Rastreável** (critério individual da disciplina).

---

## Ata 01 — Definição do Tema, Integração de Disciplinas e Papéis
- **Data:** 18/11/2026
- **Participantes:** Pierre Cavalcanti (Coordenação), `[Integrante 2 - Requisitos]`, `[Integrante 3 - Planejamento]`, `[Integrante 4 - Backlog]`, `[Integrante 5 - Qualidade]`
- **Pauta e Decisões:**
  1. Definida a unificação do projeto extensionista de Engenharia de Software com o projeto de Front-end React sob o nome **Family Place** (`family-pet`).
  2. Delimitado o público comunitário real: famílias com crianças pequenas, tutores de pets, pessoas idosas, Pessoas com Deficiência (PCD) e comércios locais inclusivos.
  3. Definido o **escopo negativo** explícito: sem processamento de pagamentos, sem delivery próprio, sem avaliação por item de cardápio e sem app mobile nativo nesta entrega.
  4. Adotado o processo **Híbrido (Scrum + Kanban)** e definidos os papéis por seção do documento final.
- **Próximos passos:** Elaborar PMCanvas, TAP, questionário no Google Forms e roteiro de entrevistas.

---

## Ata 02 — Elicitação, Wireframes e Revisão de Requisitos
- **Data:** 19/11/2026 *(prever atualização com registro pós-campo)*
- **Participantes:** Pierre Cavalcanti, `[Integrante 2]`, `[Integrante 3]`, `[Integrante 4]`, `[Integrante 5]`
- **Pauta e Decisões:**
  1. Revisados os instrumentos de elicitação (Google Forms + Roteiro de Entrevista Semiestruturada) com termo de consentimento e anonimização (LGPD).
  2. Estruturados os wireframes de baixa fidelidade das 6 telas principais (Busca combinada, Perfil 4 pilares + Vitrine/WhatsApp, Avaliação 4 pilares, Favoritos por critério, Painel do Estabelecimento e Timeline/Cupons/Chat).
  3. Fechada a especificação de `RU01–RU08`, `RF001–RF015` (distribuição MoSCoW: 60% Must, 20% Should, 13,3% Could, 6,7% Won't), `NF001–NF006` verificáveis e `RD001–RD004`.
  4. Assistente Virtual (`RF013`) classificado como `Could` para proteger o prazo do MVP React.

---

## Ata 03 — Sessão de Planning Poker e Validação do Cronograma
- **Data:** 19/11/2026 *(sessão de estimativa de backlog)*
- **Participantes:** Pierre Cavalcanti (Facilitador), `[Integrante 2]`, `[Integrante 3]`, `[Integrante 4]`, `[Integrante 5]`
- **Metodologia:** Escala Fibonacci (`0, ½, 1, 2, 3, 5, 8, 13`), votação secreta simultânea, justificativa do maior para o menor em caso de divergência e nova votação até consenso (**sem média aritmética**).
- **Registro de Divergências Relevantes:**
  - **História `H01` (Busca com filtros combinados — `RF001`):** Na 1ª rodada, `[Integrante 4]` votou **3** (considerando apenas filtro simples em array React), enquanto Pierre Cavalcanti e `[Integrante 2]` votaram **8** (considerando combinação simultânea entre os 4 pilares, contagem dinâmica e desempenho `NF004 ≤ 1s`). Após debate sobre o critério de aceite, a equipe convergiu em consenso para **5 pontos**.
  - **História `H03` (Assistente Virtual / Chatbot — `RF013`):** Divergência inicial entre **5** (`[Integrante 3]`) e **13** (`[Integrante 5]`). Considerando a possibilidade de fluxo guiado com fallback para linguagem natural, o consenso fechou em **8 pontos** (e prioridade `Could`).
  - **História `H14` (Clube de Fidelidade e Cupons — `RF012`):** Divergência entre **3** e **5** pontos devido à regra de bloqueio por validade (`RD004`); consenso em **5 pontos**.
- **Resultado Total:** 54 pontos no backlog ativo (`H01–H14`), sendo 31 pontos em histórias `Must` (foco do MVP React).

---

## Ata 04 — Revisão de Coerência, Ensaio da Apresentação e Transição para o MVP React
- **Data:** `[21/11/2026 a 23/11/2026 — A preencher após ensaio]`
- **Participantes:** Todos os integrantes
- **Pauta:**
  1. Conferência da Matriz de Rastreabilidade (0 lacunas entre `OBJ`, `RU`, `RF`, `EAP`, `Marcos` e `Histórias`).
  2. Ensaio cronometrado da apresentação de **7 min + 1 min tolerância + 4 min perguntas individuais** para 24/11/2026.
  3. Liberação da etapa `4.2` (MVP React das histórias `Must`) após apresentação da documentação.
