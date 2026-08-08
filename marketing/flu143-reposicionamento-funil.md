# FLU-143 — Reposicionamento e reestruturação do funil (sleepwired)

**Data:** 2026-08-08 · **Produto:** sleepwired.com (WIRED / Sleep Reset Method) · **Nicho:** insônia, mercado anglófono
**Fonte dos números:** DB de produção (`engagement_events`, `users`, `leads`, `sleep_profiles`) + código live. Não é estimativa.

---

## 0. O achado que precede a pergunta

Antes de decidir VSL ou enquete, isto tem de ficar claro:

| Facto | Data |
|---|---|
| Última compra registada (`users.purchased_at`) | **2026-05-22** |
| Último evento de tracking de qualquer tipo | **2026-06-08 08:13** |
| Página WIRED/Netflix virou a homepage (`dc34422`) | **2026-06-07** |
| Eventos `watch_*` alguma vez registados | **0** |
| Leads desde 05 Jun | **1** (12 Jul) |

**Tradução:** o tráfego está desligado há dois meses. Tudo o que se construiu desde 7 de Junho — a série WIRED, os 5 episódios, os depoimentos, o order bump do Recovery Pack, a âncora de preço, o exit-intent, a correção do OG — **nunca foi visto por um visitante pago**. O `logEvent` da página está correto (mesmo endpoint `/api/sw/e` que a landing antiga, que gravava bem); simplesmente não houve quem disparasse.

Isto muda o diagnóstico do briefing. "As nossas páginas de vendas não estavam boas" é provavelmente verdade sobre a landing antiga — temos dados. Sobre a página atual **não temos evidência nenhuma**, nem boa nem má. Estamos a reescrever às cegas desde Junho.

> **Consequência prática:** a decisão nº1 não é de copy nem de layout. É religar tráfego com um orçamento pequeno e controlado. Sem isso, qualquer reestruturação de funil é opinião.

---

## 1. Resposta direta: VSL ou enquete?

**Enquete na entrada. VSL como fechador. Não é meio-termo — é o que os nossos próprios números mostram.**

### O que aconteceu com cada ativo (janela 25 Mai – 8 Jun)

**Enquete** (`quiz_start` dispara no load da página `/quiz`):

| Passo | N | Taxa |
|---|---|---|
| Chegou à enquete | 277 | — |
| Terminou as 10 perguntas | 20 | **7,2%** |
| Deu email (`quiz_complete`) | 5 | 1,8% |
| Clicou para checkout | 2 | **40% de quem terminou** |

**VSL** (na landing antiga, 542 `page_view`):

| Passo | N | Taxa |
|---|---|---|
| Autoplay iniciado | 130 | 24% dos page views |
| Sobreviveu 30s | 13 | **10%** |
| Chegou a 1 min | 8 | 6% |
| Chegou a 10 min | 1 | **0,8%** |

`cta_click` em toda a landing: 154 / 542 = 28,4%.

### A leitura honesta

**Os dois ativos sangram no mesmo sítio: os primeiros 30 segundos.** Nenhum está a ganhar. A diferença é que **a fuga da enquete é um problema de desenho e a do VSL é um problema de copy** — e já reescrevemos o VSL várias vezes sem mover o número.

Três coisas apontam para a enquete:

1. **A procura existe.** 277 pessoas abriram a enquete. Insone com 3 anos de problema quer descobrir "que tipo eu sou" — não quer ver mais um vídeo de vendas. O clique existe; é o meio que falha.
2. **Quem termina é ouro.** 2 em 5 completers clicaram para checkout — 40% contra 28% do site inteiro. Amostra minúscula (n=5), mas é o segmento de maior intenção em todo o dataset.
3. **A enquete produz um ativo que o VSL não produz:** dados de segmentação. É literalmente a matéria-prima da esteira de produtos que este briefing pede.

E há a razão de nicho: o comprador de insônia é um cético do "já tentei tudo" — melatonina, apps, chás, comprimidos. Uma promessa genérica bate no muro. Um diagnóstico não, porque não é promessa, é leitura. A enquete transforma a oferta de *anúncio* em *resultado*.

**Mas a enquete não fecha venda de €27 sozinha.** O mecanismo (hiperexcitação, o pulso de cortisol das 3h07) precisa de ser mostrado, não listado. É aí que o vídeo entra — a seguir ao resultado, para quem já se autoidentificou. É por isso que o formato é enquete → resultado → VSL/oferta, e não um ou outro.

---

## 2. Porque a enquete atual não funciona (e é corrigível)

Três falhas, todas no código, todas reparáveis:

**a) São 10 perguntas. 92,8% desiste.**
Idade, género, tipo, duração, frequência, impacto diurno, o que já tentou, stress, medicação, o que mudaria. Metade disto é pesquisa de mercado, não diagnóstico. Para o utilizador é um formulário; o custo aparece antes de qualquer retorno.

**b) A enquete não tem resultado.**
`quiz.tsx:288` redireciona para `/?h=<hero>&qp=<profile_id>`. Mas desde 7 de Junho a raiz `/` é o `watch.tsx` — **e o `watch.tsx` não lê `h` nem `qp`** (só a `landing.tsx` lê, nas linhas 223 e 617). Quem responde a 10 perguntas hoje é despejado numa página genérica de streaming, sem uma palavra sobre o que respondeu. O prémio prometido não é entregue. Isto sozinho explica boa parte do 1,8%.

**c) Pede o email antes de entregar valor.**
A captura está no passo 11, antes do resultado. Pedimos o pagamento (dados) antes de mostrar o produto (diagnóstico).

**Nenhuma destas é razão para abandonar o formato. São três bugs de funil.**

---

## 3. Reposicionamento: parar de vender "insônia"

Os 12 perfis de enquete que temos:

| Tipo | N | % |
|---|---|---|
| **maintenance** (acorda às 3–4h e não volta) | **8** | **67%** |
| onset (não adormece) | 2 | 17% |
| circadian | 1 | 8% |
| mixed | 1 | 8% |

Dois terços do público que se autoqualificou tem **um** problema: acordar de madrugada. Não é insônia genérica. Já temos o ativo certo — o EP4, *"Why Exactly 3:07 AM"* — mas ele está enterrado como quarto episódio de uma série, atrás de conteúdo mais fraco.

**Reposicionamento proposto:** o sleepwired deixa de ser "um método para dormir melhor" e passa a ser **o produto para quem acorda às 3 da manhã**. Ângulo único, mecanismo único (o pulso de cortisol), promessa única. Amostra pequena, mas é a única evidência de segmento que temos — e um posicionamento estreito é testável; um largo não é.

---

## 4. O funil reestruturado

O FLU-24 já mapeou a esteira (bump €19, OTO €19, downsell €9, subscrição, coaching). O que falta — e é o que este briefing pede — é **ligar a esteira ao tipo de sono declarado na enquete**. A oferta não deve ser a mesma para os dois terços que acordam às 3h e para quem não adormece.

```
ANÚNCIO (ângulo 3AM)
   ↓
ENQUETE — 5 perguntas, sem email        ← corta de 10 para 5
   ↓
PÁGINA DE RESULTADO — "You're a Maintenance Type"
   diagnóstico + mecanismo + EP4 embebido  ← o VSL vive aqui
   email pedido AQUI, para receber o plano ← depois do valor
   ↓
OFERTA — WIRED Method €27, hero e copy do tipo declarado
   ↓ bump por tipo: 3AM Protocol (maintenance) | Wind-Down (onset) — €19
   ↓ OTO €19  →  downsell €9
   ↓
Sleep Guardian €6,90/mês (o motor de LTV — ver FLU-24 §C)
```

Mudanças face a hoje:
- **Enquete de 5 perguntas** (tipo, duração, frequência, o que já tentou, impacto diurno). As outras cinco saem — ou passam para pós-compra, onde não custam conversão.
- **Página de resultado real**, que hoje não existe. É a peça que falta no funil inteiro.
- **Email depois do diagnóstico**, não antes.
- **Bump escolhido pelo tipo**, não fixo.
- Ticket mantém-se €27 / €46 com bump. Não mexer em preço enquanto não houver tráfego para medir — baixar preço às cegas queima a única âncora que temos.

---

## 5. Estilo: escolher um

Hoje há dois em competição, e isso é pior do que qualquer um deles isolado:
- `watch.tsx` — Netflix escuro, editorial, entretenimento (a raiz)
- `landing.tsx` — clínico claro (#FAFAF7 + navy), credibilidade (em `/start`)

**Proposta: o estilo clínico-diagnóstico é a espinha da conversão. O WIRED continua como camada de conteúdo e criativo de anúncio.**

Razão: quem paga €27 com garantia de 60 dias e já falhou com cinco soluções compra por **credibilidade**, não por produção. O enquadramento Netflix é excelente para parar o scroll no Meta e para reter atenção nos episódios — e é um enquadramento estranho para entregar um cartão de crédito. Enquete, resultado e checkout ficam no estilo clínico; os episódios WIRED vivem *dentro* dele, como prova.

Isto não deita fora o trabalho da série — reposiciona-o do sítio errado (a caixa registadora) para o sítio certo (o topo do funil e a prova).

---

## 6. Ordem de execução

| # | O quê | Dono | Porquê primeiro |
|---|---|---|---|
| 0 | **Religar tráfego** — orçamento pequeno, ângulo 3AM | **Ash** (decisão) + Alex | Sem isto nada abaixo é mensurável |
| 1 | Enquete 5 perguntas + página de resultado + email pós-valor | Diego | Repara o buraco que mata 92,8% |
| 2 | Take-rates reais do Stripe (bump %, OTO %, refund %) | Ana | Calibra o FLU-24 antes de investir na esteira |
| 3 | Bump por tipo de sono + downsell €9 | Diego | Ticket médio, receita incremental |
| 4 | Sleep Guardian €6,90/mês | Diego + Roger | O motor de LTV (FLU-24 §C) |

**O passo 0 não é opcional e não é meu para decidir.** Enquanto o tráfego estiver desligado, os passos 1–4 continuam a ser construção às cegas — exatamente o que fizemos entre Junho e hoje.

---

## Ressalvas

- `quiz_complete` = 5 e `quiz_questions_done` = 20 são amostras pequenas. A direção (7,2% de conclusão) é grande demais para ser ruído; o 40% de CTR dos completers **não é** conclusivo e não deve ser citado como facto para fora.
- Os 12 perfis de enquete não são uma amostra representativa do mercado — são de quem clicou nos nossos anúncios, com os nossos ângulos. Confirmar com o primeiro lote de tráfego novo.
- Os eventos são da landing antiga. Não descrevem a página atual, porque a página atual não tem dados.

---

*Deliverable interno FLU-143. Complementa o FLU-24 (esteira/upsell). Copy de produto é EN; esta análise é interna PT-BR.*
