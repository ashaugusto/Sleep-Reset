# FLU-143 — Capas dos produtos e texto do checkout Hotmart

**Data:** 2026-08-09 · **Pedido do Ash:** "preciso de fotos de capa dos produtos, e preciso de um texto e uma foto de capa do checkout também"
**Ficheiros:** `marketing/hotmart-assets/` (cópia no OneDrive em `FLUYON/08_PROJETOS/Sleep Rewire/hotmart/capas/`)

As imagens usam as cores e as letras do funil, tiradas de `artifacts/sleep-reset/src/styles/funnel.css`: preto #06080b, branco quente #ece7de, latão #c8a24c, Fraunces no título e Inter no resto. Quem vem da enquete e cai no checkout vê a mesma coisa.

---

## 1. Os ficheiros

| Ficheiro | Tamanho | Onde entra |
|---|---|---|
| `00_checkout-banner.jpg` | 1440x480 | banner do topo do checkout personalizado |
| `01_7-night-protocol.jpg` | 1080x1080 | produto 1, The 7-Night Protocol, 27 EUR |
| `02_recovery-pack.jpg` | 1080x1080 | produto 2, The Recovery Pack, 19 EUR, e imagem do order bump |
| `03_3am-relapse-kit.jpg` | 1080x1080 | produto 3, The 3AM Relapse Kit, 47 EUR |
| `04_3am-anxiety-protocol.jpg` | 1080x1080 | produto 4, The 3AM Anxiety Protocol, 9 EUR |
| `05_second-seat.jpg` | 1080x1080 | produto 5, Second Seat, 17 EUR |

### Porquê estes tamanhos

Não vêm da documentação, vêm do checkout de referência que mandaste (`pay.hotmart.com/B102813651H?checkoutMode=10`). Carreguei a página e li a configuração do construtor que vem lá dentro:

- O banner de topo desse checkout é um ficheiro de **1422x471**, ou seja 3:1, e a Hotmart serve-o reduzido a 1024x339, 640x211 e 360x119. Os nossos 1440x480 são a mesma proporção com margem para o ecrã de 1024.
- A imagem de produto desse checkout é **1080x1080** e a Hotmart mostra-a a 300x300 no resumo da compra. O campo do painel pede no mínimo 600x600; 1080 fica acima disso e aguenta o dia em que aparecer num sítio maior.

**Consequência de desenho:** a 300x300 a linha pequena por baixo do título desaparece e fica só o título. É de propósito. A capa tem de funcionar como miniatura no resumo da compra e como cartaz na página do produto, e são duas leituras diferentes da mesma imagem.

### O que está escrito em cada capa

Cada uma tem o mesmo bloco em baixo à esquerda: traço de latão, `SLEEP WIRED`, o título do produto e uma linha curta.

| Produto | Título na capa | Linha |
|---|---|---|
| 1 | The 7-Night Protocol | For people who wake at 3AM |
| 2 | The Recovery Pack | For the nights that go wrong |
| 3 | The 3AM Relapse Kit | When one bad night becomes seven |
| 4 | The 3AM Anxiety Protocol | The 3AM track, on its own |
| 5 | Second Seat | The same protocol, one more login |

O prefixo "Sleep Wired:" não vai no título da capa porque já está no eyebrow em latão. No painel da Hotmart o nome do produto continua a ser o da ficha, `Sleep Wired: The 7-Night Protocol`, porque esse é o que sai no recibo.

**Uma capa por produto, não por oferta.** O produto 1 vai ter quatro ofertas, uma por tipo de sono (maintenance, onset, mixed, circadian), todas a 27 EUR. A imagem é do produto, portanto a mesma serve as quatro. Quem separa é o código de oferta.

---

## 2. Onde se carrega cada uma

1. **Capa do produto:** Produtos → o produto → Informações básicas → Imagem do produto. Uma por produto, ficheiros 01 a 05.
2. **Banner do checkout:** Ferramentas → Aparência da página de pagamento → construtor → componente de imagem na primeira linha, ficheiro 00.
3. **Imagem do order bump:** dentro do bloco de order bump, campo de imagem própria, ficheiro 02.

Lembrete que já custou uma decisão: o trabalho do construtor **só aparece com `checkoutMode=10` na URL**. Sem o parâmetro o mesmo produto abre no checkout normal e nada disto se vê. Quem monta a URL é `hotmartCheckoutUrl` em `src/lib/offers.ts`.

---

## 3. Os textos do checkout

Antes dos textos, uma coisa que vi na configuração do checkout de referência e que muda a expectativa: **aquele checkout não tem um único bloco de texto.** Os componentes que lá estão são cinco imagens, o formulário de pagamento, um order bump e um popup de saída. Tudo o que parece texto está pintado dentro das imagens.

Ou seja, "o texto do checkout" reparte-se em três sítios, e só dois são campos de escrever.

**Correcção de 9 de Agosto às 13:08.** O construtor tem sim componentes de texto e o Ash pôs dois no checkout, por baixo do banner: um título e um parágrafo, ambos ainda com o lorem ipsum de fábrica. Isso muda a conta acima e resolve o problema que a decisão 2 tinha aberto. A copy destes dois componentes está na secção 5, que é a que se copia para o painel.

### 3.1 Banner do topo (já pintado na imagem 00)

```
SLEEP WIRED

You fall asleep fine. You wake at 3AM.

Seven nights. One payment. No subscription, ever.
```

Se quiseres trocar esta frase, troca-se e eu volto a gerar o ficheiro. Não é editável na Hotmart, é pixel.

### 3.2 Order bump (campos reais do bloco)

| Campo | Texto a colar |
|---|---|
| Cabeçalho | `Add to your order` |
| Título | `The Recovery Pack` |
| Texto | `The seven nights the protocol does not cover: a travel night, a shift night, a night after drinking, a night after being ill, a night on call. Seven short audio protocols so one bad night does not restart the whole thing.` |
| Botão | `Add for 19 EUR` |
| Imagem | `02_recovery-pack.jpg` |
| Desconto riscado | **deixar desligado**, ver abaixo |

**Sobre o preço riscado.** O bloco tem um campo para mostrar um valor riscado e uma percentagem de desconto. Só o uso se os 19 EUR forem mesmo um desconto sobre um preço a que o Recovery Pack se vende sozinho. Hoje ele não se vende sozinho em lado nenhum, portanto o riscado seria um preço inventado. Isso é publicidade enganosa na UE e é motivo de reclamação na Hotmart. Fica desligado até o pack existir como produto avulso com preço próprio.

**O texto do bump fica em inglês nos quatro mercados, de propósito.** No checkout de referência o bump estava escrito em espanhol dentro de um checkout em francês: a interface da Hotmart traduz-se sozinha, o texto que nós escrevemos não. Escrito uma vez, lido em todo o lado.

### 3.3 Popup de saída

| Campo | Texto |
|---|---|
| Título | `One thing before you close this` |
| Corpo | `Seven nights, one payment, and it is yours for good. No app to subscribe to, no coach, no monthly charge. Run the protocol. If your sleep has not moved, write to support@sleepwired.com and you get every cent back, up to 60 days.` |
| Botão | `Finish my order` |

### 3.4 Nome e descrição que a Hotmart mostra no resumo da compra

O resumo do checkout puxa o nome e a descrição do produto. A descrição longa da ficha é para a página do produto e para o Mercado de Afiliados; no resumo aparece cortada. Vale a pena ter uma linha curta:

| Produto | Linha curta |
|---|---|
| 1 | `Seven nights. One payment. No subscription.` |
| 2 | `Seven protocols for the nights that go wrong.` |
| 3 | `The night the seven nights do not cover.` |
| 4 | `The 3AM track, on its own.` |
| 5 | `A second login for someone in the same house.` |

---

## 4. Decidido pelo Ash, 9 de Agosto às 10:42

Fechado. Nada aqui fica em aberto.

1. **A frase do banner fica como está.** `You fall asleep fine. You wake at 3AM. / Seven nights. One payment. No subscription, ever.` Não se volta a gerar a imagem 00.
2. **As quatro imagens verticais não se fazem.** O checkout leva banner, formulário, order bump e popup de saída. Nada por baixo do formulário.
3. **A série de capas fica na fotografia de noite.** Não se abre a segunda leitura clínica.

### A consequência da decisão 2, que vale a pena saber antes de carregares

Sem as verticais, **a garantia de 60 dias deixa de aparecer no checkout a quem compra a direito**. O único sítio onde ela fica escrita é o popup de saída, e esse só abre a quem está a sair. Quem vem da página de resultado, lê o banner e paga, nunca a vê no momento de pagar.

Não é bloqueio e não custa imagem nenhuma resolver, porque a Hotmart mostra a descrição curta do produto no resumo da compra. A linha do produto 1 passaria de

```
Seven nights. One payment. No subscription.
```

para

```
Seven nights. One payment. No subscription. 60-day refund.
```

São seis palavras num campo de texto que já vais preencher. Se preferires deixar a linha como está, também não é erro: a garantia continua prometida na página de vendas e no email. Fica à tua escolha no momento de escrever a descrição.

**Resolvido pela secção 5.** Com o bloco de texto por baixo do banner, a garantia passa a estar escrita no checkout a quem paga a direito. A linha curta do produto 1 pode ficar como estava.

---

## 5. Os dois blocos de texto por baixo do banner

O que está no construtor são dois componentes: um título e um parágrafo. Trabalham em conjunto e o trabalho deles não é vender outra vez. A venda já foi feita na página de resultado; quem chega aqui já quer. O que ainda pode travar a mão em cima do cartão são três dúvidas, por esta ordem:

1. **isto vai cobrar-me todos os meses?** É a maior, porque é o que toda a concorrência faz e é a promessa que nos distingue.
2. **o que recebo, e quando?** Ninguém quer pagar e ficar à espera de um email.
3. **e se não resultar?** A garantia, que sem este bloco não aparecia em lado nenhum no momento de pagar.

O texto responde às três por essa ordem, em três parágrafos curtos. Em inglês nos quatro mercados, pela mesma razão do order bump: a interface da Hotmart traduz-se sozinha, o que nós escrevemos não.

### 5.1 Título (componente de título, substitui `Lorem ipsum dolor`)

```
You are paying once. That is the whole thing.
```

Escolhido acima de "Tonight is night one" porque a objecção do momento não é a impaciência, é a desconfiança. Toda a gente neste nicho já foi apanhada por um teste gratuito que virou cobrança mensal. A frase diz em nove palavras aquilo que nos separa do mercado inteiro, e diz no segundo exacto em que a pessoa está a olhar para o campo do cartão.

Duas alternativas, se quiseres testar:

| Variante | Texto | Quando usar |
|---|---|---|
| B, entrega | `Night one can be tonight.` | se as métricas mostrarem abandono por hesitação e não por desconfiança |
| C, identidade | `For the half of the night nobody gave you anything for.` | se quiseres continuar a frase do banner em vez de mudar de assunto |

Não mais do que uma linha e meia no telemóvel. As três cabem.

### 5.2 Parágrafo (componente de texto, substitui o bloco `Lorem ipsum dolor sit amet...`)

```
One payment for the full 7-night protocol. No trial, no subscription, nothing that renews next month.

The moment your payment clears, the next page opens your account and night one is ready. Seven guided sessions, the sleep diary, and the charts that show whether it actually moved. Lifetime access, every future update included.

Run the seven nights. If your sleep has not changed, write to support@sleepwired.com and you get every cent back, up to 60 days.
```

Três parágrafos, cerca de 430 caracteres. O lorem que lá está tem quase 500 e no telemóvel é uma parede de doze linhas: reparar que na captura de ecrã o texto empurra o formulário para fora do primeiro ecrã. Com quebras de linha a cada duas frases lê-se em diagonal, que é como se lê num checkout.

**Versão curta**, se ainda achares pesado no telemóvel:

```
One payment. No subscription, nothing that renews.

Your account opens on the next page and night one is ready tonight. Seven guided sessions, the sleep diary, lifetime access.

If your sleep has not changed after the seven nights, every cent back, up to 60 days.
```

### 5.3 Porque é que cada frase está lá, para não se estragar ao editar

- **"nothing that renews next month"** e não "o teu cartão não fica guardado". O cartão fica mesmo guardado, é isso que faz o one-click da página de upsell funcionar. A promessa que se pode fazer é que nada renova, e essa é verdadeira.
- **"The moment your payment clears"** e não "instantâneo". Quem paga por métodos com aprovação diferida não tem acesso imediato, e prometer imediato a essa pessoa é o primeiro email de suporte.
- **"the next page opens your account"** descreve o que a `/welcome` faz de facto quando recebe o `?transaction=`. Se esse parâmetro não for ligado na configuração pós-venda, esta frase passa a ser mentira e tem de mudar para "you get an email with your access". Ligar o parâmetro é mais barato do que baixar a promessa.
- **"whether it actually moved"** é a única palavra de prova que lá está. O diário e os gráficos são o que nos separa de um pacote de áudios, e mencioná-los custa seis palavras.
- **O email de suporte escrito por extenso** na frase da garantia. Uma garantia sem morada para onde escrever lê-se como cláusula; com morada lê-se como promessa.

### 5.4 A linha de aviso, opcional

O checkout fica numa categoria de saúde e a ficha do produto já leva o aviso. Se quiseres repeti-lo aqui, vai no fim do parágrafo e em texto mais pequeno:

```
Education and coaching, not medical care. Not a treatment or a diagnosis, and no replacement for a doctor.
```

Custa conversão, ganha tranquilidade na revisão da Hotmart. Como o aviso já está na descrição do produto, que é o que o revisor lê, a minha escolha seria deixar de fora do checkout. Fica contigo.

---

## 6. Estado verificado da conta, 9 de Agosto às 13h

Lido directamente: `products/api/v1/products` para os produtos, e a configuração do construtor que vem dentro de `pay.hotmart.com/S107083069O?checkoutMode=10`. Não é o que devia estar, é o que está.

### Produtos

| ID | Nome | Estado | Oferta | Preço | Garantia |
|---|---|---|---|---|---|
| 8279398 | Sleep Wired: The 7-Night Protocol | ACTIVE | `x4qj5aft` | 27 EUR | **7 dias** |
| 8279460 | Sleep Wired: The Recovery Pack | ACTIVE | `o1knxjme` | 19 EUR | **7 dias** |
| 8279532 | Sleep Wired: The 3AM Relapse Kit | DRAFT | `bzkk9yds` | 47 EUR | **7 dias** |
| 8279449 | The Recovery Pack (EBOOK) | DRAFT | | | duplicado, apagar |
| 8279392 | Sleep Wired: The 7-Night Protocol | DELETED | | | ok |

Todos com `is_currency_conversion_enabled: true`. Categoria `Saúde e Sports`, em português, num produto em inglês.

### Order bump: activo

O Recovery Pack entra no resumo da compra como `ORDER_BUMP_ITEM` (produto 8279460, oferta `o1knxjme`), com a imagem `02_recoverypack.jpg` e a descrição dos sete áudios. Um relatório anterior deu isto como não configurado; estava errado.

### Preço que o comprador vê (Alemanha)

```
produto 1   27,00 + 5,13 IVA (19%)  = 32,13 EUR
order bump  19,00 + 3,61 IVA (19%)  = 22,61 EUR
os dois                              = 54,74 EUR
```

`businessModel: DEEMED_SELLER`, "Hotmart as Deemed Seller for Creators in CH with Electronic Product for European or British shopper". Comissão com imposto CH a 8,1%. O IVA está legal; o que não bate é a página de vendas dizer 27.

### Auteur no checkout

`authorName: Fluyon`, `authorEmail: info@fluyon.ch`. Vem do Perfil Público. O comprador vem do Sleep Wired e nunca viu a Fluyon.

### Construtor: os quatro blocos, e o que falta em cada um

Uma linha só, coluna esquerda com peso 2 e direita com peso 1.

| Coluna | Componente | Conteúdo actual | Substituir por |
|---|---|---|---|
| esquerda | `hotpay-text` tipo `title` | `Lorem ipsum dolor` | secção 5.1 |
| esquerda | `hotpay-text` tipo `text` | lorem completo, ~500 caracteres | secção 5.2 |
| esquerda | `hotpay-checkout` | formulário, fixo | nada |
| direita | `hotpay-image` | `def.jpg`, demo da Hotmart, 1023x682 | `00_checkout-banner.jpg` |
| direita | `hotpay-advantages` | selos SSL, segurança, email, conteúdo | nada |

O banner desenhado é 1440x480 (3:1) e o espaço do construtor está a mostrar uma imagem 3:2. Se ficar cortado, a alternativa é gerar uma versão 3:2 do mesmo banner.

### Vendas

`payments/api/v1/sales/history` devolve zero. Nunca houve uma venda pela Hotmart, portanto nada do que se mexer agora parte uma compra existente.

---

## 7. Ligar as envs, 9 de Agosto às 14h

Ash na FLU-143: *"pode fechar o que tiver aberto e pode ligar as envs"*. Feito o que se pode fazer sem entrar no painel, e fica escrito o que não se pode.

### O que ficou escrito

`artifacts/sleep-reset/.env` (build do browser):

```
VITE_CHECKOUT_PROVIDER=hotmart
VITE_HOTMART_LOCALES=            (vazio = todos os idiomas)
VITE_HOTMART_PRODUCT=S107083069O
VITE_HOTMART_OFF_FRONT=x4qj5aft
VITE_HOTMART_OFF_BUMP=o1knxjme
```

`.env` da raiz (o que o systemd entrega à API):

```
HOTMART_OFF_FRONT=x4qj5aft
HOTMART_OFF_BUMP=o1knxjme
HOTMART_HOTTOK=                  ainda por colar
```

As quatro ofertas por tipo de sono ficam vazias porque ainda não existem no painel: `offerCode()` cai na genérica quando faltam, portanto o site funciona à mesma. O OTO 1 fica vazio porque o produto 8279532 está em DRAFT, e um código de produto em rascunho não cobra.

### O que trava o build

`HOTMART_HOTTOK`. Com ele vazio, `hottokValid()` devolve `false`, o webhook responde 503 e não abre conta nenhuma. Do outro lado, `VITE_HOTMART_PRODUCT` preenchido tira o Stripe do caminho. As duas coisas juntas, sem o token, é cobrar o cartão e não entregar. Por isso os valores estão escritos e o build de produção não foi corrido.

O token está no painel em Ferramentas → Webhook (API e notificações), no mesmo ecrã onde se regista `https://sleepwired.com/api/hotmart/webhook` para `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED` e `PURCHASE_CHARGEBACK`.

### Verificado hoje, de fora do painel

Lido do `__NUXT_DATA__` de `pay.hotmart.com/S107083069O`, sem sessão iniciada:

| O que | Estado |
|---|---|
| `S107083069O` responde 200, com e sem `?off=x4qj5aft` | sim |
| `warrantyDays` no checkout | **7** |
| `authorName` / `authorEmail` | `Fluyon` / `info@fluyon.ch` |
| Categoria | `Saúde e Sports` |
| Blocos do construtor | lorem ipsum e `def.jpg` continuam lá |
| `checkoutMode=10` | só com o parâmetro na URL é que o construtor aparece |

**Correcção ao que a secção 6 diz sobre o order bump.** Fui procurar e não encontrei: não há `ORDER_BUMP`, nem o nome do Recovery Pack, nem `o1knxjme` no payload de nenhum dos dois modos, e o construtor traz `inCheckoutComponents: []`. Não prova que o bump não existe, prova que não se vê de fora. Confirma-se com uma olhadela ao painel ou com uma compra de teste, e não se deve dar por certo até lá.

**O lorem não chega ao comprador hoje.** `hotmartCheckoutUrl()` em `src/lib/offers.ts` não mete `checkoutMode=10` na URL, portanto quem clica cai no checkout normal, que não mostra o construtor. O preço a pagar é que o banner e a copy da secção 5 também não aparecem. É uma escolha, não um acidente: enquanto o construtor tiver lorem, o checkout normal é o melhor dos dois.
