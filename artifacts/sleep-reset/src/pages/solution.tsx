import { Moon, CheckCircle2, Star, Shield, Truck, MessageCircle, AlertTriangle, Package, Clock, Zap } from "lucide-react";
import { useState, useEffect } from "react";

// ─── Config ───────────────────────────────────────
const BRAND = "Sleep Rewire";
const PRODUCT = "SleepCalm — Suplemento Natural do Sono";
const CURRENCY = "€";
const PRICE = 10;
const WHATSAPP_NUMBER = "353000000000"; // substitua pelo número real (sem + ou espaços)
const WHATSAPP_MESSAGE = encodeURIComponent(
  `Olá! Quero encomendar o ${PRODUCT} por ${CURRENCY}${PRICE}. Entrega em Dublin. 🌙`
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

// ─── Countdown ────────────────────────────────────
function useMidnightCountdown() {
  function getSecondsLeft() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  }
  const [seconds, setSeconds] = useState(getSecondsLeft);
  useEffect(() => {
    const id = setInterval(() => setSeconds(getSecondsLeft()), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return { h, m, s, expired: seconds === 0 };
}

// ─── Layout helpers ───────────────────────────────
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`max-w-lg mx-auto px-5 ${className}`}>{children}</section>;
}
function Divider() {
  return <div className="border-t border-border/30 my-1" />;
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">{children}</p>;
}

// ─── Warning banner ───────────────────────────────
function WarningBanner() {
  const { expired } = useMidnightCountdown();
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IE", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="bg-yellow-400 text-gray-900 text-center py-3 px-4">
      <p className="text-sm font-extrabold leading-snug">
        <AlertTriangle className="inline w-4 h-4 mr-1.5 -mt-0.5" />
        {expired
          ? `⚠️ AVISO: Esta oferta expirou. Verifique disponibilidade no WhatsApp.`
          : `⚠️ AVISO: Stock limitado disponível. Esta página pode ser removida a meia-noite de ${dateStr}.`}
      </p>
    </div>
  );
}

// ─── Countdown block ──────────────────────────────
function CountdownTimer() {
  const { h, m, s, expired } = useMidnightCountdown();
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-center">
      <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">
        {expired ? "Oferta pode ter expirado — contacte-nos no WhatsApp" : "⚡ Preço especial expira à meia-noite"}
      </p>
      <div className="flex items-center justify-center gap-3">
        {[{ label: "HRS", val: h }, { label: "MIN", val: m }, { label: "SEC", val: s }].map(({ label, val }) => (
          <div key={label} className="text-center">
            <div className="bg-background border border-border rounded-xl w-16 py-2">
              <span className="text-2xl font-extrabold tabular-nums text-foreground">{val}</span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CTA Button → WhatsApp ────────────────────────
function WhatsAppButton({ size = "default" }: { size?: "default" | "large" }) {
  function handleClick() {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  }
  if (size === "large") {
    return (
      <div className="text-center">
        <button
          onClick={handleClick}
          className="inline-flex items-center justify-center gap-3 w-full max-w-sm bg-[#25D366] text-white font-extrabold text-lg py-5 px-8 rounded-2xl shadow-[0_0_40px_rgba(37,211,102,0.4)] hover:shadow-[0_0_60px_rgba(37,211,102,0.6)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 cursor-pointer"
        >
          <MessageCircle className="w-6 h-6" />
          Encomendar pelo WhatsApp →
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          1 unidade · {CURRENCY}{PRICE} · Entrega grátis em Dublin
        </p>
      </div>
    );
  }
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-extrabold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(37,211,102,0.35)] hover:shadow-[0_0_50px_rgba(37,211,102,0.55)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
    >
      <MessageCircle className="w-5 h-5" />
      Quero encomendar agora →
    </button>
  );
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────
export default function Solution() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      <WarningBanner />

      {/* ── Nav ── */}
      <header className="flex items-center justify-between px-5 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          <span className="font-bold text-base tracking-tight">{BRAND}</span>
        </div>
        <button
          onClick={() => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer")}
          className="flex items-center gap-1.5 text-xs text-[#25D366] hover:text-[#1ebe5a] transition-colors font-semibold"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
      </header>

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
      <Section className="pt-4 pb-8 text-center">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Star className="w-3 h-3 fill-current" />
          Fórmula natural · Sem dependência · Entrega grátis em Dublin
        </div>

        <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3">
          Finalmente uma solução natural para dormir melhor
        </p>

        <h1 className="text-[2rem] font-extrabold leading-[1.15] mb-5">
          Durma Profundamente Todas as Noites —{" "}
          <span className="text-primary">Sem Prescrição Médica.</span>
        </h1>

        <p className="text-muted-foreground text-base leading-relaxed mb-7">
          O <strong className="text-foreground">SleepCalm</strong> é um suplemento natural desenvolvido para quem sofre de ansiedade nocturna, pensamentos acelerados e dificuldade em adormecer. Ingredientes clinicamente estudados. Sem efeitos secundários. Sem habituação.
        </p>

        {/* ── Delivery badge ── */}
        <div className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-4 mb-7">
          <Truck className="w-5 h-5 text-[#25D366] shrink-0" />
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Entrega Grátis em Dublin</p>
            <p className="text-xs text-muted-foreground">Enviamos para toda a cidade · Rápido e discreto</p>
          </div>
        </div>

        <WhatsAppButton size="large" />
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          3 SCENARIOS (familiar)
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Reconhece-se nisto?</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-8 leading-snug">
          Toda a noite, um destes{" "}
          <span className="text-primary">3 cenários</span> acontece a quem dorme mal:
        </h2>

        {[
          {
            emoji: "😤",
            title: "Cenário #1 — O cérebro não para",
            desc: "Está exausto. Deita-se. Mas a mente liga-se como uma máquina — preocupações, conversas antigas, problemas de amanhã. O peito aperta. O coração não abranda. Quanto mais tenta forçar o sono, mais acordado fica. O relógio marca as 3 da manhã.",
            bad: true,
          },
          {
            emoji: "😰",
            title: "Cenário #2 — Acorda a meio da noite",
            desc: "Adormece depressa — mas acorda às 3 da manhã com um salto de ansiedade. A mente começa imediatamente a acelerar. Fica deitado a olhar para o tecto. Quando finalmente consegue adormecer, é quase hora de levantar. Todas. As. Noites.",
            bad: true,
          },
          {
            emoji: "😴",
            title: "Cenário #3 — Adormece e fica a dormir",
            desc: "Está na cama, calmo. O ciclo ansioso não começa. O sono vem em 15 minutos. Dorme a noite toda. Acorda antes do despertador — genuinamente descansado. É isto que o SleepCalm ajuda o seu corpo a fazer de forma natural.",
            bad: false,
          },
        ].map((s) => (
          <div
            key={s.title}
            className={`border rounded-2xl p-5 mb-4 ${
              s.bad
                ? "border-border/50 bg-card/40"
                : "border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(139,92,246,0.12)]"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{s.emoji}</span>
              <p className={`text-xs font-bold uppercase tracking-widest ${s.bad ? "text-muted-foreground" : "text-primary"}`}>
                {s.title}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            {!s.bad && (
              <p className="text-xs font-semibold text-primary mt-3">
                ← Isto é possível. O SleepCalm prepara o seu corpo para isso.
              </p>
            )}
          </div>
        ))}
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          PRODUCT DETAILS
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>O que está dentro</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          Ingredientes Naturais,{" "}
          <span className="text-primary">Resultados Reais</span>
        </h2>

        <div className="space-y-3 mb-6">
          {[
            { name: "Valeriana", desc: "Reduz o tempo para adormecer e melhora a qualidade do sono profundo" },
            { name: "Melatonina (baixa dose)", desc: "Regula o ciclo circadiano de forma suave, sem criar dependência" },
            { name: "Magnésio Bisglicinato", desc: "Relaxa o sistema muscular e nervoso, combate o cortisol nocturno" },
            { name: "L-Teanina", desc: "Promove calma mental sem sedação — ideal para ansiedade nocturna" },
            { name: "Extracto de Maracujá", desc: "Reduz pensamentos acelerados e facilita a transição para o sono" },
          ].map((item) => (
            <div key={item.name} className="flex items-start gap-3 p-3.5 bg-card/50 border border-border/40 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-foreground">{item.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>100% natural, sem glúten, sem lactose.</strong> Fabricado dentro das normas GMP (Good Manufacturing Practice). Adequado para uso continuado sem risco de habituação ou dependência.
          </p>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          BENEFITS LIST
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Para quem é?</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          Este Suplemento É Para Si Se…
        </h2>
        <div className="space-y-3 mb-6">
          {[
            "A mente acelera assim que tenta adormecer, mesmo estando esgotado",
            "A ansiedade ou o stress são a principal razão por não conseguir dormir",
            "Acorda a meio da noite com preocupações e não consegue voltar a adormecer",
            "Sente-se cansado durante o dia mesmo depois de horas na cama",
            "Já experimentou melatonina isolada ou apps de meditação — sem resultado",
            "Quer uma solução natural sem receita, sem efeitos secundários, sem riscos",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 p-3.5 bg-card/50 border border-border/40 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          SOCIAL PROOF
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>O que dizem os clientes</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          Pessoas Reais,{" "}
          <span className="text-primary">Resultados Reais</span>
        </h2>

        <div className="space-y-4">
          {[
            {
              name: "Ana R.",
              location: "Dublin 4",
              text: "Há meses que não dormia mais de 4 horas seguidas. Na segunda noite a tomar o SleepCalm já estava a dormir 6 horas. Continuei e agora durmo a noite toda. Mudou a minha vida.",
              stars: 5,
            },
            {
              name: "Miguel S.",
              location: "Dublin 2",
              text: "Estava céptico, mas depois de 3 semanas com outros suplementos sem resultado, decidi experimentar. A diferença foi imediata — adormeço mais depressa e já não acordo às 3 da manhã.",
              stars: 5,
            },
            {
              name: "Carla M.",
              location: "Dublin 8",
              text: "Finalmente um produto que funciona sem me deixar zonza de manhã. Sinto-me descansada a acordar pela primeira vez em anos. E a entrega foi super rápida!",
              stars: 5,
            },
          ].map((r) => (
            <div key={r.name} className="bg-card border border-border/50 rounded-2xl p-5">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3 italic">"{r.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{r.name[0]}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          ORDER BOX
      ════════════════════════════════════ */}
      <Section className="py-8" id="order">
        <div className="bg-card border-2 border-primary/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.15)]">

          {/* Header */}
          <div className="bg-primary px-5 py-4 text-center">
            <p className="text-sm font-extrabold text-primary-foreground uppercase tracking-wider">
              Encomendar agora — via WhatsApp
            </p>
          </div>

          {/* Price block */}
          <div className="px-5 pt-6 pb-5 border-b border-border/50 text-center">
            <p className="text-6xl font-extrabold text-foreground leading-none mb-2">
              {CURRENCY}<span className="text-primary">{PRICE}</span>
            </p>
            <p className="text-sm font-bold text-foreground mb-4">
              1 embalagem · Pagamento na entrega disponível
            </p>

            <div className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 rounded-full px-4 py-1.5 mb-2">
              <Truck className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="text-xs font-extrabold text-[#25D366] uppercase tracking-wider">
                Entrega grátis em Dublin
              </span>
            </div>
          </div>

          {/* What's included */}
          <div className="px-5 py-5 border-b border-border/50 space-y-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              ✅ Ao encomendar recebe:
            </p>
            {[
              { icon: Package, label: "1 embalagem SleepCalm (30 cápsulas — 1 mês de uso)" },
              { icon: Truck, label: "Entrega grátis em Dublin — rápida e discreta" },
              { icon: Clock, label: "Suporte via WhatsApp — resposta em menos de 1 hora" },
              { icon: Shield, label: "Garantia de satisfação — se não funcionar, devolvemos" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-5 py-6 space-y-3">
            <WhatsAppButton />
            <div className="flex items-center justify-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                100% natural
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="w-3 h-3" />
                Entrega grátis Dublin
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                Resposta rápida
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/70 text-center">
              Sem subscrição · Sem compromisso · Pague apenas o que encomendou
            </p>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          COUNTDOWN
      ════════════════════════════════════ */}
      <Section className="py-8">
        <CountdownTimer />
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          FAQ
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Perguntas frequentes</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          Tem Dúvidas?
        </h2>

        <div className="space-y-3">
          {[
            {
              q: "Como funciona o processo de encomenda?",
              a: "É simples: clique no botão de WhatsApp, envie-nos uma mensagem e nós confirmamos a sua encomenda. Combinamos a entrega em Dublin e pode pagar por transferência ou na entrega.",
            },
            {
              q: "Quanto tempo demora a entrega em Dublin?",
              a: "Entregamos normalmente no mesmo dia ou no dia seguinte, dependendo da sua localização em Dublin. A entrega é totalmente grátis.",
            },
            {
              q: "É seguro? Tem efeitos secundários?",
              a: "O SleepCalm é 100% natural e fabricado com ingredientes clinicamente estudados. Não cria dependência e não causa sonolência residual de manhã. Como com qualquer suplemento, consulte o seu médico se estiver grávida ou a tomar medicação.",
            },
            {
              q: "E se não funcionar?",
              a: "Temos uma garantia de satisfação. Se não ficar satisfeito com os resultados após 2 semanas de uso, contacte-nos pelo WhatsApp e resolvemos.",
            },
            {
              q: "Posso encomendar mais do que uma embalagem?",
              a: "Claro! Muitos clientes encomendam 2 ou 3 unidades para ter stock. Fale connosco pelo WhatsApp e combinamos.",
            },
          ].map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </Section>

      {/* ════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════ */}
      <Section className="py-10 text-center">
        <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-4">
          Não deixe para outra noite
        </p>
        <h2 className="text-2xl font-extrabold mb-4 leading-snug">
          Esta noite pode ser{" "}
          <span className="text-primary">a última noite</span> a dormir mal.
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-7">
          Por apenas {CURRENCY}{PRICE} com entrega grátis em Dublin — comece já a dormir melhor.
        </p>
        <WhatsAppButton size="large" />
      </Section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-8 mt-4">
        <div className="max-w-lg mx-auto px-5 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{BRAND}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Suplemento alimentar. Não substitui tratamento médico. Mantenha fora do alcance de crianças.
          </p>
          <p className="text-xs text-muted-foreground">
            Para encomendas e suporte:{" "}
            <button
              onClick={() => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer")}
              className="text-[#25D366] hover:underline font-semibold"
            >
              WhatsApp
            </button>
          </p>
        </div>
      </footer>

    </div>
  );
}

// ─── FAQ accordion item ────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-card/80 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <span className="text-primary text-lg font-bold shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}
