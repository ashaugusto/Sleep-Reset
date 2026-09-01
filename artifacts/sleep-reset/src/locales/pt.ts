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
    ctaMicro: "Pagamento único · Reembolso em 30 dias · Acesso imediato",

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
    guarantee: "Faça as sete noites. Se o seu sono não tiver mudado, devolvemos tudo. 30 dias.",
    cta: "Começar hoje por {price}",
    ctaBusy: "Abrindo o pagamento",
    ctaMicro: "Pagamento seguro pela Hotmart. Não precisa de conta para começar.",
    checkoutError: "O pagamento não abriu. Tente novamente.",
    faqLabel: "Antes de decidir",
    faq: [
      {
        q: "Isso é higiene do sono de novo?",
        a: "Não. A higiene do sono previne insônia, não trata, e é por isso que não fez nada por você. Aqui é o protocolo comportamental usado contra insônia crônica, reduzido a sete noites que você faz em casa.",
      },
      {
        q: "E se não funcionar comigo?",
        a: "Aí você terá feito as sete noites e recebe o dinheiro de volta, em até 30 dias. O reembolso não depende de concordarmos sobre o motivo.",
      },
      {
        q: "Preciso de conta?",
        a: "Para comprar, não. Depois do pagamento você escolhe uma senha em uma tela só, e o protocolo abre no mesmo aparelho.",
      },
    ],
    backToResult: "Voltar ao meu resultado",
  },

  oto1: {
    eyebrow: "Adicione antes de entrar",
    title: "A noite em que ela volta",
    body: [
      "Você acabou de comprar sete noites. E já está com a pergunta na cabeça: e na primeira noite em que a insônia voltar? Porque ela volta, uma vez, quase sempre algumas semanas depois, e é essa noite que decide se você mantém o método ou para de usar sem dizer nada.",
      "O 3AM Relapse Kit é o que você usa nessa noite. Um protocolo de vinte minutos para ouvir no escuro, um cartão para os primeiros noventa segundos e três versões curtas para as três coisas que costumam causar a recaída. Nada para ler e nada para resolver às três da manhã.",
    ],
    includedLabel: "O que vem dentro",
    included: [
      {
        title: "O protocolo de 20 minutos",
        body: "Áudio guiado para o meio da noite, com os silêncios mantidos, para você ser conduzido enquanto faz, em vez de decorar uma lista antes.",
      },
      {
        title: "O cartão dos primeiros 90 segundos",
        body: "Uma página. Impressa para a gaveta do criado-mudo e salva no celular. O que fazer antes de decidir qualquer coisa sobre a noite.",
      },
      {
        title: "Três versões por gatilho",
        body: "Quatro a cinco minutos cada, para as recaídas que acontecem de verdade: acordar em ansiedade, a noite depois de beber e uma mudança de horário.",
      },
      {
        title: "Seu para sempre",
        body: "O mesmo acesso vitalício do protocolo. Pago uma vez, sem assinatura, com todas as atualizações incluídas.",
      },
    ],
    notLabel: "O que isto não é",
    not: "Não é um segundo curso nem mais teoria. É a única noite que as sete noites não cobrem, resolvida com antecedência. Educação e acompanhamento, não atendimento médico.",
    priceLine: "Um pagamento único de {price}, somado ao pedido que você acabou de fazer.",
    cta: "Sim, quero adicionar o Relapse Kit",
    decline: "Não, obrigado. Quero ir para o meu protocolo",
    micro: "Um clique. O cartão não é pedido de novo.",
    guarantee: "Coberto pela mesma garantia de 30 dias do protocolo.",
  },

  // Degraus 4 e 5, texto da Sophie: marketing/esteira-degraus-4-7-copy.md.
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
  // Degraus 6 e 7, texto da Sophie: marketing/esteira-degraus-4-7-copy.md.
  // O degrau 6 abre no dia 14 e o 7 no fim da noite 7: src/lib/rung-gates.ts
  // guarda essa ordem, porque as duas ofertas juntas comiam-se uma a outra.
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
  backend: {
    name: "The Recalibration",
    eyebrow: "Depois de 7 noites registadas",
    title: "A app calcula. Isto é alguém olhando",
    promise: "Alguém lê as noites que você registou e devolve, por escrito, a janela que os seus próprios dados pedem.",
    bullets: [
      "Você não envia nada. O seu sleep-log já está na conta, e é sobre ele que se trabalha.",
      "Uma pessoa passa noite a noite pelo seu registo. Não é o cálculo automático da app, esse você já tem e continua a ter.",
      "Você recebe um plano escrito para o seu caso: a janela recalculada, que hábito mudar primeiro e o que deixar de fazer à noite.",
      "Chega em até 7 dias úteis depois de nos pedir para começar, uma vez. Não é acompanhamento contínuo e não há assinatura nenhuma por trás.",
      "É educação sobre hábitos de sono, entregue por escrito. Não é diagnóstico, não é tratamento, não é aconselhamento médico e não substitui uma consulta.",
    ],
    medical:
      "Se dorme mal há mais de três meses, se toma medicação para dormir ou se tem outra condição de saúde, fale com o seu médico. Nada no plano é motivo para mudar ou parar medicação.",
    consent: {
      title: "Duas coisas para autorizar antes de comprar",
      logReading:
        "Autorizo que uma pessoa da Sleep Wired leia o meu registo de sono para preparar o meu plano. Sei que este registo diz respeito à minha saúde e posso retirar esta autorização a qualquer momento.",
      earlyStart:
        "Peço que comecem a trabalhar no meu plano já, antes de acabarem os 14 dias para anular. Sei que perco o direito de anular assim que o plano me for entregue.",
      earlyStartNote:
        "Opcional. Se deixar por marcar, compra na mesma: o trabalho começa ao dia 15, quando acabarem os seus 14 dias para anular.",
      blocked: "Marque a autorização acima e os preços aparecem. Ninguém lê o seu registo sem ela.",
      recorded: "Registada {when}",
      error: "Isto não ficou gravado. Verifique a ligação e marque outra vez.",
    },
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
    guarantee:
      "Tem 14 dias para anular a compra e ser reembolsado, sem dar motivo. Se nos pedir para começarmos antes disso, o direito de anular acaba no momento em que o plano lhe for entregue. Antes de começar olhamos para o seu registo: se não houver ali noites que cheguem para trabalhar, dizemos e devolvemos tudo sem ter começado. No nível com chamada, se anular depois de receber o plano e antes da chamada, devolvemos os 70 euros da chamada.",
  },
};

export default pt;
