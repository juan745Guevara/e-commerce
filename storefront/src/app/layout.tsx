import type { Metadata } from "next";
import { MotionConfig } from "motion/react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Atelier",
    template: "%s · Atelier",
  },
  description: "Tecnología pensada para el día a día. Envío a todo el país.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <MotionConfig reducedMotion="user">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </MotionConfig>
      </body>
    </html>
  );
}
