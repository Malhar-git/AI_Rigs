import Featured from "./components/Featured";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import HeroCard from "./components/HeroCard";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-g font-primary text-foreground">
      <Header />
      <main className="flex-1">
        <Hero />
        <HeroCard />
        <Featured />
      </main>
      <Footer />
    </div>
  );
}
