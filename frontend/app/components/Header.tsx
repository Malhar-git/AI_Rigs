import Button from "../ui components/Button";

const navItems = ["About", "Configurator", "Categories", "Top Grossing", "Contact Us"];

function Navigation() {
  return (
    <nav aria-label="Main navigation" className="flex items-center gap-0 bg-secondary rounded-4xl">
      {navItems.map((item) => (
        <Button
          key={item}
          variant="ghost"
          size="md"
          className="rounded-md py-2 text-sm text-primary-foreground/80 hover:text-primary-foreground focus-visible:ring-primary-foreground/50 gap-0"
        >
          {item}
        </Button>
      ))}
    </nav>
  );
}

export default function Header() {
  return (
    <header className="flex w-full pt-2 justify-between rounded-xl bg-primary">
      <div className="title ml-10">
        <h4 className="text-2xl font-bold tracking-wider text-primary-foreground">AI RIGS</h4>
      </div>
      <div className="navigation mr-32">
        <Navigation />
      </div>
    </header>
  );
}