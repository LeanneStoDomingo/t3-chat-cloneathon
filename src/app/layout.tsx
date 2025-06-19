import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./_providers/convex-provider";
import { PostHogProvider } from "./_providers/posthog-provider";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { ThemeProvider } from "./_providers/theme-provider";
import { ThemeToggle } from "~/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "T3 Chat Cloneathon",
  description: "Open source clone of T3 Chat",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "system", "matrix"]}
        >
          <ClerkProvider>
            <ConvexClientProvider>
              <PostHogProvider>
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarTrigger className="fixed top-0 left-0 z-10" />
                  {children}
                  <ThemeToggle className="fixed top-0 right-0" />
                </SidebarProvider>
              </PostHogProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
