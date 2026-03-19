import Header from "./components/Header";
import Button from "./ui components/Button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-g font-primary text-foreground">
      <Header />
      <main className="flex-1">
        {/* <div className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-sm">
          <h3 className="text-accent font-bold">RTX 5090</h3>
          <p className="text-muted-foreground text-sm">Next-gen GPU architecture</p>
          <button className="bg-primary text-primary-foreground px-3 py-1 mt-2 rounded">
            View Specs
          </button>
          <Button variant="primary">Click me</Button>
          <Button variant="secondary">Click me</Button>
          <Button variant="accent">Click me</Button>
          <Button variant="danger">Click me</Button>
          <Button variant="ghost">Click me</Button>
        </div> */}
      </main>
    </div>
  );
}
