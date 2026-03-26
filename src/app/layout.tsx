import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ApiKeyProvider } from "@/lib/api-key-context";
import { HistoryProvider } from "@/lib/history-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Paper2Notebook",
  description:
    "Transform research papers into production-quality Google Colab notebooks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ApiKeyProvider>
          <HistoryProvider>{children}</HistoryProvider>
        </ApiKeyProvider>
      </body>
    </html>
  );
}
