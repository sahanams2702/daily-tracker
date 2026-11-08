import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import AppShell from "./app-shell";

const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font" });

export const metadata: Metadata = {
  title: "Daily Tracker",
  description: "Habits and tasks for every day",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={font.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
