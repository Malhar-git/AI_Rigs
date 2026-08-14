"use client";
import { useRouter } from "next/navigation";
import Button from "../ui-components/Button";
import Image from "next/image";

export default function Hero() {
  const router = useRouter();
  return (
    <div className="w-full px-6">
      <div className="hero-card flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-16 items-end pt-16 md:pt-52 mb-8 md:mb-16">
        <div className="salutation order-1 md:order-2">
          <h1 className="tracking-tighter">A definitive catalog to build your ultimate AI Workstation</h1>
        </div>
        <div className="descripton&cta flex flex-col max-w-xs order-2 md:order-1">
          <p>This is a Local AI Configuration builder that provides user the access to choose the necessary hardware required to achieve their goal</p>
          <div className="cta__button align-top mt-2">
            <Button variant="sweep" className="h-auto rounded-4xl px-0 py-1" size="sm" onClick={() => { router.push("/guild-builder") }}>
              <span className="inline-flex items-center justify-center align-middle gap-2">
                <Image alt="arrow-forward" src="/arrow-forward.svg" width={16} height={16} />
                Build Now
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}