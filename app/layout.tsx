import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "Carbinox KPI Tracker",
  description:
    "Real-time KPI and target tracking across every Carbinox department — one dashboard for the numbers that matter.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0">
              <Topbar />
              <main className="mx-auto max-w-7xl px-4 py-8 pt-14 sm:px-6 lg:pt-8">{children}</main>
            </div>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
