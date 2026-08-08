import type { Dict } from "./types";

// ─── Português (BR) ──────────────────────────────────────────────────────────
// Traduzido à mão a partir de en.ts. Tratamento por "você", que é o registo
// natural em pt-BR e não soa distante como o "o senhor".
// Sem travessão e sem emoji, tal como no original.

const pt: Dict = {
  code: "pt",
  name: "Português",
  htmlLang: "pt-BR",
  money: "{n} €",

  quiz: {
    eyebrow: "Teste de sono de 60 segundos",
    headline: "Por que o seu cérebro te acorda às 3 da manhã?",
    sub: "Cinco perguntas. Sessenta segundos. No fim você tem o seu tipo de insônia e o mecanismo exato por trás dela.",
    cta: "Ver o meu tipo de sono",
    microcopy: "Nenhum e-mail é pedido para ver o seu resultado.",
    promises: [
      "Qual dos quatro tipos de insônia é o seu",
      "O mecanismo que te mantém acordado na sua hora",
      "A primeira coisa a mudar, já esta noite",
    ],
    stepLabel: "{n} / {total}",
    building: "Montando o seu resultado",
    back: "Voltar",
    noEmailNote: "Nenhum e-mail para ver o seu resultado",
    analysisLabel: "Análise",
    analyzing: [
      "Lendo as suas respostas",
      "Comparando com os quatro tipos de insônia",
      "O seu resultado está pronto",
    ],
    privacy: "As suas respostas ficam privadas. Nunca vendemos nem compartilhamos.",
    failTitle: "Não conseguimos montar o seu resultado.",
    failBody: "As suas respostas estão salvas. Um toque e tentamos de novo.",
    retry: "Tentar de novo",

    questions: {
      main_problem: {
        prompt: "Qual delas é a sua noite?",
        helper: "Escolha a que estraga mais noites.",
        choices: {
          wake_3am: {
            label: "Durmo bem e depois acordo às 3 da manhã",
            feedback: "É a resposta mais comum deste teste.",
          },
          cant_fall_asleep: {
            label: "Fico horas deitado antes de pegar no sono",
            feedback: "O seu cérebro não quer passar o turno. Existe um motivo.",
          },
          both: {
            label: "As duas. Custa a dormir e depois acordo de novo",
            feedback: "Dois problemas e um mecanismo só por baixo. Já chegamos lá.",
          },
          light_all_night: {
            label: "Durmo, mas leve e picado a noite toda",
            feedback: "Sono que nunca desce. Outra falha, a mesma causa.",
          },
          irregular_schedule: {
            label: "A minha rotina é um caos: turnos, viagens, noites tarde",
            feedback: "O seu relógio interno é reescrito toda semana.",
          },
        },
      },
      night_mind: {
        prompt: "Quando você está acordado de madrugada, o que o seu cérebro faz?",
        helper: "Seja honesto. Todo mundo se reconhece em uma delas.",
        choices: {
          racing: {
            label: "Dispara. Trabalho, dinheiro, conversas em loop",
            feedback: "Não são pensamentos. É um cérebro que ficou de guarda.",
          },
          alert: {
            label: "Totalmente acordado e alerta, como se fosse meio-dia",
            feedback: "Estar alerta às 3 é um hormônio fazendo mal o trabalho dele.",
          },
          clock_math: {
            label: "Olho o relógio e calculo as horas que sobram",
            feedback: "Essa conta é a forma mais rápida de continuar acordado.",
          },
          sleep_anxiety: {
            label: "Fico preocupado por não estar dormindo",
            feedback: "Tentar dormir com mais força é justamente o que te mantém acordado.",
          },
        },
      },
      severity: {
        prompt: "Com que frequência isso acontece?",
        helper: "Por alto. Ninguém está contando.",
        choices: {
          nightly_chronic: {
            label: "Quase toda noite, e já faz anos",
            feedback: "Anos, não semanas. Isso já é insônia crônica.",
          },
          most_nights: {
            label: "Quase todas as noites dos últimos meses",
            feedback: "Passados três meses, deixa de ser uma fase ruim.",
          },
          few_nights: {
            label: "Algumas noites por semana, vai e volta",
            feedback: "Vai e volta continua sendo toda semana. Conta.",
          },
          waves: {
            label: "Vem em ondas. Semanas boas e semanas terríveis",
            feedback: "As ondas quase sempre seguem alguma coisa. Vamos achar.",
          },
        },
      },
      tried: {
        prompt: "O que você já tentou?",
        helper: "Escolha o ponto mais longe onde chegou.",
        choices: {
          supplements: {
            label: "Melatonina, chás, magnésio",
            feedback: "A melatonina desloca o horário. Não trava a hiperativação.",
          },
          apps: {
            label: "Apps de sono, meditação, ruído branco",
            feedback: "Os apps acalmam o quarto. O problema não é o quarto.",
          },
          hygiene: {
            label: "Higiene do sono: quarto escuro, sem telas, sem café",
            feedback: "A higiene do sono previne insônia. Não trata.",
          },
          prescription: {
            label: "Remédio para dormir com receita",
            feedback: "Você foi até onde a medicina vai. E continua aqui.",
          },
          nothing: {
            label: "Sinceramente, nada sério ainda",
            feedback: "Então você começa antes de os anos se acumularem.",
          },
        },
      },
      day_impact: {
        prompt: "O que o dia seguinte te custa?",
        helper: "A parte que você consertaria primeiro.",
        choices: {
          no_energy: {
            label: "Energia. Às 10 da manhã já estou no zero",
            feedback: "O café para de funcionar por volta da terceira semana ruim.",
          },
          brain_fog: {
            label: "Foco. Leio a mesma linha quatro vezes",
            feedback: "Essa névoa é o seu cérebro fazendo manutenção acordado.",
          },
          bad_mood: {
            label: "Paciência. Perco a linha com quem eu amo",
            feedback: "Quem está perto percebe antes de você.",
          },
          dread: {
            label: "Medo. Do jantar em diante já temo a hora de deitar",
            feedback: "Temer a cama é o ciclo se alimentando sozinho.",
          },
        },
      },
    },
  },

  result: {
    badge: "O seu resultado",
    loading: "Abrindo o seu resultado",
    readoutLabel: "A versão curta",
    haveLabel: "O que você tem",
    nightLabel: "O que acontece de madrugada",
    firstLabel: "O que tem que mudar primeiro",
    fullReadLabel: "A versão longa",
    watchNext: "A seguir · Episódio {n} · {time}",
    cta: "Ver o meu plano de 7 noites",
    ctaMicro: "Pagamento único · Reembolso em 60 dias · Acesso imediato",

    capture: {
      headline: "Para onde mandamos o seu plano?",
      sub: "A sua análise completa de {type} e a Noite 1 do protocolo. Um e-mail. Nada mais.",
      button: "Me manda o meu plano",
      sending: "Enviando",
      micro: "Sem spam. No máximo um lembrete. Cancelamento em um clique.",
      placeholder: "voce@exemplo.com",
      sentTitle: "O seu plano está a caminho.",
      sentBody: "Olhe a sua caixa de entrada nos próximos minutos.",
      invalidEmail: "Digite um e-mail válido.",
      saveError: "Não deu para salvar o seu e-mail. Tente de novo.",
      networkError: "Erro de rede. Tente novamente.",
    },

    types: {
      maintenance: {
        title: "Você é um Tipo Manutenção.",
        subtitle: "Você não tem dificuldade para dormir. Tem dificuldade para continuar dormindo, e esse é outro problema, com outra solução.",
        body: [
          "É isto que acontece com você por volta das 3 da manhã. O cortisol, o hormônio que te tira da cama de manhã, não liga na hora do despertador. Ele começa a subir na segunda metade da noite, horas antes de você precisar dele. Na maioria das pessoas esse pulso passa por baixo do sono e ninguém percebe. Em você, ele chega como um alarme. Olhos abertos. Totalmente alerta. Na pior hora possível.",
          "Essa é a primeira metade. A segunda é o que o seu cérebro aprendeu a fazer com ela. Depois de noites ruins suficientes, acordar deixa de ser neutro e vira ameaça, então no instante em que você acorda o seu cérebro olha o relógio, faz a conta e se prepara para o dia seguinte. Isso é hiperativação, e é por isso que se esforçar piora. É também por isso que melatonina, apps e higiene do sono não fizeram nada por você. Foram feitos para ajudar a pegar no sono. Isso você já faz bem. Ninguém nunca te deu nada para a metade das 3 da manhã.",
        ],
        bridge: "O seu plano mira o despertar da madrugada, não a hora de deitar.",
        label: "Tipo Manutenção",
        have: "Insônia de manutenção. Você começa bem a noite e a perde na segunda metade.",
        night: "Uma subida de cortisol chega horas adiantada e pousa em cima do seu sono em vez de passar por baixo.",
        first: "Pare de trabalhar a hora de deitar. O que precisa ser treinado é o despertar das 3.",
        episodeTitle: "Por que exatamente às 3:07",
        planLede: "Cada noite do protocolo trabalha a segunda metade da sua noite. É a metade para a qual nada do que você tentou foi construído.",
      },
      onset: {
        title: "Você é um Tipo Início.",
        subtitle: "O seu corpo está pronto para dormir. O seu cérebro se recusa a passar o turno.",
        body: [
          "Pegar no sono não é uma decisão, é uma passagem de turno. O seu sistema nervoso precisa sair do modo alerta antes de o sono começar. O seu não sai. No instante em que a luz apaga e as distrações acabam, tudo o que o dia deixou pendente toma a palavra: trabalho, dinheiro, a conversa que você repassou às seis da tarde. O seu corpo está exausto e o seu cérebro está na velocidade do meio-dia. É o estado de cansado mas ligado, e é uma condição física mensurável, não um traço de personalidade.",
          "O que prende as pessoas vem depois. Cada hora que você passa acordado na cama ensina ao seu cérebro que a cama é o lugar onde se fica pensando. Faça isso por algumas centenas de noites e o próprio quarto vira o gatilho. Você cochila no sofá e fica bem acordado no segundo em que se deita. É por isso que mandarem você relaxar não funciona, e por isso que o esforço se vira contra você. O sono é a única coisa que se afasta quanto mais você corre atrás. Tem que ser abordado de lado.",
        ],
        bridge: "O seu plano trabalha a passagem de turno, não a força de vontade.",
        label: "Tipo Início",
        have: "Insônia inicial. O corpo está pronto, o sistema nervoso não passa o turno.",
        night: "O modo alerta nunca desce: assim que o quarto fica em silêncio, tudo o que ficou pendente toma a palavra.",
        first: "Pare de correr atrás do sono. A passagem de turno se aborda de lado, nunca de frente.",
        episodeTitle: "O mecanismo",
        planLede: "Cada noite do protocolo trabalha a passagem de turno, aquilo que um corpo faz sozinho e o seu deixou de fazer sob comando.",
      },
      circadian: {
        title: "Você é um Tipo Circadiano.",
        subtitle: "O seu sono não está quebrado. Ele está sendo agendado por outra coisa que não o seu relógio interno.",
        body: [
          "Você tem um relógio interno que decide quando o sono chega, e ele funciona com luz e rotina, não com o quanto você está cansado. Turnos, viagens e noites tarde reescrevem esse relógio mais rápido do que ele consegue se ajustar. Então ele para de chegar na mesma hora toda noite. Você se deita quando a agenda manda e o seu corpo ainda não chegou, ou passou por ali três horas antes e foi embora.",
          "É o tipo que recebe os piores conselhos, porque quase todo produto de sono pressupõe uma rotina normal e manda manter uma hora fixa de deitar. Você não pode. O que você pode fazer é ancorar o relógio pela outra ponta: a hora de acordar, a primeira luz do dia, a primeira hora depois dela. Esses são os sinais que o seu corpo realmente lê, e funcionam mesmo quando as suas noites não se repetem.",
        ],
        bridge: "O seu plano ancora as manhãs, porque as suas noites se mexem.",
        label: "Tipo Circadiano",
        have: "Desalinhamento circadiano. O sono em si está bem. O horário é que não está.",
        night: "Turnos, viagens e luz reescrevem o seu relógio interno mais rápido do que ele consegue fixar uma hora.",
        first: "Pare de corrigir a hora de deitar. O relógio se ancora pela manhã.",
        episodeTitle: "Por que nada funcionou",
        planLede: "Cada noite do protocolo ancora o relógio pela manhã, porque as suas noites se recusam a repetir.",
      },
      mixed: {
        title: "Você é um Tipo Misto.",
        subtitle: "Dois problemas na superfície. Um mecanismo só por baixo.",
        body: [
          "Você tem dificuldade para entrar no sono e dificuldade para se manter nele, o que parece duas falhas separadas mas normalmente não é. É um sistema nervoso que nunca sai por completo do modo alerta. Ele te impede de dormir no começo da noite e te acorda no primeiro ponto natural de subida, algumas horas depois. A mesma guarda, dois turnos.",
          "O Misto é o tipo que faz as pessoas desistirem, porque consertar uma metade parece piorar a outra. Você finalmente dorme mais rápido e mesmo assim está de pé às 3. Isso não é fracasso, é a ordem estar errada. Quando a ativação de fundo desce, as duas metades se mexem juntas, mas tem que ser feito em sequência, uma antes da outra, e essa é a parte que ninguém te conta.",
        ],
        bridge: "O seu plano avança em ordem, porque as duas metades estão ligadas.",
        label: "Tipo Misto",
        have: "Insônia mista. Custa entrar no sono e custa se manter nele.",
        night: "Um sistema nervoso só, preso em alerta, fazendo dois turnos: o começo da noite e a primeira vez que você sobe.",
        first: "Pare de tratar as duas metades separadamente. É a ordem que decide se alguma delas se mexe.",
        episodeTitle: "O mecanismo",
        planLede: "O protocolo trata as suas duas metades em sequência, ativação primeiro, porque é essa ordem que faz as duas se mexerem.",
      },
    },
  },

  plan: {
    eyebrow: "O seu protocolo",
    title: "Sete noites, construídas em torno do seu {label}.",
    keyNight: "Para um {label}, a Noite {n} é a que carrega a mudança.",
    nightsLabel: "O que as sete noites fazem",
    nights: [
      {
        title: "O ponto de partida",
        body: "Você mede a noite que realmente tem, não a que lembra. Dez minutos, uma vez só.",
      },
      {
        title: "Tirar o esforço",
        body: "A primeira regra que baixa a pressão de dormir, que é exatamente a pressão que te mantém acordado.",
      },
      {
        title: "Uma descida que funciona a frio",
        body: "Uma sequência de doze minutos que funciona esteja você calmo ou não na hora de começar.",
      },
      {
        title: "A resposta das 3 da manhã",
        body: "Exatamente o que fazer quando você está acordado no escuro, inclusive quando sair da cama e quando não sair.",
      },
      {
        title: "Ancorar o relógio",
        body: "A hora de acordar e a primeira hora de luz que sustentam o resto da semana.",
      },
      {
        title: "Os pensamentos",
        body: "O que fazer com o loop da madrugada, sem discutir com ele e sem esperar passar.",
      },
      {
        title: "Manter",
        body: "Como o protocolo se reduz a três hábitos que você mantém sem pensar neles.",
      },
    ],
    includedLabel: "O que você recebe",
    included: [
      "O protocolo de 7 noites, uma sessão por noite",
      "O áudio guiado de cada sessão",
      "O diário de sono e os gráficos que mostram se mexeu de verdade",
      "Acesso vitalício, com todas as atualizações futuras",
    ],
    bump: {
      label: "Complemento",
      title: "O Pacote Recuperação",
      body: "O que fazer depois de uma noite ruim, uma noite de viagem e uma noite de plantão, para que uma noite quebrada não recomece tudo.",
      check: "Sim, adicionar o Pacote Recuperação por {price}",
      note: "Normalmente vendido por {price} depois que você termina. Adicione aqui e vai no mesmo pagamento.",
    },
    offerLabel: "A oferta",
    priceLine: "Um pagamento único de {price}. Sem assinatura, sem cobrança recorrente.",
    anchorLine: "Preço de beta aberta. Sobe para {price} no lançamento público.",
    guarantee: "Faça as sete noites. Se o seu sono não tiver mudado, devolvemos tudo. 60 dias.",
    cta: "Começar hoje por {price}",
    ctaBusy: "Abrindo o pagamento",
    ctaMicro: "Pagamento seguro pela Stripe. Não precisa de conta para começar.",
    checkoutError: "O pagamento não abriu. Tente novamente.",
    faqLabel: "Antes de decidir",
    faq: [
      {
        q: "Isso é higiene do sono de novo?",
        a: "Não. A higiene do sono previne insônia, não trata, e é por isso que não fez nada por você. Aqui é o protocolo comportamental usado contra insônia crônica, reduzido a sete noites que você faz em casa.",
      },
      {
        q: "E se não funcionar comigo?",
        a: "Aí você terá feito as sete noites e recebe o dinheiro de volta, em até 60 dias. O reembolso não depende de concordarmos sobre o motivo.",
      },
      {
        q: "Preciso de conta?",
        a: "Para comprar, não. Depois do pagamento você escolhe uma senha em uma tela só, e o protocolo abre no mesmo aparelho.",
      },
    ],
    backToResult: "Voltar ao meu resultado",
  },
};

export default pt;
