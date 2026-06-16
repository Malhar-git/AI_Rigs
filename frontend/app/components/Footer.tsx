type FooterSection = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Navigation",
    links: [
      { label: "GPU Database", href: "#" },
      { label: "AI Benchmarks", href: "#" },
      { label: "Rig Builder", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Affiliate Disclosure", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/35">
      <div className="mx-6 max-w-7xl py-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <section className="md:max-w-xl md:flex-1">
            <h4 className="tracking-wide">AI RIGS</h4>
            <p className="mt-4 max-w-lg text-secondary">
              Precision-engineered hardware evaluation for the next generation of local AI development.
              Built for architects, researchers, and pioneers.
            </p>
          </section>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-12 ">
            {FOOTER_SECTIONS.map((section) => (
              <section key={section.title}>
                <small className="text-[0.64rem] uppercase tracking-wider text-secondary">
                  {section.title}
                </small>
                <ul className="mt-5 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-secondary transition-colors hover:text-foreground"
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

        <div className="mt-6 flex flex-col border-t border-border pt-8 uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <small>© 2026 AI RIGS Analytics Engine.</small>
          <small>Data Version 2.6.11 Beta</small>
        </div>
      </div>
    </footer>
  );
}