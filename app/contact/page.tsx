import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import ContactForm from "@/components/contact/ContactForm";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

export const metadata: Metadata = buildMetadata(
  {
    title: "Contact Us – i79.ai",
    description:
      "Get in touch with i79.ai. We're ready to help you build your AI system or answer questions about i79 Engage.",
    openGraph: {
      title: "Contact i79.ai",
      description:
        "Reach out to our team for AI consulting, product demos, or general inquiries.",
    },
  },
  { canonicalPath: "/contact" }
);

const contactDetails = [
  // {
  //   icon: MapPin,
  //   label: "Address",
  //   value: "Abu Dhabi, UAE",
  // },
  {
    icon: Mail,
    label: "Email",
    value: "contact@i79.ai",
    href: "mailto:contact@i79.ai",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+971 56 970 8658",
    href: "tel:+971 56 176 4568",
  },
];

export default function ContactPage() {
  return (
    <SectionWrapper className="pt-36 pb-24">
      {/* Header */}
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-5">
          Get in Touch
        </span>
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-foreground">
          Let&apos;s{" "}
          <span className="gradient-text">Talk</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
          Whether you want a demo of Engage, exploring AI strategy, or have
          a specific project in mind — we&apos;re here.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
        {/* Left: Contact Info */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              i79.ai 
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An AI consulting and product company powering enterprise
              transformation across the region.
            </p>
          </div>

          <div className="space-y-6">
            {contactDetails.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      className="text-sm text-foreground hover:text-primary transition-colors whitespace-pre-line"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Looking for something specific?
            </p>
            <a
              href="/engage"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRight size={14} />
              View i79 Engage
            </a>
            <a
              href="https://vengage.i79.ai/register"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRight size={14} />
              Start Free Trial
            </a>
            <a
              href="/services"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRight size={14} />
              See Our Services
            </a>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-xl shadow-primary/5">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Send Us a Message
            </h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
