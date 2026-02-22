/* v0.2.3 */
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
    default:
      "AwesomeContext — MCP Server for Claude Code | AI Coding Rules Engine",
    template: "%s | AwesomeContext",
  },
  description:
    "AwesomeContext is an open-source MCP server that gives Claude Code instant access to 122+ engineering rules — architecture patterns, security checklists, and compliance checks. Sub-5ms retrieval, 96% token savings. Set up in 30 seconds.",
  keywords: [
    "MCP server",
    "Claude Code",
    "Claude Code MCP",
    "Model Context Protocol",
    "MCP tools",
    "AI coding assistant",
    "AI code review",
    "engineering rules",
    "coding standards",
    "architecture patterns",
    "code compliance",
    "security review",
    "developer tools",
    "Claude AI",
    "Anthropic MCP",
    "token optimization",
    "AI pair programming",
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
      "Give Claude Code instant access to 122+ engineering rules. Architecture patterns, security reviews, and compliance checks — all in under 5ms. Open source.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AwesomeContext — MCP Server for Claude Code",
    description:
      "Give Claude Code instant access to 122+ engineering rules. Architecture patterns, security reviews, compliance checks — sub-5ms. Open source.",
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
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
                "Open-source MCP server that gives Claude Code instant access to 122+ engineering rules — architecture patterns, security checklists, and compliance checks in under 5ms.",
              url: SITE_URL,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              softwareRequirements: "Claude Code",
              license: "https://opensource.org/licenses/MIT",
              codeRepository:
                "https://github.com/everest-an/AwesomeContext",
              programmingLanguage: ["TypeScript", "Python"],
              featureList: [
                "122+ pre-built engineering rule modules",
                "Sub-5ms semantic retrieval",
                "96% token savings vs raw prompts",
                "Architecture consulting (REST API, microservices, auth patterns)",
                "40+ injectable skills (security review, TDD, Docker, database migrations)",
                "Real-time compliance verification (SQL injection, XSS, OWASP)",
                "Works with Claude Code via Model Context Protocol (MCP)",
                "Cloud hosted or self-hosted with Docker",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is AwesomeContext?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "AwesomeContext is an open-source MCP (Model Context Protocol) server that gives Claude Code instant access to 122+ engineering rules — architecture patterns, security checklists, coding standards, and compliance checks. It retrieves relevant rules in under 5ms with 96% token savings compared to including raw documentation in prompts.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I set up AwesomeContext with Claude Code?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Add the MCP server URL to your Claude Code settings: {\"mcpServers\": {\"awesome-context\": {\"url\": \"https://mcp.awesomecontext.dev/mcp\"}}}. Claude will automatically call get_rules when you start a new session. No installation or API keys required for the cloud version.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What MCP tools does AwesomeContext provide?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "AwesomeContext provides four MCP tools: get_rules (loads project-specific coding standards), architect_consult (retrieves architecture patterns before coding), skill_injector (loads specialized skills like security reviews and TDD workflows), and compliance_verify (checks code against rules before committing).",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is AwesomeContext free to use?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. AwesomeContext is open source under the MIT license. The cloud-hosted version is free to use — just add the MCP server URL to your Claude Code settings. You can also self-host with Docker for full control.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${sans.variable} ${mono.variable} antialiased`} suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
