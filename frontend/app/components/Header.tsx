import Button from "../ui components/Button";

const navItems = ["About", "Configurator", "Categories", "Top Grossing", "Contact Us"];

function Navigation() {
  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center gap-1 rounded-4xl bg-muted p-0."
    >
      {navItems.map((item) => (
        <Button
          key={item}
          variant="ghost"
          size="sm"
          className="rounded-3xl px-1 text-sm text-foreground transition-all duration-250 ease-out will-change-transform hover:cursor-pointer hover:scale-[0.92] hover:translate-y-px hover:bg-white hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] focus-visible:ring-accent/50 active:scale-[0.9]"
        >
          {item}
        </Button>
      ))}
    </nav>
  );
}

export default function Header() {
  return (
    <header className="flex w-full pt-2 justify-between rounded-xl bg-background">
      <div className="title ml-10">
        <h4 className="text-2xl font-bold tracking-wider text-foreground">AI RIGS</h4>
      </div>
      <div className="navigation mr-32">
        <Navigation />
      </div>
    </header>
  );
}
// TODO: Make the header tile transparent when scrolling and have a piano effect while hovering around nav bar buttons+