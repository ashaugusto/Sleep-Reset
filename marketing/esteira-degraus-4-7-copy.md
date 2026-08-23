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
5. **Garantia de 30 dias** nos degraus 4, 5 e 6, igual à do protocolo. O degrau 7 é serviço humano e a garantia tem de ser escrita de outra forma, ver a secção respectiva. Nota de plataforma: o dropdown da Hotmart só tem 7, 15, 21 e 30 dias, e vender em EUR proíbe os 7, portanto 30 é a escolha e não há 60.
6. **Degrau 7 é educação e acompanhamento, nunca diagnóstico, tratamento ou terapia.** A frase está escrita nos quatro idiomas e não é opcional.

---

## O que precisa de decisão do Ash antes de ir para o ar

| Degrau | Decisão em aberto | Porque bloqueia |
|---|---|---|
| 4 | RESOLVIDO em 23 Ago. É o `kit-3am-protocol.mp3` sozinho. O Diego colou a copy nos quatro locales no commit 4258ac0 | fechado |
| 5 | RESOLVIDO em 23 Ago. É convite por link: o comprador compra em `/partner` e o parceiro abre a conta em `/seat/:token`. A bullet do convite fica como estava escrita | fechado |
| 6 | EM ABERTO. Quando cai a primeira entrega em relação à compra, e quais são as quatro datas do ano | A garantia de 30 dias corre da compra, não da entrega |
| 7 | EM ABERTO. Preço único ou dois níveis entre 79 e 149, prazo de resposta, mínimo de noites registadas, e quem faz a revisão humana | Os números estão escritos como `{price}` e `{days}`, não inventei nenhum |

Nenhum destes bloqueios impede o Diego de colar o texto nos locales já hoje. Bloqueiam a criação da oferta na Hotmart.

**Estado em 23 Ago, fim do dia.** Degraus 4 e 5 estão colados nos quatro locales e têm página (`/partner`, `/seat/:token`), com os tipos `DownsellCopy` e `SeatCopy` em `src/locales/types.ts`. Degraus 6 e 7 continuam só neste ficheiro, à espera das decisões acima. A linha de compliance do degrau 7 está a ser vista pelo Roger.

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

**Onde vive:** dentro da plataforma, depois da noite 7. Chave sugerida: `season`.

**A trava:** isto **não é uma assinatura** e a copy tem de dizê-lo em voz alta, porque a página de venda promete "sem assinatura" e este é o único degrau que pode parecer contradizê-la. Por isso as três frases que aparecem nos quatro idiomas: paga-se uma vez, não há renovação, e o que já é seu continua seu.

### Duas decisões que peço ao Ash

**1. Quando cai a primeira entrega.** A garantia de 30 dias corre da compra, não da entrega. Se alguém comprar em Janeiro e a primeira entrega for em Março, o prazo de reembolso já fechou antes de a pessoa ter recebido o que quer que seja. Isso é pedido de chargeback, não é reembolso. A forma de o resolver é a primeira entrega ficar disponível no momento da compra e as três seguintes chegarem nas datas. Escrevi a copy assim.

**2. As quatro datas não funcionam nos quatro mercados.** A mudança da hora foi abolida no Brasil em 2019. Um bullet que diga "a mudança da hora em Março e Outubro" está errado para o comprador brasileiro, que é o mercado com afiliados. Solução escrita abaixo: o bullet fica com o mesmo esqueleto, e cada locale nomeia os momentos que existem naquele calendário. O conteúdo entregue é o mesmo, o que muda é o exemplo que se dá. Se o Ash preferir uma lista igual em todo o lado, então tem de ser uma lista sem a mudança da hora.

**Estado do activo:** PRODUZIR. Nada disto existe hoje no repositório. A copy está pronta, o produto não.

---

### PT

**Nome:** Reset Season
**Promessa:** Quatro protocolos novos ao longo de um ano, para as quatro vezes por ano em que o sono é derrubado. Pago uma vez.

**Eyebrow:** Depois da noite 7
**Título:** O ano tem quatro noites em que isto volta

**Bullets:**
- Quatro entregas ao longo de doze meses, marcadas nos momentos que derrubam o sono de verdade: as festas de fim de ano, a volta de férias em Janeiro, as noites de calor e o inverno de dias curtos.
- Cada entrega é uma gravação nova mais uma página com o que fazer naquela semana. Nada de teoria e nada de curso.
- A primeira entrega fica disponível no momento em que você paga. As outras três chegam nas datas.
- Pago uma vez pelos doze meses. Sem renovação, sem cartão guardado e sem nada para cancelar.
- O que você já tem continua seu, sem alteração nenhuma. E as entregas que receber ficam na sua biblioteca para sempre, mesmo depois do ano acabar.

**Botão:** Quero o Reset Season por {price}
**Linha de preço:** Um pagamento único de {price} pelos doze meses. Não é assinatura.
**Garantia:** Garantia de 30 dias a partir da compra, com a primeira entrega já na sua biblioteca.

### EN

**Name:** Reset Season
**Promise:** Four new protocols across a year, for the four times a year sleep gets knocked over. Paid once.

**Eyebrow:** After night 7
**Title:** There are four nights a year when this comes back

**Bullets:**
- Four drops across twelve months, set on the moments that actually knock sleep over: the clocks moving in spring and autumn, the short days of winter, and the end of year holidays.
- Each drop is a new recording plus one page of what to do that week. No theory and no course.
- The first drop is in your library the moment you pay. The other three arrive on the dates.
- Paid once for the twelve months. No renewal, no card kept on file, nothing to cancel.
- What you already own stays exactly as it is. And the drops you receive stay in your library for good, including after the year ends.

**Button:** Get Reset Season for {price}
**Price line:** One payment of {price} for the twelve months. This is not a subscription.
**Guarantee:** 30 day guarantee from the purchase, with the first drop already in your library.

### FR

**Nom :** Reset Season
**Promesse :** Quatre nouveaux protocoles sur une année, pour les quatre moments de l'année où le sommeil se casse. Payé une fois.

**Eyebrow :** Après la nuit 7
**Titre :** Il y a quatre nuits par an où ça revient

**Bullets :**
- Quatre livraisons sur douze mois, placées sur les moments qui cassent vraiment le sommeil : le changement d'heure au printemps et en automne, les journées courtes de l'hiver, et les fêtes de fin d'année.
- Chaque livraison est un nouvel enregistrement plus une page sur quoi faire cette semaine-là. Pas de théorie et pas de programme.
- La première livraison est dans votre bibliothèque dès le paiement. Les trois autres arrivent aux dates.
- Payé une fois pour les douze mois. Sans reconduction, sans carte enregistrée et sans rien à annuler.
- Ce que vous avez déjà reste exactement comme c'est. Et les livraisons que vous recevez restent dans votre bibliothèque définitivement, y compris après la fin de l'année.

**Bouton :** Je prends Reset Season pour {price}
**Ligne de prix :** Un paiement unique de {price} pour les douze mois. Ce n'est pas un abonnement.
**Garantie :** Garantie de 30 jours à partir de l'achat, avec la première livraison déjà dans votre bibliothèque.

### ES

**Nombre:** Reset Season
**Promesa:** Cuatro protocolos nuevos a lo largo de un año, para las cuatro veces al año en que el sueño se cae. Se paga una vez.

**Eyebrow:** Después de la noche 7
**Título:** Hay cuatro noches al año en que esto vuelve

**Bullets:**
- Cuatro entregas a lo largo de doce meses, puestas en los momentos que de verdad tumban el sueño: el cambio de hora en primavera y en otoño, los días cortos del invierno y las fiestas de fin de año.
- Cada entrega es una grabación nueva más una página con qué hacer esa semana. Nada de teoría y nada de curso.
- La primera entrega está en su biblioteca en cuanto paga. Las otras tres llegan en las fechas.
- Se paga una vez por los doce meses. Sin renovación, sin tarjeta guardada y sin nada que cancelar.
- Lo que ya tiene sigue igual, sin ningún cambio. Y las entregas que reciba se quedan en su biblioteca para siempre, también después de que termine el año.

**Botón:** Quiero Reset Season por {price}
**Línea de precio:** Un pago único de {price} por los doce meses. No es una suscripción.
**Garantía:** Garantía de 30 días desde la compra, con la primera entrega ya en su biblioteca.

### Pronto a colar

```ts
// pt.ts
season: {
  name: "Reset Season",
  eyebrow: "Depois da noite 7",
  title: "O ano tem quatro noites em que isto volta",
  promise: "Quatro protocolos novos ao longo de um ano, para as quatro vezes por ano em que o sono é derrubado. Pago uma vez.",
  bullets: [
    "Quatro entregas ao longo de doze meses, marcadas nos momentos que derrubam o sono de verdade: as festas de fim de ano, a volta de férias em Janeiro, as noites de calor e o inverno de dias curtos.",
    "Cada entrega é uma gravação nova mais uma página com o que fazer naquela semana. Nada de teoria e nada de curso.",
    "A primeira entrega fica disponível no momento em que você paga. As outras três chegam nas datas.",
    "Pago uma vez pelos doze meses. Sem renovação, sem cartão guardado e sem nada para cancelar.",
    "O que você já tem continua seu, sem alteração nenhuma. E as entregas que receber ficam na sua biblioteca para sempre, mesmo depois do ano acabar.",
  ],
  priceLine: "Um pagamento único de {price} pelos doze meses. Não é assinatura.",
  cta: "Quero o Reset Season por {price}",
  guarantee: "Garantia de 30 dias a partir da compra, com a primeira entrega já na sua biblioteca.",
},

// en.ts
season: {
  name: "Reset Season",
  eyebrow: "After night 7",
  title: "There are four nights a year when this comes back",
  promise: "Four new protocols across a year, for the four times a year sleep gets knocked over. Paid once.",
  bullets: [
    "Four drops across twelve months, set on the moments that actually knock sleep over: the clocks moving in spring and autumn, the short days of winter, and the end of year holidays.",
    "Each drop is a new recording plus one page of what to do that week. No theory and no course.",
    "The first drop is in your library the moment you pay. The other three arrive on the dates.",
    "Paid once for the twelve months. No renewal, no card kept on file, nothing to cancel.",
    "What you already own stays exactly as it is. And the drops you receive stay in your library for good, including after the year ends.",
  ],
  priceLine: "One payment of {price} for the twelve months. This is not a subscription.",
  cta: "Get Reset Season for {price}",
  guarantee: "30 day guarantee from the purchase, with the first drop already in your library.",
},

// fr.ts
season: {
  name: "Reset Season",
  eyebrow: "Après la nuit 7",
  title: "Il y a quatre nuits par an où ça revient",
  promise: "Quatre nouveaux protocoles sur une année, pour les quatre moments de l'année où le sommeil se casse. Payé une fois.",
  bullets: [
    "Quatre livraisons sur douze mois, placées sur les moments qui cassent vraiment le sommeil : le changement d'heure au printemps et en automne, les journées courtes de l'hiver, et les fêtes de fin d'année.",
    "Chaque livraison est un nouvel enregistrement plus une page sur quoi faire cette semaine-là. Pas de théorie et pas de programme.",
    "La première livraison est dans votre bibliothèque dès le paiement. Les trois autres arrivent aux dates.",
    "Payé une fois pour les douze mois. Sans reconduction, sans carte enregistrée et sans rien à annuler.",
    "Ce que vous avez déjà reste exactement comme c'est. Et les livraisons que vous recevez restent dans votre bibliothèque définitivement, y compris après la fin de l'année.",
  ],
  priceLine: "Un paiement unique de {price} pour les douze mois. Ce n'est pas un abonnement.",
  cta: "Je prends Reset Season pour {price}",
  guarantee: "Garantie de 30 jours à partir de l'achat, avec la première livraison déjà dans votre bibliothèque.",
},

// es.ts
season: {
  name: "Reset Season",
  eyebrow: "Después de la noche 7",
  title: "Hay cuatro noches al año en que esto vuelve",
  promise: "Cuatro protocolos nuevos a lo largo de un año, para las cuatro veces al año en que el sueño se cae. Se paga una vez.",
  bullets: [
    "Cuatro entregas a lo largo de doce meses, puestas en los momentos que de verdad tumban el sueño: el cambio de hora en primavera y en otoño, los días cortos del invierno y las fiestas de fin de año.",
    "Cada entrega es una grabación nueva más una página con qué hacer esa semana. Nada de teoría y nada de curso.",
    "La primera entrega está en su biblioteca en cuanto paga. Las otras tres llegan en las fechas.",
    "Se paga una vez por los doce meses. Sin renovación, sin tarjeta guardada y sin nada que cancelar.",
    "Lo que ya tiene sigue igual, sin ningún cambio. Y las entregas que reciba se quedan en su biblioteca para siempre, también después de que termine el año.",
  ],
  priceLine: "Un pago único de {price} por los doce meses. No es una suscripción.",
  cta: "Quiero Reset Season por {price}",
  guarantee: "Garantía de 30 días desde la compra, con la primera entrega ya en su biblioteca.",
},
```

---

# Degrau 7. The Recalibration · 79 a 149 EUR

**Onde vive:** dentro da plataforma, a partir do dia 7, e só para quem tem noites registadas no sleep-log. Nunca no checkout inicial. Chave sugerida: `backend`.

**O ângulo, e a linha que não se pode passar:** a app já calcula a janela de sono sozinha. O que se vende aqui é a diferença entre a app calcular e **alguém olhar para os teus dados**. Todo o valor está nessa frase, e é ela que aparece nos quatro idiomas.

### Quatro decisões que peço ao Ash, e que deixei como variáveis

Não inventei nenhum número. O texto tem `{price}`, `{days}` e `{nights}` à espera de decisão:

- **Preço.** A esteira diz 79 a 149. Escrevi para um preço único. Se forem dois níveis, é preciso decidir o que separa um do outro, porque "mais caro com mais atenção" não é uma diferença que se consiga escrever com honestidade.
- **Prazo de resposta.** `{days}` é o número de dias entre o pedido e a entrega do plano escrito. É a promessa mais fácil de falhar de toda a esteira.
- **Mínimo de noites registadas.** `{nights}`. A esteira fala em pelo menos 5 e o plano vive melhor com 7 a 14. É preciso um número, porque é ele que aparece no filtro de quem vê a oferta e na copy.
- **Quem faz a revisão.** O documento diz semi-automatizado com revisão humana antes de enviar. Enquanto essa pessoa não tiver nome e horário, o prazo de resposta é um desejo.

**Compliance, e isto não é opcional:** vende-se como educação e acompanhamento, nunca como terapia, tratamento ou diagnóstico. A última bullet e a linha de garantia estão escritas para isso e **passam pelo Roger antes de ir para o ar**, como a esteira já tinha marcado.

**A garantia não pode ser a mesma dos outros degraus.** Trabalho humano feito e entregue não se devolve como um ficheiro. A forma honesta, escrita abaixo: olhamos para o log antes de começar, e se não houver ali material com que trabalhar, dizemos e devolvemos o dinheiro antes de começar.

---

### PT

**Nome:** The Recalibration
**Promessa:** Alguém lê as noites que você registou e devolve, por escrito, a janela que os seus próprios dados pedem.

**Eyebrow:** Depois de {nights} noites registadas
**Título:** A app calcula. Isto é alguém olhando

**Bullets:**
- Você não envia nada. O seu sleep-log já está na conta, e é sobre ele que se trabalha.
- Uma pessoa passa noite a noite pelo seu registo. Não é o cálculo automático da app, esse você já tem e continua a ter.
- Você recebe um plano escrito para o seu caso: a janela recalculada, o que mudar primeiro e o que parar de fazer.
- Chega em {days} dias, uma vez. Não é acompanhamento contínuo e não há assinatura nenhuma por trás.
- É educação e acompanhamento sobre hábitos de sono. Não é diagnóstico, não é tratamento e não substitui um médico.

**Botão:** Pedir a minha recalibração
**Linha de preço:** Um pagamento único de {price}, por uma leitura.
**Garantia:** Olhamos para o seu registo antes de começar. Se não houver ali noites suficientes para trabalhar, dizemos e devolvemos o dinheiro sem ter começado.

### EN

**Name:** The Recalibration
**Promise:** Someone reads the nights you logged and writes back the window your own data is asking for.

**Eyebrow:** After {nights} logged nights
**Title:** The app calculates. This is someone looking

**Bullets:**
- You send nothing. Your sleep log is already in the account, and that is what gets worked on.
- A person goes through your log night by night. This is not the app's automatic calculation, you already have that and you keep it.
- You get back a written plan for your case: the recalculated window, what to change first, and what to stop doing.
- It arrives in {days} days, once. This is not ongoing coaching and there is no subscription behind it.
- This is education and coaching about sleep habits. It is not a diagnosis, it is not treatment, and it does not replace a doctor.

**Button:** Ask for my recalibration
**Price line:** One payment of {price}, for one reading.
**Guarantee:** We look at your log before starting. If there are not enough nights in there to work with, we say so and refund you without having started.

### FR

**Nom :** The Recalibration
**Promesse :** Quelqu'un lit les nuits que vous avez enregistrées et vous renvoie par écrit la fenêtre que vos propres données demandent.

**Eyebrow :** Après {nights} nuits enregistrées
**Titre :** L'application calcule. Ici, quelqu'un regarde

**Bullets :**
- Vous n'envoyez rien. Votre journal de sommeil est déjà dans le compte, et c'est là-dessus que le travail se fait.
- Une personne parcourt votre journal nuit par nuit. Ce n'est pas le calcul automatique de l'application, celui-là vous l'avez déjà et vous le gardez.
- Vous recevez un plan écrit pour votre cas : la fenêtre recalculée, quoi changer en premier et quoi arrêter de faire.
- Il arrive en {days} jours, une fois. Ce n'est pas un suivi continu et il n'y a aucun abonnement derrière.
- C'est de l'éducation et de l'accompagnement sur les habitudes de sommeil. Ce n'est pas un diagnostic, pas un traitement, et cela ne remplace pas un médecin.

**Bouton :** Demander ma recalibration
**Ligne de prix :** Un paiement unique de {price}, pour une lecture.
**Garantie :** Nous regardons votre journal avant de commencer. S'il n'y a pas assez de nuits pour travailler, nous le disons et nous vous remboursons sans avoir commencé.

### ES

**Nombre:** The Recalibration
**Promesa:** Alguien lee las noches que usted registró y le devuelve por escrito la ventana que piden sus propios datos.

**Eyebrow:** Después de {nights} noches registradas
**Título:** La app calcula. Esto es alguien mirando

**Bullets:**
- Usted no envía nada. Su registro de sueño ya está en la cuenta, y es sobre eso que se trabaja.
- Una persona recorre su registro noche por noche. No es el cálculo automático de la app, ese ya lo tiene y lo sigue teniendo.
- Recibe un plan escrito para su caso: la ventana recalculada, qué cambiar primero y qué dejar de hacer.
- Llega en {days} días, una vez. No es acompañamiento continuo y no hay ninguna suscripción detrás.
- Es educación y acompañamiento sobre hábitos de sueño. No es un diagnóstico, no es un tratamiento y no sustituye a un médico.

**Botón:** Pedir mi recalibración
**Línea de precio:** Un pago único de {price}, por una lectura.
**Garantía:** Miramos su registro antes de empezar. Si no hay noches suficientes para trabajar, se lo decimos y le devolvemos el dinero sin haber empezado.

### Pronto a colar

```ts
// pt.ts
backend: {
  name: "The Recalibration",
  eyebrow: "Depois de {nights} noites registadas",
  title: "A app calcula. Isto é alguém olhando",
  promise: "Alguém lê as noites que você registou e devolve, por escrito, a janela que os seus próprios dados pedem.",
  bullets: [
    "Você não envia nada. O seu sleep-log já está na conta, e é sobre ele que se trabalha.",
    "Uma pessoa passa noite a noite pelo seu registo. Não é o cálculo automático da app, esse você já tem e continua a ter.",
    "Você recebe um plano escrito para o seu caso: a janela recalculada, o que mudar primeiro e o que parar de fazer.",
    "Chega em {days} dias, uma vez. Não é acompanhamento contínuo e não há assinatura nenhuma por trás.",
    "É educação e acompanhamento sobre hábitos de sono. Não é diagnóstico, não é tratamento e não substitui um médico.",
  ],
  priceLine: "Um pagamento único de {price}, por uma leitura.",
  cta: "Pedir a minha recalibração",
  guarantee: "Olhamos para o seu registo antes de começar. Se não houver ali noites suficientes para trabalhar, dizemos e devolvemos o dinheiro sem ter começado.",
},

// en.ts
backend: {
  name: "The Recalibration",
  eyebrow: "After {nights} logged nights",
  title: "The app calculates. This is someone looking",
  promise: "Someone reads the nights you logged and writes back the window your own data is asking for.",
  bullets: [
    "You send nothing. Your sleep log is already in the account, and that is what gets worked on.",
    "A person goes through your log night by night. This is not the app's automatic calculation, you already have that and you keep it.",
    "You get back a written plan for your case: the recalculated window, what to change first, and what to stop doing.",
    "It arrives in {days} days, once. This is not ongoing coaching and there is no subscription behind it.",
    "This is education and coaching about sleep habits. It is not a diagnosis, it is not treatment, and it does not replace a doctor.",
  ],
  priceLine: "One payment of {price}, for one reading.",
  cta: "Ask for my recalibration",
  guarantee: "We look at your log before starting. If there are not enough nights in there to work with, we say so and refund you without having started.",
},

// fr.ts
backend: {
  name: "The Recalibration",
  eyebrow: "Après {nights} nuits enregistrées",
  title: "L'application calcule. Ici, quelqu'un regarde",
  promise: "Quelqu'un lit les nuits que vous avez enregistrées et vous renvoie par écrit la fenêtre que vos propres données demandent.",
  bullets: [
    "Vous n'envoyez rien. Votre journal de sommeil est déjà dans le compte, et c'est là-dessus que le travail se fait.",
    "Une personne parcourt votre journal nuit par nuit. Ce n'est pas le calcul automatique de l'application, celui-là vous l'avez déjà et vous le gardez.",
    "Vous recevez un plan écrit pour votre cas : la fenêtre recalculée, quoi changer en premier et quoi arrêter de faire.",
    "Il arrive en {days} jours, une fois. Ce n'est pas un suivi continu et il n'y a aucun abonnement derrière.",
    "C'est de l'éducation et de l'accompagnement sur les habitudes de sommeil. Ce n'est pas un diagnostic, pas un traitement, et cela ne remplace pas un médecin.",
  ],
  priceLine: "Un paiement unique de {price}, pour une lecture.",
  cta: "Demander ma recalibration",
  guarantee: "Nous regardons votre journal avant de commencer. S'il n'y a pas assez de nuits pour travailler, nous le disons et nous vous remboursons sans avoir commencé.",
},

// es.ts
backend: {
  name: "The Recalibration",
  eyebrow: "Después de {nights} noches registradas",
  title: "La app calcula. Esto es alguien mirando",
  promise: "Alguien lee las noches que usted registró y le devuelve por escrito la ventana que piden sus propios datos.",
  bullets: [
    "Usted no envía nada. Su registro de sueño ya está en la cuenta, y es sobre eso que se trabaja.",
    "Una persona recorre su registro noche por noche. No es el cálculo automático de la app, ese ya lo tiene y lo sigue teniendo.",
    "Recibe un plan escrito para su caso: la ventana recalculada, qué cambiar primero y qué dejar de hacer.",
    "Llega en {days} días, una vez. No es acompañamiento continuo y no hay ninguna suscripción detrás.",
    "Es educación y acompañamiento sobre hábitos de sueño. No es un diagnóstico, no es un tratamiento y no sustituye a un médico.",
  ],
  priceLine: "Un pago único de {price}, por una lectura.",
  cta: "Pedir mi recalibración",
  guarantee: "Miramos su registro antes de empezar. Si no hay noches suficientes para trabajar, se lo decimos y le devolvemos el dinero sin haber empezado.",
},
```

---

## Nota para o Diego

Os quatro blocos partilham a mesma forma, por isso dá um tipo só em `src/locales/types.ts`, no molde do `Oto1Copy` que já lá está:

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
```

`{price}` já é servido pelo `fill()` e pelo `money()` que o `/kit` usa. `{days}` e `{nights}` no degrau 7 ficam à espera de números do Ash, e é melhor que rebentem visivelmente do que serem preenchidos por mim com um palpite.
