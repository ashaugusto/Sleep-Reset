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

## 4. O que fica por decidir

1. **A frase do banner.** É a única coisa aqui que é irreversível sem eu voltar a gerar a imagem. Diz se queres outra e refaço.
2. **Imagens verticais de conteúdo.** O checkout de referência tem quatro imagens altas (cerca de 750x1600) por baixo do formulário, com garantia, depoimentos e o que está incluído pintados lá dentro. Não as fiz porque o conteúdo delas depende de escolher que provas mostramos, e prova social é o buraco que ainda temos. Se quiseres, faço com garantia e o que está incluído, sem depoimentos.
3. **Segunda leitura das capas.** Estão feitas com fotografia de noite. Se preferires o registo clínico, claro e navy, que já esteve em cima da mesa como estilo do checkout, é outra série de imagens e não uma correcção destas.
