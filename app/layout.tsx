import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast";
import TopBar from "@/components/layout/TopBar";
import MainNavbar from "@/components/layout/MainNavbar";
import ToastContainer from "@/components/ui/ToastContainer";
import { Toaster } from "react-hot-toast";
import NavigationProgress from "@/components/NavigationProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevOps Shop - Votre marketplace multi-tenant",
  description: "Application e-commerce microservices avec architecture multi-tenant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-blue-300"
        >
          Aller au contenu principal
        </a>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            
            {/* Double Navbar E-commerce */}
            <TopBar />
            <MainNavbar />
            
            <main
              id="main-content"
              className="min-h-screen"
              role="main"
            >
              {children}
            </main>

            {/* Footer Minimaliste */}
            <footer className="bg-slate-900 text-white mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                  <p>&copy; 2025 DevOps Shop. Tous droits réservés.</p>
                  <a href="/help" className="hover:text-white transition-colors">
                    Besoin d'aide ?
                  </a>
                </div>
              </div>
            </footer>

            <ToastContainer />
            <Toaster position="top-right" />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
