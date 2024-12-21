import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
export const metadata: Metadata = {
  title: "Wealthify",
  description: "Your One Stop Financial Solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${poppins.className} antialiased flex flex-col`}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Toaster richColors />
          {/* Footer */}
          <footer className="bg-yellow-50 py-6">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>
                Made with ❤️ by{" "}
                <Link
                  className="text-gray-900 hover:underline font-bold"
                  href={"https://github.com/TheMercury1229"}
                >
                  Mercury
                </Link>
              </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
