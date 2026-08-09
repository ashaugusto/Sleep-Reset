import { useLocation } from "wouter";
import { Moon, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

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
          <h1 className="text-2xl font-extrabold mb-1">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: May 17, 2026</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Sleep Wired ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding it. By using the Sleep Wired platform, you agree to the practices described in this policy.
        </p>

        {[
          {
            title: "1. Information We Collect",
            content: `We collect the following types of information:

**Account data:** Email address, name (optional), and a hashed password when you create an account. We never store your password in plain text.

**Sleep data:** Information you voluntarily enter through the app, including bedtime, wake time, sleep quality ratings, mood notes, and other diary entries. This data is used solely to power your personal progress tracking.

**Usage data:** Basic technical information such as your browser type, device type, and pages visited, used to improve the product experience.

**Lead data:** If you enter your email (and optionally your name and WhatsApp number) on the order form, we store it to (a) hand you over to our checkout and (b) — if you don't complete the purchase — send you up to three follow-up emails over the next 72 hours to help you finish your setup. You can stop these emails at any time by clicking the unsubscribe link in any message.

**Payment data:** Payments are processed by Hotmart, which acts as merchant of record for the sale. Your card details are entered on Hotmart's checkout and never reach our servers: we do not store your card number or any full payment details. Hotmart's privacy policy governs payment data handling.`,
          },
          {
            title: "2. How We Use Your Information",
            content: `We use your information to:

- Provide and operate The Cognitive Shutdown Method protocol
- Personalise your sleep protocol based on your onboarding answers
- Track your nightly progress and generate sleep efficiency scores
- Send transactional emails (account confirmation, purchase receipt)
- Send up to 3 follow-up emails if you started a checkout but didn't complete it (opt-out anytime)
- Measure advertising effectiveness through Meta Pixel and Conversions API (see Section 4)
- Improve our product through aggregated, anonymised analytics
- Comply with legal obligations`,
          },
          {
            title: "3. Data Storage & Security",
            content: `Your data is stored in a secure PostgreSQL database hosted on DigitalOcean's managed infrastructure (EU region). We use industry-standard security practices including:

- Password hashing using bcrypt (your password is never stored in plain text)
- HTTPS / TLS encryption for all data in transit
- HTTP-only session cookies to prevent cross-site scripting attacks
- No selling or renting of your personal data to third parties, ever`,
          },
          {
            title: "4. Third-Party Services & Advertising Trackers",
            content: `We use the following third-party services:

**Hotmart:** Payment processing and merchant of record. Your payment data is governed by Hotmart's Privacy Policy (hotmart.com/en/legal/privacy-policy).

**DigitalOcean:** Hosting and infrastructure. DigitalOcean's Privacy Policy applies to infrastructure-level data.

**Resend:** Transactional and recovery email delivery (resend.com/legal/privacy-policy).

**Meta (Facebook) Pixel + Conversions API:** We use the Meta Pixel and server-side Conversions API to measure ad performance and optimise our advertising. This means Meta may receive limited information about your visit (such as the fact that you viewed the page, started checkout, or made a purchase) along with a hashed version of your email address when applicable. You can opt out of personalised ads via Meta's settings (facebook.com/help/568137493302217) or by using ad-blocking browser extensions.

**Google Tag Manager:** We use GTM to deploy and manage tracking tags efficiently. GTM itself does not collect personal data.

We do not use Google Analytics on this platform.`,
          },
          {
            title: "5. Your Rights",
            content: `You have the right to:

- **Access:** Request a copy of the personal data we hold about you
- **Correction:** Ask us to correct inaccurate data
- **Deletion:** Request deletion of your account and all associated data
- **Export:** Request a CSV export of your sleep diary data (available directly in the app)
- **Opt-out:** Unsubscribe from any non-transactional communications at any time

To exercise any of these rights, email us at the address in Section 7.`,
          },
          {
            title: "6. Data Retention",
            content: `We retain your account data for as long as your account is active. If you request account deletion, we will remove your personal data within 30 days. Aggregated, anonymised data (with no personal identifiers) may be retained for product improvement purposes.`,
          },
          {
            title: "7. Contact",
            content: `For any privacy-related questions or requests, contact us at:

**Email:** privacy@sleepwired.com

We aim to respond to all requests within 5 business days.`,
          },
          {
            title: "8. Changes to This Policy",
            content: `We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. Continued use of the platform after changes constitutes acceptance of the updated policy.`,
          },
        ].map((section) => (
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
            ← Back to Sleep Wired
          </button>
        </div>
      </main>
    </div>
  );
}
