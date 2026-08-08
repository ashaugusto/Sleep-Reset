# FLU-143 — A esteira de ofertas do sleepwired na Hotmart

**Data:** 2026-08-08 · **Pergunta do Ash:** "quais são as ofertas que podemos linkar aí? A plataforma como oferta primeira e principal, o Recovery Pack como upsell. O que seria OTO, cross-sell, etc."
**Base:** ativos que já existem no repositório (verificados ficheiro a ficheiro), posição fechada no `flu143-pesquisa-posicionamento.md`, mecânicas confirmadas na documentação pública da Hotmart.

---

## Decisões fechadas pelo Ash, 8 de Agosto de 2026

Este documento foi escrito com três perguntas em aberto. Estão respondidas. O que está escrito abaixo delas continua válido como raciocínio, mas onde a recomendação foi contrariada, vale a decisão.

| Pergunta | Recomendação do documento | **Decisão do Ash** |
|---|---|---|
| Que mercados na Hotmart | Só PT e ES, EN e FR ficam no Stripe | **Hotmart em tudo** |
| Qual é o OTO 1 | A série WIRED, já produzida, €37 | **Produzir o 3AM Relapse Kit, €47** |
| Como entra a recorrência | Reset Season, €39/ano pago uma vez | **Reset Season** (confirmada) |

**Hotmart em tudo.** Custa cerca de €3,50 a mais por venda em EN e FR, e compra um só painel, um só conjunto de regras de funil e o estatuto de Merchant of Record aplicado aos quatro idiomas em vez de dois. A conta de IVA da secção 4 passa a estar coberta em todo o lado, não só em PT e ES. O filtro por idioma fica no código como caminho de volta: `VITE_HOTMART_LOCALES=pt,es` devolve EN e FR ao Stripe sem escrever lógica nova.

**O OTO 1 é o Kit, não a série.** É a opção que o documento marcou como "duas a três semanas antes de haver OTO nenhum", e essa é a consequência aceite: enquanto o Kit não estiver escrito, o funil não tem degrau 3. Em troca, o OTO passa a estar alinhado com a posição (o despertar das 3h) em vez de ser vídeo sobre o mecanismo, e a série WIRED **fica inteira e grátis em `/watch`**, como topo de funil e criativo de anúncio. Isto também fecha a decisão de estilo por outro caminho: cinema do lado do anúncio, clínica do lado da compra. Nenhum episódio sai do ar.

**Reset Season a €39/ano pagos de uma vez.** Sem assinatura, portanto sem fluxo de cancelamento self-service, sem aviso de renovação e sem a revisão de termos que uma subscrição na UE obriga. Na Hotmart cria-se como produto de pagamento único, nunca como plano recorrente.

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
3. OTO 1     3AM Relapse Kit                          €47   [por produzir]
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

### Degrau 3. OTO 1, um clique, logo após a compra. €47

**Decidido:** o *3AM Relapse Kit*. A série WIRED foi a alternativa e foi recusada; fica grátis em `/watch`, inteira, como topo de funil.

**O que é:** o kit para a noite em que a insónia volta depois do protocolo ter funcionado. O produto principal ensina a dormir sete noites; este ensina a recuperar a oitava vez que falha, que é quando o cliente perde a fé no método e pede reembolso. Vende-se a quem acabou de comprar porque é exactamente o medo que ele tem no momento em que paga: *"e quando voltar?"*

**Ativo:** **POR PRODUZIR.** Duas a três semanas. Enquanto não existir, o funil não tem degrau 3 e vai do bump directo para dentro da plataforma. Consequência aceite na decisão.

**Por que este e não a série:** a série é vídeo sobre o mecanismo, e o mecanismo já foi comprado no degrau 1. O Kit está na posição fechada (o despertar das 3h) e é accionável na cama, às 3h, que é onde este público está quando se lembra de nós. Ficar de graça também dá à série o único trabalho que ela faz bem hoje: aquecer tráfego frio antes da enquete.

**Take-rate:** benchmark 10 a 23% para OTO de um clique. Sem histórico próprio.

**Âmbito de produção, para o degrau caber em duas a três semanas:** um protocolo de emergência de 20 minutos em áudio, um cartão impresso de uma página com o que fazer nos primeiros 90 segundos depois de acordar, e três variantes curtas por gatilho (ansiedade, álcool, mudança de horário). Reaproveita a voz, o formato e a cadeia de produção dos áudios das noites 1 a 7, que já existem.

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

**A ressalva que fica de pé:** a força de afiliados da Hotmart é esmagadoramente **PT-BR e ES**. Em EN e FR a plataforma não traz distribuição nenhuma, traz só custo, e isso continua verdade depois da decisão de processar tudo lá. O que muda é a leitura: em PT e ES a taxa paga distribuição, em EN e FR paga o IVA e a operação única. Recrutar afiliados só faz sentido nas versões PT e ES.

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
| 3. 3AM Relapse Kit (OTO) | €47 | 12% | €5,64 |
| 4. Protocolo avulso (downsell) | €9 | 8% dos que recusaram | €0,63 |
| | | **AOV** | **≈ €39,90** |

Descontando a taxa Hotmart (9,9% + $0,50), líquido por comprador ≈ **€35,50**.

**Até o Kit existir, o degrau 3 vale zero e o AOV é ≈ €33,70** (€30,10 líquidos). É esse o custo de esperar pelo Kit em vez de vender a série já produzida, e é a conta que se compara com o que o Kit valer depois.

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

**Recomendação do documento: dividir por mercado.** PT e ES na Hotmart com afiliados ligados, EN e FR no Stripe que já está construído e é três vezes mais barato.

**Decisão: Hotmart em tudo.** Custa cerca de €3,50 a mais por venda em EN e FR e compra plataforma única. Duas coisas ficam melhores do que na versão dividida: o IVA europeu fica coberto nos quatro idiomas em vez de dois (o Ash é residente na Suíça, portanto EN e FR a consumidores da UE eram exactamente a parte exposta), e o funil existe uma vez só, em vez de haver regras de bump, OTO e downsell duplicadas entre painel e código.

O que se perde é a comparação: com dois processadores dava para ver lado a lado o que a Hotmart custa em conversão. Fica por medir.

O caminho de volta está no código e é uma variável: `VITE_HOTMART_LOCALES=pt,es` devolve EN e FR ao Stripe, que continua construído e a funcionar, sem lógica nova.

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
| 0 | ~~Decidir mercados, OTO e recorrência~~ | | **FEITO, 8 Ago** |
| 1 | **Criar conta, produto e as 4 ofertas na Hotmart** | **Ash, só ele tem a conta** | 1 hora, painel |
| 2 | Configurar Order Bump (Recovery Pack) | 1 | 15 min, painel |
| 3 | Colar os códigos de oferta em `.env` e rebuild | 1, 2 | 10 min |
| 4 | Webhook de entrega de acesso | 1 | 1 a 2 dias, Diego |
| 5 | Produzir o 3AM Relapse Kit | nada, corre em paralelo | 2 a 3 semanas |
| 6 | Funil de Vendas: OTO Kit + downsell avulso | 1, 4, 5 | meio dia, painel |
| 7 | Religar tráfego, orçamento pequeno, ângulo 3AM | 1 a 4 | **decisão do Ash** |
| 8 | Afiliados, na prática PT e ES | 7 com números | painel |
| 9 | Degraus 5, 6 e 7 (cross-sell, Reset Season, backend) | dados do 7 | semanas |

**Os passos 1 a 4 são uma hora de painel e um a dois dias de código, e nada disso arranca sem o passo 1.** Enquanto a conta Hotmart não existir, a esteira está desenhada e não está ligada. O passo 5 é o único que corre em paralelo, porque não depende da conta.

Nenhum destes passos torna o passo 7 dispensável: enquanto o tráfego estiver desligado desde 8 de Junho, a esteira é uma hipótese bem desenhada e nada mais.

---

## 7. Já ficou no código

`src/lib/offers.ts` passa a ser o sítio único onde a esteira vive: os degraus como dados, com preço, código de oferta Hotmart e se o entregável existe mesmo hoje. O `/plan` já sabe montar o link de checkout da Hotmart com `off`, `sck` e email pré-preenchido, e escolhe entre Stripe e Hotmart por configuração. Sem códigos de oferta configurados, o comportamento é exactamente o de hoje: Stripe, nada muda.

As decisões de 8 de Agosto já estão lá: o degrau 3 é o Kit a €47 marcado como `shippable: false`, e o filtro de idioma fica vazio, o que significa Hotmart em todos os mercados.

`.env.hotmart.example` lista as variáveis a preencher, uma a uma, com a explicação do que criar na Hotmart para cada. É o ficheiro a abrir ao lado do painel.

Trocar preço ou oferta é editar um ficheiro, não caçar constantes por cinco páginas.

---

## 8. Ressalvas

- Todas as take-rates são benchmark de indústria. **Nada nesta esteira foi visto por tráfego pago.** A última compra registada é de 22 de Maio.
- As mecânicas da Hotmart (order bump, upsell de um clique, downsell, MoR para IVA) estão confirmadas na documentação pública. As regras finas (excluir do downsell quem já levou o bump, comportamento exacto do `sck` em funil) confirmam-se no painel antes de dependermos delas.
- A conta do IVA é indicativa e não é minha para fechar. Juliano e Roger.
- O degrau 7 tem exposição regulatória real. Não vai para o ar sem revisão jurídica.

---

*Deliverable interno FLU-143. Complementa `flu24-taxas-funil-upsell.md` (esteira em Stripe) e `flu143-pesquisa-posicionamento.md` (posição). Copy de produto é EN; esta análise é interna PT-BR.*
