import Image from "next/image";

type FeaturedCard = {
  productName: string;
  imageUrl: string;
  alt: string;
};

const featuredContent: FeaturedCard[] = [
  {
    productName: "RTX 4090",
    imageUrl: "/featured/nvidia-geforce-rtx-4090-product.avif",
    alt: "GPU",
  },
  {
    productName: "RX 7900-XTX",
    imageUrl: "/featured/amd-radeon-rx-7900-xtx-product.png",
    alt: "GPU",
  },
  {
    productName: "ARC B-850",
    imageUrl: "/featured/intel-arc-b850.png",
    alt: "Processor",
  },
  {
    productName: "RTX 5080",
    imageUrl: "/featured/geforce-rtx-5080.png",
    alt: "GPU",
  },
];

export default function Featured() {
  return (
    <section className="featured">
      <div className="parent-container mx-auto grid w-full max-w-6xl grid-cols-1 place-items-center gap-4 px-4 py-2 sm:grid-cols-2 lg:grid-cols-4">
        {featuredContent.map((card, index) => (
          <div key={index} className="featured-card flex flex-col items-center gap-3">
            <div className="featured-image relative h-32 w-56 overflow-hidden ">
              <Image src={card.imageUrl} alt={card.alt} fill className="object-contain px-2" />
            </div>
            <div className="featured-product-name text-center text-md text-foreground p-0 m-0">{card.productName}</div>
          </div>
        ))}
      </div>
    </section>
  );
}