# Sleep Wired: nome, promessa e copy dos degraus 4 a 7

**Issue:** FLU-226 (filha da FLU-221) · **Data:** 23 de Agosto de 2026
**Base de tom:** `src/pages/kit.tsx` e a chave `oto1` nos quatro locales. **Base de esteira:** `marketing/flu143-esteira-hotmart.md` e `src/lib/offers.ts`.

Quatro degraus, quatro nomes, texto pronto a colar em PT, EN, FR e ES. As chaves usadas abaixo (`downsell`, `seat`, `season`, `backend`) são exactamente os nomes de `Rung` que já existem em `src/lib/offers.ts`, para o Diego não ter de inventar nomenclatura nova.

---

## Regras que valem para os quatro degraus

1. **A marca é Sleep Wired.** Em nenhum lado do texto do produto aparece agência, assinatura ou vocabulário de fornecedor.
2. **Sem travessão e sem emoji** em texto que o cliente lê. Vírgula, ponto e dois pontos chegam.
3. **Nomes de produto ficam em inglês nos quatro idiomas**, como já acontece com o 3AM Relapse Kit e o Recovery Pack. A frase de promessa vem logo a seguir na língua do visitante e explica o nome, que é o padrão que o Kit já usa e que funciona.
4. **Nada de assinatura e nada de revogar o que já foi vendido.** É a trava da posição: paga-se uma vez. O degrau 6 é um ano comprado de uma vez, não uma mensalidade.
5. **Garantia de 30 dias** nos degraus 4, 5 e 6, igual à do protocolo, com uma diferença no 6: ali conta da primeira entrega e não da compra, por decisão do Ash a 23 de Agosto. O degrau 7 é serviço humano e a garantia tem de ser escrita de outra forma, ver a secção respectiva. Nota de plataforma: o dropdown da Hotmart só tem 7, 15, 21 e 30 dias, vender em EUR proíbe os 7, portanto 30 é a escolha e não há 60. E a Hotmart conta sempre da compra, nunca da entrega, o que faz da garantia do degrau 6 uma promessa honrada à mão.
6. **Degrau 7 é educação e acompanhamento, nunca diagnóstico, tratamento ou terapia.** A frase está escrita nos quatro idiomas e não é opcional.

---

## O que precisa de decisão do Ash antes de ir para o ar

| Degrau | Decisão em aberto | Porque bloqueia |
|---|---|---|
| 4 | RESOLVIDO em 23 Ago. É o `kit-3am-protocol.mp3` sozinho. O Diego colou a copy nos quatro locales no commit 4258ac0 | fechado |
| 5 | RESOLVIDO em 23 Ago. É convite por link: o comprador compra em `/partner` e o parceiro abre a conta em `/seat/:token`. A bullet do convite fica como estava escrita | fechado |
| 6 | RESOLVIDO em 23 Ago. Entrega só nas quatro datas fixas (1 Jan, 1 Abr, 1 Jul, 1 Out), nada no acto da compra, e a garantia corre da primeira entrega | fechado na copy. Fica de pé uma questão de plataforma, ver a secção do degrau 6 |
| 7 | RESOLVIDO em 23 Ago. Dois níveis, 79 escrito e 149 com chamada de 30 min. Até 7 dias úteis. Mínimo de 7 noites. Revisão do Ash, em lote semanal | fechado. Já não há `{days}` nem `{nights}` no texto, os números estão escritos |

Nenhum destes bloqueios impede o Diego de colar o texto nos locales já hoje. Bloqueiam a criação da oferta na Hotmart.

**Estado em 23 Ago, fim do dia.** As quatro decisões fecharam. Degraus 4 e 5 estão colados nos quatro locales e têm página (`/partner`, `/seat/:token`), com os tipos `DownsellCopy` e `SeatCopy` em `src/locales/types.ts`. Degraus 6 e 7 têm agora o texto final, com os números escritos e sem uma única variável por decidir, e estão prontos para o Diego colar. Ficam três pontos que não são de copy e que estão nomeados na nota final: o preço do segundo nível não tem onde viver em `OFFERS`, os degraus 6 e 7 abrem no mesmo instante e é preciso separá-los, e a garantia do degrau 6 é honrada à mão porque a Hotmart não a sabe contar. A chamada de 30 minutos do degrau 7 foi revista pelo Roger a 23 de Agosto: a linha actual chega para o nível de 79 e não chega para o de 149, que precisa de uma linha extra na página e de um aceite no momento de marcar. O texto novo, nos quatro idiomas, está em `marketing/flu238-degrau7-chamada-compliance.md`.

---

# Degrau 4. The 3AM Protocol · 9 EUR

**Onde vive:** página de recusa do OTO. O visitante acabou de dizer não a 47 EUR, está a noventa segundos de ter pago o protocolo principal e ainda não entrou na plataforma. Chave sugerida: `downsell`.

### Decisão que peço ao Ash antes de criar a oferta

O `flu143-esteira-hotmart.md` decidiu em Agosto que este degrau era **uma faixa do Recovery Pack vendida sozinha**, e deixou uma ressalva por resolver: quem levou o Recovery Pack no order bump não pode ver este downsell, porque seria vender-lhe o que ele acabou de comprar.

Escrevi a copy para a outra hipótese, que é **o `public/audio/kit-3am-protocol.mp3` vendido sozinho, sem o cartão e sem as três versões por gatilho**. Três razões:

- Resolve a ressalva. Ninguém pode já ter comprado esta faixa neste checkout, portanto o downsell pode ser mostrado a toda a gente que recusa, sem regra condicional no painel.
- É a resposta honesta a quem acabou de recusar. Ele não recusou o tema, recusou o preço. Dar-lhe a peça central do que recusou por um quinto é a oferta que o "não" pede.
- O ficheiro já existe no repositório desde a FLU-153. Não há produção nenhuma pela frente.

O que se paga por isto é canibalização: quem hesitava no Kit a 47 tem agora uma saída a 9. É o preço normal de um downsell e vive dentro do take-rate assumido de 8 por cento sobre quem recusa.

**Se o Ash preferir manter a faixa do Recovery Pack, diga e reescrevo esta secção.** A copy muda, a regra de funil volta a ser precisa e o nome deixa de fazer sentido.

---

### PT

**Nome:** The 3AM Protocol
**Promessa:** O áudio de vinte minutos que está no centro do kit, sozinho, para a noite em que a insónia voltar.

**Eyebrow:** Antes de entrar
**Título:** Então leve só o áudio

**Bullets:**
- O protocolo de 20 minutos, a mesma gravação que está no centro do kit, sem o cartão e sem as três versões por gatilho.
- Feito para ouvir no escuro, com os silêncios mantidos. Nada para ler às três da manhã.
- Entra na sua biblioteca no mesmo login, no momento em que pagar.
- Seu para sempre. Pago uma vez, sem assinatura.

**Botão:** Sim, quero o protocolo por {price}
**Recusa:** Não, obrigado. Quero ir para o meu protocolo
**Linha de preço:** Um pagamento único de {price}, somado ao pedido que você acabou de fazer.
**Garantia:** Coberto pela mesma garantia de 30 dias do protocolo.

### EN

**Name:** The 3AM Protocol
**Promise:** The twenty minute audio at the centre of the kit, on its own, for the night it comes back.

**Eyebrow:** Before you go in
**Title:** Then take just the audio

**Bullets:**
- The 20 minute protocol, the same recording that sits at the centre of the kit, without the card and without the three trigger versions.
- Made to be played in the dark, with the silences left in. Nothing to read at three in the morning.
- It lands in your library on the same login, the moment you pay.
- Yours for good. Paid once, no subscription.

**Button:** Yes, take the protocol for {price}
**Decline:** No thanks, take me to my protocol
**Price line:** One payment of {price}, added to the order you just made.
**Guarantee:** Covered by the same 30 day guarantee as the protocol.

### FR

**Nom :** The 3AM Protocol
**Promesse :** L'audio de vingt minutes qui est au coeur du kit, seul, pour la nuit où l'insomnie revient.

**Eyebrow :** Avant d'entrer
**Titre :** Alors prenez seulement l'audio

**Bullets :**
- Le protocole de 20 minutes, le même enregistrement qui est au coeur du kit, sans la carte et sans les trois versions par déclencheur.
- Fait pour être écouté dans le noir, silences compris. Rien à lire à trois heures du matin.
- Il arrive dans votre bibliothèque, sur le même identifiant, dès le paiement.
- À vous, définitivement. Payé une fois, sans abonnement.

**Bouton :** Oui, je prends le protocole pour {price}
**Refus :** Non merci, emmenez-moi à mon protocole
**Ligne de prix :** Un paiement unique de {price}, ajouté à la commande que vous venez de passer.
**Garantie :** Couvert par la même garantie de 30 jours que le protocole.

### ES

**Nombre:** The 3AM Protocol
**Promesa:** El audio de veinte minutos que está en el centro del kit, solo, para la noche en que el insomnio vuelva.

**Eyebrow:** Antes de entrar
**Título:** Entonces llévese solo el audio

**Bullets:**
- El protocolo de 20 minutos, la misma grabación que está en el centro del kit, sin la tarjeta y sin las tres versiones por detonante.
- Hecho para escuchar a oscuras, con los silencios dentro. Nada que leer a las tres de la mañana.
- Aparece en su biblioteca, en el mismo acceso, en cuanto pague.
- Suyo para siempre. Se paga una vez, sin suscripción.

**Botón:** Sí, quiero el protocolo por {price}
**Rechazo:** No, gracias. Llévenme a mi protocolo
**Línea de precio:** Un pago único de {price}, sumado al pedido que acaba de hacer.
**Garantía:** Cubierto por la misma garantía de 30 días que el protocolo.

### Pronto a colar

```ts
// pt.ts
downsell: {
  name: "The 3AM Protocol",
  eyebrow: "Antes de entrar",
  title: "Então leve só o áudio",
  promise: "O áudio de vinte minutos que está no centro do kit, sozinho, para a noite em que a insónia voltar.",
  bullets: [
    "O protocolo de 20 minutos, a mesma gravação que está no centro do kit, sem o cartão e sem as três versões por gatilho.",
    "Feito para ouvir no escuro, com os silêncios mantidos. Nada para ler às três da manhã.",
    "Entra na sua biblioteca no mesmo login, no momento em que pagar.",
    "Seu para sempre. Pago uma vez, sem assinatura.",
  ],
  priceLine: "Um pagamento único de {price}, somado ao pedido que você acabou de fazer.",
  cta: "Sim, quero o protocolo por {price}",
  decline: "Não, obrigado. Quero ir para o meu protocolo",
  guarantee: "Coberto pela mesma garantia de 30 dias do protocolo.",
},

// en.ts
downsell: {
  name: "The 3AM Protocol",
  eyebrow: "Before you go in",
  title: "Then take just the audio",
  promise: "The twenty minute audio at the centre of the kit, on its own, for the night it comes back.",
  bullets: [
    "The 20 minute protocol, the same recording that sits at the centre of the kit, without the card and without the three trigger versions.",
    "Made to be played in the dark, with the silences left in. Nothing to read at three in the morning.",
    "It lands in your library on the same login, the moment you pay.",
    "Yours for good. Paid once, no subscription.",
  ],
  priceLine: "One payment of {price}, added to the order you just made.",
  cta: "Yes, take the protocol for {price}",
  decline: "No thanks, take me to my protocol",
  guarantee: "Covered by the same 30 day guarantee as the protocol.",
},

// fr.ts
downsell: {
  name: "The 3AM Protocol",
  eyebrow: "Avant d'entrer",
  title: "Alors prenez seulement l'audio",
  promise: "L'audio de vingt minutes qui est au coeur du kit, seul, pour la nuit où l'insomnie revient.",
  bullets: [
    "Le protocole de 20 minutes, le même enregistrement qui est au coeur du kit, sans la carte et sans les trois versions par déclencheur.",
    "Fait pour être écouté dans le noir, silences compris. Rien à lire à trois heures du matin.",
    "Il arrive dans votre bibliothèque, sur le même identifiant, dès le paiement.",
    "À vous, définitivement. Payé une fois, sans abonnement.",
  ],
  priceLine: "Un paiement unique de {price}, ajouté à la commande que vous venez de passer.",
  cta: "Oui, je prends le protocole pour {price}",
  decline: "Non merci, emmenez-moi à mon protocole",
  guarantee: "Couvert par la même garantie de 30 jours que le protocole.",
},

// es.ts
downsell: {
  name: "The 3AM Protocol",
  eyebrow: "Antes de entrar",
  title: "Entonces llévese solo el audio",
  promise: "El audio de veinte minutos que está en el centro del kit, solo, para la noche en que el insomnio vuelva.",
  bullets: [
    "El protocolo de 20 minutos, la misma grabación que está en el centro del kit, sin la tarjeta y sin las tres versiones por detonante.",
    "Hecho para escuchar a oscuras, con los silencios dentro. Nada que leer a las tres de la mañana.",
    "Aparece en su biblioteca, en el mismo acceso, en cuanto pague.",
    "Suyo para siempre. Se paga una vez, sin suscripción.",
  ],
  priceLine: "Un pago único de {price}, sumado al pedido que acaba de hacer.",
  cta: "Sí, quiero el protocolo por {price}",
  decline: "No, gracias. Llévenme a mi protocolo",
  guarantee: "Cubierto por la misma garantía de 30 días que el protocolo.",
},
```

---

# Degrau 5. Second Seat · 17 EUR

**Onde vive:** dentro da plataforma, entre a noite 5 e a noite 7. Não no checkout: vende-se a quem já está a ver resultado, não a quem ainda está a decidir. Chave sugerida: `seat`.

**O ângulo:** quem não dorme acorda quem dorme ao lado. O parceiro não comprou nada e há semanas que tem as noites partidas por causa disto. O que se vende não é partilhar a conta, é uma conta dele, com a janela de sono calculada sobre as noites dele.

### Decisão que peço ao Ash

A copy diz que o parceiro recebe um convite e faz o próprio onboarding. **Isso é uma promessa de entrega que eu não confirmei que existe.** O documento de Agosto marcou o degrau como PRONTO por ser "o mesmo produto com outra conta", mas conta nova não é o mesmo que fluxo de convite. Faltam duas coisas por decidir:

- O comprador escreve o email do parceiro no checkout, ou recebe um link de convite para reencaminhar.
- Se o parceiro tem conta própria a sério, ou se é um segundo perfil dentro da conta do comprador.

Escrevi para a versão do convite por email, que é a que vende melhor e a que o texto do onboarding próprio implica. **Se o Diego confirmar que só dá para dar o email no checkout, mudo três linhas.** Não muda o nome nem a promessa.

Segunda utilização, que fica de pé em qualquer das versões: isto vende como presente, sobretudo em Dezembro.

---

### PT

**Nome:** Second Seat
**Promessa:** Uma segunda conta para quem você acorda, com as sete noites calculadas sobre as noites dela.

**Eyebrow:** Para o outro lado da cama
**Título:** Ela também não está dormindo

**Bullets:**
- Uma conta separada, com login próprio, sleep-log próprio e janela de sono calculada sobre as noites dela, não sobre as suas.
- Onboarding próprio do início. Ela responde às mesmas perguntas e recebe o plano do caso dela.
- As mesmas sete noites e as mesmas gravações que você tem. Nada é versão reduzida.
- Acesso vitalício, pago uma vez, sem assinatura. Continua dela mesmo que um dia se separem das contas.
- Serve como presente. Você paga, ela recebe o convite e faz a configuração sozinha.

**Botão:** Adicionar um segundo assento por {price}
**Linha de preço:** Um pagamento único de {price}. Nenhuma alteração no seu acesso.
**Garantia:** A mesma garantia de 30 dias do protocolo.

### EN

**Name:** Second Seat
**Promise:** A second account for the person you wake up, with the seven nights worked out on their nights, not yours.

**Eyebrow:** For the other side of the bed
**Title:** They are not sleeping either

**Bullets:**
- A separate account, with its own login, its own sleep log and a sleep window worked out on their nights, not yours.
- Their own onboarding from the start. They answer the same questions and get the plan for their case.
- The same seven nights and the same recordings you have. Nothing about it is a cut down version.
- Lifetime access, paid once, no subscription. It stays theirs even if the two accounts go separate ways.
- It works as a gift. You pay, they get the invitation and set it up themselves.

**Button:** Add a second seat for {price}
**Price line:** One payment of {price}. Nothing changes about your own access.
**Guarantee:** The same 30 day guarantee as the protocol.

### FR

**Nom :** Second Seat
**Promesse :** Un deuxième compte pour la personne que vous réveillez, avec les sept nuits calculées sur ses nuits à elle.

**Eyebrow :** Pour l'autre côté du lit
**Titre :** Elle non plus ne dort pas

**Bullets :**
- Un compte séparé, avec son propre identifiant, son propre journal de sommeil et une fenêtre de sommeil calculée sur ses nuits, pas sur les vôtres.
- Son propre parcours de départ. Elle répond aux mêmes questions et reçoit le plan de son cas.
- Les mêmes sept nuits et les mêmes enregistrements que vous. Rien n'est une version allégée.
- Accès à vie, payé une fois, sans abonnement. Le compte reste le sien même si un jour les deux se séparent.
- Cela fonctionne comme cadeau. Vous payez, elle reçoit l'invitation et fait la configuration elle-même.

**Bouton :** Ajouter un deuxième accès pour {price}
**Ligne de prix :** Un paiement unique de {price}. Rien ne change à votre propre accès.
**Garantie :** La même garantie de 30 jours que le protocole.

### ES

**Nombre:** Second Seat
**Promesa:** Una segunda cuenta para quien usted despierta, con las siete noches calculadas sobre las noches de ella.

**Eyebrow:** Para el otro lado de la cama
**Título:** Ella tampoco está durmiendo

**Bullets:**
- Una cuenta aparte, con acceso propio, registro de sueño propio y una ventana de sueño calculada sobre sus noches, no sobre las suyas.
- Su propia puesta en marcha desde el principio. Responde a las mismas preguntas y recibe el plan de su caso.
- Las mismas siete noches y las mismas grabaciones que usted tiene. Nada es una versión reducida.
- Acceso de por vida, se paga una vez, sin suscripción. Sigue siendo suyo aunque un día las dos cuentas se separen.
- Sirve como regalo. Usted paga, ella recibe la invitación y hace la configuración sola.

**Botón:** Añadir un segundo acceso por {price}
**Línea de precio:** Un pago único de {price}. Su propio acceso no cambia en nada.
**Garantía:** La misma garantía de 30 días que el protocolo.

### Pronto a colar

```ts
// pt.ts
seat: {
  name: "Second Seat",
  eyebrow: "Para o outro lado da cama",
  title: "Ela também não está dormindo",
  promise: "Uma segunda conta para quem você acorda, com as sete noites calculadas sobre as noites dela.",
  bullets: [
    "Uma conta separada, com login próprio, sleep-log próprio e janela de sono calculada sobre as noites dela, não sobre as suas.",
    "Onboarding próprio do início. Ela responde às mesmas perguntas e recebe o plano do caso dela.",
    "As mesmas sete noites e as mesmas gravações que você tem. Nada é versão reduzida.",
    "Acesso vitalício, pago uma vez, sem assinatura. Continua dela mesmo que um dia se separem das contas.",
    "Serve como presente. Você paga, ela recebe o convite e faz a configuração sozinha.",
  ],
  priceLine: "Um pagamento único de {price}. Nenhuma alteração no seu acesso.",
  cta: "Adicionar um segundo assento por {price}",
  guarantee: "A mesma garantia de 30 dias do protocolo.",
},

// en.ts
seat: {
  name: "Second Seat",
  eyebrow: "For the other side of the bed",
  title: "They are not sleeping either",
  promise: "A second account for the person you wake up, with the seven nights worked out on their nights, not yours.",
  bullets: [
    "A separate account, with its own login, its own sleep log and a sleep window worked out on their nights, not yours.",
    "Their own onboarding from the start. They answer the same questions and get the plan for their case.",
    "The same seven nights and the same recordings you have. Nothing about it is a cut down version.",
    "Lifetime access, paid once, no subscription. It stays theirs even if the two accounts go separate ways.",
    "It works as a gift. You pay, they get the invitation and set it up themselves.",
  ],
  priceLine: "One payment of {price}. Nothing changes about your own access.",
  cta: "Add a second seat for {price}",
  guarantee: "The same 30 day guarantee as the protocol.",
},

// fr.ts
seat: {
  name: "Second Seat",
  eyebrow: "Pour l'autre côté du lit",
  title: "Elle non plus ne dort pas",
  promise: "Un deuxième compte pour la personne que vous réveillez, avec les sept nuits calculées sur ses nuits à elle.",
  bullets: [
    "Un compte séparé, avec son propre identifiant, son propre journal de sommeil et une fenêtre de sommeil calculée sur ses nuits, pas sur les vôtres.",
    "Son propre parcours de départ. Elle répond aux mêmes questions et reçoit le plan de son cas.",
    "Les mêmes sept nuits et les mêmes enregistrements que vous. Rien n'est une version allégée.",
    "Accès à vie, payé une fois, sans abonnement. Le compte reste le sien même si un jour les deux se séparent.",
    "Cela fonctionne comme cadeau. Vous payez, elle reçoit l'invitation et fait la configuration elle-même.",
  ],
  priceLine: "Un paiement unique de {price}. Rien ne change à votre propre accès.",
  cta: "Ajouter un deuxième accès pour {price}",
  guarantee: "La même garantie de 30 jours que le protocole.",
},

// es.ts
seat: {
  name: "Second Seat",
  eyebrow: "Para el otro lado de la cama",
  title: "Ella tampoco está durmiendo",
  promise: "Una segunda cuenta para quien usted despierta, con las siete noches calculadas sobre las noches de ella.",
  bullets: [
    "Una cuenta aparte, con acceso propio, registro de sueño propio y una ventana de sueño calculada sobre sus noches, no sobre las suyas.",
    "Su propia puesta en marcha desde el principio. Responde a las mismas preguntas y recibe el plan de su caso.",
    "Las mismas siete noches y las mismas grabaciones que usted tiene. Nada es una versión reducida.",
    "Acceso de por vida, se paga una vez, sin suscripción. Sigue siendo suyo aunque un día las dos cuentas se separen.",
    "Sirve como regalo. Usted paga, ella recibe la invitación y hace la configuración sola.",
  ],
  priceLine: "Un pago único de {price}. Su propio acceso no cambia en nada.",
  cta: "Añadir un segundo acceso por {price}",
  guarantee: "La misma garantía de 30 días que el protocolo.",
},
```

---

# Degrau 6. Reset Season · 39 EUR pagos de uma vez

**Onde vive:** dentro da plataforma. Ver a nota de sequência no fim deste ficheiro: não pode ser no fim da noite 7, porque o degrau 7 já está lá. Chave: `season`.

**A trava:** isto **não é uma assinatura** e a copy tem de dizê-lo em voz alta, porque a página de venda promete "sem assinatura" e este é o único degrau que pode parecer contradizê-la. Por isso as três frases que aparecem nos quatro idiomas: paga-se uma vez, não há renovação, e o que já é seu continua seu.

### Decisões do Ash, fechadas em 23 de Agosto

**Entrega só nas quatro datas fixas, e a garantia corre da primeira entrega.** As datas são 1 de Janeiro, 1 de Abril, 1 de Julho e 1 de Outubro. Nada é entregue no acto da compra.

Isto resolve de uma vez os dois problemas que eu tinha levantado:

1. **A garantia deixa de correr em vazio.** Contava da compra e podia fechar antes de a pessoa receber alguma coisa. Agora conta da primeira entrega, e a copy diz isso com todas as letras nos quatro idiomas. É uma garantia melhor do que a dos outros degraus, não pior, e a copy usa-a assim.
2. **A mudança da hora sai do texto.** Era o bullet que estava errado para o comprador brasileiro, onde o horário de verão foi abolido em 2019. Datas de calendário são iguais nos quatro mercados, e o bullet passa a ser o mesmo em todo o lado.

**Quantas entregas cada comprador recebe.** Quatro, sempre. São as quatro datas fixas que caem dentro dos doze meses dele. Quem compra em Fevereiro recebe Abril, Julho, Outubro e Janeiro. Ninguém recebe menos por ter comprado no mês errado, e a copy diz isso porque é a primeira dúvida que ocorre a quem lê "datas fixas".

**`{nextDate}` é a única variável nova.** É a próxima das quatro datas a contar de hoje, na língua do visitante. Sem ela a página pede que a pessoa faça a conta de cabeça, e uma pessoa que hesita não faz contas, fecha o separador.

### Duas coisas que não são copy e que alguém tem de resolver

**1. A Hotmart não sabe contar a garantia a partir da entrega.** O dropdown conta da compra e só tem 7, 15, 21 e 30 dias. Uma garantia contada da primeira entrega é uma promessa nossa, honrada à mão, e para quem comprou logo a seguir a uma das datas a janela automática da plataforma já fechou quando o prazo prometido ainda está aberto. Ou se aceita reembolsar fora da plataforma, ou esta linha não pode ir para o ar como está escrita. Não é decisão minha e não a resolvo com palavras. É do Ash, e é anterior a criar a oferta.

**2. O prazo mais longo de espera é de três meses.** Quem compra a 2 de Janeiro espera até 1 de Abril. A copy não esconde isso, mostra a data e explica porquê, que é a única forma honesta de a vender. Vale a pena a decisão consciente de que 39 EUR podem ficar até três meses sem contrapartida visível, porque é aí que nasce o pedido de chargeback.

**Estado do activo:** PRODUZIR. Nada disto existe hoje no repositório. A copy está pronta, o produto não.

---

### PT

**Nome:** Reset Season
**Promessa:** Quatro protocolos novos ao longo de um ano, nas quatro datas em que o sono costuma cair. Pago uma vez.

**Eyebrow:** O ano não é plano
**Título:** O ano tem quatro noites em que isto volta

**Bullets:**
- Quatro entregas por ano, em datas fixas: 1 de Janeiro, 1 de Abril, 1 de Julho e 1 de Outubro. São as quatro alturas em que o sono cai, e cai sempre nas mesmas.
- Você recebe as quatro entregas que caem dentro dos seus doze meses. A primeira é {nextDate}.
- Cada entrega é uma gravação nova mais uma página com o que fazer naquela semana. Nada de teoria e nada de curso.
- Pago uma vez pelos doze meses. Sem renovação, sem cartão guardado e sem nada para cancelar.
- O que você já tem continua seu, sem alteração nenhuma. E as entregas que receber ficam na sua biblioteca para sempre, mesmo depois do ano acabar.

**Botão:** Quero o Reset Season por {price}
**Linha de preço:** Um pagamento único de {price} pelas quatro entregas do ano. Não é assinatura.
**Garantia:** Garantia de 30 dias a contar da sua primeira entrega, não da compra. O prazo só começa quando você tiver alguma coisa na mão.

### EN

**Name:** Reset Season
**Promise:** Four new protocols across a year, on the four dates when sleep tends to fall over. Paid once.

**Eyebrow:** The year is not flat
**Title:** There are four nights a year when this comes back

**Bullets:**
- Four drops a year, on fixed dates: 1 January, 1 April, 1 July and 1 October. Those are the four points where sleep goes, and it goes at the same ones every time.
- You get the four drops that fall inside your twelve months. The first one is {nextDate}.
- Each drop is a new recording plus one page of what to do that week. No theory and no course.
- Paid once for the twelve months. No renewal, no card kept on file, nothing to cancel.
- What you already own stays exactly as it is. And the drops you receive stay in your library for good, including after the year ends.

**Button:** Get Reset Season for {price}
**Price line:** One payment of {price} for the four drops of the year. This is not a subscription.
**Guarantee:** 30 day guarantee counted from your first drop, not from the purchase. The clock only starts once you have something in hand.

### FR

**Nom :** Reset Season
**Promesse :** Quatre nouveaux protocoles sur une année, aux quatre dates où le sommeil se casse. Payé une fois.

**Eyebrow :** L'année n'est pas plate
**Titre :** Il y a quatre nuits par an où ça revient

**Bullets :**
- Quatre livraisons par an, à dates fixes : le 1er janvier, le 1er avril, le 1er juillet et le 1er octobre. Ce sont les quatre moments où le sommeil lâche, et il lâche toujours aux mêmes.
- Vous recevez les quatre livraisons qui tombent dans vos douze mois. La première est le {nextDate}.
- Chaque livraison est un nouvel enregistrement plus une page sur quoi faire cette semaine-là. Pas de théorie et pas de programme.
- Payé une fois pour les douze mois. Sans reconduction, sans carte enregistrée et sans rien à annuler.
- Ce que vous avez déjà reste exactement comme c'est. Et les livraisons que vous recevez restent dans votre bibliothèque définitivement, y compris après la fin de l'année.

**Bouton :** Je prends Reset Season pour {price}
**Ligne de prix :** Un paiement unique de {price} pour les quatre livraisons de l'année. Ce n'est pas un abonnement.
**Garantie :** Garantie de 30 jours à partir de votre première livraison, pas de l'achat. Le délai ne commence que quand vous avez quelque chose en main.

### ES

**Nombre:** Reset Season
**Promesa:** Cuatro protocolos nuevos a lo largo de un año, en las cuatro fechas en que el sueño se cae. Se paga una vez.

**Eyebrow:** El año no es plano
**Título:** Hay cuatro noches al año en que esto vuelve

**Bullets:**
- Cuatro entregas al año, en fechas fijas: 1 de enero, 1 de abril, 1 de julio y 1 de octubre. Son los cuatro momentos en que el sueño se cae, y se cae siempre en los mismos.
- Usted recibe las cuatro entregas que caen dentro de sus doce meses. La primera es el {nextDate}.
- Cada entrega es una grabación nueva más una página con qué hacer esa semana. Nada de teoría y nada de curso.
- Se paga una vez por los doce meses. Sin renovación, sin tarjeta guardada y sin nada que cancelar.
- Lo que ya tiene sigue igual, sin ningún cambio. Y las entregas que reciba se quedan en su biblioteca para siempre, también después de que termine el año.

**Botón:** Quiero Reset Season por {price}
**Línea de precio:** Un pago único de {price} por las cuatro entregas del año. No es una suscripción.
**Garantía:** Garantía de 30 días desde su primera entrega, no desde la compra. El plazo empieza cuando usted ya tiene algo en la mano.

### Pronto a colar

```ts
// pt.ts
season: {
  name: "Reset Season",
  eyebrow: "O ano não é plano",
  title: "O ano tem quatro noites em que isto volta",
  promise: "Quatro protocolos novos ao longo de um ano, nas quatro datas em que o sono costuma cair. Pago uma vez.",
  bullets: [
    "Quatro entregas por ano, em datas fixas: 1 de Janeiro, 1 de Abril, 1 de Julho e 1 de Outubro. São as quatro alturas em que o sono cai, e cai sempre nas mesmas.",
    "Você recebe as quatro entregas que caem dentro dos seus doze meses. A primeira é {nextDate}.",
    "Cada entrega é uma gravação nova mais uma página com o que fazer naquela semana. Nada de teoria e nada de curso.",
    "Pago uma vez pelos doze meses. Sem renovação, sem cartão guardado e sem nada para cancelar.",
    "O que você já tem continua seu, sem alteração nenhuma. E as entregas que receber ficam na sua biblioteca para sempre, mesmo depois do ano acabar.",
  ],
  priceLine: "Um pagamento único de {price} pelas quatro entregas do ano. Não é assinatura.",
  cta: "Quero o Reset Season por {price}",
  guarantee: "Garantia de 30 dias a contar da sua primeira entrega, não da compra. O prazo só começa quando você tiver alguma coisa na mão.",
},

// en.ts
season: {
  name: "Reset Season",
  eyebrow: "The year is not flat",
  title: "There are four nights a year when this comes back",
  promise: "Four new protocols across a year, on the four dates when sleep tends to fall over. Paid once.",
  bullets: [
    "Four drops a year, on fixed dates: 1 January, 1 April, 1 July and 1 October. Those are the four points where sleep goes, and it goes at the same ones every time.",
    "You get the four drops that fall inside your twelve months. The first one is {nextDate}.",
    "Each drop is a new recording plus one page of what to do that week. No theory and no course.",
    "Paid once for the twelve months. No renewal, no card kept on file, nothing to cancel.",
    "What you already own stays exactly as it is. And the drops you receive stay in your library for good, including after the year ends.",
  ],
  priceLine: "One payment of {price} for the four drops of the year. This is not a subscription.",
  cta: "Get Reset Season for {price}",
  guarantee: "30 day guarantee counted from your first drop, not from the purchase. The clock only starts once you have something in hand.",
},

// fr.ts
season: {
  name: "Reset Season",
  eyebrow: "L'année n'est pas plate",
  title: "Il y a quatre nuits par an où ça revient",
  promise: "Quatre nouveaux protocoles sur une année, aux quatre dates où le sommeil se casse. Payé une fois.",
  bullets: [
    "Quatre livraisons par an, à dates fixes : le 1er janvier, le 1er avril, le 1er juillet et le 1er octobre. Ce sont les quatre moments où le sommeil lâche, et il lâche toujours aux mêmes.",
    "Vous recevez les quatre livraisons qui tombent dans vos douze mois. La première est le {nextDate}.",
    "Chaque livraison est un nouvel enregistrement plus une page sur quoi faire cette semaine-là. Pas de théorie et pas de programme.",
    "Payé une fois pour les douze mois. Sans reconduction, sans carte enregistrée et sans rien à annuler.",
    "Ce que vous avez déjà reste exactement comme c'est. Et les livraisons que vous recevez restent dans votre bibliothèque définitivement, y compris après la fin de l'année.",
  ],
  priceLine: "Un paiement unique de {price} pour les quatre livraisons de l'année. Ce n'est pas un abonnement.",
  cta: "Je prends Reset Season pour {price}",
  guarantee: "Garantie de 30 jours à partir de votre première livraison, pas de l'achat. Le délai ne commence que quand vous avez quelque chose en main.",
},

// es.ts
season: {
  name: "Reset Season",
  eyebrow: "El año no es plano",
  title: "Hay cuatro noches al año en que esto vuelve",
  promise: "Cuatro protocolos nuevos a lo largo de un año, en las cuatro fechas en que el sueño se cae. Se paga una vez.",
  bullets: [
    "Cuatro entregas al año, en fechas fijas: 1 de enero, 1 de abril, 1 de julio y 1 de octubre. Son los cuatro momentos en que el sueño se cae, y se cae siempre en los mismos.",
    "Usted recibe las cuatro entregas que caen dentro de sus doce meses. La primera es el {nextDate}.",
    "Cada entrega es una grabación nueva más una página con qué hacer esa semana. Nada de teoría y nada de curso.",
    "Se paga una vez por los doce meses. Sin renovación, sin tarjeta guardada y sin nada que cancelar.",
    "Lo que ya tiene sigue igual, sin ningún cambio. Y las entregas que reciba se quedan en su biblioteca para siempre, también después de que termine el año.",
  ],
  priceLine: "Un pago único de {price} por las cuatro entregas del año. No es una suscripción.",
  cta: "Quiero Reset Season por {price}",
  guarantee: "Garantía de 30 días desde su primera entrega, no desde la compra. El plazo empieza cuando usted ya tiene algo en la mano.",
},
```

**Formato de `{nextDate}`:** entra sem preposição e sem artigo, porque PT e EN não os querem e FR e ES já os trazem escritos no bullet. PT `1 de Abril`, EN `1 April`, FR `1er avril`, ES `1 de abril`. O bullet FR diz `La première est le {nextDate}` e o ES diz `La primera es el {nextDate}`, portanto o valor entra cru.

---

# Degrau 7. The Recalibration · dois níveis, 79 e 149 EUR

**Onde vive:** dentro da plataforma, no fim da noite 7, e só para quem tem 7 noites registadas no sleep-log. Nunca no checkout inicial. Chave: `backend`.

**O ângulo, e a linha que não se pode passar:** a app já calcula a janela de sono sozinha. O que se vende aqui é a diferença entre a app calcular e **alguém olhar para os teus dados**. Todo o valor está nessa frase, e é ela que aparece nos quatro idiomas.

### Decisões do Ash, fechadas em 23 de Agosto

Os quatro números que faltavam já não são variáveis. Estão escritos no texto abaixo:

| O que estava em aberto | Decidido |
|---|---|
| Preço | Dois níveis. 79 pela leitura escrita, 149 com chamada de 30 minutos |
| Prazo de resposta | 7 dias úteis. Escrevi **até** 7 dias úteis, ver a nota abaixo |
| Mínimo de noites registadas | 7 noites |
| Quem faz a revisão | O Ash, em lote uma vez por semana |

**O que separa os dois níveis, escrito com honestidade.** Não é mais atenção nem mais cuidado, que é o que eu tinha avisado que não se consegue escrever sem mentir. É uma conversa. Os 79 entregam o plano escrito. Os 149 entregam o mesmo plano escrito e mais 30 minutos ao vivo, marcados depois de a pessoa o ter lido, para as perguntas que só aparecem na leitura. Quem compra sabe exactamente o que está a comprar a mais, e o nível de baixo não fica mutilado para justificar o de cima.

**Porque escrevi "até 7 dias úteis" e não "em 7 dias".** A revisão é em lote semanal. Se o pedido entrar logo a seguir a um lote, espera pelo seguinte, e o relógio já anda. Sete dias úteis chegam com folga desde que o dia do lote nunca deslize. "Até" é a diferença entre uma promessa que aguenta uma semana má e uma que rebenta na primeira. **O dia do lote tem de ser fixo e tem de estar escrito algures que não seja este ficheiro**, porque é dele que depende o único prazo que esta esteira promete.

**Nota de capacidade.** Uma revisão semanal em lote, feita por uma pessoa, é o tecto de vendas deste degrau. Não é problema de copy, mas é o número que decide se este degrau abre com fila ou com promessa falhada.

**Compliance, e isto não é opcional:** vende-se como educação e acompanhamento, nunca como terapia, tratamento ou diagnóstico. A última bullet e a linha de garantia estão escritas para isso. **A chamada de 30 minutos foi revista pelo Roger a 23 de Agosto (FLU-238) e o parecer está em `marketing/flu238-degrau7-chamada-compliance.md`.** Em resumo: a bullet acima fica exactamente como está e serve os dois níveis, mas o nível de 149 leva mais uma linha na página de venda, e o essencial não é texto de página, é um aceite no momento de marcar a chamada, com duas caixas separadas (dados de saúde, e natureza do serviço mais reembolso) e um aviso de sintomas a ler antes. Tudo isso está escrito nos quatro idiomas no parecer, pronto a colar, e a Sophie não precisa de traduzir nada. A garantia do nível 2 também leva uma frase a mais, ver o bloco E do parecer. **Atenção ao que o parecer encontrou fora da copy:** a política de privacidade da app diz hoje que o sleep-log serve só para o cálculo automático, e enquanto essa frase lá estiver o degrau 7 não abre, nem a 79 nem a 149.

**A garantia não pode ser a mesma dos outros degraus.** Trabalho humano feito e entregue não se devolve como um ficheiro. A forma honesta, escrita abaixo: olhamos para o log antes de começar, e se não houver ali material com que trabalhar, dizemos e devolvemos o dinheiro antes de começar. Vale igual nos dois níveis.

**Estado do activo:** PRODUZIR. Falta o processo, não a copy.

---

### PT

**Nome:** The Recalibration
**Promessa:** Alguém lê as noites que você registou e devolve, por escrito, a janela que os seus próprios dados pedem.

**Eyebrow:** Depois de 7 noites registadas
**Título:** A app calcula. Isto é alguém olhando

**Bullets, comuns aos dois níveis:**
- Você não envia nada. O seu sleep-log já está na conta, e é sobre ele que se trabalha.
- Uma pessoa passa noite a noite pelo seu registo. Não é o cálculo automático da app, esse você já tem e continua a ter.
- Você recebe um plano escrito para o seu caso: a janela recalculada, o que mudar primeiro e o que parar de fazer.
- Chega em até 7 dias úteis, uma vez. Não é acompanhamento contínuo e não há assinatura nenhuma por trás.
- É educação e acompanhamento sobre hábitos de sono. Não é diagnóstico, não é tratamento e não substitui um médico.

**Nível 1. The Recalibration, 79**
Linha: O plano escrito, em até 7 dias úteis.
Botão: Pedir a minha recalibração por {price}

**Nível 2. The Recalibration Live, 149**
Linha: O mesmo plano escrito, e mais 30 minutos ao vivo para o percorrer consigo.
Bullet extra: Trinta minutos por chamada, marcados depois de você ler o plano, para as perguntas que só aparecem na leitura.
Botão: Quero o plano e a chamada por {price}

**Garantia, nos dois níveis:** Olhamos para o seu registo antes de começar. Se não houver ali noites suficientes para trabalhar, dizemos e devolvemos o dinheiro sem ter começado.

### EN

**Name:** The Recalibration
**Promise:** Someone reads the nights you logged and writes back the window your own data is asking for.

**Eyebrow:** After 7 logged nights
**Title:** The app calculates. This is someone looking

**Bullets, shared by both tiers:**
- You send nothing. Your sleep log is already in the account, and that is what gets worked on.
- A person goes through your log night by night. This is not the app's automatic calculation, you already have that and you keep it.
- You get back a written plan for your case: the recalculated window, what to change first, and what to stop doing.
- It arrives in up to 7 working days, once. This is not ongoing coaching and there is no subscription behind it.
- This is education and coaching about sleep habits. It is not a diagnosis, it is not treatment, and it does not replace a doctor.

**Tier 1. The Recalibration, 79**
Line: The written plan, in up to 7 working days.
Button: Ask for my recalibration for {price}

**Tier 2. The Recalibration Live, 149**
Line: The same written plan, plus 30 minutes live to walk you through it.
Extra bullet: Thirty minutes on a call, booked after you have read the plan, for the questions that only turn up in the reading.
Button: Get the plan and the call for {price}

**Guarantee, both tiers:** We look at your log before starting. If there are not enough nights in there to work with, we say so and refund you without having started.

### FR

**Nom :** The Recalibration
**Promesse :** Quelqu'un lit les nuits que vous avez enregistrées et vous renvoie par écrit la fenêtre que vos propres données demandent.

**Eyebrow :** Après 7 nuits enregistrées
**Titre :** L'application calcule. Ici, quelqu'un regarde

**Bullets, communs aux deux niveaux :**
- Vous n'envoyez rien. Votre journal de sommeil est déjà dans le compte, et c'est là-dessus que le travail se fait.
- Une personne parcourt votre journal nuit par nuit. Ce n'est pas le calcul automatique de l'application, celui-là vous l'avez déjà et vous le gardez.
- Vous recevez un plan écrit pour votre cas : la fenêtre recalculée, quoi changer en premier et quoi arrêter de faire.
- Il arrive en 7 jours ouvrés au plus, une fois. Ce n'est pas un suivi continu et il n'y a aucun abonnement derrière.
- C'est de l'éducation et de l'accompagnement sur les habitudes de sommeil. Ce n'est pas un diagnostic, pas un traitement, et cela ne remplace pas un médecin.

**Niveau 1. The Recalibration, 79**
Ligne : Le plan écrit, en 7 jours ouvrés au plus.
Bouton : Demander ma recalibration pour {price}

**Niveau 2. The Recalibration Live, 149**
Ligne : Le même plan écrit, et 30 minutes en direct pour le parcourir avec vous.
Bullet en plus : Trente minutes en visio, fixées après votre lecture du plan, pour les questions qui n'apparaissent qu'à la lecture.
Bouton : Je prends le plan et l'appel pour {price}

**Garantie, aux deux niveaux :** Nous regardons votre journal avant de commencer. S'il n'y a pas assez de nuits pour travailler, nous le disons et nous vous remboursons sans avoir commencé.

### ES

**Nombre:** The Recalibration
**Promesa:** Alguien lee las noches que usted registró y le devuelve por escrito la ventana que piden sus propios datos.

**Eyebrow:** Después de 7 noches registradas
**Título:** La app calcula. Esto es alguien mirando

**Bullets, comunes a los dos niveles:**
- Usted no envía nada. Su registro de sueño ya está en la cuenta, y es sobre eso que se trabaja.
- Una persona recorre su registro noche por noche. No es el cálculo automático de la app, ese ya lo tiene y lo sigue teniendo.
- Recibe un plan escrito para su caso: la ventana recalculada, qué cambiar primero y qué dejar de hacer.
- Llega en hasta 7 días hábiles, una vez. No es acompañamiento continuo y no hay ninguna suscripción detrás.
- Es educación y acompañamiento sobre hábitos de sueño. No es un diagnóstico, no es un tratamiento y no sustituye a un médico.

**Nivel 1. The Recalibration, 79**
Línea: El plan escrito, en hasta 7 días hábiles.
Botón: Pedir mi recalibración por {price}

**Nivel 2. The Recalibration Live, 149**
Línea: El mismo plan escrito, y 30 minutos en directo para recorrerlo con usted.
Bullet extra: Treinta minutos por videollamada, fijados después de que usted lea el plan, para las preguntas que solo aparecen al leer.
Botón: Quiero el plan y la llamada por {price}

**Garantía, en los dos niveles:** Miramos su registro antes de empezar. Si no hay noches suficientes para trabajar, se lo decimos y le devolvemos el dinero sin haber empezado.

### Pronto a colar

```ts
// pt.ts
backend: {
  name: "The Recalibration",
  eyebrow: "Depois de 7 noites registadas",
  title: "A app calcula. Isto é alguém olhando",
  promise: "Alguém lê as noites que você registou e devolve, por escrito, a janela que os seus próprios dados pedem.",
  bullets: [
    "Você não envia nada. O seu sleep-log já está na conta, e é sobre ele que se trabalha.",
    "Uma pessoa passa noite a noite pelo seu registo. Não é o cálculo automático da app, esse você já tem e continua a ter.",
    "Você recebe um plano escrito para o seu caso: a janela recalculada, o que mudar primeiro e o que parar de fazer.",
    "Chega em até 7 dias úteis, uma vez. Não é acompanhamento contínuo e não há assinatura nenhuma por trás.",
    "É educação e acompanhamento sobre hábitos de sono. Não é diagnóstico, não é tratamento e não substitui um médico.",
  ],
  tiers: [
    {
      name: "The Recalibration",
      priceLine: "O plano escrito, em até 7 dias úteis.",
      extra: null,
      cta: "Pedir a minha recalibração por {price}",
    },
    {
      name: "The Recalibration Live",
      priceLine: "O mesmo plano escrito, e mais 30 minutos ao vivo para o percorrer consigo.",
      extra: "Trinta minutos por chamada, marcados depois de você ler o plano, para as perguntas que só aparecem na leitura.",
      cta: "Quero o plano e a chamada por {price}",
    },
  ],
  guarantee: "Olhamos para o seu registo antes de começar. Se não houver ali noites suficientes para trabalhar, dizemos e devolvemos o dinheiro sem ter começado.",
},

// en.ts
backend: {
  name: "The Recalibration",
  eyebrow: "After 7 logged nights",
  title: "The app calculates. This is someone looking",
  promise: "Someone reads the nights you logged and writes back the window your own data is asking for.",
  bullets: [
    "You send nothing. Your sleep log is already in the account, and that is what gets worked on.",
    "A person goes through your log night by night. This is not the app's automatic calculation, you already have that and you keep it.",
    "You get back a written plan for your case: the recalculated window, what to change first, and what to stop doing.",
    "It arrives in up to 7 working days, once. This is not ongoing coaching and there is no subscription behind it.",
    "This is education and coaching about sleep habits. It is not a diagnosis, it is not treatment, and it does not replace a doctor.",
  ],
  tiers: [
    {
      name: "The Recalibration",
      priceLine: "The written plan, in up to 7 working days.",
      extra: null,
      cta: "Ask for my recalibration for {price}",
    },
    {
      name: "The Recalibration Live",
      priceLine: "The same written plan, plus 30 minutes live to walk you through it.",
      extra: "Thirty minutes on a call, booked after you have read the plan, for the questions that only turn up in the reading.",
      cta: "Get the plan and the call for {price}",
    },
  ],
  guarantee: "We look at your log before starting. If there are not enough nights in there to work with, we say so and refund you without having started.",
},

// fr.ts
backend: {
  name: "The Recalibration",
  eyebrow: "Après 7 nuits enregistrées",
  title: "L'application calcule. Ici, quelqu'un regarde",
  promise: "Quelqu'un lit les nuits que vous avez enregistrées et vous renvoie par écrit la fenêtre que vos propres données demandent.",
  bullets: [
    "Vous n'envoyez rien. Votre journal de sommeil est déjà dans le compte, et c'est là-dessus que le travail se fait.",
    "Une personne parcourt votre journal nuit par nuit. Ce n'est pas le calcul automatique de l'application, celui-là vous l'avez déjà et vous le gardez.",
    "Vous recevez un plan écrit pour votre cas : la fenêtre recalculée, quoi changer en premier et quoi arrêter de faire.",
    "Il arrive en 7 jours ouvrés au plus, une fois. Ce n'est pas un suivi continu et il n'y a aucun abonnement derrière.",
    "C'est de l'éducation et de l'accompagnement sur les habitudes de sommeil. Ce n'est pas un diagnostic, pas un traitement, et cela ne remplace pas un médecin.",
  ],
  tiers: [
    {
      name: "The Recalibration",
      priceLine: "Le plan écrit, en 7 jours ouvrés au plus.",
      extra: null,
      cta: "Demander ma recalibration pour {price}",
    },
    {
      name: "The Recalibration Live",
      priceLine: "Le même plan écrit, et 30 minutes en direct pour le parcourir avec vous.",
      extra: "Trente minutes en visio, fixées après votre lecture du plan, pour les questions qui n'apparaissent qu'à la lecture.",
      cta: "Je prends le plan et l'appel pour {price}",
    },
  ],
  guarantee: "Nous regardons votre journal avant de commencer. S'il n'y a pas assez de nuits pour travailler, nous le disons et nous vous remboursons sans avoir commencé.",
},

// es.ts
backend: {
  name: "The Recalibration",
  eyebrow: "Después de 7 noches registradas",
  title: "La app calcula. Esto es alguien mirando",
  promise: "Alguien lee las noches que usted registró y le devuelve por escrito la ventana que piden sus propios datos.",
  bullets: [
    "Usted no envía nada. Su registro de sueño ya está en la cuenta, y es sobre eso que se trabaja.",
    "Una persona recorre su registro noche por noche. No es el cálculo automático de la app, ese ya lo tiene y lo sigue teniendo.",
    "Recibe un plan escrito para su caso: la ventana recalculada, qué cambiar primero y qué dejar de hacer.",
    "Llega en hasta 7 días hábiles, una vez. No es acompañamiento continuo y no hay ninguna suscripción detrás.",
    "Es educación y acompañamiento sobre hábitos de sueño. No es un diagnóstico, no es un tratamiento y no sustituye a un médico.",
  ],
  tiers: [
    {
      name: "The Recalibration",
      priceLine: "El plan escrito, en hasta 7 días hábiles.",
      extra: null,
      cta: "Pedir mi recalibración por {price}",
    },
    {
      name: "The Recalibration Live",
      priceLine: "El mismo plan escrito, y 30 minutos en directo para recorrerlo con usted.",
      extra: "Treinta minutos por videollamada, fijados después de que usted lea el plan, para las preguntas que solo aparecen al leer.",
      cta: "Quiero el plan y la llamada por {price}",
    },
  ],
  guarantee: "Miramos su registro antes de empezar. Si no hay noches suficientes para trabajar, se lo decimos y le devolvemos el dinero sin haber empezado.",
},
```

---

## Nota para o Diego

### O tipo

Os degraus 4, 5 e 6 partilham a mesma forma. O 7 não, porque tem dois níveis.

```ts
export type RungCopy = {
  name: string;
  eyebrow: string;
  title: string;
  promise: string;
  bullets: string[];
  priceLine: string;
  cta: string;
  /** Só o degrau 4 tem recusa: é o único que vive numa página de saída. */
  decline?: string;
  guarantee: string;
};

/** Degrau 7: mesma cabeça, mas o preço e o botão vivem em cada nível. */
export type BackendTier = {
  name: string;
  priceLine: string;
  /** Só o nível de cima tem. Uma bullet a mais, não uma bullet diferente. */
  extra: string | null;
  cta: string;
};

export type BackendCopy = Omit<RungCopy, "priceLine" | "cta" | "decline"> & {
  tiers: BackendTier[];
};
```

### Variáveis

`{price}` já é servido pelo `fill()` e pelo `money()` que o `/kit` usa. No degrau 7 resolve por nível, 79 no primeiro e 149 no segundo, não uma vez para a página toda.

`{nextDate}` é nova e só existe no degrau 6. É a próxima de 1 Janeiro, 1 Abril, 1 Julho, 1 Outubro a contar de hoje, formatada na língua do visitante e **sem preposição nem artigo**: `1 de Abril`, `1 April`, `1er avril`, `1 de abril`. Os bullets FR e ES já trazem o `le` e o `el` escritos.

### Três coisas no código que esta copy obriga a mexer

1. **`OFFERS.backend` tem um preço só, 79.** Com dois níveis passam a ser precisos dois. Ou duas entradas em `Rung`, ou um campo de preço alto no mesmo degrau. É decisão tua, mas a copy do nível 2 diz 149 e hoje não há onde ir buscá-lo.
2. **`season` e `backend` colidem na mesma noite.** O programa tem 7 noites (`sleep-rewire-7night`), o degrau 7 abre com 7 noites registadas, e o degrau 6 estava escrito para "depois da noite 7". São o mesmo instante. Quem acaba a noite 7 via um pack de 39 e um serviço de 79 a 149 ao mesmo tempo, e as duas ofertas comem-se uma à outra. **A minha recomendação:** o degrau 7 fica no fim da noite 7, que é o momento em que o registo que a pessoa acabou de encher vale mais e a atenção está no pico. O degrau 6 desce para o dia 14, uma semana depois de o programa acabar, que é quando a pergunta "e agora, o que me impede de voltar atrás" aparece sozinha. Por isso o eyebrow do degrau 6 já não diz "Depois da noite 7", diz "O ano não é plano". Se preferires outra ordem, diz e eu reescrevo o eyebrow, mas simultâneas não podem ficar.
3. **A garantia do degrau 6 conta da primeira entrega.** A Hotmart não sabe fazer isso, conta sempre da compra. Ou se honra à mão, ou a linha não vai ao ar como está. Está escrito na secção do degrau 6 e é do Ash, não é tua.
