import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ToastProvider } from "@/lib/toast-context";
import { MobileMenuProvider } from "@/lib/mobile-menu-context";
import { ApiClientBridge } from "@/components/ApiClientBridge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastContainer } from "@/components/ui/ToastContainer";
import "./globals.css";

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
  description: "Marketplace multi-tenant pour gérer vos produits, commandes et paiements.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <ApiClientBridge>
                <MobileMenuProvider>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <div className="flex flex-1">
                      <Sidebar />
                      <main className="flex-1 min-w-0 w-full">
                        {children}
                      </main>
                    </div>
                    <Footer />
                    <ToastContainer />
                  </div>
                </MobileMenuProvider>
              </ApiClientBridge>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
