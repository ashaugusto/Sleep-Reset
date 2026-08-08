# FLU-153 — 3AM Relapse Kit, o degrau 3 do funil sleepwired

**Data:** 2026-08-08 · **Decisão de origem:** Ash, 8 de Agosto, na interação da FLU-143 (OTO 1 é o Kit a 47 EUR, não a série WIRED)
**Estado:** produzido. `OFFERS.oto1.shippable` está a `true`. Falta a configuração na Hotmart, que é a FLU-143.

---

## O que existe agora no repositório

| Entregável | Ficheiro | Duração / formato |
|---|---|---|
| Protocolo de emergência | `artifacts/sleep-reset/public/audio/kit-3am-protocol.mp3` | 20:25 (10,2 min de voz, 10,2 min de silêncio guiado) |
| Legendas do protocolo | `.../audio/kit-3am-protocol.vtt` | WEBVTT |
| Gatilho: ansiedade | `.../audio/kit-trigger-anxiety.mp3` | 5:23 |
| Gatilho: álcool | `.../audio/kit-trigger-alcohol.mp3` | 4:28 |
| Gatilho: mudança de horário | `.../audio/kit-trigger-schedule.mp3` | 4:17 |
| Cartão de uma página, para imprimir | `artifacts/sleep-reset/public/kit/first-90-seconds.pdf` | A5, uma página, tinta sobre branco |
| Cartão para o telemóvel | `.../kit/first-90-seconds.png` | 1170 px de largura, fundo escuro |
| Fonte do cartão | `.../kit/first-90-seconds.html` | escuro no ecrã, claro na impressão, mesmo texto |
| Guiões | `marketing/audio-scripts/kit-*.txt` | texto simples, com marcas `[pause N]` |

Reprodução: `python3 marketing/audio-scripts/build_kit_audio.py` refaz os quatro áudios, `bash artifacts/sleep-reset/public/kit/build_card.sh` refaz o PDF e o PNG. O build do cartão falha de propósito se o PDF sair com mais de uma página.

**Voz e cadeia:** as mesmas das noites 1 a 7. edge-tts, `en-US-AvaNeural`, `--rate=-15%`, `--pitch=-2Hz`, custo zero, corre localmente.

**A diferença técnica em relação às noites:** um protocolo guiado é sobretudo silêncio. Uma linha `[pause 150]` no guião vira 150 segundos de silêncio real dentro do mp3, que é onde o cliente escreve, respira ou espera. Sem isso, vinte minutos de protocolo seriam vinte minutos de alguém a falar, que é o oposto do produto. O silêncio é gerado com o mesmo 24 kHz mono a 48 kbps da voz, por isso o ficheiro final concatena sem recodificar, e as legendas de cada bloco falado são deslocadas por tudo o que vem antes.

---

## Porque é que o Kit é este conteúdo e não outro

O produto principal ensina a dormir sete noites. O Kit trata da oitava vez que falha, que é o momento em que o cliente perde a fé no método e pede reembolso. É por isso que ele se vende logo a seguir à compra: é exactamente o medo que a pessoa tem no segundo em que paga.

Três decisões de conteúdo que valem a pena ficar registadas:

1. **O protocolo não tenta adormecer ninguém.** Diz o contrário, e diz cedo: esta noite não tem como objectivo dormir. Tem dois objectivos, manter a cama associada a descanso e proteger a hora de acordar do dia seguinte. Prometer sono a quem está acordado às 3h é a forma mais rápida de perder a pessoa aos cinco minutos.
2. **A manhã seguinte ocupa mais tempo do que a noite.** É a parte que decide se uma noite má vira uma semana má: hora de acordar igual, luz na primeira meia hora, sesta só até vinte minutos e antes das 15h, cafeína até ao meio-dia, e não ir para a cama mais cedo para compensar. É também a parte que os clientes fazem ao contrário.
3. **As três variantes existem porque a recaída tem causas diferentes e a mesma resposta.** A de álcool explica o rebound e tira a culpa do caminho, a de horário explica que um relógio anda cerca de uma hora por dia e que julgar no dia seguinte não faz sentido, a de ansiedade trata a subida antes do pensamento. Nenhuma repete o protocolo inteiro: cada uma diz o que é diferente e devolve a pessoa às mesmas regras.

**Limites respeitados em todo o material:** educação e acompanhamento, nunca terapia, tratamento ou diagnóstico; nenhuma promessa de cura; nota explícita para procurar um médico quando o despertar vem com dor, falta de ar ou humor em baixo há semanas. Sem travessão e sem emoji em nada que o cliente lê.

---

## Copy da página de OTO

A copy vive em `artifacts/sleep-reset/src/locales/{en,pt,es,fr}.ts`, no bloco `oto1`, com o tipo em `locales/types.ts`. Está lá em vez de num documento porque é assim que uma língua em falta se torna um erro de TypeScript em vez de um espaço em branco à frente de um comprador.

A página em si é servida pela Hotmart, portanto a copy é para colar no painel. Ordem no painel, igual à do bloco: sobrelinha, título, dois parágrafos, o que vem dentro (quatro pontos), o que isto não é, linha de preço, botão, recusa, microcopy, garantia.

**Inglês, que é a língua de produto:**

> Add before you go in
> **The night it comes back**
>
> You just bought seven nights. Here is the question you are already asking: what about the first night it comes back? Because it does come back, once, usually a few weeks in, and that is the night that decides whether you keep the method or quietly stop using it.
>
> The 3AM Relapse Kit is what you run on that night. A twenty minute protocol you play in the dark, a card for the first ninety seconds, and three short versions for the three things that usually set it off. Nothing to read and nothing to work out at three in the morning.
>
> One payment of 47 EUR, added to the order you just made.
> **Yes, add the Relapse Kit** · No thanks, take me to my protocol

PT, ES e FR seguem o mesmo bloco, traduzidos, no mesmo ficheiro. O PT é do Brasil, como o resto do ficheiro.

**A recusa é um link a sério e visível.** Não é um cinzento escondido por baixo do botão. Uma página de um clique sem saída clara é um dark pattern, e num produto de sono vendido a quem já desconfia de tudo, é também a forma mais cara de ganhar 47 euros.

---

## O que falta para o degrau 3 estar a vender

1. **Criar a oferta na Hotmart** e pôr o código em `VITE_HOTMART_OFF_OTO1`. Enquanto essa variável estiver vazia, `offerCode("oto1")` devolve `""` e quem chama cai no Stripe ou salta o degrau. Ninguém aterra numa página partida. (FLU-143)
2. **Configurar a entrega.** Já está servida: os seis ficheiros estão em produção em `sleepwired.com/audio/kit-*.mp3` e `sleepwired.com/kit/first-90-seconds.{pdf,png}`, com o mesmo tamanho byte a byte do repositório, servidos pelo Caddy a partir de `dist/public` como os áudios das noites. Basta apontar a entrega da Hotmart para esses URLs.
3. **Página de entrega dentro da app**, se quisermos que o Kit apareça ao lado do Recovery Pack para quem já comprou, em vez de viver só no email da Hotmart. Não é preciso para vender, é preciso para o cliente reencontrar o Kit três semanas depois, que é justamente quando ele precisa. Fica como issue separada.

---

## Efeito no ticket médio

Com o degrau 3 em falta, o ticket médio projectado dos degraus 1 a 4 estava em cerca de 33,70 EUR. Com o Kit a existir, volta à projecção original de cerca de 39,90 EUR, assim que a oferta estiver criada na Hotmart. Os dois números são projecção com benchmarks de indústria (30 a 45% de take-rate no order bump, 10 a 23% no OTO de um clique). Continuamos sem histórico próprio: o tráfego pago está desligado desde 8 de Junho e nada disto foi visto por um visitante pago.
