import clsx from "clsx";
import Footer from "./Footer";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
  width?: "default" | "wide" | "full";
  className?: string;
};

export default function PageShell({ children, width = "default", className }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-primary text-foreground">
      <Header />
      <main
        className={clsx(
          "flex-1",
          width !== "full" && "mx-auto w-full px-4 py-8 sm:px-6 lg:px-8",
          width === "default" && "max-w-7xl",
          className,
        )}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
