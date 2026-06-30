import type { Metadata } from "next";
import {DM_Sans, JetBrains_Mono} from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["200","300", "400", "500", "600", "700"],
  subsets: ["latin"],

});
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetBrains-mono",
  weight: ["200", "300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Rigs — AI Workstation Configurator",
  description: "Find and configure the ideal AI workstation for your local inference and training workloads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
