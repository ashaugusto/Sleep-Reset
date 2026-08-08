# FLU-143 — Enquete de entrada do sleepwired: conteúdo completo

**Data:** 2026-08-08 · **Substitui:** `artifacts/sleep-reset/src/pages/quiz.tsx` (10 perguntas, 7,2% de conclusão)
**Depende de:** `flu143-reposicionamento-funil.md` (funil) e `flu143-pesquisa-posicionamento.md` (posição B/A/WIRED)
**Estado:** spec de copy pronto para implementação. Toda a copy de utilizador está em inglês e é para copiar tal como está. As notas em PT-BR são para o Diego, não vão para o ecrã.

---

## 0. Regras que governam o ecrã inteiro

| Regra | Valor |
|---|---|
| Perguntas | **5**. Nunca mais. |
| Interação | Uma pergunta por ecrã, resposta única, **um toque avança**. Sem botão "Continue". |
| Scroll | Zero. Pergunta + opções cabem em 100dvh a 375px de largura. |
| Email | **Só na página de resultado**, depois do diagnóstico. Nunca antes. |
| Estilo | Clínico claro (`#FAFAF7` / `#0E2541` / `#C9A14A`), o mesmo do `quiz.tsx` atual. O WIRED não entra aqui. |
| Voltar | Link "Back" discreto, canto inferior esquerdo. Sem seta de avançar. |
| Persistência | Manter o `localStorage` de progresso que já existe. |

**Fluxo:** Hero → Q1 → micro-feedback → Q2 → … → Q5 → ecrã de cálculo (2,5s) → resultado do perfil → pedido de email → oferta.

---

## 1. Hero de entrada

Vende o diagnóstico, não o produto. Ninguém sabe o preço nem o nome do produto neste ecrã.

**Versão principal (usar esta):**

```
EYEBROW:     A 60-SECOND SLEEP TEST

HEADLINE:    Why does your brain wake you at 3AM?

SUB:         Five questions. Sixty seconds. At the end you get your
             sleep type and the exact mechanism behind it.

BUTTON:      Show me my sleep type

MICROCOPY:   No email needed to see your result.
```

**Alternativas para teste A/B (não implementar já, deixar como constante trocável):**

- B: `You've tried everything. Find out what you actually have.` / sub: `Most people treat the wrong kind of insomnia for years. Five questions tells you which one is yours.`
- C: `Three types of people can't sleep. Only one of them wakes at 3AM.` / sub: `Answer five questions and find out which one you are.`

**Notas:**
- A microcopy "No email needed to see your result" é a peça mais importante do hero. É a promessa que separa isto do quiz antigo e de todos os quiz funnels do nicho. Tem de estar visível **abaixo do botão**, não escondida.
- Não usar "personalized", "journey", "unlock", "transform". O público está em sofisticação 4-5 e essas palavras identificam-nos como mais um.

---

## 2. Barra de progresso

Topo fixo, com logo à esquerda e contador à direita, como já está no `quiz.tsx`.

```
Question 1 of 5
Question 2 of 5
Question 3 of 5
Question 4 of 5
Question 5 of 5
```

No ecrã de cálculo, o contador muda para:

```
Building your result
```

**Não** contar o pedido de email como passo (o atual conta `Step 11 of 11` — foi parte do problema: o utilizador via 11 passos antes de qualquer retorno). A barra vai a 100% ao terminar a Q5.

---

## 3. As 5 perguntas

Legenda das colunas: `value` = slug guardado na DB · `perfil` = para onde a resposta puxa · `captura` = variável de segmentação.

---

### Q1 — `main_problem` · o divisor de perfil

```
PROMPT:   Which one is your night?
HELPER:   Pick the one that ruins the most nights.
```

| Emoji | Label (EN) | `value` | Perfil | Micro-feedback (aparece após o clique) |
|---|---|---|---|---|
| 🌙 | I fall asleep fine — then I'm awake at 3AM | `wake_3am` | **maintenance** | `That's the most common answer on this test.` |
| 🔁 | I lie there for hours before I fall asleep | `cant_fall_asleep` | onset | `Your brain won't hand over the shift. There's a reason.` |
| ⚡ | Both — hard to fall asleep, then awake again | `both` | mixed | `Two problems, one mechanism underneath. We'll get to it.` |
| 🪶 | I sleep, but light and broken all night | `light_all_night` | mixed | `Sleep that never goes deep. Different failure, same cause.` |
| 🕐 | My schedule is chaos — shifts, travel, late nights | `irregular_schedule` | circadian | `Your body clock is being overwritten every week.` |

**Nota de implementação:** o classificador em `artifacts/api-server/src/routes/quiz.ts:20` decide `circadian` pela pergunta `shift_work`, que deixa de existir. Trocar a linha 22 por `if (main === "irregular_schedule") return "circadian";`. Os restantes `value` mantêm-se iguais aos de hoje — a DB histórica continua legível.

---

### Q2 — `night_mind` · o mecanismo, e a pergunta mais divertida das cinco

```
PROMPT:   When you're awake at night, what's your brain doing?
HELPER:   Be honest. Everyone picks one of these.
```

| Emoji | Label (EN) | `value` | Captura | Micro-feedback |
|---|---|---|---|---|
| 🌀 | Racing — work, money, conversations on loop | `racing` | hiperexcitação cognitiva | `Not thoughts. A brain stuck on guard duty.` |
| 🫀 | Wide awake and alert, like it's midday | `alert` | hiperexcitação fisiológica | `Alert at 3AM is a hormone doing its job badly.` |
| ⏰ | Watching the clock, doing the math on hours left | `clock_math` | ansiedade de desempenho | `Clock math is the fastest way to stay awake.` |
| 😰 | Worrying about not sleeping | `sleep_anxiety` | ansiedade antecipatória | `Trying harder to sleep is what keeps you awake.` |

**Porque esta pergunta existe:** é a que faz o resultado parecer merecido. Sem ela o diagnóstico lê-se como sorte; com ela o utilizador reconhece que descrevemos a cabeça dele. É também a única pergunta que produz um dado que os concorrentes não recolhem.

---

### Q3 — `severity` · frequência e duração numa só pergunta

```
PROMPT:   How often does this happen?
HELPER:   Roughly. Nobody's counting.
```

| Emoji | Label (EN) | `value` | Captura | Micro-feedback |
|---|---|---|---|---|
| 🔴 | Almost every night, and it's been years | `nightly_chronic` | severidade alta + crónico | `Years, not weeks. This is chronic insomnia territory.` |
| 🟠 | Most nights for the last few months | `most_nights` | severidade alta + crónico | `Past three months, it stops being a bad patch.` |
| 🟡 | A few nights a week, on and off | `few_nights` | severidade média | `On and off is still every week. It counts.` |
| 🟢 | It comes in waves — good weeks, terrible weeks | `waves` | severidade variável | `The waves usually track something. We'll find it.` |

**Nota:** esta pergunta escreve **dois** campos — `frequency` (nightly / most / few / variable) e `duration_bucket` (chronic / chronic / unknown / unknown). Uma resposta, dois dados, um toque. Substitui as duas perguntas separadas do quiz antigo.

---

### Q4 — `tried` · o que já falhou, resposta única

```
PROMPT:   What have you already tried?
HELPER:   Pick the furthest you've gone.
```

Resposta **única** (o quiz antigo era multi-select e exigia botão "Continue" — quebrava o um-toque). As opções estão em escada, da mais leve à mais pesada, e o utilizador escolhe a mais alta que atingiu.

| Emoji | Label (EN) | `value` | Captura | Micro-feedback |
|---|---|---|---|---|
| 🍵 | Melatonin, teas, magnesium | `supplements` | nível 1 | `Melatonin shifts timing. It doesn't stop hyperarousal.` |
| 📱 | Sleep apps, meditation, white noise | `apps` | nível 2 | `Apps calm the room. The problem isn't the room.` |
| 📋 | Sleep hygiene — dark room, no screens, no coffee | `hygiene` | nível 3 | `Sleep hygiene prevents insomnia. It doesn't treat it.` |
| 💊 | Prescription sleeping pills | `prescription` | nível 4 · alta intenção | `You went as far as medicine goes. And you're still here.` |
| 🆕 | Honestly, nothing serious yet | `nothing` | frio | `Then you're starting before the years pile up.` |

**Nota:** `prescription` é o segmento de maior intenção de compra. Marcar no perfil para o retargeting e para escolher o bump.

---

### Q5 — `day_impact` · a aposta emocional

```
PROMPT:   What does the next day cost you?
HELPER:   The part you'd fix first.
```

| Emoji | Label (EN) | `value` | Captura | Micro-feedback |
|---|---|---|---|---|
| 🔋 | Energy — I'm running on empty by 10am | `no_energy` | dor física | `Coffee stops working around the third bad week.` |
| 🌫️ | Focus — I read the same line four times | `brain_fog` | dor cognitiva | `That fog is your brain running maintenance while awake.` |
| 😤 | Patience — I snap at people I love | `bad_mood` | dor relacional | `The people around you notice before you do.` |
| 🛏️ | Dread — I start fearing bedtime by dinner | `dread` | ansiedade antecipatória | `Dreading bed is the loop feeding itself.` |

**Porque esta é a última:** é a resposta que a página de resultado cita de volta ao utilizador, e é o que a copy da oferta usa. Fica em último porque é a mais pesada emocionalmente e nessa altura já investiu quatro toques.

---

## 4. Micro-feedback — regras de exibição

O micro-feedback é o que separa isto de um formulário. Sem ele, cinco perguntas continuam a parecer cinco perguntas.

- Aparece **depois do clique**, no lugar das opções ou por baixo da opção escolhida.
- Duração: **1.100 ms**, depois avança sozinho. Nada de botão.
- Formato: uma linha, máximo 12 palavras, sem ponto de exclamação.
- Estilo: fundo `#0E2541` a 6% de opacidade, texto `#0E2541`, itálico não. Um ponto dourado `#C9A14A` à esquerda.
- A opção escolhida fica visível e marcada enquanto o feedback está no ecrã. O utilizador tem de ver o que respondeu.
- **Nada de barras de carregamento falsas entre perguntas.** O único ecrã de espera é o do cálculo final.

**Tom do micro-feedback:** informação, não elogio. `Good choice!` e `Great answer!` matam a credibilidade neste nicho. Cada linha diz um facto ou nomeia o que a pessoa acabou de descrever.

---

## 5. Ecrã de cálculo

Depois da Q5. Duração total **2.500 ms**. Três linhas, cada uma 800 ms, entrando por cima da anterior com a anterior a ficar em cinzento com um check.

```
Reading your answers…
Matching them to the four insomnia types…
Your result is ready.
```

**Se for preciso uma quarta linha** (por ex. se a chamada à API demorar):

```
Reading your answers…
Matching them to the four insomnia types…
Checking which mechanism fits…
Your result is ready.
```

**Aviso — não implementar a linha do briefing:** `Comparing your answers to 1,200 sleep profiles…` não pode ir para o ar. Temos 12 perfis na base, não 1.200. Um número inventado numa página que vende credibilidade a um público cético é exatamente o risco que a pesquisa de posicionamento identificou (§2, "neste nicho a moeda é credibilidade"), e é uma afirmação sobre a qual a ASA e a FTC têm dentes. Quando tivermos volume real, trocamos por `Comparing your answers to X,XXX profiles` com o número lido da DB.

---

## 6. Página de resultado — um bloco por perfil

Estrutura idêntica nos quatro. O que muda é o título, os dois parágrafos e a linha do plano.

**Moldura comum (acima do bloco de perfil):**

```
BADGE:     YOUR RESULT
```

**Moldura comum (abaixo dos dois parágrafos, antes do email):** ver §7.

---

### 6.1 MAINTENANCE — `wake_3am` · 67% do público. É o bloco que importa.

```
TITLE:     You're a Maintenance Type.
SUBTITLE:  You don't have trouble falling asleep. You have trouble
           staying asleep — and that's a different problem with a
           different fix.
```

**Parágrafo 1 — o mecanismo:**

```
Here's what happens to you around 3AM. Cortisol — the hormone that
gets you out of bed in the morning — doesn't switch on at your alarm.
It starts rising in the second half of the night, hours before you
need it. In most people that pulse passes underneath sleep and nobody
notices. In you, it lands like an alarm. Eyes open. Fully alert. At
the worst possible hour.
```

**Parágrafo 2 — porque não é culpa dele, e porque nada funcionou:**

```
That's the first half. The second half is what your brain has learned
to do with it. After enough bad nights, waking up stops being neutral
and becomes a threat — so the moment you're awake, your brain starts
checking the clock, doing the math, bracing for tomorrow. That's
hyperarousal, and it's why trying harder makes it worse. It's also
why melatonin, apps and sleep hygiene did nothing for you: they're
built to help you fall asleep. You already do that fine. Nobody gave
you anything for the 3AM half.
```

**Ponte para o email:**

```
LINE:      Your plan targets the wake-up, not the bedtime.
```

---

### 6.2 ONSET — `cant_fall_asleep`

```
TITLE:     You're an Onset Type.
SUBTITLE:  Your body is ready for sleep. Your brain refuses to hand
           over the shift.
```

**Parágrafo 1 — o mecanismo:**

```
Falling asleep isn't a decision, it's a handover — your nervous system
has to drop out of alert mode before sleep can start. Yours doesn't.
The moment the lights go off and the distractions stop, the day's
unfinished business gets the floor: work, money, the conversation you
replayed at 6pm. Your body is exhausted and your brain is running at
midday speed. That's the "tired but wired" state, and it's a
measurable physical condition, not a personality trait.
```

**Parágrafo 2 — porque piora:**

```
The part that traps people is what comes next. Every hour you spend
awake in bed teaches your brain that bed is where you lie there
thinking. Do that for a few hundred nights and the bedroom itself
becomes the trigger — you get sleepy on the sofa and wide awake the
second you lie down. This is why "just relax" fails and why effort
backfires: sleep is the one thing that gets further away the harder
you chase it. It has to be approached from the side.
```

**Ponte para o email:**

```
LINE:      Your plan works on the handover, not on willpower.
```

---

### 6.3 CIRCADIAN — `irregular_schedule`

```
TITLE:     You're a Circadian Type.
SUBTITLE:  Your sleep isn't broken. It's being scheduled by something
           other than your body clock.
```

**Parágrafo 1 — o mecanismo:**

```
You have an internal clock that decides when you get sleepy, and it
runs on light and routine — not on how tired you are. Shift work,
travel, and late nights rewrite that clock faster than it can adjust.
So it stops arriving at the same time every night. You lie down when
the schedule says to and your body isn't there yet, or it showed up
three hours ago and left.
```

**Parágrafo 2 — porque os produtos genéricos falham aqui:**

```
This is the type that gets the worst advice, because most sleep
products assume a normal schedule and tell you to keep a fixed
bedtime. You can't. What you can do is anchor the clock from the other
end — the wake-up, the first light of the day, the first hour after
it. Those are the signals your body actually reads, and they work even
when your nights don't repeat.
```

**Ponte para o email:**

```
LINE:      Your plan anchors the mornings, because your nights move.
```

---

### 6.4 MIXED — `both` / `light_all_night`

```
TITLE:     You're a Mixed Type.
SUBTITLE:  Two problems on the surface. One mechanism underneath.
```

**Parágrafo 1 — o mecanismo:**

```
You have trouble getting in and trouble staying in — which reads like
two separate faults but usually isn't. It's a nervous system that
never fully drops out of alert. It keeps you from falling asleep at
the start of the night, and it wakes you at the first natural surface
point a few hours in. Same guard, two shifts.
```

**Parágrafo 2 — porque é o mais frustrante e o mais tratável:**

```
Mixed is the type that makes people give up, because fixing one half
seems to make the other worse: you finally fall asleep faster and then
you're up at 3AM anyway. That's not failure, it's the order being
wrong. When the underlying arousal comes down, both halves move
together — but it has to be done in sequence, one before the other,
which is the part nobody tells you.
```

**Ponte para o email:**

```
LINE:      Your plan runs in order, because both halves are connected.
```

---

## 7. Pedido de email — só aqui, depois do diagnóstico

Aparece logo abaixo do bloco de perfil, no mesmo ecrã. Sem transição, sem modal.

```
HEADLINE:  Where should we send your plan?

SUB:       Your full {TYPE} breakdown plus Night 1 of the protocol.
           One email. Nothing else.

FIELD:     Email

BUTTON:    Send me my plan

MICRO:     No spam. One follow-up at most. Unsubscribe in one click.

SKIP:      Or keep reading without it →
```

**Regras:**
- `{TYPE}` = `Maintenance Type` / `Onset Type` / `Circadian Type` / `Mixed Type`.
- **O link "Or keep reading without it" não é opcional.** O resultado já foi entregue; se agora bloquearmos o resto atrás do email, quebramos a promessa do hero e perdemos o comprador cético — que é o comprador. Quem salta continua para o VSL/EP4 e para a oferta normalmente, e o email é recuperado no exit-intent que já existe.
- O botão dispara `quiz_complete` + Meta Lead com o `event_id` partilhado, como já faz o `quiz.tsx:249-270`. Manter essa lógica intacta.
- Abaixo deste bloco vem o EP4 (`Why Exactly 3:07 AM`) embebido para o perfil maintenance, e o episódio correspondente para os outros — conforme o funil em `flu143-reposicionamento-funil.md` §4.

---

## 8. O que morreu do quiz antigo, e porquê

Cinco perguntas saíram. Nenhuma delas diagnosticava nada — eram pesquisa de mercado a ser cobrada ao utilizador antes de ele receber o que quer que fosse.

| Pergunta cortada | Porquê |
|---|---|
| `age` — faixa etária | Era a **primeira** pergunta. Abrir um teste de insónia a perguntar a idade sinaliza formulário, não diagnóstico, e o utilizador percebe isso no primeiro segundo. Não entra no `classifyType`. Recolhe-se no pós-compra, onde não custa conversão. |
| `gender` | Idem. Não altera o perfil nem a oferta. Segunda pergunta do funil, custo puro. |
| `recent_stress` — evento stressante | Toda a gente responde "yes" ou "I always have stress". Uma pergunta cuja resposta é previsível não segmenta nada. |
| `shift_work` | Absorvida como a 5ª opção da Q1 (`irregular_schedule`). Continua a produzir o perfil `circadian`, com um toque em vez de dois. |
| `outcome` — "o que mudaria se resolvesses" | Duplicava o `day_impact` do lado positivo. Mantivemos a versão da dor (Q5), que é a que o público reconhece e a que a copy da oferta usa. |
| `frequency` + `duration` (duas perguntas) | Fundidas na Q3. As opções carregam frequência e duração no mesmo label — uma resposta, dois campos. |
| `tried` multi-select | Passou a resposta única, em escada. O multi-select exigia botão "Continue" e era a única pergunta que quebrava o um-toque. |

**Ganho líquido:** 10 → 5 perguntas, 11 → 5 passos até valor, e o email deixa de ser o passo 11 para passar a ser posterior ao resultado. As três falhas descritas em `flu143-reposicionamento-funil.md` §2 ficam fechadas: comprimento, resultado inexistente, e email antes do valor.

**Entrou uma pergunta nova** (`night_mind`, Q2). É a única adição, e é deliberada: é o que faz o diagnóstico parecer lido em vez de sorteado, e é o dado que nenhum concorrente do mapa recolhe.

---

## 9. Notas para o Diego

1. **Classificador** — `artifacts/api-server/src/routes/quiz.ts:20-27`: trocar a regra de `shift === "yes"` por `main === "irregular_schedule"`. Os restantes `value` de `main_problem` não mudam, portanto os 12 perfis históricos continuam a classificar igual.
2. **Campos novos na `sleep_profiles.answers`**: `night_mind`, `severity`, e os dois derivados da Q3 (`frequency`, `duration_bucket`). Não é preciso migração de schema se `answers` for JSONB.
3. **Página de resultado** — hoje não existe. `quiz.tsx:288` despeja o utilizador em `/?h=…&qp=…` e o `watch.tsx` não lê nenhum dos dois parâmetros. Esta é a peça que falta no funil inteiro; o resultado tem de ser renderizado, não redirecionado.
4. **Eventos**: manter `quiz_start` e `quiz_complete`. Adicionar `quiz_q{1..5}_done` e `quiz_result_view` — sem eles não conseguimos ver em que pergunta se perde gente, que é o único número que interessa medir nesta versão.
5. **Claims a não inventar**: nenhuma linha desta spec afirma um número que não possamos suportar. Se alguém acrescentar um "junta-te a X pessoas" ou "1.200 perfis analisados" durante a implementação, tem de sair.
6. **Isto só é mensurável com tráfego ligado.** Está desligado desde 8 de Junho. Enquanto não houver ~200 cliques frios, esta enquete é uma hipótese bem construída, exatamente como a anterior.

---

*Deliverable interno FLU-143. Copy de produto em EN; notas internas em PT-BR.*
