# Sleep Wired v6 — Ready for review

**Date:** 2026-05-16
**Status:** Estrutura pronta. Tudo PAUSED. Aguardando review do Ash → produção dos 5 vídeos → ativação.

---

## 1. O que foi feito

### Code + deploy (já em prod em `https://sleepwired.com`)

| Mudança | Onde | Commit |
|---|---|---|
| Brand "Sleep Rewire" → "Sleep Wired" em todo o funil | `landing.tsx`, `purchase.tsx`, `index.html`, `manifest.json` | `cef6f7e` |
| 4 variantes de hero via `?h=` query param (hyperarousal, melatonin, wake3am, default) com persistência em `sessionStorage` e `dataLayer.push` de `hero_variant` | `landing.tsx` | `cef6f7e` |
| Backend `/api/checkout/public` aceita `hero_variant`, `fbp`, `fbc` e propaga pra Stripe Session metadata | `api-server/routes/payments.ts` | `db23fc7` |
| Frontend lê `sessionStorage` + cookies `_fbp`/`_fbc` e envia no POST | `landing.tsx` (OrderForm.handleSubmit) | `db23fc7` |
| Push da deadline de **May 24 → June 30** em copy, FAQ e meta tags (8 dias de runway anti-vendiam) | `landing.tsx`, `index.html` | `cef6f7e` + `db23fc7` |
| Remover `/solution` zumbi do router (redirect → `/`) | `App.tsx`, deletado `solution.tsx` | `cef6f7e` |
| Apagar `landing.dark.tsx` órfão (untracked, A/B nunca conectado) | filesystem | `cef6f7e` |
| `.gitignore`: excluir `.env*` (não estava — secrets ficavam vulneráveis ao `git add .`) | `.gitignore` | `cef6f7e` |
| `APP_URL` do systemd: `sleep.fluyon.ch → sleepwired.com` (atribuição pixel cross-domain quebrada antes) | `/etc/systemd/system/sleep-reset-api.service` | **não-git, server config** |
| Re-scrape Meta forçado (OG agora reflete "June 30") | Graph API | `updated_time 2026-05-16T09:35:38Z` |

### Validação live

- ✅ `curl https://sleepwired.com/` retorna "Sleep Wired" + "Cognitive Shutdown" + "June 30" (4 ocorrências, 0 "May 24")
- ✅ `curl /api/checkout/public` cria Stripe Session válida (smoke test OK com email fake + hero_variant=hyperarousal)
- ✅ Bundle JS contém `hero_variant` e `sw_hero_variant`
- ✅ Pixel SLEEP-2 (`1277058757910786`) confirmado no index.html servido por Caddy
- ✅ Meta Graph re-scrape: OG description = "Launch price €27 — increases to €97 from June 30"

### Meta Ads — estrutura criada (TUDO PAUSED)

**Account:** `swiss-chf-1` (`act_2168506510289919`) — CHF, Europe/Paris timezone, balance 0 (top up needed)
**Pixel:** SLEEP-2 (`1277058757910786`)
**Page:** Sleep Wired (`1023528354186771`)

| Asset | ID | Status | Detalhe |
|---|---|---|---|
| Campaign `SLEEP \| SALES \| ANGLO \| v6 \| hooks-test` | `120242657870190147` | PAUSED | OUTCOME_SALES, CBO daily_budget CHF 60, AUCTION, bid_strategy LOWEST_COST_WITHOUT_CAP |
| Ad Set `hyperarousal \| GB-IE` | `120242657904330147` | PAUSED | OFFSITE_CONVERSIONS / Purchase, GB+IE, 25-65, Advantage+ Audience |
| Ad Set `melatonin \| GB-IE` | `120242657908250147` | PAUSED | idem |
| Ad Set `wake3am \| GB-IE` | `120242657911700147` | PAUSED | idem |
| Ad Set `doctor-cbti \| GB-IE` | `120242657914470147` | PAUSED | idem |
| Ad Set `default \| GB-IE` | `120242657918000147` | PAUSED | idem |
| Ads | — | — | **0 ads criados** — depende dos vídeos serem produzidos |

### Briefs criativos + imagens estáticas

- 📄 `marketing/creative-briefs-v6.md` — 10 criativos completos: 5 vídeos (roteiro frame-a-frame com timing, voiceover, on-screen text, ad copy, headline, CTA) + 5 estáticos (visual brief + headline/sub overlay text)
- 🖼️ `marketing/images/v6/` — 5 PNGs 1024×1536 prontos pra você aplicar text overlay (Canva/Figma/Photoshop)

---

## 2. O que falta — e quem faz

| Item | Quem | Por quê |
|---|---|---|
| **Gravar/produzir 5 vídeos 15-20s** (roteiros em `creative-briefs-v6.md`) | **Ash** | Roteiros são prontos pra avatar HeyGen, UGC com celular, ou screen-record. Decisão de formato + actor/voz é tua. Eu não tenho HeyGen configurado pro perfil Sleep. |
| **Aplicar text overlay nos 5 estáticos** | **Ash** | Headlines + sub text estão no brief. Use Canva/Figma — 5 minutos por imagem. ImageMagick não instalado no VPS. |
| **Top-up da conta swiss-chf-1** | **Ash** | Balance atual = 0. Pra rodar CHF 60/dia × 10 dias = mínimo CHF 600. Recomendo CHF 800 pra cobrir buffer. |
| **Upload dos ads (vídeo + estático) e linkar aos Ad Sets corretos** | **Ash via Meta UI** | Eu posso fazer via Graph API quando os assets estiverem prontos, mas Reels boost via API tem limitação documentada — UI é mais seguro. |
| **Ativar campanha** | **Ash** | Por política sua: nunca ativo campanha Meta sem autorização explícita. Vou esperar tu rever os 5 ad sets e mandar "ativa". |

---

## 3. Decisões que tomei sem te perguntar (você pode reverter)

1. **Deadline empurrada pra June 30 (não rolling fake countdown)** — porque a copy explicitamente promete "no fake countdown, no reset — the date is fixed". Quebrar isso destrói credibilidade. Em 45 dias revisitamos.
2. **APP_URL → sleepwired.com** (não sleep.fluyon.ch) — atribuição pixel cross-domain estava quebrada (success_url voltava pra domínio diferente do ad). Single domain agora.
3. **`/solution` virou redirect, não 410** — Wouter é SPA, server sempre retorna 200 + index.html. Cliente redireciona pra `/`. Pra 410 real precisa de regra Caddy server-side — diga se quer.
4. **5 hooks (não 10-15)** — sua restrição de budget e o ciclo de leitura de 7 dias por ad set faz com que 5 ad sets × 2 creatives cada (=10 ads totais) seja o máximo testável em CHF 600. Mais hooks = leitura mais lenta.
5. **GB + IE só** — anglo CPM mais barato pra calibrar, e Meta otimiza pra Purchase mais rápido com menos países. Se 1+ ângulo provar conversão em 10d, expande pra CA/AU/NZ na semana 2.
6. **Pixel: usei SLEEP-2 dedicado** (memória dizia que é teste anti-conta-poluída — mantive)
7. **Custom Conversion: não criei** — o evento `Purchase` padrão do pixel já funciona pra otimização. Custom Conversion só vale se quiser segmentar por value range, o que não é necessário num produto single-price.
8. **`.env` agora no gitignore** — fix de segurança. Vai precisar copiar/symlink manualmente em cada novo clone.

---

## 4. O que NÃO foi feito (e por quê)

- **Não criei custom conversion no Meta** — desnecessário pro fluxo atual
- **Não ativei CAPI (Conversions API)** — pixel + cookies já passa fbp/fbc pra Stripe, mas falta o webhook Stripe → Meta CAPI pra confirmar purchases server-side. Vale fazer ANTES de escalar mas não trava o primeiro teste
- **Não pushei pra GitHub** (`git push origin main`) — fora do escopo "ajusta tudo", quis te dar chance de revisar os 2 commits antes
- **Não toquei em campanhas existentes** — todas as outras (v5 anglo, retargeting, copies) ficaram exatamente como estavam

---

## 5. Checklist pra você antes de "ativa"

- [ ] Revisar `marketing/creative-briefs-v6.md` (10 criativos)
- [ ] Olhar as 5 imagens em `marketing/images/v6/` (aprovar visualmente)
- [ ] Decidir formato dos vídeos: HeyGen avatar Sleep / UGC celular / screen-record / mix
- [ ] Top-up swiss-chf-1 (mínimo CHF 600, recomendo CHF 800)
- [ ] Decidir: push commits pro GitHub agora ou esperar?
- [ ] Confirmar destino: vamos ativar quando os criativos estiverem prontos OU revisar mais alguma peça antes?

---

## 6. Critério de leitura (10-day window)

| Dia | Decisão |
|---|---|
| 3 | Kill ads com CTR < 0.8% ou hook rate < 25% |
| 5 | Kill ad sets com 0 Purchase em CHF 40+ spent |
| 7 | Sobrevivem: ad sets com CPA ≤ €27 (break-even tripwire) |
| 10 | Escala vencedores +50% budget. Briefa próximos 5 hooks. |

**Métrica única reportada:** Purchase (CTR/hook rate = diagnóstico, não delivery — conforme tua regra).
