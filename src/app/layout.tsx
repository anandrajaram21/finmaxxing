import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { env } from "@/env";
import { cn } from "@/lib/utils";

const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const appUrl = new URL(env.BETTER_AUTH_URL);
const title = "Finmaxxing";
const description =
  "A private portfolio workspace for goals, investments, transactions, allocations, and long-term planning.";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  applicationName: title,
  description,
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  metadataBase: appUrl,
  openGraph: {
    description,
    images: [
      {
        alt: "Finmaxxing portfolio workspace overview",
        height: 630,
        url: "/og-image.png",
        width: 1200,
      },
    ],
    locale: "en_IN",
    siteName: title,
    title,
    type: "website",
    url: "/",
  },
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  twitter: {
    card: "summary_large_image",
    description,
    images: [
      {
        alt: "Finmaxxing portfolio workspace overview",
        url: "/og-image.png",
      },
    ],
    title,
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const themeScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("finmaxxing-theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : systemTheme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geist.variable, "font-sans", geistMono.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
