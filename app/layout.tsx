import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/layout/JsonLd";
import { defaultMetadata } from "@/lib/metadata";

export const metadata: Metadata = defaultMetadata;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "i79.ai",
  url: "https://i79.ai",
  logo: "https://i79.ai/favicon.svg",
  description:
    "i79.ai is an AI consulting company building enterprise AI platforms, intelligent automation systems, and AI-powered recruitment software.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@i79.ai",
    contactType: "customer service",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://i79.ai",
  name: "i79.ai",
  description: "Enterprise AI consulting & intelligent recruitment platforms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">

        {/* Structured data */}
        <JsonLd schema={organizationSchema} />
        <JsonLd schema={websiteSchema} />

        {/* Google Analytics 4 */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity */}
        {CLARITY_ID && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `}
          </Script>
        )}

        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
