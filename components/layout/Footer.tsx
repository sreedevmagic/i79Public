import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Engage", href: "/engage" },
    { label: "Sign In", href: "https://vengage.i79.ai" },
    { label: "Get Started", href: "https://vengage.i79.ai/register" },
  ],
  Company: [
    { label: "Services", href: "/services" },
    { label: "Contact", href: "/contact" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight gradient-text"
            >
              i79
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              AI consulting company building enterprise AI platforms and
              intelligent recruitment systems.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              
            </p>
            <a
              href="mailto:contact@i79.ai"
              className="mt-1 block text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              contact@i79.ai
            </a>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-sm font-semibold text-foreground mb-4">
                {group}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} i79.ai Technologies LLC. All
            rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for enterprise. Designed for clarity.
          </p>
        </div>
      </div>
    </footer>
  );
}
