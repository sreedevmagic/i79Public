import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = buildMetadata(
  {
    title: "Accessibility Statement",
    description:
      "i79 Engage is committed to making our platform accessible to all users, including those with disabilities. We target WCAG 2.1 Level AA conformance.",
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
                i79 Engage aims to comply with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standard published by the World Wide Web Consortium (W3C). We target conformance across:
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
                  <span>Keyboard navigation and focus indicators</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Screen reader compatibility (NVDA, JAWS, VoiceOver)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Sufficient color contrast (WCAG AA standards)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Resizable text and zoom functionality</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>Semantic HTML and ARIA landmarks</span>
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
                While we strive for full accessibility, we acknowledge there may be areas where our platform does not meet WCAG 2.1 Level AA standards. We are actively working to identify and remediate any barriers. If you encounter an accessibility issue, please contact us so we can prioritize a fix.
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
                Accessibility is an ongoing commitment. We regularly test our platform against WCAG 2.1 standards and incorporate user feedback to improve the experience for all users. We welcome suggestions and will respond to accessibility inquiries within 2 business days.
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
                    href="https://www.w3.org/WAI/WCAG21/quickref/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    WCAG 2.1 Quick Reference Guide
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
