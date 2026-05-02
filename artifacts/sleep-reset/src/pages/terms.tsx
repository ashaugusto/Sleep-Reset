import { useLocation } from "wouter";
import { Moon, ArrowLeft } from "lucide-react";

export default function Terms() {
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
          <span className="font-bold text-sm">Sleep Rewire</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Last updated: April 9, 2026</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          These Terms of Service ("Terms") govern your access to and use of the Sleep Rewire platform, website, and digital program (collectively, the "Service") operated by Sleep Rewire ("we", "us", or "our"). By creating an account or purchasing the program, you agree to be bound by these Terms.
        </p>

        {[
          {
            title: "1. The Service",
            content: `Sleep Rewire provides a self-guided, 7-night digital program based on Cognitive Behavioral Therapy for Insomnia (CBT-I). The program includes:

- Nightly guided content and protocols
- Evening and morning sleep diary tools
- Sleep efficiency score and progress tracking
- Personal sleep profile generation

The program is a digital educational product. It is not a medical treatment, therapy service, or substitute for professional medical advice.`,
          },
          {
            title: "2. Medical Disclaimer",
            content: `**This program is not a substitute for professional medical advice, diagnosis, or treatment.**

CBT-I is a well-researched, evidence-based behavioral approach to improving sleep. However, Sleep Rewire does not diagnose, treat, or cure any medical condition. If you have or suspect a sleep disorder (such as sleep apnea, narcolepsy, or restless leg syndrome), a mental health condition, or any other medical concern, consult a qualified healthcare professional before beginning this program.

Individual results vary. We make no guarantee that the program will resolve your specific sleep issues.`,
          },
          {
            title: "3. Eligibility",
            content: `You must be at least 18 years of age to use this Service. By using the Service, you represent and warrant that you are 18 or older and have the legal capacity to enter into these Terms.`,
          },
          {
            title: "4. Account & Purchase",
            content: `To access the full program, you must:

1. Create an account with a valid email address and password
2. Complete a one-time purchase of €27 via Stripe

Your account is personal and non-transferable. You are responsible for maintaining the security of your credentials. Do not share your account with others.

The purchase grants you **lifetime access** to the program for your personal, non-commercial use only.`,
          },
          {
            title: "5. Refund Policy",
            content: `We offer a full 7-night money-back guarantee. If you complete all 7 nights of the protocol and do not notice a measurable improvement in your sleep quality, you may request a full refund within 30 days of purchase by emailing us at support@sleepwired.com.

We reserve the right to refuse refund requests that show no evidence of program completion, or where the refund policy is being abused.

Refunds are processed within 5–10 business days through the original payment method.`,
          },
          {
            title: "6. Intellectual Property",
            content: `All content within the Sleep Rewire platform — including but not limited to program materials, copy, audio, design, and software — is the exclusive intellectual property of Sleep Rewire.

Your purchase grants you a personal, non-exclusive, non-transferable licence to access and use the content for your own sleep improvement. You may not:

- Copy, reproduce, or redistribute the program content
- Resell or sublicense access to others
- Use the content for commercial purposes without written permission`,
          },
          {
            title: "7. Limitation of Liability",
            content: `To the maximum extent permitted by applicable law, Sleep Rewire shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of data, personal injury, or health outcomes.

Our total liability to you for any claim arising from these Terms or use of the Service shall not exceed the amount you paid for the program (€27).`,
          },
          {
            title: "8. Termination",
            content: `We reserve the right to suspend or terminate your account at our sole discretion if you violate these Terms, engage in abusive behaviour, or attempt to circumvent payment. In such cases, no refund will be issued.

You may delete your account at any time by contacting us at support@sleepwired.com.`,
          },
          {
            title: "9. Changes to Terms",
            content: `We may update these Terms from time to time. When we do, we will update the "Last updated" date above. Continued use of the Service after changes constitutes your acceptance of the revised Terms. We will make reasonable efforts to notify users of material changes via email.`,
          },
          {
            title: "10. Governing Law",
            content: `These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Sleep Rewire operates, without regard to conflict of law provisions. Any disputes arising from these Terms shall be resolved through good-faith negotiation, and if necessary, binding arbitration.`,
          },
          {
            title: "11. Contact",
            content: `For any questions about these Terms, contact us at:

**Email:** support@sleepwired.com`,
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
            ← Back to Sleep Rewire
          </button>
        </div>
      </main>
    </div>
  );
}
