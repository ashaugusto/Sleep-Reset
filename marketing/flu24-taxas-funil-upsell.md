# FLU-24 — Taxas / Funil / Upsell: como montar o ticket médio do sleepwired

**Data:** 2026-07-12 · **Produto:** sleepwired.com (WIRED / Sleep Reset Method) · **Nicho:** insônia / CBT-I, mercado anglófono, produto digital (áudio + protocolo)

---

## 1. Onde o funil está hoje (fonte: código live)

| Rung | Oferta | Preço | Mecânica | Arquivo |
|---|---|---|---|---|
| Front-end | WIRED / Sleep Reset Method | **€27** (âncora €47) | 1x, lifetime, garantia 60 dias | `watch.tsx` `PRICE_TODAY=27` |
| Order bump | Recovery Pack (7 protocolos situacionais) | **+€19** | checkbox no checkout, re-precifica todos os CTAs → ticket €46 | `watch.tsx` `BUMP_PRICE`, `payments.ts` `STRIPE_PRICE_PREMIUM` |
| Pós-compra OTO | Recovery Pack (mesmo produto) | **€19** | `/upgrade?oto=1` p/ quem não pegou o bump | `upgrade.tsx`, `payments.ts:289` |

**Ticket máximo hoje = €46.** Estrutura sólida de *front + bump + OTO*, mas com **dois buracos grandes:**

1. **Zero receita recorrente.** Tudo é `mode: "payment"` (pagamento único). Num nicho onde o problema é *crônico e recorrente* (insônia volta em viagem, stress, mudança de estação), estamos deixando o LTV inteiro na mesa. Este é o lever nº1.
2. **O funil só sobe, nunca segura a queda.** Quem recusa o bump E o OTO sai por €27. Não há downsell para recuperar esse "não".

> ⚠️ **Nota de dados:** não temos aqui as take-rates reais (% que pega o bump, % que converte no OTO). Antes de priorizar por ROI, a Ana deve puxar do Stripe: `checkout.session.completed` com `metadata.bump_recovery_pack=1` vs. total. As projeções abaixo usam premissas rotuladas.

---

## 2. As "taxas" que cabem no nicho — menu priorizado

Organizado por **lucro-por-esforço**. Cada item reaproveita o máximo da arquitetura Stripe/checkout que já existe.

### 🟢 TIER 1 — Ship a seguir (baixo esforço, reaproveita o que já temos)

#### A. Downsell após recusa do OTO — €9 "protocolo avulso"
- **O quê:** quem clica "No thanks" no `/upgrade?oto=1` vê UMA oferta menor: um único protocolo do Recovery Pack (ex: *3 AM Anxiety Attack*) por **€9**.
- **Por que encaixa:** o "não" ao Recovery Pack raramente é "não quero" — é "€19 é muito agora". €9 recupera 15-25% desses.
- **Impacto:** +€9 sobre uma fatia hoje = €0. Receita 100% incremental.
- **Implementação:** novo `STRIPE_PRICE_MINI` (€9), rota clona `/api/checkout/upgrade` (`payments.ts:289`), página `/upgrade?downsell=1`. ~meio dia.
- **Compliance:** nenhuma bandeira. Mesma garantia.

#### B. Reframe do bump como escolha de tier (Good / Complete)
- **O quê:** em vez de checkbox "+€19", oferecer no checkout **duas opções lado a lado**: `Method €27` vs. `Complete (Method + Recovery Pack) €39`. O bundle a €39 ancora contra os €46 à-la-carte → sobe take-rate E AOV.
- **Por que encaixa:** decisão de tier converte melhor que add-on opcional (o comprador escolhe "qual versão", não "quero pagar mais?").
- **Impacto:** se hoje 25% pegam o bump (€46) e 75% ficam em €27 → AOV ≈ €31,75. Com tier bundle a €39 puxando take-rate p/ ~40% → AOV ≈ €31,80 mas com **margem maior por unidade premium** e caminho p/ testar €42/€44.
- **Implementação:** reusa `STRIPE_PRICE_PREMIUM` como 2º line item + cupom de −€6, OU um `STRIPE_PRICE_BUNDLE` dedicado. Frontend: trocar o checkbox `useBump` por um seletor de tier. ~1 dia. **Rodar como A/B contra o bump atual** antes de trocar.

### 🔵 TIER 2 — O motor de lucro do nicho (esforço médio, maior LTV)

#### C. Continuidade — assinatura "Sleep Guardian" · €6,90/mês ou €59/ano
- **O quê:** membership recorrente. Entregável mensal que faz sentido no nicho: **1 nova sessão guiada/mês, check-in de sono, protocolos sazonais** (mudança de horário out/mar, insônia de inverno/luz, festas de fim de ano), e trilha de *accountability*. Embutir **14–30 dias grátis em toda compra do Method** → converte na hora certa (quando o cliente já teve resultado).
- **Por que é o lever nº1:** insônia é crônica e recorrente. O modelo Calm/Headspace existe porque o problema volta. Hoje capturamos €27–46 uma vez; um assinante a €6,90/mês que fica 6 meses = **+€41 de LTV** por cabeça, com margem quase pura (áudio já produzido + 1 sessão nova/mês).
- **Impacto:** transforma o negócio de "venda única" em "base recorrente". Mesmo 8% dos compradores convertendo pós-trial move o LTV mais que qualquer bump.
- **Implementação (maior peça):** `mode: "subscription"` no Stripe, `STRIPE_PRICE_SUB_MONTH` / `_YEAR`, webhook `invoice.paid` + `customer.subscription.deleted` em `webhookHandlers.ts`, flag `subActiveUntil` no user, gate de conteúdo no dashboard, fluxo de cancelamento self-service (exigência UE/consumidor). ~1 semana. **Entregar via child-issue dedicada.**
- **Compliance:** assinatura na UE exige cancelamento fácil, aviso de renovação e trial claramente rotulado. Roger revisa os termos.

### 🟡 TIER 3 — Ascensão high-ticket (menor volume, maior margem por venda)

#### D. Recalibração personalizada / "Sleep Coaching" · €39–79
- **O quê:** oferta assíncrona — cliente manda 7 dias de sleep-log, recebe **janela de sono recalibrada + plano personalizado** (IA sobre os dados + revisão humana). Vendida no dia 5–7 do protocolo, quando o engajamento é máximo.
- **Por que encaixa:** parte do público quer hand-holding e paga por isso. Já temos o *sleep-window calculator* — isto é a versão "feita para você".
- **Impacto:** mesmo 3–5% a €49 é receita alta-margem sobre trabalho semi-automatizado.
- **Compliance (bandeira):** vender como **"coaching / educação"**, nunca "terapia" ou "tratamento médico". Sem claims de cura. Roger + disclaimer obrigatórios.

### 🟠 TIER 4 — Margem sem fulfillment (a "taxa" literal: frete)

#### E. Afiliados — "Sleep Environment Kit"
- **O quê:** página pós-compra + email com curadoria de gear (óculos blue-light, despertador nascer-do-sol, magnésio glicinato, tampões). **Links de afiliado** — zero estoque, zero fulfillment, comissão pura.
- **Impacto:** €0 de custo, receita passiva sobre tráfego que já converteu e confia na marca.
- **Compliance:** disclosure de afiliado (FTC/ASA) obrigatório.

#### F. Produto físico print-on-demand — "The Sleep Reset Journal" · €17 + frete
- **O quê:** diário de sono físico companion, impresso sob demanda (Printful/Gelato). Sem inventário. **O frete é a "taxa" literal** que soma ao ticket, e o objeto físico melhora retenção/brand.
- **Impacto:** AOV up + presença física da marca. Margem menor que digital mas incremental.
- **Compliance:** prazos de entrega e política de troca claros.

### ⚪ Extras oportunistas (baixo esforço, quando fizer sentido)
- **G. Gifting / 2º assento:** "ofereça uma noite a quem não dorme" — link de compra-presente. Sazonal (Natal). Fácil.
- **H. Order-bump sazonal:** ativar um bump de *transição de horário* nas semanas de mudança de relógio (mar/out). Reusa a mecânica do bump atual.

### ⛔ O que NÃO fazer
- **Junk fees** (taxa de "processamento", "acesso prioritário", "manutenção") numa oferta liderada por garantia de 60 dias **destroem a confiança** que sustenta a conversão. A resposta à pergunta "que taxas adicionar?" no nicho de sono é **valor recorrente + ascensão**, não fricção de cobrança.

---

## 3. Ticket médio projetado (ilustrativo — calibrar com dados da Ana)

| Cenário | AOV imediato | + LTV recorrente (6m) |
|---|---|---|
| Hoje (front + bump/OTO) | ~€31–35 | €0 |
| + Downsell (A) + Tier bundle (B) | ~€36–40 | €0 |
| + Sleep Guardian (C), 8% conv. @ €6,90 × 6m | ~€37 | **+€33/comprador** |
| + Coaching (D) 4% @ €49 | +€2 blended | — |

**Leitura:** os itens A/B mexem no ticket na margem; **o item C (recorrência) é o que muda o negócio de patamar.** Tudo o mais é otimização; a assinatura é estratégia.

---

## 4. Ordem de execução recomendada

1. **Ana** puxa take-rates reais do Stripe (bump %, OTO %, refund %) → calibra as premissas. *(1 dia, desbloqueia priorização)*
2. **A. Downsell €9** — quick win, receita 100% incremental. *(Diego, ~meio dia)*
3. **B. Tier bundle** como A/B contra o bump atual. *(Diego, ~1 dia)*
4. **C. Sleep Guardian (assinatura)** — child-issue dedicada, o motor de LTV. *(Diego + Roger nos termos, ~1 semana)*
5. **D/E/F** — ascensão e margem passiva, em paralelo conforme banda de esforço.

---

*Deliverable interno FLU-24. Copy de produto é EN; esta análise é interna (PT-BR). Números são ilustrativos até a Ana calibrar com Stripe.*
