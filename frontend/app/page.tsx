import Featured from "./components/Featured";
import Hero from "./components/Hero";
import HeroCard from "./components/HeroCard";
import PageShell from "./components/PageShell";

export default function Home() {
  return (
    <PageShell width="full">
      <Hero />
      <HeroCard />
      <Featured />
    </PageShell>
  );
}
