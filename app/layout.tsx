import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme-init-script";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fruct CRM",
  description: "CRM для продавца компьютерных кресел: лиды, сделки, склад, доставка, зарплата.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={montserrat.variable} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
