# Degrau 7: a chamada de 30 minutos. Revisão de compliance

**Issue:** FLU-238 (filha da FLU-226) · **Data:** 23 de Agosto de 2026 · **Revisor:** Roger, jurídico
**Objecto:** o nível de 149 EUR do degrau 7 do Sleep Wired, que acrescenta 30 minutos de chamada ao vivo ao plano escrito.
**Base revista:** `marketing/esteira-degraus-4-7-copy.md`, secção "Degrau 7" (commit 36a88ad), mais `src/pages/terms.tsx` e `src/pages/privacy-policy.tsx` da app.

---

## Resposta ao ponto 1, em uma linha

**A linha que está escrita chega para o nível de 79 e não chega para o nível de 149.**

Não é preciso reescrever nada do que já está aprovado. A bullet actual ("É educação e acompanhamento sobre hábitos de sono. Não é diagnóstico, não é tratamento e não substitui um médico.") fica exactamente como está, nos quatro idiomas, e continua a servir os dois níveis. O que falta é texto novo em dois sítios que hoje não existem:

1. **Uma linha a mais na página de venda**, só debaixo do nível 2, a dizer o que a chamada não faz.
2. **Um aceite no momento de marcar a chamada**, que é o ponto onde a linha da página de venda não vale nada.

O ponto 2 é o que interessa. Explico porquê antes de dar o texto.

---

## Porque é que a linha da página de venda não chega

A frase actual é boa. O problema não é a frase, é onde ela vive e o que ela cobre.

**Primeiro: uma página de venda não é uma cláusula aceite.** A linha está numa bullet, no meio de um argumentário, numa página que a pessoa lê para decidir comprar. Nenhuma lei de consumo europeia trata uma bullet de sales page como termo contratual oponível. Serve para não induzir em erro, e nisso funciona. Não serve para fixar o que a pessoa aceitou. Enquanto o produto era um plano escrito enviado uma vez, isso chegava, porque o plano escrito é revisto antes de sair e nunca diz mais do que o autor quis dizer. Uma chamada ao vivo não tem essa protecção.

**Segundo: a chamada é bidireccional e não é revista.** É esta a diferença de risco, e é a única que importa. No plano escrito, tudo o que sai foi escrito, lido e pode ser confrontado com a bullet. Na chamada, o comprador vai dizer coisas que não se podem antecipar, e vai fazer perguntas a que alguém tem de responder no momento: "tomo zolpidem, corto?", "acordo a engasgar, é normal?", "o meu médico disse-me X, o que acha?". Cada uma dessas respostas, dada ao vivo a uma pessoa concreta que acabou de descrever sintomas, é exactamente aquilo que os regimes de exercício ilegal da medicina descrevem. A bullet na página não impede a pergunta e não ajuda quem tem de responder.

**Terceiro: uma conversa personalizada cria confiança, e a confiança come o disclaimer.** É o ponto que costuma ser mal percebido. Um disclaimer não é um escudo automático: vale enquanto a conduta não o contradiz. Trinta minutos de conversa individual sobre os dados de sono de uma pessoa, com recomendações do que mudar, é conduta que se parece com aconselhamento de saúde individualizado. Se depois houver litígio, ninguém vai ler a bullet e parar por aí; vão ouvir o que foi dito na chamada. Se o que foi dito extravasou, a bullet não repõe nada. A protecção real, aqui, não é texto: é a regra do que a chamada não faz, escrita antes, aceite antes, e cumprida durante.

**Quarto: dados de saúde.** O sleep-log já é dado de saúde na acepção do art. 9 do RGPD e do art. 5 al. c da nLPD suíça, e já é tratado hoje. A chamada acrescenta duas coisas novas: o comprador vai revelar oralmente dados que não estão no log (medicação, diagnósticos, estado psicológico), e há uma plataforma de vídeo pelo meio que hoje não está declarada em lado nenhum. O tratamento de dados de saúde exige consentimento explícito, e explícito quer dizer específico e dado antes. Uma bullet lida na página de venda não é consentimento explícito para nada.

---

## Ponto 2: faz diferença o mercado?

**Faz, mas não da forma que se esperaria. O texto pode e deve ser o mesmo nos quatro idiomas. O que muda por mercado é o que a chamada pode ser, não como se escreve.**

Quatro textos legais diferentes por idioma seria uma armadilha de manutenção e não protegeria mais, porque o que protege é a conduta. Dito isto, vale a pena saber onde estão as arestas, porque elas informam as regras da chamada.

**Suíça.** A regulação das profissões de saúde é sobretudo cantonal, e o que a lei federal protege são os **títulos**: "médecin" (LPMéd), "psychologue" e "psychothérapeute" (LPsy). Usar um desses títulos, ou deixar que o comprador acredite que está a falar com um deles, é o que dispara. Aconselhamento sobre hábitos, sem título protegido, sem diagnóstico e sem tratamento, fica de fora. Vários cantões (VD, GE, TI, ZH entre outros) exigem autorização para actividades de "thérapeute" ou de "pratiques complémentaires", o que reforça a mesma regra: a palavra "thérapie" não pode aparecer a descrever o que se vende, e quem está na chamada não se apresenta com nenhum título de saúde. A nLPD revista, em vigor desde 1 de Setembro de 2023, trata dados de saúde como dados sensíveis e exige consentimento explícito.

**União Europeia.** Aqui não há uma directiva única: há regimes nacionais, e os mais duros são precisamente os de dois dos nossos idiomas.

- **Alemanha**, alcançável pelo texto EN, tem a Heilpraktikergesetz. Exercer Heilkunde, que inclui avaliar ou aliviar doença, sem licença é crime, não contra-ordenação. Os tribunais alemães já a aplicaram a aconselhamento individualizado prestado por não licenciados a pessoas com uma condição.
- **França**, e portanto o texto FR, tem o art. L.4161-1 do Code de la santé publique, com a redacção mais larga das quatro: participar habitualmente no estabelecimento de um diagnóstico ou no tratamento de doença. "Habitualmente" é o advérbio perigoso, porque um degrau de esteira é, por definição, habitual.
- Espanha, Itália, Portugal e Áustria têm figuras análogas, com a austríaca (Psychotherapiegesetz) a apanhar também o lado psicológico.

A insónia é uma condição diagnosticável, com código próprio (ICD-11 7A00, ICD-10 G47.0 e F51.0). Isso é o que torna a fronteira real e não teórica: não estamos a falar de bem-estar genérico, estamos a falar de uma queixa clínica nomeada. Um plano escrito que aplica um método publicado aos dados que a pessoa registou é defensável em qualquer destes regimes. Uma conversa ao vivo em que a pessoa descreve sintomas e recebe recomendações está mais perto da linha, e a distância à linha decide-se pelo que se responde a duas ou três perguntas concretas.

**O que isto quer dizer na prática.** O texto é um só, nos quatro idiomas. A mitigação está em três regras de conduta, não em redacção: nunca falar de medicação, nunca dar diagnóstico, e ter uma lista de sintomas que faz a chamada parar e virar encaminhamento. Estão escritas mais abaixo.

**O que fica por decidir e não é meu.** Se este degrau escalar em França ou na Alemanha com tráfego pago, isso justifica uma opinião de advogado local nesses dois países antes de aumentar volume. Não bloqueia abrir o degrau; bloqueia escalá-lo às cegas.

---

## Ponto 3: tem de ser dito alguma coisa antes da chamada?

**Sim, e é a parte mais importante desta revisão.** No momento de marcar, e não só na página de venda.

Três coisas, por esta ordem de importância:

1. **Consentimento explícito para falar de saúde na chamada.** Base legal art. 9(2)(a) do RGPD e nLPD. Tem de ser separado do aceite dos termos, porque consentimento não se pode empacotar com aceitação contratual: são caixas diferentes.
2. **Reconhecimento do que a chamada é e do que não é**, incluindo que não se fala de medicação e que não há diagnóstico. É esta a peça que substitui, com força contratual, aquilo que hoje só existe como bullet.
3. **Pedido expresso de execução dentro do prazo de retractação, e perda desse direito depois da chamada.** Na UE o comprador tem 14 dias de direito de retractação em venda à distância, e um serviço executado dentro desses 14 dias exige que ele peça expressamente a execução e reconheça que perde o direito depois de o serviço estar prestado. Sem isto, alguém pode ter a chamada e pedir reembolso na mesma, e ter razão.

Há ainda uma quarta, mais simples: **dizer que a chamada não é gravada**. Se um dia for gravada, isso passa a exigir consentimento próprio e separado. Enquanto não for, dizê-lo remove uma pergunta e fecha um risco de graça.

E, antes das caixas, um aviso a ler: a lista de sintomas que manda a pessoa ao médico antes de marcar. Este aviso vale por dois motivos. Filtra para fora as pessoas que não deviam estar nesta chamada, que é a mitigação mais eficaz que existe. E, se alguma coisa correr mal, é a prova de que foi dito antes e por escrito.

---

# Texto novo, nos quatro idiomas

Regras respeitadas: marca Sleep Wired, zero travessão, zero emoji, sem vocabulário de fornecedor.

## A. Página de venda, linha extra só no nível 2

Vai logo a seguir à bullet extra do nível 2 que já está escrita.

**PT:** A chamada é uma conversa sobre os seus hábitos de sono e sobre o plano que recebeu. Não damos diagnóstico, não falamos de medicação e não substituímos a sua ida ao médico.

**EN:** The call is a conversation about your sleep habits and about the plan you received. We do not give a diagnosis, we do not discuss medication, and we are not a replacement for seeing your doctor.

**FR :** L'appel est une conversation sur vos habitudes de sommeil et sur le plan que vous avez reçu. Nous ne posons pas de diagnostic, nous ne parlons pas de médicaments, et cela ne remplace pas une consultation médicale.

**ES:** La llamada es una conversación sobre sus hábitos de sueño y sobre el plan que recibió. No damos diagnóstico, no hablamos de medicación y no sustituimos su visita al médico.

## B. Página de marcação, aviso a ler antes de escolher a data

**PT**
Antes de marcar, leia isto.
Se lhe acontece parar de respirar durante o sono, acordar a engasgar ou ressonar muito alto, se adormece ao volante ou a trabalhar, se toma comprimidos para dormir receitados por um médico, ou se anda com o humor em baixo ao ponto de lhe passarem pela cabeça pensamentos de se magoar, fale primeiro com um médico. Não é uma formalidade nossa: são coisas que só um médico pode ver, e uma conversa sobre hábitos não as resolve. Se aparecerem durante a chamada, nós paramos e dizemos-lhe isso mesmo.

**EN**
Read this before you book.
If you stop breathing during sleep, wake up gasping, or snore very loudly, if you fall asleep at the wheel or at work, if you take prescription sleeping pills, or if your mood has been low enough that thoughts of hurting yourself have crossed your mind, talk to a doctor first. This is not a formality on our side: these are things only a doctor can look at, and a conversation about habits will not solve them. If they come up during the call, we stop and tell you exactly that.

**FR**
À lire avant de fixer la date.
Si vous arrêtez de respirer pendant le sommeil, si vous vous réveillez en suffoquant ou si vous ronflez très fort, si vous vous endormez au volant ou au travail, si vous prenez des somnifères prescrits, ou si votre moral est bas au point que des pensées de vous faire du mal vous ont traversé l'esprit, parlez d'abord à un médecin. Ce n'est pas une formalité de notre part : ce sont des choses que seul un médecin peut examiner, et une conversation sur les habitudes ne les règle pas. Si cela apparaît pendant l'appel, nous arrêtons et nous vous le disons.

**ES**
Lea esto antes de reservar.
Si deja de respirar mientras duerme, se despierta ahogándose o ronca muy fuerte, si se queda dormido al volante o en el trabajo, si toma pastillas para dormir recetadas, o si su ánimo ha estado tan bajo que le han pasado por la cabeza pensamientos de hacerse daño, hable primero con un médico. No es un trámite nuestro: son cosas que solo un médico puede mirar, y una conversación sobre hábitos no las resuelve. Si aparecen durante la llamada, paramos y se lo decimos.

## C. Página de marcação, caixa 1 de 2. Dados de saúde

Caixa separada, obrigatória, não pré-marcada.

**PT:** Autorizo que nesta chamada se fale do meu registo de sono e daquilo que eu contar sobre a minha saúde. A chamada não é gravada. Posso retirar esta autorização a qualquer momento antes da chamada, escrevendo para privacy@sleepwired.com.

**EN:** I agree that this call may cover my sleep log and whatever I choose to say about my health. The call is not recorded. I can withdraw this at any time before the call by writing to privacy@sleepwired.com.

**FR :** J'accepte que cet appel porte sur mon journal de sommeil et sur ce que je choisirai de dire concernant ma santé. L'appel n'est pas enregistré. Je peux retirer cet accord à tout moment avant l'appel, en écrivant à privacy@sleepwired.com.

**ES:** Autorizo que en esta llamada se hable de mi registro de sueño y de lo que yo cuente sobre mi salud. La llamada no se graba. Puedo retirar esta autorización en cualquier momento antes de la llamada, escribiendo a privacy@sleepwired.com.

## D. Página de marcação, caixa 2 de 2. O que a chamada é, e o reembolso

Caixa separada, obrigatória, não pré-marcada.

**PT:** Percebi que esta chamada é educação sobre hábitos de sono, que não é diagnóstico nem tratamento, e que nela não se fala de medicação. Peço que a chamada aconteça na data que escolhi, e percebi que depois de ela acontecer já não posso pedir o reembolso dos 30 minutos.

**EN:** I understand that this call is education about sleep habits, that it is not a diagnosis or treatment, and that medication is not discussed on it. I ask for the call to take place on the date I picked, and I understand that once it has taken place I can no longer ask for the 30 minutes to be refunded.

**FR :** Je comprends que cet appel est de l'éducation sur les habitudes de sommeil, qu'il ne s'agit ni d'un diagnostic ni d'un traitement, et qu'on n'y parle pas de médicaments. Je demande que l'appel ait lieu à la date que j'ai choisie, et je comprends qu'une fois l'appel passé je ne peux plus demander le remboursement des 30 minutes.

**ES:** Entiendo que esta llamada es educación sobre hábitos de sueño, que no es un diagnóstico ni un tratamiento, y que en ella no se habla de medicación. Pido que la llamada tenga lugar en la fecha que elegí, y entiendo que una vez que haya ocurrido ya no puedo pedir el reembolso de los 30 minutos.

## E. Ajuste à garantia do nível 2

A garantia escrita hoje ("Olhamos para o seu registo antes de começar. Se não houver ali noites suficientes para trabalhar, dizemos e devolvemos o dinheiro sem ter começado.") está bem para o nível de 79 e fica incompleta no de 149, porque não diz onde é o ponto sem retorno de um serviço humano que tem duas entregas. Uma frase resolve, a acrescentar só no nível 2:

**PT:** No nível com chamada, o plano escrito e a chamada contam separado: enquanto a chamada não acontecer, ela é reembolsável.

**EN:** On the tier with the call, the written plan and the call count separately: as long as the call has not happened, it is refundable.

**FR :** Au niveau avec appel, le plan écrit et l'appel comptent séparément : tant que l'appel n'a pas eu lieu, il est remboursable.

**ES:** En el nivel con llamada, el plan escrito y la llamada cuentan por separado: mientras la llamada no ocurra, es reembolsable.

---

# Regras da chamada. Interno, não é texto de cliente

Isto não vai para lado nenhum que o comprador leia. É a folha de quem está na chamada, e é a peça que faz o texto acima valer alguma coisa. Sem ela, o texto é decoração.

**Nunca, em nenhum mercado:**

1. Não se dá diagnóstico, nem em forma de pergunta ("parece-me apneia, não?"). A frase é sempre a mesma: isso é para um médico ver.
2. Não se fala de medicação. Não se sugere cortar, reduzir, mudar hora ou trocar. Nem "eu no seu lugar". Se o comprador perguntar, a resposta é que quem receitou é quem altera.
3. Não se usa nenhum título de saúde para descrever quem está na chamada, e não se deixa passar em claro se o comprador assumir um. Se ele disser "doutor", corrige-se na hora.
4. Não se usam as palavras terapia, tratamento, consulta ou paciente. Nem em conversa solta. É plano, chamada, e o nome da pessoa.
5. Não se promete resultado, prazo de melhoria ou número de noites.

**Parar e encaminhar.** Se aparecer qualquer um destes, a chamada muda de assunto na hora e passa a ser encaminhamento: pausas na respiração, engasgo ou ressonar alto; adormecer ao volante ou em tarefa perigosa; paralisia do sono com alucinações, ou perda súbita de força com emoção; comprimidos receitados para dormir; humor em baixo, ansiedade a dominar, ou qualquer menção a fazer-se mal; gravidez; menor de 18 anos, e aqui nem sequer se devia ter chegado à chamada, porque os termos já exigem 18.

O encaminhamento diz-se assim, e não de outra forma: isto é uma coisa que um médico tem de ver, eu não posso avaliar isso, e não é o que esta chamada faz.

**Registo.** Depois de cada chamada, duas linhas guardadas: data, e se houve encaminhamento e porquê. Não é burocracia, é a única prova que existe de que a regra foi cumprida, e é ela que se mostra se um dia alguém perguntar.

---

# O que esta revisão encontrou fora da copy, e que é mais urgente do que a copy

Ao rever o degrau fui ver o que a app já promete ao comprador. Encontrei três coisas que não são do texto do produto, mas que este degrau parte, e uma delas parte já no nível de 79, não só na chamada.

**1. A política de privacidade diz hoje que os dados de sono servem só para o progresso automático.** A frase em `src/pages/privacy-policy.tsx`, secção 1, é: "This data is used solely to power your personal progress tracking." A partir do momento em que uma pessoa lê o sleep-log de um comprador e escreve um plano sobre ele, esta frase deixa de ser verdadeira. Não é um detalhe de redacção: é uma finalidade declarada que passa a ser contrariada pelo tratamento real, e é o tipo de coisa que uma autoridade de protecção de dados sanciona sem precisar de queixa de ninguém. Isto bloqueia o degrau 7 inteiro, os dois níveis, e não só a chamada. A política também não tem base legal declarada, não fala do art. 9, não identifica o responsável pelo tratamento, não menciona a nLPD suíça apesar de a Suíça ser mercado, e não tem plataforma de videochamada declarada.

**2. Os termos descrevem um produto que já não é este, e limitam a responsabilidade a 27 euros.** `src/pages/terms.tsx`, secção 1, define o serviço como "a self-guided, 7-night digital program". Uma revisão humana e uma chamada ao vivo não cabem em "self-guided digital program", e a secção 2, o disclaimer médico, está escrita a pensar num programa que ninguém lê do outro lado. Mais grave, a secção 7 limita a responsabilidade total a "the amount you paid for the program (€27)". Quem pagar 149 tem um tecto escrito que é inferior ao que pagou e que nomeia um preço que não é o dele. Um tecto assim, num serviço humano com componente de saúde, é dos que caem à primeira: a Directiva 93/13 apanha-o por desequilíbrio, e nenhum tecto exclui responsabilidade por dano pessoal por negligência, em nenhum destes países.

**3. Os termos existem só em inglês, e o produto vende em quatro idiomas.** Para um comprador francês isto é um problema com nome: a exigência de linguagem clara e compreensível da Directiva 93/13, e o Code de la consommation, que espera francês. Enquanto o produto era 27 euros, era um risco pequeno e teórico. Com um serviço humano a 149 e dados de saúde pelo meio, deixa de ser.

Nenhum destes três é copy do degrau, e por isso não os corrijo aqui. Ficam nomeados, com issue própria, porque o 1 e o 2 bloqueiam a abertura do degrau 7 e devem ser fechados antes da primeira venda.

---

# Resumo, para quem só lê isto

- **Ponto 1.** A linha chega para o nível de 79. Não chega para o de 149. Não se muda nada do que está aprovado; acrescenta-se uma linha na página, no bloco A, e faz-se um aceite na marcação, blocos B a D.
- **Ponto 2.** Um texto só, igual nos quatro idiomas. O que muda por mercado é a conduta na chamada, não a redacção. As arestas duras são a Alemanha, por via do EN, e a França. Escalar tráfego pago nesses dois pede opinião local; abrir o degrau não pede.
- **Ponto 3.** Sim. Aviso de sintomas a ler, duas caixas separadas, uma de dados de saúde e outra de natureza do serviço mais reembolso. Separadas porque consentimento não se empacota com aceitação contratual.
- **Texto novo:** entregue nos quatro idiomas, pronto a colar. A Sophie não precisa de traduzir nada.
- **A sério, antes disto tudo:** a política de privacidade diz que o sleep-log só serve para o cálculo automático. Enquanto essa frase estiver lá, o degrau 7 não abre, nem a 79 nem a 149.
