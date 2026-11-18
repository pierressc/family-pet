# Instrumentos de Elicitação e Evidências — Family Place

**Responsável pela Elicitação:** `[Integrante 2 - Nome]` (Apoio: Pierre Cavalcanti)  
**Técnicas Selecionadas (Mínimo exigido: 2):**
1. **Questionário Estruturado (Google Forms)** — para alcançar muitas pessoas rapidamente com perguntas fechadas e mensurar prioridades dos 4 pilares.
2. **Entrevista Semiestruturada** — para aprofundar dores reais de famílias, tutores de pets, idosos/PCD e gestores de estabelecimentos locais.
3. **Cenários de Uso (complementar)** — para validar o passo a passo da busca combinada e do contato externo antes dos wireframes.

---

## 1. Protocolo Ético e Cuidados com a Comunidade (LGPD)

Conforme orientações da disciplina e Lei nº 13.709/2018 (LGPD):
- **Consentimento explícito:** Antes de qualquer gravação, foto de infraestrutura ou preenchimento de formulário, o participante concorda com o termo abaixo.
- **Anonimização:** Nenhum nome completo, CPF, telefone pessoal ou endereço residencial de respondentes é publicado na documentação (usam-se códigos como `Resp-01`, `Entrev-01`, `Comércio-A`).
- **Texto do Termo de Consentimento (início do Google Forms e da Entrevista):**
  > *"Esta pesquisa faz parte de um projeto extensionista acadêmico da disciplina de Engenharia de Software para mapear dificuldades ao escolher locais inclusivos (crianças, pets, idosos e pessoas com deficiência). Suas respostas são anônimas e usadas apenas para fins educacionais de especificação do sistema Family Place. Você concorda em participar?"* `[ ] Sim, concordo` / `[ ] Não`

---

## 2. Técnica 1 — Questionário Estruturado (Google Forms)

**Público-alvo:** Pais/responsáveis, tutores de pets, idosos, familiares/cuidadores e PCDs da comunidade local.  
**Link do formulário aplicado:** `[Inserir link do Google Forms da equipe]`  
**Período de aplicação:** `18/11/2026 a 22/11/2026` *(meta OBJ2: ≥ 20 respostas)*

### Perguntas do Formulário

1. **Qual(is) perfil(is) melhor representa(m) suas saídas em família/comunidade?** *(Múltipla escolha)*
   - `[ ]` Acompanho criança(s) pequena(s)
   - `[ ]` Tenho animal(is) de estimação (pet)
   - `[ ]` Acompanho ou sou pessoa idosa
   - `[ ]` Acompanho ou sou Pessoa com Deficiência (PCD)
   - `[ ]` Gestor / proprietário de estabelecimento local

2. **Com que frequência você desiste de ir a um local ou passa por imprevistos por falta de informação sobre estrutura (trocador, rampa, espaço pet, ambiente calmo)?**
   - `( )` Nunca  `( )` Raramente  `( )` Às vezes  `( )` Frequentemente  `( )` Sempre

3. **Ao escolher um restaurante, café ou espaço de lazer, quais informações você considera indispensáveis? (Escolha até 4)**
   - `[ ]` Espaço kids / trocador / cadeirão
   - `[ ]` Rampa de acesso e banheiro adaptado (PCD)
   - `[ ]` Ambiente confortável e pouco ruidoso para idosos
   - `[ ]` Permissão para pets (área coberta, pote de água, porte aceito)
   - `[ ]` Avaliações detalhadas separadas por critério (não apenas nota única)
   - `[ ]` Preço médio / custo-benefício

4. **Você prefere ver uma nota única (0 a 5) ou notas separadas para Infantil, Acessibilidade, Pet e Atendimento?**
   - `( )` Nota única geral
   - `( )` Notas separadas por critério (4 pilares)
   - `( )` Tanto faz

5. **Você usaria listas de favoritos organizadas por companhia (ex.: "Para ir com meu avô", "Para levar o pet")?**
   - `( )` Sim, muito útil  `( )` Talvez  `( )` Não usaria

6. **Ao decidir visitar ou reservar um local encontrado na plataforma, como prefere entrar em contato?**
   - `( )` Ir direto para o WhatsApp ou site oficial do estabelecimento
   - `( )` Pagar/fechar pedido dentro da própria plataforma
   - `( )` Ligar por telefone

7. **Você acompanharia novidades/eventos de locais favoritos em uma timeline e resgataria cupons de fidelidade gratuitos?**
   - `( )` Sim, ambos  `( )` Apenas cupons  `( )` Apenas novidades  `( )` Não tenho interesse

8. **Você utilizaria um assistente virtual (chat) para perguntar em linguagem natural (ex.: "Onde almoçar hoje com criança e cachorro?") em vez de marcar vários filtros?**
   - `( )` Sim  `( )` Talvez  `( )` Não, prefiro os filtros tradicionais

### Registro Consolidado das Respostas (Amostra Real)

> **Nota de preenchimento:** Após fechar a coleta no Google Forms (meta até 20/11–22/11), preencher os números exatos abaixo e anexar o print/CSV exportado do Forms na apresentação.

- **Total de respostas válidas:** `[XX respostas — meta ≥ 20]`
- **Distribuição de perfis:** `[XX% crianças | XX% pets | XX% idosos/PCD]`
- **Principais achados e requisitos derivados:**
  - Achado Q2/Q3 (necessidade de combinar critérios simultaneamente) ➔ originou **`RF001`** e **`NF004`**.
  - Achado Q4 (preferência por avaliação segmentada) ➔ originou **`RF003`**, **`RF004`** e **`RF009`**.
  - Achado Q5 (listas por companhia) ➔ originou **`RF005`**.
  - Achado Q6 (contato direto sem intermediação de pagamento) ➔ originou **`RF008`** e **`RD002`**.
  - Achado Q7 (acompanhamento de eventos e cupons) ➔ originou **`RF010`**, **`RF011`** e **`RF012`**.
  - Achado Q8 (assistente conversacional como facilidade complementar) ➔ originou **`RF013`** (*Could*).

---

## 3. Técnica 2 — Roteiro e Registro de Entrevista Semiestruturada

**Objetivo:** Aprofundar o contexto real de quem frequenta e de quem gerencia espaços comerciais na comunidade.

### Roteiro — Bloco A: Frequentadores (Famílias, Tutores, Idosos/PCD)
1. Conte a última vez em que você teve dificuldade ao visitar um comércio/restaurante com criança, pet, idoso ou pessoa com deficiência.
2. Como você busca essas informações hoje (Google Maps, Instagram, WhatsApp, indicação)? O que costuma falhar?
3. Se pudesse avaliar um local em 4 pilares (Infantil, Acessibilidade/Conforto, Pet Friendly e Atendimento/Custo-Benefício), o que observaria em cada um?
4. Como um espaço de "Favoritos" ou um assistente de recomendação ajudaria no seu dia a dia?

### Roteiro — Bloco B: Gestores de Estabelecimentos Locais
1. Que estruturas inclusivas o seu estabelecimento oferece hoje (trocador, rampa, banheiro adaptado, área pet)? Como os clientes ficam sabendo disso?
2. Vocês já perderam clientes por falta de clareza sobre regras (ex.: porte de pet permitido ou acessibilidade)?
3. Como preferem receber reservas ou pedidos de contato de clientes vindos de um portal comunitário (WhatsApp, site, telefone)?
4. Qual seria o interesse em publicar novidades/eventos curtos e cupons de fidelidade gratuitos para atrair famílias e tutores?

### Registros das Entrevistas Realizadas

| ID Registro | Data | Participante (Anonimizado) | Responsável | Resumo dos Pontos-Chave Coletados | Requisitos Derivados |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ENT-01` | `[DD/11/2026]` | Mãe/responsável com criança pequena e pet (comunidade local) | `[Integrante 2]` | `[Inserir resumo real da conversa: ex. dificuldade de achar restaurante com área coberta pet + cadeirão; usa WhatsApp para confirmar]` | `RF001`, `RF003`, `RF008` |
| `ENT-02` | `[DD/11/2026]` | Familiar de pessoa idosa / PCD (comunidade local) | `[Integrante 2]` | `[Inserir resumo real: ex. fontes pequenas em cardápios/sites dificultam leitura; rampa íngreme ou banheiro sem barra não aparecem em notas genéricas]` | `RF002`, `RF004`, `NF002` |
| `ENT-03` | `[DD/11/2026]` | Gestor(a) de café / restaurante local | `[Integrante 1/2]` | `[Inserir resumo real: ex. prefere atendimento direto no WhatsApp sem pagar comissão de marketplace; quer divulgar eventos de fim de semana e itens favoritos da casa]` | `RF007`, `RF008`, `RF011`, `RF012`, `RD002` |

---

## 4. Validação dos Protótipos de Baixa Fidelidade

**Artefato visual associado:** [wireframes-baixa-fidelidade.svg](./wireframes-baixa-fidelidade.svg)

| Data da Validação | Público Participante (Anonimizado) | Telas Apresentadas | Ajustes Identificados na Validação |
| :--- | :--- | :--- | :--- |
| `[DD/11/2026]` | `[Ex.: 3 usuários do público-alvo + 1 comerciante]` | Busca combinada, Perfil 4 pilares, Avaliação, Favoritos e Painel do Local | `[Registrar feedback real: ex. deixar mais visíveis as tags de porte de pet e acessibilidade já no card de busca; incluir filtro de comentários por pilar (RF009)]` |
