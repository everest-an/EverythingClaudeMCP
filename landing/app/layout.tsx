import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const sans = Inter({
  variable: "--font-aeonik",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://awesomecontext.awareness.market";

export const metadata: Metadata = {
  title: {
    default: "AwesomeContext — MCP Server for Claude Code | Compress Engineering Rules",
    template: "%s | AwesomeContext",
  },
  description:
    "AwesomeContext is an MCP server that compresses engineering rules into latent space tensors. Query 122+ coding modules in under 5ms with 96% token savings. Works with Claude Code, supports architecture consulting, skill injection, and compliance verification.",
  keywords: [
    "MCP server",
    "Claude Code",
    "Model Context Protocol",
    "engineering rules",
    "latent space",
    "AI coding assistant",
    "code compliance",
    "architecture patterns",
    "developer tools",
    "Claude AI",
    "coding standards",
    "token optimization",
    "AwesomeContext",
  ],
  authors: [{ name: "AwesomeContext Team" }],
  creator: "AwesomeContext",
  publisher: "AwesomeContext",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "AwesomeContext",
    title: "AwesomeContext — MCP Server for Claude Code",
    description:
      "Compress engineering rules into latent space tensors. Query 122+ modules in under 5ms with 96% token savings. Open source MCP server for Claude Code.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AwesomeContext — MCP Server for Claude Code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AwesomeContext — MCP Server for Claude Code",
    description:
      "Compress engineering rules into latent space tensors. Query 122+ modules in under 5ms with 96% token savings.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "AwesomeContext",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Cross-platform",
              description:
                "MCP server that compresses engineering rules into latent space tensors for Claude Code. 122+ modules, sub-5ms retrieval, 96% token savings.",
              url: SITE_URL,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              softwareRequirements: "Claude Code, Node.js",
              license: "https://opensource.org/licenses/MIT",
              codeRepository:
                "https://github.com/everest-an/AwesomeContext",
              programmingLanguage: ["TypeScript", "Python"],
              featureList: [
                "Engineering rule compression into latent space",
                "Sub-5ms rule retrieval",
                "96% token savings",
                "Architecture consulting",
                "Skill injection",
                "Compliance verification",
                "122+ pre-built modules",
              ],
            }),
          }}
        />
      </head>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
