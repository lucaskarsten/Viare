import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import "./tailwind.css";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans-var",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Viare — Aprenda Kali Linux & Cybersecurity",
  description:
    "Plataforma interativa para aprender Kali Linux e Cybersecurity com labs CTF, projetos guiados e gamificação.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale === "pt" ? "pt-BR" : locale}
      data-palette="cool"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var p=localStorage.getItem('vr:palette');document.documentElement.dataset.palette=p||'cool';if(localStorage.getItem('vr:dark')==='1')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
