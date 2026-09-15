import type { Metadata, Viewport } from "next";
import { Cairo, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { ConnectivityProvider } from "@/components/layout/ConnectivityProvider";
import { ServiceWorkerBridge } from "@/components/layout/ServiceWorkerBridge";
import { ToastProvider } from "@/components/ui/Toast";
import { getLocaleContext } from "@/lib/i18n";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "بحيرة سمارت — بوابة رقمية واحدة",
    template: "%s · بحيرة سمارت",
  },
  description:
    "البوابة الرقمية الموحدة لمحافظة البحيرة: الخدمات الحكومية، البلاغات الذكية، الأخبار الرسمية، والبرامج التدريبية — في مكان واحد.",
  applicationName: "بحيرة سمارت",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "بحيرة سمارت", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/brand/emblem-96.png", sizes: "96x95", type: "image/png" },
      { url: "/brand/emblem-192.png", sizes: "192x190", type: "image/png" },
    ],
    apple: { url: "/brand/emblem-192.png", sizes: "192x190", type: "image/png" },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F5F1" },
    { media: "(prefers-color-scheme: dark)", color: "#050E18" },
  ],
};

/** يمنع وميض النمط الخاطئ قبل ترطيب React. */
const THEME_INIT = `
(function(){try{
  var stored = localStorage.getItem("bs-theme");
  var theme = stored || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
}catch(e){document.documentElement.setAttribute("data-theme","light");}})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { config, t } = await getLocaleContext();

  return (
    <html lang={config.code} dir={config.dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className={`${plexArabic.variable} ${cairo.variable} antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:rounded-lg focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-white"
        >
          {t.shell.skipToContent}
        </a>
        <ConnectivityProvider>
          <ToastProvider>
            <ServiceWorkerBridge />
            {children}
          </ToastProvider>
        </ConnectivityProvider>
      </body>
    </html>
  );
}
