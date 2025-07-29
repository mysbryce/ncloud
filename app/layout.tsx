import type React from "react"
import type { Metadata } from "next"
import { Anuphan } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const anuphan = Anuphan({
  subsets: ["latin"],
  variable: "--font-anuphan",
})

export const metadata: Metadata = {
  title: "NCloud - LAN Storage",
  description: "Beautiful cloud storage for your local network",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${anuphan.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
