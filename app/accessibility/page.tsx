import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = buildMetadata(
  {
    title: "Accessibility Statement",
    description:
      "i79 Engage is committed to making our platform accessible to all users, including those with disabilities. We target WCAG 2.2 Level AA conformance.",
    openGraph: {
      title: "Accessibility Statement — i79 Engage",
      description:
        "Learn about our commitment to accessibility and how to report barriers.",
    },
  },
  {
    canonicalPath: "/accessibility",
  }
);

export default function AccessibilityPage() {
  return (
    <main>
      <SectionWrapper className="py-20">
        <div className="max-w-3xl">
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Accessibility Statement
          </h1>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <p className="text-base text-muted-foreground leading-relaxed">
                i79 Engage is committed to making our platform accessible to all users, including those with disabilities. We are continuously improving the accessibility of our platform to ensure everyone can use our product effectively and independently.
              </p>
            </section>

            {/* Conformance */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                WCAG Conformance
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                i79 Engage aims to comply with the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA standard published by the World Wide Web Consortium (W3C). WCAG 2.2 AA is the standard referenced by ADA / Section 508 (US), EN 301 549 (EU/EEA), and the UAE Federal e-Government Accessibility Guidelines. We target conformance across:
              </p>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>The main i79 Engage platform and admin dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>The public candidate-facing AI interview portal</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>This website (i79.ai)</span>
                </li>
              </ul>
              <p className="text-base text-muted-foreground leading-relaxed mt-4">
                WCAG 2.2 introduces new success criteria beyond 2.1, including: enhanced focus appearance (2.4.11, 2.4.12, 2.4.13), consistent help mechanisms (3.2.6), redundant entry avoidance (3.3.7), and accessible authentication (3.3.8). We are actively working to meet all new 2.2 criteria.
              </p>
            </section>

            {/* What We Support */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Accessibility Features
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Our platform includes support for:
              </p>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Keyboard navigation and visible focus indicators</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Screen reader compatibility (NVDA, JAWS, VoiceOver)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Sufficient color contrast (WCAG 2.2 AA — minimum 4.5:1 for normal text)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Resizable text and zoom functionality up to 200%</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Semantic HTML, ARIA landmarks, and skip navigation links</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Reduced motion support via <code>prefers-reduced-motion</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Video captions and transcripts where applicable</span>
                </li>
              </ul>
            </section>

            {/* Known Issues */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Known Limitations
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                While we strive for full WCAG 2.2 Level AA conformance, we acknowledge there may be areas where our platform does not yet meet all criteria. We are actively working to identify and remediate any barriers — particularly for the new WCAG 2.2 success criteria. If you encounter an accessibility issue, please contact us so we can prioritize a fix.
              </p>
            </section>

            {/* Contact & Support */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Report Accessibility Barriers
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                If you experience any accessibility barriers while using i79 Engage — whether on the platform, interview portal, or this website — please contact us. We are committed to resolving accessibility issues promptly.
              </p>
              <div className="bg-card border border-border rounded-lg p-6 mt-4">
                <p className="text-sm text-foreground font-semibold mb-2">
                  Email:
                </p>
                <a
                  href="mailto:contactus@i79.ai"
                  className="text-sm text-primary hover:underline"
                >
                  contactus@i79.ai
                </a>
                <p className="text-sm text-muted-foreground mt-4">
                  Please include details about the barrier you encountered and how it affected your use of the platform. This helps us prioritize fixes.
                </p>
              </div>
            </section>

            {/* Continuous Improvement */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Continuous Improvement
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Accessibility is an ongoing commitment. We regularly audit our platform against WCAG 2.2 standards, conduct user testing with assistive technologies, and incorporate feedback to improve the experience for all users. We respond to accessibility inquiries within 2 business days.
              </p>
            </section>

            {/* Standards & Resources */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Standards & Resources
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                For more information about web accessibility standards:
              </p>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <a
                    href="https://www.w3.org/WAI/WCAG22/quickref/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    WCAG 2.2 Quick Reference Guide
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <a
                    href="https://www.w3.org/WAI/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    W3C Web Accessibility Initiative (WAI)
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <a
                    href="https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    EN 301 549 v3.2.1 (EU Accessibility Standard)
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </li>
              </ul>
            </section>

            {/* Last Updated */}
            <section className="pt-8 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Last updated: June 2026
              </p>
            </section>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
