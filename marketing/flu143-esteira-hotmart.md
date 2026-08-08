# FLU-143 — A esteira de ofertas do sleepwired na Hotmart

**Data:** 2026-08-08 · **Pergunta do Ash:** "quais são as ofertas que podemos linkar aí? A plataforma como oferta primeira e principal, o Recovery Pack como upsell. O que seria OTO, cross-sell, etc."
**Base:** ativos que já existem no repositório (verificados ficheiro a ficheiro), posição fechada no `flu143-pesquisa-posicionamento.md`, mecânicas confirmadas na documentação pública da Hotmart.

---

## 0. A esteira em uma tela

```
ANÚNCIO (ângulo 3AM)
   ↓
ENQUETE 5 perguntas  →  RESULTADO (diagnóstico + EP4)     [grátis, não é produto Hotmart]
   ↓
1. FRONT     A plataforma, acesso vitalício           €27   ← oferta principal
   ↓ order bump no checkout
2. BUMP      Recovery Pack, 7 protocolos de recaída  +€19   → ticket €46
   ↓ 1 clique, sem redigitar cartão
3. OTO 1     WIRED, a série completa                  €37
   ↓ se recusar
4. DOWNSELL  Um protocolo avulso                       €9
   ↓ já dentro da plataforma, noite 5 a 7
5. CROSS     Segundo assento (parceiro) €17 · Sleep Kit (afiliado) €0 de custo
   ↓ depois da noite 7
6. CONTINUIDADE  Reset Season, pack anual pago uma vez €39/ano
   ↓ para quem quer ser levado pela mão
7. BACKEND   Recalibração personalizada sobre o sleep-log  €79 a €149
   ↓ transversal
8. AFILIADOS Hotmart, 50 a 60% de comissão, versões PT e ES
```

Ticket médio projetado com os degraus 1 a 4: **~€39**, contra €27 de preço de tabela. Os degraus 5 a 8 não entram no ticket da primeira compra, entram no LTV.

---

## 1. A trava que decide toda a esteira

A posição fechada na pesquisa é: *"O protocolo de 7 noites para quem adormece bem e acorda às 3h. Sem app, sem assinatura, sem coach. Pagas uma vez."*

Isso não é uma frase de copy, é uma restrição de arquitetura. **Toda oferta desta esteira tem de ser comprável de uma vez.** No momento em que a porta de entrada virar mensalidade, deixamos de ser a alternativa ao Sleep Reset de $297/28 dias e passamos a ser a versão barata dele, no terreno onde eles têm 3.817 reviews e nós não temos nenhuma.

Isto tem duas consequências práticas, e vale a pena engoli-las agora:

- O degrau 6 (recorrência) aparece como **pack anual pago uma vez**, não como assinatura. É a mesma receita anual sem contradizer a promessa da página de venda. Assinatura mensal fica em banho-maria: só se o pack anual vender.
- O acesso à plataforma **nunca** é revogável nem degradável. Nada de "acesso premium expira". O que se vende depois é conteúdo novo, nunca a devolução de algo que já era do cliente.

A tua formulação, "a plataforma é a oferta primeira e principal", encaixa nisto sem atrito: acesso vitalício à plataforma, pago uma vez. É literalmente a única faixa vazia do mapa do mercado.

---

## 2. A esteira, degrau a degrau

Legenda de ativos: **PRONTO** = o ficheiro está no repositório hoje · **PARCIAL** = existe matéria-prima, falta montar · **PRODUZIR** = não existe.

### Degrau 1. FRONT-END: a plataforma. €27 (âncora €47)

**O que é:** acesso vitalício ao protocolo das 7 noites dentro da app. Não é um PDF nem um pacote de áudios soltos: é onboarding, player noite a noite, sleep-log, cálculo de janela de sono e página de progresso.

**Ativo:** **PRONTO.** `public/audio/night-1..7.mp3` com legendas `.vtt`, mais `onboarding.tsx`, `night.tsx` (510 linhas), `sleep-log.tsx` (550), `progress.tsx`, `dashboard.tsx`.

**Por que a plataforma é a oferta principal e não o áudio:** é o que justifica os €27 contra um ebook de €9, e é o que impede a comparação directa com um pack de meditações. Também é o que dá o dado do degrau 7.

**Hotmart:** produto principal, pagamento único, checkout `pay.hotmart.com/<código>?off=<oferta>`. Criar **quatro ofertas** (`off=`) com o mesmo preço, uma por tipo de sono (maintenance, onset, mixed, circadian). Custa nada e resolve o degrau 2 (ver abaixo).

---

### Degrau 2. ORDER BUMP: Recovery Pack. +€19 (ticket €46)

**O que é:** os 7 protocolos situacionais para quando a insónia volta. Jet lag, ataque de ansiedade às 3h, insónia de domingo à noite, trabalho por turnos, pós-doença, pós-férias, reset rápido de 2 noites.

**Ativo:** **PRONTO.** Os 7 mp3 estão em `public/audio/recovery-*.mp3`. Confirmei um a um, incluindo o `sunday-night`. Já está vendido hoje no Stripe como bump de €19.

**Take-rate:** benchmark de indústria 30 a 45% para order bump relevante. Não é previsão nossa, nunca foi visto por tráfego pago.

**Hotmart:** Order Bump é nativo e gratuito, aparece no checkout com um clique e sem redireccionamento. Limitação a saber: o bump é configurado **por oferta**, é fixo. Como o funil já sabe o tipo de sono do visitante, isso vira vantagem: a oferta `off=maintenance` leva o bump com o título *"The 3AM Kit"* em destaque, a `off=onset` leva o mesmo pack com o título *"The Wind-Down Kit"*. Mesmo produto, mesma entrega, headline diferente conforme o que a pessoa acabou de responder.

---

### Degrau 3. OTO 1, um clique, logo após a compra. €37

**O que é:** WIRED, a série completa. Os episódios sobre o mecanismo, com o EP4 (*Why Exactly 3:07 AM*) como peça central.

**Ativo:** **PRONTO e parado.** `public/videos/eps/` tem ep1 a ep5 mais trailer, 163 MB de vídeo já produzido, mais as 16 imagens de `images/watch/`. Está tudo de graça em `/watch`, uma página que zero tráfego pago viu.

**Por que este e não outro:** é o único OTO que podemos lançar esta semana com custo de produção zero. O candidato "correcto" pela posição seria um *3AM Relapse Kit* novo, mas isso é duas a três semanas de produção para testar uma hipótese que ainda não sabemos se paga. Vender o que já está feito responde primeiro à pergunta que interessa: **este público paga por vídeo depois de comprar?** Se sim, produz-se o Relapse Kit e ele passa a ser o OTO 1, com a série a descer para downsell.

**O trade-off, dito de frente:** para vender a série, os EP3 a EP5 saem do `/watch` público. EP1 e EP2 ficam abertos, como topo de funil e prova. Perde-se conteúdo grátis de aquecimento, ganha-se um OTO de margem 100%.

**Take-rate:** benchmark 10 a 23% para OTO de um clique.

**Hotmart:** Funil de Vendas nativo, upsell com pagamento em um clique sem redigitar o cartão. O produto setup é o degrau 1.

---

### Degrau 4. DOWNSELL, para quem recusou o OTO. €9

**O que é:** um único protocolo, à escolha pelo tipo declarado. Para o maintenance, *3 AM Anxiety Attack*.

**Ativo:** **PRONTO.** É uma faixa do Recovery Pack vendida sozinha.

**Por que existe:** o "não" ao OTO raramente é "não quero", é "agora não são €37". A Hotmart tem downsell nativo no mesmo Funil de Vendas, portanto isto é configuração, não desenvolvimento. Receita 100% incremental sobre gente que hoje sai por €27.

**Cuidado:** quem já levou o Recovery Pack no bump **não pode** ver este downsell, seria vender-lhe o que ele já comprou. Regra de funil na Hotmart, a validar no painel.

---

### Degrau 5. CROSS-SELL, dentro da plataforma, noites 5 a 7

Aqui já não é upsell (mais do mesmo produto), é lateral. Momento certo: quando a pessoa está a usar e a ver resultado, não no checkout.

**5a. Segundo assento, €17.** Quem não dorme acorda quem dorme ao lado. Uma segunda conta para o parceiro, com o onboarding próprio. Ativo **PRONTO**, é o mesmo produto com outra conta. Também funciona como oferta de oferta (Natal).

**5b. Sleep Environment Kit, €0 de custo nosso.** Página com curadoria de equipamento (óculos anti-luz azul, despertador de nascer do sol, magnésio glicinato, tampões) em links de afiliado. Zero stock, zero entrega, comissão pura sobre tráfego que já confia na marca. **Fora da Hotmart**, é Amazon Associates ou equivalente. Obriga a disclosure de afiliado.

**5c. O diário físico, €17 + portes.** Print-on-demand (Printful, Gelato). **Não recomendo agora:** a Hotmart é infraestrutura para digital, o físico traz devoluções, portes e serviço ao cliente. Fica como ideia de marca para quando houver volume.

---

### Degrau 6. CONTINUIDADE sem quebrar a promessa. €39/ano, pago uma vez

**O que é:** *Reset Season*. Quatro entregas por ano ligadas ao calendário real da insónia: mudança de hora em Março e Outubro, insónia de inverno com falta de luz, o desregramento das festas de fim de ano. Compra-se uma vez, cobre doze meses.

**Ativo:** **PRODUZIR.** Uma faixa nova por trimestre mais o email que a acompanha. É o item de produção mais leve da lista depois do degrau 3.

**Por que assim e não assinatura mensal:** €39 pagos uma vez rendem quase o mesmo que €6,90/mês retidos seis meses (€41), sem contradizer "sem assinatura" na página de venda, sem exigir fluxo de cancelamento self-service, sem aviso de renovação e sem a revisão de termos que uma subscrição na UE obriga. É a mesma receita com um quinto do trabalho jurídico e zero custo de posicionamento.

**A Hotmart suporta assinatura nativa com trial** se um dia quisermos. A recomendação é não usar por enquanto.

---

### Degrau 7. BACKEND high-ticket. €79 a €149

**O que é:** recalibração personalizada. O cliente já registou 7 a 14 noites no `sleep-log`; nós analisamos, recalculamos a janela de sono e devolvemos um plano escrito para o caso dele.

**Ativo:** **PARCIAL.** O sleep-log e a calculadora de janela já existem, é a diferença entre "a app calcula" e "alguém olha para os teus dados". Falta o processo de entrega, que é semi-automatizável (modelo sobre os dados, revisão humana antes de enviar).

**Momento de venda:** dia 7, dentro da app, para quem registou pelo menos 5 noites. Nunca no checkout inicial.

**Bandeira de compliance, a sério:** isto vende-se como **educação e coaching**, nunca como terapia, tratamento ou diagnóstico médico. Sem promessa de cura, disclaimer obrigatório. Passa pelo Roger antes de ir para o ar.

---

### Degrau 8. AFILIADOS. A razão número um para estar na Hotmart

Esta é a parte que nenhuma das outras plataformas dá, e é a que responde ao problema real do projecto, que não é ticket médio, é **não haver tráfego desde 8 de Junho**.

O Mercado de Afiliados da Hotmart põe o produto à frente de gente que já tem audiência e só ganha se vender. Comissão de 50 a 60% no front-end é a norma no low-ticket, e a margem continua boa porque o custo marginal é zero e nós ficamos com a esteira toda a partir do degrau 3.

**A ressalva que decide o desenho:** a força de afiliados da Hotmart é esmagadoramente **PT-BR e ES**. Para EN e FR a plataforma não traz distribuição nenhuma, traz só custo. Como o site já fala as quatro línguas desde ontem, o desenho que faz sentido é dividido, e está na secção 4.

---

### O que NÃO fazer

- **Junk fees** (taxa de processamento, de acesso prioritário, de manutenção). Numa oferta que se sustenta em garantia de 60 dias, isso queima a confiança que faz a conversão. Já estava no FLU-24 e continua válido.
- **Assinatura como porta de entrada.** Mata a única posição vazia do mercado.
- **Gate no que já foi vendido.** Acesso vitalício quer dizer vitalício.
- **Empilhar os oito degraus antes de haver tráfego.** Ver secção 6.

---

## 3. Ticket médio projetado

Premissas rotuladas, todas benchmark de indústria, nenhuma medida por nós:

| Degrau | Preço | Take-rate assumido | Contribuição |
|---|---|---|---|
| 1. Plataforma | €27 | 100% | €27,00 |
| 2. Recovery Pack (bump) | €19 | 35% | €6,65 |
| 3. Série WIRED (OTO) | €37 | 12% | €4,44 |
| 4. Protocolo avulso (downsell) | €9 | 8% dos que recusaram | €0,63 |
| | | **AOV** | **≈ €38,70** |

Descontando a taxa Hotmart (9,9% + $0,50), líquido por comprador ≈ **€34,40**.

Degraus 5 a 8 não entram aqui: são LTV ao longo de semanas, não ticket de checkout.

---

## 4. Hotmart ou Stripe: a conta honesta

Hoje o checkout é Stripe e funciona (`routes/payments.ts`, checkout express, bump, OTO, webhook, claim de conta). Trocar tem custo. Vale a pena saber exactamente o que se ganha e o que se paga.

| | Stripe (hoje) | Hotmart |
|---|---|---|
| Taxa | ~2,9% + €0,25 | **9,9% + $0,50** |
| Numa venda de €46 | ~€1,58 | **~€5,05** |
| Order bump, upsell 1 clique, downsell | construído por nós, meio a um dia cada | **nativo, configuração no painel** |
| IVA na UE | **é nosso problema** (OSS, 19 a 27%) | **Hotmart é Merchant of Record**, assume IVA |
| Distribuição | nenhuma | **Mercado de Afiliados (PT, ES)** |
| Recebimento | D+7 | D+30 (antecipável, com custo) |
| Entrega do produto | já integrada | **é preciso construir** (secção 5) |

Duas leituras que mudam a decisão:

1. **Os 7 pontos percentuais de taxa compram três coisas:** o funil nativo que nos poupa uma a duas semanas de desenvolvimento, o IVA europeu que hoje é uma exposição por resolver (o Ash é residente na Suíça, portanto fora da UE, e vender digital a consumidores da UE cria obrigação de IVA que a Hotmart absorve como MoR), e um canal de afiliados. Se o IVA estiver mesmo por regularizar, isto sozinho paga a diferença. **Confirmar com o Juliano e o Roger antes de qualquer conclusão financeira.**
2. **Os afiliados só existem em PT e ES.** Em EN e FR a Hotmart cobra o triplo e não entrega distribuição.

**Recomendação: dividir por mercado.**
- **PT e ES na Hotmart.** Esteira completa, afiliados ligados, é o teste barato de "isto vende com tráfego de outra gente".
- **EN e FR continuam no Stripe**, que já está construído e é três vezes mais barato, até termos tráfego pago a funcionar.
- O código passa a escolher o checkout pelo idioma. Isso é uma linha de configuração, não uma migração.

Se preferires plataforma única para simplificar a operação, é uma escolha defensável e a esteira acima não muda: muda só quem processa.

---

## 5. O que a Hotmart não resolve: entregar o produto

Este é o ponto que costuma ser descoberto tarde. A Hotmart tem área de membros própria (Hotmart Club), mas **o nosso produto é a plataforma**, e ela é que tem o player, o sleep-log e o progresso. Portanto a Hotmart processa o pagamento e nós entregamos o acesso.

Spec da integração, para quando for para código:

1. Webhook `POST /api/webhooks/hotmart`, validado pelo header `hottok`.
2. Eventos a tratar: `PURCHASE_APPROVED` (cria utilizador, marca a compra, envia link de acesso), `PURCHASE_REFUNDED` e `PURCHASE_CHARGEBACK` (revoga), `PURCHASE_COMPLETE` (fim da garantia).
3. Distinguir o degrau pelo código de oferta que vem no payload: front, bump, OTO, downsell.
4. Reaproveitar o fluxo de claim que já existe em `routes/payments.ts:262` (`/auth/claim`). O email chega no payload, o resto do caminho é o mesmo do Stripe.
5. Atribuição: passar `sck` no link de checkout com o `utm_content` e o tipo de sono. A Hotmart devolve o `sck` no webhook, e a origem da venda fica fechada de ponta a ponta.

Trabalho estimado: um a dois dias, quase todo em reutilização.

---

## 6. Ordem de execução

O erro a não repetir é o de Junho a Agosto: construir a esteira toda antes de saber se a posição pega.

| # | O quê | Depende de | Custo |
|---|---|---|---|
| 0 | **Decidir: Hotmart em tudo, ou só PT/ES** | Ash | decisão |
| 1 | Criar produto e ofertas na Hotmart, uma por tipo de sono | 0 | 1 hora, painel |
| 2 | Configurar Order Bump (Recovery Pack) | 1 | 15 min, painel |
| 3 | Webhook de entrega de acesso | 1 | 1 a 2 dias, Diego |
| 4 | Funil de Vendas: OTO série + downsell avulso | 1, 3 | meio dia, painel + página |
| 5 | Religar tráfego, orçamento pequeno, ângulo 3AM | 1 a 4 | **decisão do Ash** |
| 6 | Afiliados PT/ES | 5 com números | painel |
| 7 | Degraus 5, 6 e 7 (cross-sell, Reset Season, backend) | dados do 5 | semanas |

**Os degraus 1 a 4 são configuração e um dia de código.** Tudo a partir do 6 só faz sentido com números reais. Nenhum destes passos torna o passo 5 dispensável: enquanto o tráfego estiver desligado, a esteira é uma hipótese bem desenhada e nada mais.

---

## 7. Já ficou no código

`src/lib/offers.ts` passa a ser o sítio único onde a esteira vive: os oito degraus como dados, com preço, código de oferta Hotmart e a que degrau pertencem. O `/plan` já sabe montar o link de checkout da Hotmart com `off`, `sck` e email pré-preenchido, e escolhe entre Stripe e Hotmart por configuração. Sem códigos de oferta configurados, o comportamento é exactamente o de hoje: Stripe, nada muda.

Trocar preço ou oferta é editar um ficheiro, não caçar constantes por cinco páginas.

---

## 8. Ressalvas

- Todas as take-rates são benchmark de indústria. **Nada nesta esteira foi visto por tráfego pago.** A última compra registada é de 22 de Maio.
- As mecânicas da Hotmart (order bump, upsell de um clique, downsell, MoR para IVA) estão confirmadas na documentação pública. As regras finas (excluir do downsell quem já levou o bump, comportamento exacto do `sck` em funil) confirmam-se no painel antes de dependermos delas.
- A conta do IVA é indicativa e não é minha para fechar. Juliano e Roger.
- O degrau 7 tem exposição regulatória real. Não vai para o ar sem revisão jurídica.

---

*Deliverable interno FLU-143. Complementa `flu24-taxas-funil-upsell.md` (esteira em Stripe) e `flu143-pesquisa-posicionamento.md` (posição). Copy de produto é EN; esta análise é interna PT-BR.*
