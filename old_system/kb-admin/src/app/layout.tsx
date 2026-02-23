import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GetSessionInServer } from "@/actions/auth-action";
import { Toaster } from "@/components/ui/sonner";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppInsightsProvider } from "@/components/app-insights-provider";
import { AppInsightsErrorBoundary } from "@/components/app-insights-error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ibben Admin",
  description: "Ibben Admin",
};

export default async function RootLayout({
  home,
  dashboard,
}: Readonly<{
  home: React.ReactNode;
  dashboard: React.ReactNode;
}>) {
  const session = await GetSessionInServer();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  if (!session && pathname !== "/") {
    redirect("/");
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppInsightsProvider />
        <AppInsightsErrorBoundary>
          <main>{session ? <>{dashboard}</> : <>{home}</>}</main>
        </AppInsightsErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
