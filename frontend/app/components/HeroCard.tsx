import Image from "next/image"
export default function HeroCard() {
  return (
    <section className="hero-card">
    <div className="hero-container relative hidden md:flex w-full overflow-x-hidden h-screen">
        <Image src="/hero/ai-workstation.png" fill priority className="object-cover" alt="AI Workstation" />
      </div>
    </section>
  )
}