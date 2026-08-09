# FLU-143 — Fichas de criação dos produtos na Hotmart

**Data:** 2026-08-09 · **Pedido do Ash:** "me dá o título dos produtos que é pra criar na Hotmart, com descrição, preço e todas informações que crio"
**Base:** a esteira fechada em `flu143-esteira-hotmart.md`, os preços em `src/lib/quiz-data.ts`, os códigos de oferta esperados em `.env.hotmart.example` e os ativos verificados um a um em `public/audio/` e `public/kit/`.

Este ficheiro é para ter aberto ao lado do painel. Cada campo abaixo corresponde a um campo do formulário da Hotmart e o valor está pronto para copiar.

---

## 0. O que criar hoje e o que não criar

São **sete produtos** na esteira. Nem todos se criam agora, porque a Hotmart aprova o produto olhando para a página de vendas e para o que é entregue, e produto sem entrega pronta é reprovação ou reembolso.

| # | Produto | Preço | Ativo | Criar agora |
|---|---|---|---|---|
| 1 | Sleep Wired: The 7-Night Protocol | 27 EUR | pronto | **sim** |
| 2 | Sleep Wired: The Recovery Pack | 19 EUR | pronto | **sim** |
| 3 | Sleep Wired: The 3AM Relapse Kit | 47 EUR | pronto (FLU-153) | **sim** |
| 4 | Sleep Wired: The 3AM Anxiety Protocol | 9 EUR | pronto | **sim** |
| 5 | Sleep Wired: Second Seat | 17 EUR | pronto | **sim** |
| 6 | Sleep Wired: Reset Season | 39 EUR | por produzir | não |
| 7 | Sleep Wired: Personal Recalibration | 79 EUR | parcial | não |

Os produtos 6 e 7 estão marcados `shippable: false` em `src/lib/offers.ts`. Enquanto lá estiverem, o site não mostra botão nenhum para eles, portanto criá-los na Hotmart só produziria produtos parados no painel a envelhecer sem vendas. As fichas deles estão na secção 8 para quando os ativos existirem.

**Ordem de criação:** 1, depois 2, depois 3, depois 4, depois 5. O order bump e o funil de vendas ligam-se por cima de produtos que já existem, por isso o produto 1 tem de ser o primeiro e as configurações de funil (secções 5 e 6) fazem-se no fim, com os cinco já criados.

---

## 1. Configuração de conta, uma vez só

Antes do primeiro produto:

- **Dados fiscais e conta bancária** preenchidos. Sem isto a Hotmart não liberta saque e o produto fica em modo de rascunho.
- **Moeda base: EUR.** Todos os preços da esteira estão em euros e a página de vendas mostra euros. Ver a decisão em aberto na secção 9 sobre uma oferta em BRL.
- **Email de suporte do produtor:** `support@sleepwired.com`. É o que aparece no recibo do comprador e nos emails da Hotmart.
- **Nome do produtor / marca:** Sleep Wired.
- **Idioma da conta:** indiferente, o checkout adapta-se ao comprador.

Nomes dos produtos ficam **em inglês nos quatro mercados**. São nomes de marca ("Recovery Pack", "3AM Relapse Kit"), aparecem no recibo e no checkout, e traduzi-los obrigaria a sete produtos vezes quatro idiomas, ou seja vinte e oito produtos para gerir. O checkout em si já aparece na língua do comprador, que é o que importa para a conversão.

### Duas regras que valem para todas as ofertas dos sete produtos

**Tipo de pagamento: pagamento único. Nenhuma oferta é mensal nem anual.** A página de venda promete "sem assinatura, pagas uma vez", e a única faixa vazia do mercado é essa. No painel isso é o campo *Pagamento único* na criação da oferta, nunca *Assinatura*. Parcelamento não é recorrência: continua ligado ao máximo permitido, é uma compra só dividida no cartão. O único degrau que fala em ano é a Reset Season, 39 EUR/ano, e mesmo essa cria-se como produto de pagamento único com entrega ao longo de doze meses (secção 8).

**Tracking keys: desligadas.** A doc do webhook de compra 2.0.0 diz que `purchase.offer.metadata`, que é o objeto onde as tracking keys chegam, é "available only for subscription products". Numa oferta de pagamento único preenchem-se no painel e nunca aparecem no webhook. A atribuição faz-se pelos três campos que chegam sempre: `purchase.offer.code` (qual das cinco ofertas, ou seja o degrau e o tipo de sono), `purchase.origin.sck` (o que o site mete na URL, já implementado em `src/lib/offers.ts`) e `product.ucode` (identificador estável do produto). Se um dia houver produto de assinatura, as tracking keys voltam à mesa: dez por oferta, chave até 25 caracteres, valor até 100.

---

## 2. Produto 1. A plataforma

### Ficha

| Campo no painel | Valor a colar |
|---|---|
| Nome do produto | `Sleep Wired: The 7-Night Protocol` |
| Formato do produto | Curso online |
| Categoria | Saúde e Esportes (segunda escolha: Desenvolvimento Pessoal) |
| Idioma do produto | Inglês |
| Preço | `27.00` |
| Moeda | EUR |
| Preço de referência riscado, se o campo existir | `47.00` |
| Tipo de pagamento | **Pagamento único.** Nunca assinatura, nem mensal nem anual |
| Tracking keys | deixar desligadas, ver secção 1 |
| Garantia | 60 dias (ver aviso na secção 9) |
| Página de vendas | `https://sleepwired.com/plan` |
| Página de obrigado | `https://sleepwired.com/welcome` |
| Email de suporte | `support@sleepwired.com` |
| Entrega do conteúdo | Área de membros externa, provisionada por webhook. **Não** usar Hotmart Club |
| Parcelamento | máximo permitido, juros a cargo do comprador, recebimento à vista |
| Imagem do produto | 600x600 px, JPG ou PNG, até 2 MB |
| Afiliação | ativar, ver secção 7 |

### Descrição, versão inglesa

```
The 7-night protocol for people who fall asleep fine and wake at 3AM.

Most sleep products are built to help you fall asleep. You already do that. Nobody ever gave you anything for the second half of the night, which is where your problem actually is.

This is the behavioural protocol used for chronic insomnia, cut down to seven nights you run at home. One guided session per night, a sleep diary that shows whether it moved, and the sleep window calculated from your own data.

What you get:
- The 7-night protocol, one session per night
- Guided audio for every session
- The sleep diary and the charts that show whether it actually moved
- Lifetime access, every future update included

No app to subscribe to, no coach, no monthly charge. One payment, yours for good.

Finish the seven nights. If your sleep has not changed, every cent back, up to 60 days.

Education and coaching, not medical care. This is not a treatment or a diagnosis and does not replace a doctor.
```

### Descrição, versão portuguesa (para o Mercado de Afiliados)

```
O protocolo de 7 noites para quem adormece bem e acorda às 3 da manhã.

Quase tudo o que se vende para o sono foi feito para ajudar a adormecer. Isso tu já fazes. Ninguém nunca te deu nada para a segunda metade da noite, que é onde o teu problema está.

Este é o protocolo comportamental usado para insónia crónica, reduzido a sete noites que fazes em casa. Uma sessão guiada por noite, um diário de sono que mostra se mexeu, e a janela de sono calculada a partir dos teus próprios dados.

O que recebes:
- O protocolo de 7 noites, uma sessão por noite
- Áudio guiado em todas as sessões
- O diário de sono e os gráficos que mostram se mudou de facto
- Acesso vitalício, com todas as actualizações futuras incluídas

Sem app por assinatura, sem coach, sem cobrança mensal. Pagas uma vez e é teu.

Faz as sete noites. Se o teu sono não mudou, devolvemos tudo, até 60 dias.

Educação e treino, não cuidados médicos. Não é tratamento nem diagnóstico e não substitui um médico.
```

### Descrição, versão espanhola (para o Mercado de Afiliados)

```
El protocolo de 7 noches para quien se duerme bien y se despierta a las 3 de la madrugada.

Casi todo lo que se vende para el sueño está hecho para ayudarte a dormirte. Eso ya lo haces. Nadie te dio nunca nada para la segunda mitad de la noche, que es donde está tu problema.

Este es el protocolo conductual que se usa para el insomnio crónico, reducido a siete noches que haces en casa. Una sesión guiada por noche, un diario de sueño que muestra si se movió, y la ventana de sueño calculada con tus propios datos.

Lo que recibes:
- El protocolo de 7 noches, una sesión por noche
- Audio guiado en todas las sesiones
- El diario de sueño y los gráficos que muestran si cambió de verdad
- Acceso de por vida, con todas las actualizaciones futuras incluidas

Sin app por suscripción, sin coach, sin cobro mensual. Pagas una vez y es tuyo.

Haz las siete noches. Si tu sueño no cambió, te devolvemos todo, hasta 60 días.

Educación y entrenamiento, no atención médica. No es tratamiento ni diagnóstico y no sustituye a un médico.
```

### As cinco ofertas deste produto

O order bump da Hotmart é fixo por oferta. Como a enquete já sabe o tipo de sono do visitante antes do checkout, publicam-se cinco ofertas do mesmo produto, ao mesmo preço, para que o bump possa levar a headline que encaixa no que a pessoa acabou de responder. Mesmo produto, mesma entrega, mesmo preço, primeira linha diferente.

| Nome da oferta no painel | Preço | Headline do bump nesta oferta | Variável que recebe o código |
|---|---|---|---|
| `Generic` | 27,00 EUR | The Recovery Pack | `VITE_HOTMART_OFF_FRONT` |
| `Maintenance` | 27,00 EUR | The 3AM Kit | `VITE_HOTMART_OFF_FRONT_MAINTENANCE` |
| `Onset` | 27,00 EUR | The Wind-Down Kit | `VITE_HOTMART_OFF_FRONT_ONSET` |
| `Mixed` | 27,00 EUR | The Recovery Pack | `VITE_HOTMART_OFF_FRONT_MIXED` |
| `Circadian` | 27,00 EUR | The Clock Kit | `VITE_HOTMART_OFF_FRONT_CIRCADIAN` |

A `Generic` é a única estritamente obrigatória: é para quem chega ao checkout sem ter feito a enquete. As outras quatro custam nada e são o que faz o bump converter.

---

## 3. Produto 2. O order bump

### Ficha

| Campo no painel | Valor a colar |
|---|---|
| Nome do produto | `Sleep Wired: The Recovery Pack` |
| Formato do produto | Áudio (alternativa: Arquivos) |
| Categoria | Saúde e Esportes |
| Idioma do produto | Inglês |
| Preço | `19.00` |
| Moeda | EUR |
| Garantia | 60 dias, a mesma do produto 1 |
| Página de vendas | `https://sleepwired.com/plan#recovery-pack` |
| Página de obrigado | `https://sleepwired.com/welcome` |
| Email de suporte | `support@sleepwired.com` |
| Entrega do conteúdo | Área de membros externa, o mesmo webhook do produto 1 |
| Parcelamento | máximo permitido |
| Afiliação | desligada. Não se vende sozinho |

Oferta única, chamada `Bump`. O código vai para `VITE_HOTMART_OFF_BUMP`.

### Descrição, versão inglesa

```
Seven situational protocols for when insomnia comes back.

The 7-night protocol fixes the pattern. This is what you run when life breaks it again: a flight, a shift rotation, a fever, a Sunday night before a week you are dreading.

Seven guided audio protocols:
- Jet Lag Reset, time zones fixed in 3 nights
- 3AM Anxiety Attack, for waking up wired
- Sunday Night Insomnia, for the weekly anxiety loop
- Shift Work Adaptation
- Post-Illness Recovery, after fever, surgery or COVID
- Post-Vacation Reset, the 3-night fix
- Quick Reset, the most aggressive 2-night recompression

Lifetime access, same as the protocol. One payment, no subscription.

Education and coaching, not medical care.
```

### Descrição, versão portuguesa

```
Sete protocolos situacionais para quando a insónia volta.

O protocolo de 7 noites arruma o padrão. Isto é o que fazes quando a vida o parte outra vez: um voo, uma mudança de turno, uma febre, um domingo à noite antes de uma semana que já temes.

Sete protocolos em áudio guiado:
- Jet Lag Reset, fusos horários resolvidos em 3 noites
- 3AM Anxiety Attack, para acordar em alerta
- Sunday Night Insomnia, para o ciclo de ansiedade semanal
- Shift Work Adaptation, para trabalho por turnos
- Post-Illness Recovery, depois de febre, cirurgia ou COVID
- Post-Vacation Reset, a correcção de 3 noites
- Quick Reset, a recompressão mais agressiva, 2 noites

Acesso vitalício, igual ao do protocolo. Pagas uma vez, sem assinatura.

Educação e treino, não cuidados médicos.
```

### Descrição, versão espanhola

```
Siete protocolos situacionales para cuando el insomnio vuelve.

El protocolo de 7 noches arregla el patrón. Esto es lo que haces cuando la vida lo rompe otra vez: un vuelo, un cambio de turno, una fiebre, un domingo por la noche antes de una semana que ya temes.

Siete protocolos en audio guiado:
- Jet Lag Reset, husos horarios resueltos en 3 noches
- 3AM Anxiety Attack, para despertarte en alerta
- Sunday Night Insomnia, para el ciclo de ansiedad semanal
- Shift Work Adaptation, para trabajo por turnos
- Post-Illness Recovery, tras fiebre, cirugía o COVID
- Post-Vacation Reset, la corrección de 3 noches
- Quick Reset, la recompresión más agresiva, 2 noches

Acceso de por vida, igual que el protocolo. Pagas una vez, sin suscripción.

Educación y entrenamiento, no atención médica.
```

### O texto que aparece na caixa do bump, no checkout

Este é o campo curto da configuração do order bump, não a descrição do produto. Tem de caber em duas linhas.

| Oferta do produto 1 | Título do bump | Corpo |
|---|---|---|
| Maintenance | `The 3AM Kit` | `What to do the next time you wake at 3AM, on a travel night or on shift, so one broken night does not restart the whole thing.` |
| Onset | `The Wind-Down Kit` | `What to do after a bad night, a travel night and a night on shift, so one broken night does not restart the whole thing.` |
| Circadian | `The Clock Kit` | `What to do when the clock moves on you: flights, shift rotations and the weeks your schedule changes.` |
| Generic e Mixed | `The Recovery Pack` | `What to do after a bad night, a travel night and a night on shift, so one broken night does not restart the whole thing.` |

---

## 4. Produto 3. O OTO

### Ficha

| Campo no painel | Valor a colar |
|---|---|
| Nome do produto | `Sleep Wired: The 3AM Relapse Kit` |
| Formato do produto | Áudio (alternativa: Arquivos) |
| Categoria | Saúde e Esportes |
| Idioma do produto | Inglês |
| Preço | `47.00` |
| Moeda | EUR |
| Garantia | 60 dias |
| Página de vendas | `https://sleepwired.com/relapse-kit` **(página ainda não existe, ver secção 10)** |
| Página de obrigado | `https://sleepwired.com/welcome` |
| Email de suporte | `support@sleepwired.com` |
| Entrega do conteúdo | Área de membros externa, o mesmo webhook |
| Parcelamento | máximo permitido |
| Afiliação | desligada. Só se vende dentro do funil |

Oferta única, chamada `OTO1`. O código vai para `VITE_HOTMART_OFF_OTO1`.

### Descrição, versão inglesa

```
The night it comes back.

The 7-night protocol teaches you to sleep. This is for the eighth time it fails, which is the night that decides whether you keep the method or quietly stop using it.

What is in it:
- The 20 minute protocol. Guided audio for the middle of the night, with the silences left in, so you are talked through it instead of remembering a list.
- The first 90 seconds card. One page, printed for the bedside drawer and saved on your phone. What to do before you decide anything about the night.
- Three trigger versions. Four to five minutes each, for the three relapses that actually happen: an anxious wake, a night after drinking, and a schedule that moved.
- Lifetime access. Paid once, no subscription, every update included.

It is not a second course and it is not more theory. It is the one night the seven nights do not cover, worked out in advance.

Education and coaching, not medical care.
```

### Descrição, versão portuguesa

```
A noite em que volta.

O protocolo de 7 noites ensina-te a dormir. Isto é para a oitava vez que falha, que é a noite que decide se ficas com o método ou se paras de o usar sem dizer nada.

O que está lá dentro:
- O protocolo de 20 minutos. Áudio guiado para o meio da noite, com os silêncios deixados lá, para seres conduzido enquanto o fazes em vez de teres de te lembrar de uma lista.
- O cartão dos primeiros 90 segundos. Uma página, impressa para a mesa de cabeceira e guardada no telemóvel. O que fazer antes de decidires seja o que for sobre a noite.
- Três versões por gatilho. Quatro a cinco minutos cada, para as três recaídas que acontecem mesmo: acordar em ansiedade, uma noite depois de beber, e um horário que mudou.
- Acesso vitalício. Pagas uma vez, sem assinatura, com todas as actualizações incluídas.

Não é um segundo curso nem é mais teoria. É a única noite que as sete noites não cobrem, resolvida com antecedência.

Educação e treino, não cuidados médicos.
```

### Descrição, versão espanhola

```
La noche en que vuelve.

El protocolo de 7 noches te enseña a dormir. Esto es para la octava vez que falla, que es la noche que decide si te quedas con el método o dejas de usarlo sin decir nada.

Lo que incluye:
- El protocolo de 20 minutos. Audio guiado para mitad de la noche, con los silencios dentro, para que te lleven mientras lo haces en vez de tener que recordar una lista.
- La tarjeta de los primeros 90 segundos. Una página, impresa para la mesilla y guardada en el móvil. Qué hacer antes de decidir nada sobre la noche.
- Tres versiones por detonante. Cuatro o cinco minutos cada una, para las tres recaídas que ocurren de verdad: despertar con ansiedad, una noche después de beber, y un horario que cambió.
- Acceso de por vida. Pagas una vez, sin suscripción, con todas las actualizaciones incluidas.

No es un segundo curso ni es más teoría. Es la única noche que las siete noches no cubren, resuelta de antemano.

Educación y entrenamiento, no atención médica.
```

---

## 5. Produto 4. O downsell

### Ficha

| Campo no painel | Valor a colar |
|---|---|
| Nome do produto | `Sleep Wired: The 3AM Anxiety Protocol` |
| Formato do produto | Áudio |
| Categoria | Saúde e Esportes |
| Idioma do produto | Inglês |
| Preço | `9.00` |
| Moeda | EUR |
| Garantia | 60 dias |
| Página de vendas | `https://sleepwired.com/relapse-kit?d=1` **(mesma página do OTO, ver secção 10)** |
| Página de obrigado | `https://sleepwired.com/welcome` |
| Email de suporte | `support@sleepwired.com` |
| Entrega do conteúdo | Área de membros externa, uma faixa só |
| Parcelamento | à vista |
| Afiliação | desligada |

Oferta única, chamada `Downsell`. O código vai para `VITE_HOTMART_OFF_DOWNSELL`.

### Descrição, versão inglesa

```
One protocol, for the wake-up that keeps happening.

The single guided protocol for waking at 3AM with your heart going and your head already doing the arithmetic of tomorrow. Twelve minutes, played in the dark, no screen.

It is one track out of the Recovery Pack, sold on its own for whoever wants the 3AM one and nothing else.

Lifetime access. One payment.

Education and coaching, not medical care.
```

---

## 6. Produto 5. O segundo assento

### Ficha

| Campo no painel | Valor a colar |
|---|---|
| Nome do produto | `Sleep Wired: Second Seat` |
| Formato do produto | Curso online |
| Categoria | Saúde e Esportes |
| Idioma do produto | Inglês |
| Preço | `17.00` |
| Moeda | EUR |
| Garantia | 60 dias |
| Página de vendas | `https://sleepwired.com/dashboard` (é vendido de dentro da app, nas noites 5 a 7) |
| Página de obrigado | `https://sleepwired.com/welcome` |
| Email de suporte | `support@sleepwired.com` |
| Entrega do conteúdo | Área de membros externa, segunda conta com onboarding próprio |
| Parcelamento | à vista |
| Afiliação | desligada |

Oferta única, chamada `Seat`. O código vai para `VITE_HOTMART_OFF_SEAT`.

### Descrição, versão inglesa

```
A second account, for the person sleeping next to you.

Whoever does not sleep wakes whoever does. The second seat is a full account of their own: their own onboarding, their own sleep window, their own diary. Not a shared login.

Same 7-night protocol, same lifetime access, one payment.

Education and coaching, not medical care.
```

---

## 7. Order bump, funil de vendas e afiliados

### 7.1 Order bump

No produto 1, em cada uma das cinco ofertas, adicionar o order bump apontado ao produto 2 (Recovery Pack), oferta `Bump`, 19,00 EUR. O título e o corpo de cada uma são os da tabela na secção 3.

Ticket com o bump aceite: 46,00 EUR.

### 7.2 Funil de vendas

Um funil, com o produto 1 como produto de entrada:

```
compra do produto 1 aprovada
   └─ upsell 1 clique: produto 3, 3AM Relapse Kit, 47 EUR
        ├─ aceita  → /welcome
        └─ recusa  → downsell: produto 4, 3AM Anxiety Protocol, 9 EUR
                       ├─ aceita  → /welcome
                       └─ recusa  → /welcome
```

**Regra que não pode faltar:** quem aceitou o order bump não pode ver o downsell. O produto 4 é uma faixa do Recovery Pack, e vendê-la a quem acabou de comprar o pack inteiro é vender-lhe o que ele já tem. Se o painel não permitir a condição, o downsell fica desligado para as ofertas com bump aceite, ou desliga-se de todo. Isto verifica-se no painel, é o item 3 da secção 9.

### 7.3 Afiliados

Ativar afiliação **apenas no produto 1**. Os produtos 2 a 5 vivem dentro do funil e a comissão do afiliado sobre a venda inicial já lhe paga a esteira toda, se a Hotmart estiver configurada para atribuir as vendas do funil ao afiliado da venda de origem.

| Campo | Valor |
|---|---|
| Comissão | 50% no arranque, subir a 60% para afiliados que tragam volume |
| Tipo de atribuição | último clique |
| Aprovação de afiliados | manual, não automática |
| Divulgação no Mercado de Afiliados | sim, com as descrições PT e ES acima |

O recrutamento de afiliados só faz sentido nas versões PT e ES. Em inglês e francês a Hotmart não traz distribuição nenhuma, traz só a taxa. Isso já estava fechado no documento da esteira e não muda aqui.

---

## 8. Fichas dos produtos 6 e 7, para quando os ativos existirem

Não criar agora. Ficam escritas para não se perder a decisão.

### Produto 6. Reset Season

| Campo | Valor |
|---|---|
| Nome do produto | `Sleep Wired: Reset Season` |
| Formato | Áudio |
| Preço | `39.00` EUR |
| Tipo de cobrança | **pagamento único, nunca plano recorrente** |
| Garantia | 60 dias |
| Página de vendas | `https://sleepwired.com/dashboard` |
| Variável | `VITE_HOTMART_OFF_SEASON` |
| Falta | quatro faixas, uma por trimestre, e os emails que as acompanham |

A página de venda promete "sem assinatura". Se isto for criado como plano recorrente na Hotmart, a promessa passa a ser falsa no recibo do comprador, e é a promessa que sustenta toda a posição. Produto único com entrega ao longo do ano.

### Produto 7. Personal Recalibration

| Campo | Valor |
|---|---|
| Nome do produto | `Sleep Wired: Personal Recalibration` |
| Formato | Serviço |
| Preço | `79.00` EUR (faixa até 149 conforme o âmbito) |
| Garantia | 14 dias, é um serviço personalizado |
| Página de vendas | `https://sleepwired.com/dashboard` |
| Variável | `VITE_HOTMART_OFF_BACKEND` |
| Falta | o processo de entrega, e a revisão do Roger |

Vende-se como educação e treino, nunca como terapia, tratamento ou diagnóstico. Não vai para o ar sem passar pelo Roger.

---

## 9. Coisas que tens de confirmar no painel e que eu não consigo daqui

Estas quatro não são detalhes. Cada uma delas, se sair diferente do esperado, muda o que está escrito na página de vendas.

1. **Garantia de 60 dias.** A página promete 60 dias em todos os idiomas (`guarantee` nos quatro `src/locales/*.ts`). Se o painel só oferecer 7, 15 ou 30 dias, há duas saídas: baixar a promessa na página, ou manter os 60 e honrar os dias que passarem da janela da Hotmart por reembolso manual. Recomendo o segundo enquanto o volume for pequeno, porque a garantia longa é parte do que faz esta oferta funcionar. **Confirma isto antes de publicar a primeira oferta.**
2. **Limite de caracteres da descrição.** As descrições acima andam entre 700 e 1100 caracteres. Se o campo cortar, cortar a partir do fim, mantendo sempre a lista do que está incluído e a linha do disclaimer.
3. **Condição do downsell.** Confirmar que dá para esconder o downsell de quem aceitou o order bump. Se não der, desligar o downsell.
4. **Restrições de conteúdo de saúde.** A Hotmart revê a página de vendas. A nossa não promete cura nem resultado médico e já traz o disclaimer, mas convém contar com uma ronda de revisão e não marcar tráfego para o dia seguinte à submissão.

### Decisão em aberto: preço em reais

27 EUR convertidos dão cerca de R$165. Para low-ticket no Brasil isso é caro e é acima do ponto onde este tipo de produto converte, que anda nos R$97. A Hotmart permite criar uma oferta com preço próprio em BRL, o que resolveria isto sem tocar nos outros mercados.

Isto **não** contradiz a tua decisão de pôr a Hotmart em todos os mercados: continua tudo na Hotmart, num painel só. É só o número do preço em BRL.

Se aprovares, a esteira em reais ficaria: front R$97, bump R$67, OTO R$167, downsell R$37, seat R$57. Diz-me e eu acrescento a coluna BRL às tabelas e ajusto o `offers.ts` para escolher a oferta pela moeda. Se preferires manter só EUR, fica como está e não se cria nada.

---

## 10. O que falta no nosso lado antes de ligar o interruptor

Criar os produtos na Hotmart é a parte que depende de ti. Estas três dependem do código, e sem elas a compra na Hotmart não entrega nada:

1. **Webhook de compra.** Não existe. Hoje não há nenhum endpoint que receba a notificação de compra da Hotmart e crie a conta do comprador. Uma venda na Hotmart resultaria em dinheiro cobrado e nenhum acesso. **É o bloqueio número um.**
2. **Página do OTO.** O texto está escrito nos quatro idiomas em `src/locales/*.ts`, bloco `oto1`, mas nenhuma página o renderiza. A rota `/relapse-kit` é a que está nas fichas dos produtos 3 e 4 e ainda tem de ser criada.
3. **A página `/welcome` a aceitar a Hotmart.** Hoje espera um `session_id` da Stripe. Com a Hotmart o comprador chega lá sem esse parâmetro.

Enquanto `VITE_HOTMART_PRODUCT` estiver vazio, o site continua a cobrar pela Stripe e nada disto parte. Essa variável é o interruptor, e só se preenche quando os três pontos acima estiverem feitos.

---

## 11. Onde colar os códigos quando os tiveres

Cada oferta criada gera um código de oferta, o `off=` do link de checkout. O produto gera um id, que é o `<isto>` em `pay.hotmart.com/<isto>`. Copia-os para `.env.hotmart.example` copiado como `.env`:

```
VITE_CHECKOUT_PROVIDER=hotmart
VITE_HOTMART_LOCALES=
VITE_HOTMART_PRODUCT=<id do produto 1>
VITE_HOTMART_OFF_FRONT=<oferta Generic>
VITE_HOTMART_OFF_FRONT_MAINTENANCE=<oferta Maintenance>
VITE_HOTMART_OFF_FRONT_ONSET=<oferta Onset>
VITE_HOTMART_OFF_FRONT_MIXED=<oferta Mixed>
VITE_HOTMART_OFF_FRONT_CIRCADIAN=<oferta Circadian>
VITE_HOTMART_OFF_BUMP=<oferta Bump>
VITE_HOTMART_OFF_OTO1=<oferta OTO1>
VITE_HOTMART_OFF_DOWNSELL=<oferta Downsell>
VITE_HOTMART_OFF_SEAT=<oferta Seat>
VITE_HOTMART_OFF_SEASON=
VITE_HOTMART_OFF_BACKEND=
```

São variáveis de build. Mudar uma obriga a reconstruir e voltar a publicar, não basta reiniciar o servidor.
