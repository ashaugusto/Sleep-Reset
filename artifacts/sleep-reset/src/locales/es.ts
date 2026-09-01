import type { Dict } from "./types";

// ─── Español ─────────────────────────────────────────────────────────────────
// Traducido a mano desde en.ts. Se usa el usted, no el tú: quien lee es un
// desconocido con un problema médico que tiene que creernos.
// Sin raya larga y sin emoji, igual que en el original.

const es: Dict = {
  code: "es",
  name: "Español",
  htmlLang: "es",
  money: "{n} €",

  quiz: {
    eyebrow: "Test de sueño de 60 segundos",
    headline: "¿Por qué su cerebro le despierta a las 3 de la mañana?",
    sub: "Cinco preguntas. Sesenta segundos. Al final tiene su tipo de insomnio y el mecanismo exacto que lo produce.",
    cta: "Ver mi tipo de sueño",
    microcopy: "No hace falta ningún correo para ver su resultado.",
    promises: [
      "Cuál de los cuatro tipos de insomnio es el suyo",
      "El mecanismo que le mantiene despierto a su hora",
      "Lo primero que hay que cambiar, esta misma noche",
    ],
    stepLabel: "{n} / {total}",
    building: "Construyendo su resultado",
    back: "Atrás",
    noEmailNote: "Ningún correo para ver su resultado",
    analysisLabel: "Análisis",
    analyzing: [
      "Leyendo sus respuestas",
      "Comparándolas con los cuatro tipos de insomnio",
      "Su resultado está listo",
    ],
    privacy: "Sus respuestas son privadas. Nunca las vendemos ni las compartimos.",
    failTitle: "No hemos podido construir su resultado.",
    failBody: "Sus respuestas están guardadas. Un toque y lo intentamos otra vez.",
    retry: "Intentar de nuevo",

    questions: {
      main_problem: {
        prompt: "¿Cuál es su noche?",
        helper: "Elija la que le arruina más noches.",
        choices: {
          wake_3am: {
            label: "Me duermo bien y luego estoy despierto a las 3",
            feedback: "Es la respuesta más frecuente de este test.",
          },
          cant_fall_asleep: {
            label: "Paso horas tumbado antes de dormirme",
            feedback: "Su cerebro no quiere entregar el turno. Hay un motivo.",
          },
          both: {
            label: "Las dos. Me cuesta dormirme y luego me despierto",
            feedback: "Dos problemas y un solo mecanismo debajo. Llegaremos a él.",
          },
          light_all_night: {
            label: "Duermo, pero ligero y roto toda la noche",
            feedback: "Un sueño que nunca baja. Otra avería, la misma causa.",
          },
          irregular_schedule: {
            label: "Mi horario es un caos: turnos, viajes, noches tardías",
            feedback: "Su reloj interno se reescribe cada semana.",
          },
        },
      },
      night_mind: {
        prompt: "Cuando está despierto de noche, ¿qué hace su cerebro?",
        helper: "Sea honesto. Todo el mundo se reconoce en alguna.",
        choices: {
          racing: {
            label: "Se dispara. Trabajo, dinero, conversaciones en bucle",
            feedback: "No son pensamientos. Es un cerebro que se quedó de guardia.",
          },
          alert: {
            label: "Despierto y alerta, como si fuera mediodía",
            feedback: "Estar alerta a las 3 es una hormona haciendo mal su trabajo.",
          },
          clock_math: {
            label: "Miro el reloj y calculo las horas que me quedan",
            feedback: "Esa cuenta es la forma más rápida de seguir despierto.",
          },
          sleep_anxiety: {
            label: "Me preocupa no estar durmiendo",
            feedback: "Esforzarse más en dormir es justo lo que le mantiene despierto.",
          },
        },
      },
      severity: {
        prompt: "¿Con qué frecuencia le pasa?",
        helper: "A ojo. Nadie está contando.",
        choices: {
          nightly_chronic: {
            label: "Casi todas las noches, y desde hace años",
            feedback: "Años, no semanas. Esto ya es insomnio crónico.",
          },
          most_nights: {
            label: "Casi todas las noches de los últimos meses",
            feedback: "Pasados tres meses, deja de ser una mala racha.",
          },
          few_nights: {
            label: "Algunas noches por semana, a rachas",
            feedback: "A rachas sigue siendo todas las semanas. Cuenta.",
          },
          waves: {
            label: "Viene por olas. Semanas buenas y semanas terribles",
            feedback: "Las olas casi siempre siguen a algo. Lo encontraremos.",
          },
        },
      },
      tried: {
        prompt: "¿Qué ha probado ya?",
        helper: "Elija lo más lejos que haya llegado.",
        choices: {
          supplements: {
            label: "Melatonina, infusiones, magnesio",
            feedback: "La melatonina mueve la hora. No frena la hiperactivación.",
          },
          apps: {
            label: "Apps de sueño, meditación, ruido blanco",
            feedback: "Las apps calman la habitación. El problema no es la habitación.",
          },
          hygiene: {
            label: "Higiene del sueño: cuarto oscuro, sin pantallas, sin café",
            feedback: "La higiene del sueño previene el insomnio. No lo trata.",
          },
          prescription: {
            label: "Somníferos con receta",
            feedback: "Llegó hasta donde llega la medicina. Y sigue aquí.",
          },
          nothing: {
            label: "Sinceramente, nada serio todavía",
            feedback: "Entonces empieza antes de que se acumulen los años.",
          },
        },
      },
      day_impact: {
        prompt: "¿Qué le cuesta el día siguiente?",
        helper: "La parte que arreglaría primero.",
        choices: {
          no_energy: {
            label: "La energía. A las 10 ya estoy vacío",
            feedback: "El café deja de funcionar sobre la tercera mala semana.",
          },
          brain_fog: {
            label: "La concentración. Leo cuatro veces la misma línea",
            feedback: "Esa niebla es su cerebro haciendo mantenimiento en pleno día.",
          },
          bad_mood: {
            label: "La paciencia. Salto con la gente que quiero",
            feedback: "Los de alrededor lo notan antes que usted.",
          },
          dread: {
            label: "El temor. Desde la cena ya temo la hora de acostarme",
            feedback: "Temer la cama es el bucle alimentándose solo.",
          },
        },
      },
    },
  },

  result: {
    badge: "Su resultado",
    loading: "Abriendo su resultado",
    readoutLabel: "La versión corta",
    haveLabel: "Lo que tiene",
    nightLabel: "Lo que pasa de noche",
    firstLabel: "Lo primero que tiene que cambiar",
    fullReadLabel: "La versión larga",
    watchNext: "A continuación · Episodio {n} · {time}",
    cta: "Ver mi plan de 7 noches",
    ctaMicro: "Pago único · Devolución 30 días · Acceso inmediato",

    capture: {
      headline: "¿A dónde le enviamos su plan?",
      sub: "Su análisis completo de {type} y la Noche 1 del protocolo. Un correo. Nada más.",
      button: "Envíenme mi plan",
      sending: "Enviando",
      micro: "Sin spam. Un recordatorio como mucho. Baja en un clic.",
      placeholder: "usted@ejemplo.com",
      sentTitle: "Su plan va de camino.",
      sentBody: "Mire su bandeja de entrada en los próximos minutos.",
      invalidEmail: "Introduzca un correo válido.",
      saveError: "No se pudo guardar su correo. Inténtelo otra vez.",
      networkError: "Error de red. Inténtelo de nuevo.",
    },

    types: {
      maintenance: {
        title: "Usted es un Tipo Mantenimiento.",
        subtitle: "No le cuesta dormirse. Le cuesta seguir dormido, y ese es otro problema, con otra solución.",
        body: [
          "Esto es lo que le ocurre hacia las 3 de la mañana. El cortisol, la hormona que le saca de la cama por la mañana, no se enciende a la hora del despertador. Empieza a subir en la segunda mitad de la noche, horas antes de que le haga falta. En la mayoría de la gente ese pulso pasa por debajo del sueño y nadie lo nota. En usted aterriza como una alarma. Ojos abiertos. Del todo alerta. A la peor hora posible.",
          "Esa es la primera mitad. La segunda es lo que su cerebro ha aprendido a hacer con ella. Después de suficientes malas noches, despertarse deja de ser neutro y pasa a ser una amenaza, así que en cuanto está despierto su cerebro mira el reloj, hace la cuenta y se prepara para mañana. Eso es hiperactivación, y por eso esforzarse lo empeora. También por eso la melatonina, las apps y la higiene del sueño no le hicieron nada: están hechas para ayudarle a dormirse. Eso ya lo hace bien. Nadie le dio nunca nada para la mitad de las 3 de la mañana.",
        ],
        bridge: "Su plan apunta al despertar nocturno, no a la hora de acostarse.",
        label: "Tipo Mantenimiento",
        have: "Insomnio de mantenimiento. Empieza bien la noche y la pierde en la segunda mitad.",
        night: "Una subida de cortisol llega horas antes de tiempo y aterriza encima de su sueño en vez de pasar por debajo.",
        first: "Deje de trabajar la hora de acostarse. Lo que hay que reeducar es el despertar de las 3.",
        episodeTitle: "Por qué exactamente a las 3:07",
        planLede: "Cada noche del protocolo trabaja la segunda mitad de su noche. Es la mitad para la que no estaba hecho nada de lo que ha probado.",
      },
      onset: {
        title: "Usted es un Tipo Conciliación.",
        subtitle: "Su cuerpo está listo para dormir. Su cerebro se niega a entregar el turno.",
        body: [
          "Dormirse no es una decisión, es un relevo. Su sistema nervioso tiene que salir del modo alerta antes de que el sueño pueda empezar. El suyo no sale. En cuanto se apaga la luz y se acaban las distracciones, todo lo que el día dejó a medias toma la palabra: el trabajo, el dinero, la conversación que repasó a las seis de la tarde. Su cuerpo está agotado y su cerebro va a velocidad de mediodía. Es el estado de agotado pero acelerado, y es una condición física medible, no un rasgo de carácter.",
          "Lo que atrapa a la gente viene después. Cada hora que pasa despierto en la cama le enseña a su cerebro que la cama es el sitio donde uno se queda pensando. Haga eso unos cientos de noches y el dormitorio mismo se convierte en el disparador. Le entra sueño en el sofá y se despeja en el segundo en que se tumba. Por eso no sirve que le digan que se relaje, y por eso el esfuerzo se vuelve en contra. El sueño es lo único que se aleja cuanto más se persigue. Hay que abordarlo de lado.",
        ],
        bridge: "Su plan trabaja el relevo, no la fuerza de voluntad.",
        label: "Tipo Conciliación",
        have: "Insomnio de conciliación. El cuerpo está listo, el sistema nervioso no entrega el turno.",
        night: "El modo alerta no baja nunca: en cuanto la habitación se queda en silencio, todo lo pendiente toma la palabra.",
        first: "Deje de perseguir el sueño. El relevo se aborda de lado, nunca de frente.",
        episodeTitle: "El mecanismo",
        planLede: "Cada noche del protocolo trabaja el relevo, eso que un cuerpo hace solo y el suyo ha dejado de hacer a la orden.",
      },
      circadian: {
        title: "Usted es un Tipo Circadiano.",
        subtitle: "Su sueño no está roto. Lo está programando algo que no es su reloj interno.",
        body: [
          "Tiene un reloj interno que decide cuándo le entra sueño, y funciona con luz y rutina, no con lo cansado que esté. Los turnos, los viajes y las noches tardías reescriben ese reloj más rápido de lo que puede ajustarse. Así que deja de llegar a la misma hora cada noche. Usted se acuesta cuando lo dice la agenda y su cuerpo todavía no ha llegado, o pasó por ahí tres horas antes y se fue.",
          "Es el tipo que recibe los peores consejos, porque casi todos los productos de sueño dan por hecho un horario normal y le dicen que mantenga una hora fija de acostarse. Usted no puede. Lo que sí puede es anclar el reloj por el otro extremo: la hora de levantarse, la primera luz del día, la primera hora después. Esas son las señales que su cuerpo lee de verdad, y funcionan incluso cuando sus noches no se repiten.",
        ],
        bridge: "Su plan ancla las mañanas, porque sus noches se mueven.",
        label: "Tipo Circadiano",
        have: "Desajuste circadiano. El sueño en sí está bien. Lo que no está bien es el horario.",
        night: "Turnos, viajes y luz reescriben su reloj interno más rápido de lo que este puede fijarse en una hora.",
        first: "Deje de corregir la hora de acostarse. El reloj se ancla por la mañana.",
        episodeTitle: "Por qué no funcionó nada",
        planLede: "Cada noche del protocolo ancla el reloj por la mañana, porque sus noches se niegan a repetirse.",
      },
      mixed: {
        title: "Usted es un Tipo Mixto.",
        subtitle: "Dos problemas en la superficie. Un solo mecanismo debajo.",
        body: [
          "Le cuesta entrar en el sueño y le cuesta mantenerse, lo que parecen dos averías separadas pero normalmente no lo son. Es un sistema nervioso que nunca sale del todo del modo alerta. Le impide dormirse al principio de la noche y le despierta en el primer punto natural de subida unas horas después. La misma guardia, dos turnos.",
          "El Mixto es el tipo que hace que la gente abandone, porque arreglar una mitad parece empeorar la otra. Por fin se duerme más rápido y aun así está en pie a las 3. Eso no es un fracaso, es que el orden está mal. Cuando la activación de fondo baja, las dos mitades se mueven juntas, pero hay que hacerlo en secuencia, una antes de la otra, y esa es la parte que nadie le cuenta.",
        ],
        bridge: "Su plan avanza en orden, porque las dos mitades están conectadas.",
        label: "Tipo Mixto",
        have: "Insomnio mixto. Cuesta entrar en el sueño y cuesta mantenerse.",
        night: "Un solo sistema nervioso en alerta haciendo dos turnos: el principio de la noche y la primera vez que sube.",
        first: "Deje de tratar las dos mitades por separado. El orden decide si alguna de las dos se mueve.",
        episodeTitle: "El mecanismo",
        planLede: "El protocolo trata sus dos mitades en secuencia, primero la activación, porque es ese orden el que hace que se muevan las dos.",
      },
    },
  },

  plan: {
    eyebrow: "Su protocolo",
    title: "Siete noches, construidas alrededor de su {label}.",
    keyNight: "Para un {label}, la Noche {n} es la que lleva el cambio.",
    nightsLabel: "Qué hacen las siete noches",
    nights: [
      {
        title: "El punto de partida",
        body: "Mide la noche que tiene de verdad, no la que recuerda. Diez minutos, una sola vez.",
      },
      {
        title: "Quitar el esfuerzo",
        body: "La primera regla que baja la presión por dormir, que es justo la presión que le mantiene despierto.",
      },
      {
        title: "Una bajada que funciona en frío",
        body: "Una secuencia de doce minutos que funciona se sienta usted tranquilo o no al empezarla.",
      },
      {
        title: "La respuesta de las 3",
        body: "Qué hacer exactamente cuando está despierto a oscuras, incluido cuándo salir de la cama y cuándo no.",
      },
      {
        title: "Anclar el reloj",
        body: "La hora de levantarse y la primera hora de luz que sostienen el resto de la semana.",
      },
      {
        title: "Los pensamientos",
        body: "Qué hacer con el bucle nocturno, sin discutir con él y sin esperar a que pase.",
      },
      {
        title: "Conservarlo",
        body: "Cómo el protocolo se reduce a tres hábitos que mantiene sin pensar en ellos.",
      },
    ],
    includedLabel: "Qué recibe",
    included: [
      "El protocolo de 7 noches, una sesión por noche",
      "El audio guiado de cada sesión",
      "El diario de sueño y las curvas que muestran si se movió",
      "Acceso de por vida, con todas las actualizaciones futuras",
    ],
    bump: {
      label: "Complemento",
      title: "El Pack Recuperación",
      body: "Qué hacer después de una mala noche, una noche de viaje y una noche de turno, para que una noche rota no reinicie todo el proceso.",
      check: "Sí, añadir el Pack Recuperación por {price}",
      note: "Normalmente se vende por {price} al terminar. Añádalo aquí y va en el mismo pago.",
    },
    offerLabel: "La oferta",
    priceLine: "Un pago único de {price}. Sin suscripción, sin cargos recurrentes.",
    anchorLine: "Precio de beta abierta. Sube a {price} en el lanzamiento público.",
    guarantee: "Haga las siete noches. Si su sueño no ha cambiado, se le devuelve todo. 30 días.",
    cta: "Empezar esta noche por {price}",
    ctaBusy: "Abriendo el pago",
    ctaMicro: "Pago seguro con Hotmart. No hace falta cuenta para empezar.",
    checkoutError: "El pago no se abrió. Inténtelo de nuevo.",
    faqLabel: "Antes de decidir",
    faq: [
      {
        q: "¿Esto es higiene del sueño otra vez?",
        a: "No. La higiene del sueño previene el insomnio, no lo trata, y por eso a usted no le hizo nada. Esto es el protocolo conductual que se usa contra el insomnio crónico, reducido a siete noches que hace en casa.",
      },
      {
        q: "¿Y si a mí no me funciona?",
        a: "Entonces habrá hecho las siete noches y se le devuelve el dinero, hasta 30 días. La devolución no depende de que nos pongamos de acuerdo en el porqué.",
      },
      {
        q: "¿Necesito una cuenta?",
        a: "Para comprar no. Después del pago elige una contraseña en una sola pantalla y el protocolo se abre en el mismo dispositivo.",
      },
    ],
    backToResult: "Volver a mi resultado",
  },

  oto1: {
    eyebrow: "Añádalo antes de entrar",
    title: "La noche en que vuelve",
    body: [
      "Acaba de comprar siete noches. Y ya tiene la pregunta en la cabeza: qué pasa la primera noche en que el insomnio vuelva. Porque vuelve, una vez, casi siempre unas semanas después, y esa es la noche que decide si mantiene el método o deja de usarlo sin decir nada.",
      "El 3AM Relapse Kit es lo que pone en marcha esa noche. Un protocolo de veinte minutos para escuchar a oscuras, una tarjeta para los primeros noventa segundos y tres versiones cortas para las tres cosas que suelen provocar la recaída. Nada que leer y nada que resolver a las tres de la mañana.",
    ],
    includedLabel: "Qué incluye",
    included: [
      {
        title: "El protocolo de 20 minutos",
        body: "Audio guiado para la mitad de la noche, con los silencios dentro, para que le vayan diciendo qué hacer mientras lo hace, en vez de recordar una lista.",
      },
      {
        title: "La tarjeta de los primeros 90 segundos",
        body: "Una página. Impresa para el cajón de la mesilla y guardada en el móvil. Qué hacer antes de decidir nada sobre la noche.",
      },
      {
        title: "Tres versiones por detonante",
        body: "De cuatro a cinco minutos cada una, para las recaídas que ocurren de verdad: despertar con ansiedad, la noche después de beber y un horario que cambió.",
      },
      {
        title: "Suyo para siempre",
        body: "El mismo acceso de por vida que el protocolo. Se paga una vez, sin suscripción, y todas las actualizaciones van incluidas.",
      },
    ],
    notLabel: "Qué no es",
    not: "No es un segundo curso ni más teoría. Es la única noche que las siete noches no cubren, resuelta de antemano. Educación y acompañamiento, no atención médica.",
    priceLine: "Un pago único de {price}, sumado al pedido que acaba de hacer.",
    cta: "Sí, quiero añadir el Relapse Kit",
    decline: "No, gracias. Llévenme a mi protocolo",
    micro: "Un clic. No se vuelve a pedir la tarjeta.",
    guarantee: "Cubierto por la misma garantía de 30 días que el protocolo.",
  },

  // Peldaños 4 y 5, texto de Sophie: marketing/esteira-degraus-4-7-copy.md.
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
  // Degraus 6 e 7, texto da Sophie: marketing/esteira-degraus-4-7-copy.md.
  // O degrau 6 abre no dia 14 e o 7 no fim da noite 7: src/lib/rung-gates.ts
  // guarda essa ordem, porque as duas ofertas juntas comiam-se uma a outra.
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
  backend: {
    name: "The Recalibration",
    eyebrow: "Después de 7 noches registradas",
    title: "La app calcula. Esto es alguien mirando",
    promise: "Alguien lee las noches que usted registró y le devuelve por escrito la ventana que piden sus propios datos.",
    bullets: [
      "Usted no envía nada. Su registro de sueño ya está en la cuenta, y es sobre eso que se trabaja.",
      "Una persona recorre su registro noche por noche. No es el cálculo automático de la app, ese ya lo tiene y lo sigue teniendo.",
      "Recibe un plan escrito para su caso: la ventana recalculada, qué hábito cambiar primero y qué dejar de hacer por la noche.",
      "Llega en hasta 7 días hábiles después de pedirnos que empecemos, una vez. No es acompañamiento continuo y no hay ninguna suscripción detrás.",
      "Es educación sobre hábitos de sueño, entregada por escrito. No es un diagnóstico, no es un tratamiento, no es consejo médico y no sustituye una consulta.",
    ],
    medical:
      "Si duerme mal desde hace más de tres meses, si toma medicación para dormir o si tiene otra condición de salud, hable con su médico. Nada del plan es motivo para cambiar o dejar una medicación.",
    consent: {
      title: "Dos cosas que autorizar antes de comprar",
      logReading:
        "Autorizo a que una persona de Sleep Wired lea mi registro de sueño para preparar mi plan. Sé que este registro se refiere a mi salud y puedo retirar esta autorización en cualquier momento.",
      earlyStart:
        "Pido que empiecen a trabajar en mi plan ahora, antes de que terminen los 14 días para anular. Sé que pierdo el derecho a anular en cuanto se me entregue el plan.",
      earlyStartNote:
        "Opcional. Si la deja sin marcar, compra igual: el trabajo empieza el día 15, cuando terminen sus 14 días para anular.",
      blocked: "Marque la autorización de arriba y aparecerán los precios. Nadie lee su registro sin ella.",
      recorded: "Registrada {when}",
      error: "Esto no se guardó. Compruebe su conexión y márquelo otra vez.",
    },
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
        extra: "Treinta minutos por llamada, fijados después de que usted lea el plan, para las preguntas que solo aparecen al leer.",
        cta: "Quiero el plan y la llamada por {price}",
      },
    ],
    guarantee:
      "Tiene 14 días para anular la compra y recuperar su dinero, sin dar motivo. Si nos pide empezar antes, su derecho a anular termina en el momento en que se le entrega el plan. Antes de empezar miramos su registro: si no hay noches suficientes para trabajar, se lo decimos y le devolvemos todo sin haber empezado. En el nivel con llamada, si anula después del plan y antes de la llamada, le devolvemos los 70 euros de la llamada.",
  },
};

export default es;
