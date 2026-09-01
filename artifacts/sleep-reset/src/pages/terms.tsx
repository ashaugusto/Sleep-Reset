import { useLocation } from "wouter";
import { Moon, ArrowLeft } from "lucide-react";
import { useTerms } from "@/locales/legal";

// ─── Terms of Service ────────────────────────────────────────────────────────
// The words are not here. They are in src/locales/legal/terms.{en,fr,es,pt}.ts,
// one file per language, and this page is only the frame around whichever one
// the visitor's locale picks.
//
// They moved out of this file in FLU-243. English-only terms were survivable
// while the whole product was a 27 EUR download; they stopped being survivable
// the day a human service at 149 EUR started reading health data, because
// dir. 93/13 wants contract terms in clear and intelligible language and a
// French buyer reading English is not that. Same locale resolution as the rest
// of the funnel: ?lang=, then storage, then the browser.
//
// The renderer understands a blank line as a paragraph and **bold**, which is
// all the terms use. Anything fancier belongs in the copy, not in here.

export default function Terms() {
  const [, setLocation] = useLocation();
  const t = useTerms();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="flex items-center gap-3 px-5 py-4 max-w-2xl mx-auto border-b border-border/40">
        <button
          onClick={() => history.back()}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
          <Moon className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Sleep Wired</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">{t.heading}</h1>
          <p className="text-xs text-muted-foreground">{t.updated}</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{t.intro}</p>

        {t.sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h2 className="text-base font-bold text-foreground">{section.title}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              {section.content.split("\n\n").map((para, i) => (
                <p key={i} dangerouslySetInnerHTML={{
                  __html: para
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                    .replace(/\n/g, "<br/>"),
                }} />
              ))}
            </div>
          </div>
        ))}

        <div className="border-t border-border/40 pt-6">
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-primary hover:underline"
          >
            {t.back}
          </button>
        </div>
      </main>
    </div>
  );
}
