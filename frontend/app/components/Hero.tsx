import Button from "../ui components/Button";
import Image from "next/image";

export default function Hero() {
  return (
    <div className="hero-card grid grid-cols-1 md:grid-cols-2 gap-16 items-end pt-56">
      <div className="descripton&cta flex flex-col max-w-2xs ml-4">
        <p>This is a Local AI Configuration builder that provides user the access to choose the necessry hardware required to achieve their goal</p>
        <div className="cta__button align-top mt-2">
          <Button variant="sweep" className="h-auto rounded-4xl px-0 py-1" size="sm">
            <span className="inline-flex items-center justify-center align-middle gap-2">
              <Image alt="arrow-forward" src="./arrow-forward.svg" width={16} height={16} />
              Shop Now
            </span>
          </Button>
        </div>
      </div>
      <div className="salutation mr-7 ">
        <h1 className="tracking-tighter">A definitive catalog to build your ultimate AI Workstation</h1>
      </div>
    </div>
  )
}