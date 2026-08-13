type FooterSection = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Navigation",
    links: [
      { label: "GPU Database", href: "/products" },
      { label: "AI Benchmarks", href: "/grossing" },
      { label: "Rig Builder", href: "/guild-builder" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Affiliate Disclosure", href: "/contact" },
      { label: "Privacy Policy", href: "/contact" },
      { label: "Terms of Service", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/95">
      <div className="w-full px-5 py-4 md:py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-10">
          <section className="md:max-w-xl md:flex-1">
            <h4 className="tracking-wide">AI RIGS</h4>
            <p className="mt-2 max-w-lg text-muted-foreground md:mt-4">
              Precision-engineered hardware evaluation for the next generation of local AI development.
              Built for architects, researchers, and pioneers.
            </p>
          </section>

          <div className="flex flex-row gap-8 sm:gap-12">
            {FOOTER_SECTIONS.map((section) => (
              <section key={section.title}>
                <small className="text-[0.64rem] uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </small>
                <ul className="mt-3 space-y-1.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col border-t border-border pt-4 uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:mt-6 md:pt-6">
          <small>© 2026 AI RIGS Analytics Engine.</small>
          <small>Data Version 2.6.11 Beta</small>
        </div>
      </div>
    </footer>
  );
}