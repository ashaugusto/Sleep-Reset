import { consentText, isConsentLocale, type ConsentLocale } from "./lib/consent-texts";

// ─── The confirmation email for the seventh rung ─────────────────────────────
// This exists because of one line in dir. 2011/83/UE art. 8(7): what the buyer
// agreed to has to reach them on a durable medium, and a screen is not one. So
// the two boxes ticked on the offer page are repeated here, in the language
// they were ticked in, with the date and time each one was recorded, and the
// unticked ones are repeated too. An email that only lists what was agreed
// reads like a receipt; one that also says "you did not tick this, so we start
// on day 15" is the thing that stops a support argument in February.
//
// It is the only rung with an email of its own. Hotmart mails its receipt for
// every sale, and the platform purchase starts the onboarding sequence, but
// neither of those can carry a consent record: Hotmart does not know about the
// boxes and the sequence is not sent to this buyer.
//
// The copy below is the email's own. The two consent sentences are not: they
// come from lib/consent-texts.ts, the same words that were stored, because a
// confirmation that paraphrases what you agreed to confirms nothing.

export type RecalibrationTier = "backend" | "backendLive";

export interface ConsentRecord {
  granted: boolean;
  /** When it was ticked. Null if it never was. */
  at: Date | null;
}

export interface RecalibrationCtx {
  firstName: string;
  locale: string;
  tier: RecalibrationTier;
  earlyStart: ConsentRecord;
  logReading: ConsentRecord;
}

interface Copy {
  subject: string;
  heading: string;
  hello: string;
  bought: string;
  boughtLive: string;
  nextTitle: string;
  next: string;
  nextEarly: string;
  nextDay15: string;
  agreedTitle: string;
  ticked: string;
  notTicked: string;
  recordedAt: string;
  notTickedEarly: string;
  notTickedReading: string;
  withdraw: string;
  cancelTitle: string;
  cancel: string;
  medical: string;
  footer: string;
}

const COPY: Record<ConsentLocale, Copy> = {
  en: {
    subject: "Your Recalibration, and what you agreed to",
    heading: "Your Recalibration is booked",
    hello: "Hello {name},",
    bought: "You bought The Recalibration: one person reads your sleep log and writes back a plan for your case, once, in up to 7 working days.",
    boughtLive: "You bought The Recalibration Live: the same written plan, plus thirty minutes on a call, booked after you have read it.",
    nextTitle: "What happens next",
    next: "There is nothing for you to send. Your log is already here, and that is what gets read.",
    nextEarly: "You asked us to start straight away, so your plan is in the next batch.",
    nextDay15: "You did not ask us to start early, so work begins on day 15, once your 14 day cancellation period has run out. If you change your mind and want it sooner, reply to this email.",
    agreedTitle: "What you agreed to on the offer page",
    ticked: "Ticked",
    notTicked: "Not ticked",
    recordedAt: "Recorded {when}",
    notTickedEarly: "You did not ask for an early start. Your right to cancel is untouched for the full 14 days.",
    notTickedReading: "You have not given permission for anyone to read your log. We cannot write your plan without it, and we have not read anything. Reply to this email and we will either send you the box again or refund you in full.",
    withdraw: "You can withdraw either of these at any time. Reply to this email or write to privacy@sleepwired.com.",
    cancelTitle: "Cancelling",
    cancel: "You have 14 days to cancel and get your money back, without giving a reason. If you asked us to start early, that right ends the moment your plan is delivered. On the tier with the call, cancelling after the plan and before the call refunds the 70 euros for the call. Write to support@sleepwired.com.",
    medical: "This is sleep education, in writing. It is not a diagnosis, it is not treatment, it is not medical advice, and it does not replace seeing a doctor. Nothing in your plan is a reason to change or stop any medication.",
    footer: "Sleep Wired",
  },
  pt: {
    subject: "A sua Recalibration, e o que autorizou",
    heading: "A sua Recalibration está marcada",
    hello: "Olá {name},",
    bought: "Comprou The Recalibration: uma pessoa lê o seu registo de sono e devolve, por escrito, um plano para o seu caso, uma vez, em até 7 dias úteis.",
    boughtLive: "Comprou The Recalibration Live: o mesmo plano escrito, mais trinta minutos de chamada, marcados depois de o ler.",
    nextTitle: "O que acontece a seguir",
    next: "Não tem nada para enviar. O seu registo já está aqui, e é ele que vai ser lido.",
    nextEarly: "Pediu para começarmos já, por isso o seu plano entra no próximo lote.",
    nextDay15: "Não pediu para começarmos antes, por isso o trabalho começa ao dia 15, quando acabarem os seus 14 dias para anular. Se mudar de ideias e quiser mais cedo, responda a este email.",
    agreedTitle: "O que autorizou na página da oferta",
    ticked: "Marcada",
    notTicked: "Não marcada",
    recordedAt: "Registada {when}",
    notTickedEarly: "Não pediu início antecipado. O seu direito de anular fica intacto durante os 14 dias inteiros.",
    notTickedReading: "Não autorizou ninguém a ler o seu registo. Sem isso não podemos escrever o seu plano, e não lemos nada. Responda a este email e ou lhe enviamos a caixa outra vez ou devolvemos todo o dinheiro.",
    withdraw: "Pode retirar qualquer uma destas autorizações a qualquer momento. Responda a este email ou escreva para privacy@sleepwired.com.",
    cancelTitle: "Anular",
    cancel: "Tem 14 dias para anular e ser reembolsado, sem dar motivo. Se pediu para começarmos antes, esse direito acaba no momento em que o plano lhe for entregue. No nível com chamada, anular depois do plano e antes da chamada devolve os 70 euros da chamada. Escreva para support@sleepwired.com.",
    medical: "Isto é educação sobre hábitos de sono, entregue por escrito. Não é diagnóstico, não é tratamento, não é aconselhamento médico e não substitui uma consulta. Nada no seu plano é motivo para mudar ou parar medicação.",
    footer: "Sleep Wired",
  },
  fr: {
    subject: "Votre Recalibration, et ce que vous avez accepté",
    heading: "Votre Recalibration est enregistrée",
    hello: "Bonjour {name},",
    bought: "Vous avez acheté The Recalibration : une personne lit votre journal de sommeil et vous renvoie par écrit un plan pour votre cas, une fois, en 7 jours ouvrés au plus.",
    boughtLive: "Vous avez acheté The Recalibration Live : le même plan écrit, et trente minutes au téléphone, fixées après votre lecture.",
    nextTitle: "La suite",
    next: "Vous n'avez rien à envoyer. Votre journal est déjà là, et c'est lui qui sera lu.",
    nextEarly: "Vous avez demandé que le travail commence tout de suite, votre plan part donc dans le prochain lot.",
    nextDay15: "Vous n'avez pas demandé de démarrage anticipé, le travail commence donc au jour 15, à la fin de votre délai de rétractation de 14 jours. Si vous changez d'avis et le voulez plus tôt, répondez à cet email.",
    agreedTitle: "Ce que vous avez accepté sur la page de l'offre",
    ticked: "Cochée",
    notTicked: "Non cochée",
    recordedAt: "Enregistrée {when}",
    notTickedEarly: "Vous n'avez pas demandé de démarrage anticipé. Votre droit de rétractation reste entier pendant les 14 jours.",
    notTickedReading: "Vous n'avez autorisé personne à lire votre journal. Sans cela nous ne pouvons pas écrire votre plan, et nous n'avons rien lu. Répondez à cet email et nous vous renverrons la case ou nous vous rembourserons entièrement.",
    withdraw: "Vous pouvez retirer l'une ou l'autre de ces autorisations à tout moment. Répondez à cet email ou écrivez à privacy@sleepwired.com.",
    cancelTitle: "Annuler",
    cancel: "Vous avez 14 jours pour annuler et être remboursé, sans avoir à vous justifier. Si vous nous avez demandé de commencer avant, ce droit prend fin au moment où le plan vous est remis. Au niveau avec l'appel, annuler après le plan et avant l'appel vous rembourse les 70 euros de l'appel. Écrivez à support@sleepwired.com.",
    medical: "Ceci est de l'éducation sur les habitudes de sommeil, remise par écrit. Ce n'est pas un diagnostic, pas un traitement, pas un avis médical, et cela ne remplace pas une consultation. Rien dans votre plan n'est une raison de modifier ou d'arrêter un traitement.",
    footer: "Sleep Wired",
  },
  es: {
    subject: "Su Recalibration, y lo que autorizó",
    heading: "Su Recalibration está reservada",
    hello: "Hola {name}:",
    bought: "Compró The Recalibration: una persona lee su registro de sueño y le devuelve por escrito un plan para su caso, una vez, en hasta 7 días hábiles.",
    boughtLive: "Compró The Recalibration Live: el mismo plan escrito, y treinta minutos por llamada, fijados después de que lo lea.",
    nextTitle: "Qué pasa ahora",
    next: "No tiene nada que enviar. Su registro ya está aquí, y es lo que se va a leer.",
    nextEarly: "Nos pidió empezar de inmediato, así que su plan entra en el próximo lote.",
    nextDay15: "No nos pidió empezar antes, así que el trabajo comienza el día 15, cuando terminen sus 14 días para anular. Si cambia de idea y lo quiere antes, responda a este correo.",
    agreedTitle: "Lo que autorizó en la página de la oferta",
    ticked: "Marcada",
    notTicked: "Sin marcar",
    recordedAt: "Registrada {when}",
    notTickedEarly: "No pidió inicio anticipado. Su derecho a anular queda intacto durante los 14 días completos.",
    notTickedReading: "No autorizó a nadie a leer su registro. Sin eso no podemos escribir su plan, y no hemos leído nada. Responda a este correo y le enviaremos la casilla otra vez o le devolveremos todo el dinero.",
    withdraw: "Puede retirar cualquiera de estas autorizaciones en cualquier momento. Responda a este correo o escriba a privacy@sleepwired.com.",
    cancelTitle: "Anular",
    cancel: "Tiene 14 días para anular y recuperar su dinero, sin dar motivo. Si nos pidió empezar antes, ese derecho termina en el momento en que se le entrega el plan. En el nivel con llamada, anular después del plan y antes de la llamada le devuelve los 70 euros de la llamada. Escriba a support@sleepwired.com.",
    medical: "Esto es educación sobre hábitos de sueño, entregada por escrito. No es un diagnóstico, no es un tratamiento, no es consejo médico y no sustituye una consulta. Nada de su plan es motivo para cambiar o dejar una medicación.",
    footer: "Sleep Wired",
  },
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** "1 September 2026 at 14:32 UTC", in the buyer's language. UTC so it never lies. */
function stamp(at: Date, locale: ConsentLocale): string {
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
  }).format(at);
  return `${date} UTC`;
}

function box(args: { statement: string; record: ConsentRecord; copy: Copy; locale: ConsentLocale; missing: string }): string {
  const { statement, record, copy, locale, missing } = args;
  const badge = record.granted ? copy.ticked : copy.notTicked;
  const colour = record.granted ? "#3fb950" : "#8b949e";
  const when = record.granted && record.at ? copy.recordedAt.replace("{when}", stamp(record.at, locale)) : missing;
  return `
          <tr>
            <td style="padding:0 0 16px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#161b22;border:1px solid #30363d;border-radius:8px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${colour};">${esc(badge)}</p>
                    <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#e6edf3;">${esc(statement)}</p>
                    <p style="margin:0;font-size:11px;line-height:1.6;color:#8b949e;">${esc(when)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

export function getRecalibrationConfirmationEmail(ctx: RecalibrationCtx): { subject: string; html: string } {
  const locale: ConsentLocale = isConsentLocale(ctx.locale) ? ctx.locale : "en";
  const c = COPY[locale];
  const live = ctx.tier === "backendLive";

  const para = (text: string, size = 14) =>
    `<p style="margin:0 0 16px 0;font-size:${size}px;line-height:1.7;color:#c9d1d9;">${esc(text)}</p>`;
  const title = (text: string) =>
    `<p style="margin:24px 0 12px 0;font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#8b949e;">${esc(text)}</p>`;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(c.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:'Inter',Arial,sans-serif;color:#e6edf3;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-weight:700;font-size:15px;color:#e6edf3;letter-spacing:-0.3px;">Sleep Wired</span>
            </td>
          </tr>
          <tr>
            <td>
              <h1 style="margin:0 0 20px 0;font-size:22px;line-height:1.35;color:#e6edf3;font-weight:700;">${esc(c.heading)}</h1>
              ${para(c.hello.replace("{name}", ctx.firstName))}
              ${para(live ? c.boughtLive : c.bought)}
              ${title(c.nextTitle)}
              ${para(c.next, 13)}
              ${para(ctx.earlyStart.granted ? c.nextEarly : c.nextDay15, 13)}
              ${title(c.agreedTitle)}
            </td>
          </tr>
${box({ statement: consentText("backend_log_reading", locale), record: ctx.logReading, copy: c, locale, missing: c.notTickedReading })}
${box({ statement: consentText("backend_early_start", locale), record: ctx.earlyStart, copy: c, locale, missing: c.notTickedEarly })}
          <tr>
            <td>
              ${para(c.withdraw, 12)}
              ${title(c.cancelTitle)}
              ${para(c.cancel, 12)}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #21262d;padding-top:20px;">
              <p style="margin:0 0 10px 0;font-size:11px;line-height:1.7;color:#8b949e;">${esc(c.medical)}</p>
              <p style="margin:0;font-size:11px;color:#484f58;">${esc(c.footer)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: c.subject, html };
}
