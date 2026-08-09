import type { Dict } from "./types";

// ─── Français ────────────────────────────────────────────────────────────────
// Traduit à la main depuis en.ts, pas à la machine: c'est du texte de vente, et
// une traduction automatique aplatit exactement ce qui fait vendre. Le tutoiement
// est écarté au profit du vouvoiement: le lecteur est un inconnu qui a un
// problème médical et qui doit nous croire.
//
// Les deux règles de la maison survivent à la traduction: pas de tiret cadratin,
// pas d'emoji. Et aucune affirmation que nous ne pouvons pas soutenir.

const fr: Dict = {
  code: "fr",
  name: "Français",
  htmlLang: "fr",
  money: "{n} €",

  quiz: {
    eyebrow: "Test de sommeil en 60 secondes",
    headline: "Pourquoi votre cerveau vous réveille-t-il à 3h du matin ?",
    sub: "Cinq questions. Soixante secondes. À la fin, vous avez votre type d'insomnie et le mécanisme exact qui le provoque.",
    cta: "Voir mon type de sommeil",
    microcopy: "Aucun e-mail n'est demandé pour voir votre résultat.",
    promises: [
      "Lequel des quatre types d'insomnie est le vôtre",
      "Le mécanisme qui vous tient éveillé à votre heure",
      "La première chose à changer, dès ce soir",
    ],
    stepLabel: "{n} / {total}",
    building: "Construction de votre résultat",
    back: "Retour",
    noEmailNote: "Aucun e-mail pour voir votre résultat",
    analysisLabel: "Analyse",
    analyzing: [
      "Lecture de vos réponses",
      "Comparaison avec les quatre types d'insomnie",
      "Votre résultat est prêt",
    ],
    privacy: "Vos réponses restent privées. Nous ne les vendons ni ne les partageons.",
    failTitle: "Nous n'avons pas pu construire votre résultat.",
    failBody: "Vos réponses sont enregistrées. Un appui et nous réessayons.",
    retry: "Réessayer",

    questions: {
      main_problem: {
        prompt: "Laquelle est votre nuit ?",
        helper: "Choisissez celle qui gâche le plus de nuits.",
        choices: {
          wake_3am: {
            label: "Je m'endors sans problème, puis je suis réveillé à 3h",
            feedback: "C'est la réponse la plus fréquente à ce test.",
          },
          cant_fall_asleep: {
            label: "Je reste des heures allongé avant de m'endormir",
            feedback: "Votre cerveau refuse de passer le relais. Il y a une raison.",
          },
          both: {
            label: "Les deux. Du mal à m'endormir, puis réveillé à nouveau",
            feedback: "Deux problèmes, un seul mécanisme dessous. Nous y venons.",
          },
          light_all_night: {
            label: "Je dors, mais léger et haché toute la nuit",
            feedback: "Un sommeil qui ne descend jamais. Autre panne, même cause.",
          },
          irregular_schedule: {
            label: "Mon rythme est le chaos : horaires, voyages, nuits tardives",
            feedback: "Votre horloge interne est réécrite chaque semaine.",
          },
        },
      },
      night_mind: {
        prompt: "Quand vous êtes réveillé la nuit, que fait votre cerveau ?",
        helper: "Soyez honnête. Tout le monde se reconnaît dans l'une de ces réponses.",
        choices: {
          racing: {
            label: "Il s'emballe. Travail, argent, conversations en boucle",
            feedback: "Ce ne sont pas des pensées. C'est un cerveau resté de garde.",
          },
          alert: {
            label: "Parfaitement réveillé et alerte, comme en plein après-midi",
            feedback: "Être alerte à 3h, c'est une hormone qui fait mal son travail.",
          },
          clock_math: {
            label: "Je fixe l'heure et je calcule ce qu'il me reste",
            feedback: "Ce calcul est le moyen le plus rapide de rester éveillé.",
          },
          sleep_anxiety: {
            label: "Je m'inquiète de ne pas dormir",
            feedback: "Vouloir dormir plus fort, c'est précisément ce qui vous tient éveillé.",
          },
        },
      },
      severity: {
        prompt: "À quelle fréquence cela arrive-t-il ?",
        helper: "Approximativement. Personne ne compte.",
        choices: {
          nightly_chronic: {
            label: "Presque toutes les nuits, et depuis des années",
            feedback: "Des années, pas des semaines. On est dans l'insomnie chronique.",
          },
          most_nights: {
            label: "La plupart des nuits depuis quelques mois",
            feedback: "Au-delà de trois mois, ce n'est plus une mauvaise passe.",
          },
          few_nights: {
            label: "Quelques nuits par semaine, par intermittence",
            feedback: "Par intermittence, cela reste toutes les semaines. Cela compte.",
          },
          waves: {
            label: "Cela vient par vagues. Bonnes semaines, semaines terribles",
            feedback: "Les vagues suivent presque toujours quelque chose. Nous le trouverons.",
          },
        },
      },
      tried: {
        prompt: "Qu'avez-vous déjà essayé ?",
        helper: "Choisissez le point le plus loin où vous êtes allé.",
        choices: {
          supplements: {
            label: "Mélatonine, tisanes, magnésium",
            feedback: "La mélatonine décale l'heure. Elle n'arrête pas l'hyperéveil.",
          },
          apps: {
            label: "Applications de sommeil, méditation, bruit blanc",
            feedback: "Les applications calment la pièce. Le problème n'est pas la pièce.",
          },
          hygiene: {
            label: "L'hygiène du sommeil : chambre noire, sans écrans, sans café",
            feedback: "L'hygiène du sommeil prévient l'insomnie. Elle ne la traite pas.",
          },
          prescription: {
            label: "Des somnifères sur ordonnance",
            feedback: "Vous êtes allé aussi loin que va la médecine. Et vous êtes encore là.",
          },
          nothing: {
            label: "Honnêtement, rien de sérieux pour l'instant",
            feedback: "Alors vous commencez avant que les années s'accumulent.",
          },
        },
      },
      day_impact: {
        prompt: "Que vous coûte le lendemain ?",
        helper: "Ce que vous répareriez en premier.",
        choices: {
          no_energy: {
            label: "L'énergie. Je suis à sec dès 10h",
            feedback: "Le café cesse de fonctionner vers la troisième mauvaise semaine.",
          },
          brain_fog: {
            label: "La concentration. Je relis quatre fois la même ligne",
            feedback: "Ce brouillard, c'est votre cerveau qui fait sa maintenance en plein jour.",
          },
          bad_mood: {
            label: "La patience. Je m'emporte contre ceux que j'aime",
            feedback: "Vos proches le remarquent avant vous.",
          },
          dread: {
            label: "L'appréhension. Je redoute le coucher dès le dîner",
            feedback: "Redouter le lit, c'est la boucle qui se nourrit elle-même.",
          },
        },
      },
    },
  },

  result: {
    badge: "Votre résultat",
    loading: "Ouverture de votre résultat",
    readoutLabel: "La version courte",
    haveLabel: "Ce que vous avez",
    nightLabel: "Ce qui se passe la nuit",
    firstLabel: "Ce qui doit changer en premier",
    fullReadLabel: "La version longue",
    watchNext: "À voir ensuite · Épisode {n} · {time}",
    cta: "Voir mon plan de 7 nuits",
    ctaMicro: "Paiement unique · Remboursement 30 jours · Accès immédiat",

    capture: {
      headline: "Où devons-nous envoyer votre plan ?",
      sub: "Votre analyse complète de {type} et la Nuit 1 du protocole. Un e-mail. Rien d'autre.",
      button: "Envoyez-moi mon plan",
      sending: "Envoi",
      micro: "Pas de spam. Une relance au maximum. Désinscription en un clic.",
      placeholder: "vous@exemple.com",
      sentTitle: "Votre plan est en route.",
      sentBody: "Regardez votre boîte de réception dans les prochaines minutes.",
      invalidEmail: "Veuillez saisir une adresse e-mail valide.",
      saveError: "Impossible d'enregistrer votre e-mail. Réessayez.",
      networkError: "Erreur réseau. Veuillez réessayer.",
    },

    types: {
      maintenance: {
        title: "Vous êtes un Type Maintien.",
        subtitle: "Vous n'avez pas de mal à vous endormir. Vous avez du mal à rester endormi, et c'est un autre problème, avec une autre solution.",
        body: [
          "Voici ce qui vous arrive vers 3h du matin. Le cortisol, l'hormone qui vous sort du lit le matin, ne s'allume pas à l'heure de votre réveil. Il commence à monter dans la seconde moitié de la nuit, des heures avant que vous en ayez besoin. Chez la plupart des gens, cette montée passe sous le sommeil et personne ne la remarque. Chez vous, elle arrive comme une alarme. Les yeux s'ouvrent. Parfaitement alerte. À la pire heure possible.",
          "Ça, c'est la première moitié. La seconde, c'est ce que votre cerveau a appris à en faire. Après assez de mauvaises nuits, se réveiller cesse d'être neutre et devient une menace : dès l'instant où vous êtes éveillé, votre cerveau regarde l'heure, fait le calcul, se prépare à demain. C'est l'hyperéveil, et c'est pour cela que forcer aggrave les choses. C'est aussi pour cela que la mélatonine, les applications et l'hygiène du sommeil n'ont rien changé pour vous. Elles sont faites pour aider à s'endormir. Ça, vous le faites déjà très bien. Personne ne vous a jamais rien donné pour la moitié de 3h du matin.",
        ],
        bridge: "Votre plan vise le réveil nocturne, pas l'heure du coucher.",
        label: "Type Maintien",
        have: "Insomnie de maintien. Vous commencez bien la nuit et vous la perdez dans la seconde moitié.",
        night: "Une montée de cortisol arrive des heures trop tôt et se pose sur votre sommeil au lieu de passer dessous.",
        first: "Arrêtez de travailler sur le coucher. C'est le réveil de 3h qui doit être rééduqué.",
        episodeTitle: "Pourquoi exactement 3h07",
        planLede: "Chaque nuit du protocole travaille sur la seconde moitié de votre nuit. C'est la moitié pour laquelle rien de ce que vous avez essayé n'avait été conçu.",
      },
      onset: {
        title: "Vous êtes un Type Endormissement.",
        subtitle: "Votre corps est prêt à dormir. Votre cerveau refuse de passer le relais.",
        body: [
          "S'endormir n'est pas une décision, c'est un passage de relais. Votre système nerveux doit quitter le mode alerte avant que le sommeil puisse commencer. Le vôtre ne le quitte pas. Dès que la lumière s'éteint et que les distractions cessent, tout ce que la journée a laissé en suspens prend la parole : le travail, l'argent, la conversation que vous avez rejouée à 18h. Votre corps est épuisé et votre cerveau tourne à la vitesse de midi. C'est l'état épuisé mais sur-régime, et c'est une condition physique mesurable, pas un trait de caractère.",
          "Ce qui piège les gens, c'est la suite. Chaque heure passée éveillé au lit apprend à votre cerveau que le lit est l'endroit où l'on reste allongé à réfléchir. Faites cela quelques centaines de nuits et la chambre elle-même devient le déclencheur. Vous somnolez sur le canapé et vous êtes parfaitement réveillé à la seconde où vous vous allongez. Voilà pourquoi s'entendre dire de se détendre ne marche pas, et pourquoi l'effort se retourne contre vous. Le sommeil est la seule chose qui s'éloigne à mesure qu'on la poursuit. Il faut l'aborder de côté.",
        ],
        bridge: "Votre plan travaille sur le passage de relais, pas sur la volonté.",
        label: "Type Endormissement",
        have: "Insomnie d'endormissement. Le corps est prêt, le système nerveux ne passe pas le relais.",
        night: "Le mode alerte ne retombe jamais : dès que la pièce devient silencieuse, tout ce qui reste en suspens prend la parole.",
        first: "Arrêtez de poursuivre le sommeil. Le relais s'aborde de côté, jamais de face.",
        episodeTitle: "Le mécanisme",
        planLede: "Chaque nuit du protocole travaille sur le passage de relais, ce qu'un corps fait tout seul et que le vôtre ne fait plus sur commande.",
      },
      circadian: {
        title: "Vous êtes un Type Circadien.",
        subtitle: "Votre sommeil n'est pas cassé. Il est programmé par autre chose que votre horloge interne.",
        body: [
          "Vous avez une horloge interne qui décide du moment où vous avez sommeil, et elle fonctionne à la lumière et à la routine, pas à la fatigue. Le travail posté, les voyages et les nuits tardives réécrivent cette horloge plus vite qu'elle ne peut s'ajuster. Elle cesse donc d'arriver à la même heure chaque nuit. Vous vous couchez quand l'agenda le dit et votre corps n'y est pas encore, ou bien il est passé trois heures plus tôt et il est reparti.",
          "C'est le type qui reçoit les pires conseils, parce que la plupart des produits de sommeil supposent un rythme normal et vous disent de garder une heure de coucher fixe. Vous ne pouvez pas. Ce que vous pouvez faire, c'est ancrer l'horloge par l'autre bout : le réveil, la première lumière de la journée, la première heure qui suit. Ce sont les signaux que votre corps lit vraiment, et ils fonctionnent même quand vos nuits ne se répètent pas.",
        ],
        bridge: "Votre plan ancre les matins, parce que vos nuits bougent.",
        label: "Type Circadien",
        have: "Décalage circadien. Le sommeil lui-même va bien. C'est l'horaire qui ne va pas.",
        night: "Horaires, voyages et lumière réécrivent votre horloge interne plus vite qu'elle ne peut se fixer sur une heure.",
        first: "Arrêtez de corriger l'heure du coucher. L'horloge s'ancre par le matin.",
        episodeTitle: "Pourquoi rien n'a marché",
        planLede: "Chaque nuit du protocole ancre l'horloge par le matin, parce que vos nuits refusent de se répéter.",
      },
      mixed: {
        title: "Vous êtes un Type Mixte.",
        subtitle: "Deux problèmes en surface. Un seul mécanisme dessous.",
        body: [
          "Vous avez du mal à entrer dans le sommeil et du mal à y rester, ce qui ressemble à deux pannes séparées mais n'en est généralement pas. C'est un système nerveux qui ne quitte jamais complètement le mode alerte. Il vous empêche de vous endormir en début de nuit, et il vous réveille au premier point de remontée naturelle quelques heures plus tard. Même garde, deux services.",
          "Le type Mixte est celui qui fait abandonner, parce que réparer une moitié semble aggraver l'autre. Vous vous endormez enfin plus vite, et vous êtes debout à 3h quand même. Ce n'est pas un échec, c'est l'ordre qui est faux. Quand l'éveil de fond redescend, les deux moitiés bougent ensemble, mais cela doit se faire dans l'ordre, l'une avant l'autre, et c'est la partie que personne ne vous dit.",
        ],
        bridge: "Votre plan avance dans l'ordre, parce que les deux moitiés sont liées.",
        label: "Type Mixte",
        have: "Insomnie mixte. Du mal à entrer dans le sommeil, et du mal à y rester.",
        night: "Un seul système nerveux resté en alerte, qui fait deux services : le début de la nuit et la première remontée.",
        first: "Arrêtez de traiter les deux moitiés séparément. C'est l'ordre qui décide si l'une des deux bouge.",
        episodeTitle: "Le mécanisme",
        planLede: "Le protocole traite vos deux moitiés dans l'ordre, l'éveil de fond d'abord, parce que c'est cet ordre-là qui les fait bouger toutes les deux.",
      },
    },
  },

  plan: {
    eyebrow: "Votre protocole",
    title: "Sept nuits, construites autour de votre {label}.",
    keyNight: "Pour un {label}, la Nuit {n} est celle qui porte le changement.",
    nightsLabel: "Ce que font les sept nuits",
    nights: [
      {
        title: "L'état des lieux",
        body: "Vous mesurez la nuit que vous avez vraiment, pas celle dont vous vous souvenez. Dix minutes, une seule fois.",
      },
      {
        title: "Retirer l'effort",
        body: "La première règle qui fait baisser la pression de dormir, celle-là même qui vous tient éveillé.",
      },
      {
        title: "Une descente qui marche à froid",
        body: "Une séquence de douze minutes qui fonctionne, que vous vous sentiez calme ou non au moment de la lancer.",
      },
      {
        title: "La réponse de 3h",
        body: "Exactement quoi faire quand vous êtes réveillé dans le noir, y compris quand quitter le lit et quand rester.",
      },
      {
        title: "Ancrer l'horloge",
        body: "L'heure de réveil et la première heure de lumière qui tiennent le reste de la semaine en place.",
      },
      {
        title: "Les pensées",
        body: "Quoi faire de la boucle nocturne, sans discuter avec elle et sans attendre qu'elle passe.",
      },
      {
        title: "Le garder",
        body: "Comment le protocole se réduit à trois habitudes que vous gardez sans y penser.",
      },
    ],
    includedLabel: "Ce que vous recevez",
    included: [
      "Le protocole de 7 nuits, une séance par nuit",
      "L'audio guidé de chaque séance",
      "Le carnet de sommeil et les courbes qui montrent si cela a bougé",
      "Accès à vie, toutes les mises à jour futures comprises",
    ],
    bump: {
      label: "Complément",
      title: "Le Pack Récupération",
      body: "Quoi faire après une mauvaise nuit, une nuit de voyage et une nuit de garde, pour qu'une nuit cassée ne remette pas tout à zéro.",
      check: "Oui, ajouter le Pack Récupération pour {price}",
      note: "Vendu {price} normalement, une fois le protocole terminé. Ajoutez-le ici et il passe dans le même paiement.",
    },
    offerLabel: "L'offre",
    priceLine: "Un paiement unique de {price}. Pas d'abonnement, pas de prélèvement récurrent.",
    anchorLine: "Prix de bêta ouverte. Il passe à {price} au lancement public.",
    guarantee: "Faites les sept nuits. Si votre sommeil n'a pas changé, tout est remboursé. 30 jours.",
    cta: "Commencer ce soir pour {price}",
    ctaBusy: "Ouverture du paiement",
    ctaMicro: "Paiement sécurisé par Hotmart. Aucun compte n'est nécessaire pour commencer.",
    checkoutError: "Le paiement ne s'est pas ouvert. Veuillez réessayer.",
    faqLabel: "Avant de décider",
    faq: [
      {
        q: "C'est encore de l'hygiène du sommeil ?",
        a: "Non. L'hygiène du sommeil prévient l'insomnie, elle ne la traite pas, et c'est pour cela qu'elle n'a rien changé pour vous. Ici, c'est le protocole comportemental utilisé contre l'insomnie chronique, ramené à sept nuits que vous faites chez vous.",
      },
      {
        q: "Et si cela ne marche pas pour moi ?",
        a: "Alors vous aurez fait les sept nuits et vous êtes remboursé, jusqu'à 30 jours. Le remboursement ne dépend pas de notre accord sur les raisons.",
      },
      {
        q: "Ai-je besoin d'un compte ?",
        a: "Pas pour acheter. Après le paiement, vous choisissez un mot de passe sur un seul écran, et le protocole s'ouvre sur le même appareil.",
      },
    ],
    backToResult: "Revenir à mon résultat",
  },

  oto1: {
    eyebrow: "À ajouter avant d'entrer",
    title: "La nuit où ça revient",
    body: [
      "Vous venez d'acheter sept nuits. Et la question est déjà là : et la première nuit où l'insomnie revient ? Parce qu'elle revient, une fois, le plus souvent quelques semaines plus tard, et c'est cette nuit qui décide si vous gardez la méthode ou si vous l'abandonnez sans rien dire.",
      "Le 3AM Relapse Kit, c'est ce que vous lancez cette nuit-là. Un protocole de vingt minutes à écouter dans le noir, une carte pour les quatre-vingt-dix premières secondes, et trois versions courtes pour les trois choses qui déclenchent la rechute. Rien à lire et rien à décider à trois heures du matin.",
    ],
    includedLabel: "Ce qu'il contient",
    included: [
      {
        title: "Le protocole de 20 minutes",
        body: "Audio guidé pour le milieu de la nuit, silences compris, pour être accompagné pendant que vous le faites au lieu de retenir une liste à l'avance.",
      },
      {
        title: "La carte des 90 premières secondes",
        body: "Une page. Imprimée pour le tiroir de la table de nuit et enregistrée sur le téléphone. Quoi faire avant de décider quoi que ce soit sur la nuit.",
      },
      {
        title: "Trois versions par déclencheur",
        body: "Quatre à cinq minutes chacune, pour les rechutes qui arrivent vraiment : un réveil en anxiété, la nuit après avoir bu, et un horaire qui a bougé.",
      },
      {
        title: "À vous, définitivement",
        body: "Le même accès à vie que le protocole. Payé une fois, sans abonnement, toutes les mises à jour incluses.",
      },
    ],
    notLabel: "Ce que ce n'est pas",
    not: "Ce n'est ni un deuxième programme ni de la théorie en plus. C'est la seule nuit que les sept nuits ne couvrent pas, réglée à l'avance. Éducation et accompagnement, pas de soins médicaux.",
    priceLine: "Un paiement unique de {price}, ajouté à la commande que vous venez de passer.",
    cta: "Oui, j'ajoute le Relapse Kit",
    decline: "Non merci, emmenez-moi à mon protocole",
    micro: "Un clic. Votre carte n'est pas redemandée.",
    guarantee: "Couvert par la même garantie de 30 jours que le protocole.",
  },
};

export default fr;
