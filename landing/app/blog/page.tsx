import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/lib/blog";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog — AI Coding, MCP Servers & Vibe Coding Tips",
  description:
    "Guides and tutorials on MCP servers, Claude Code, vibe coding, Cursor rules, and AI-assisted development. Level up your AI coding workflow.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <>
      <Nav />
      <main className="min-h-screen px-6 pt-28 pb-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold mb-2">Blog</h1>
          <p className="text-[14px] text-[var(--text-secondary)] mb-12">
            Guides on MCP servers, vibe coding, and AI-assisted development.
          </p>

          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block glass-card rounded-2xl p-6 md:p-8 hover:border-[var(--accent)] transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <time className="text-[12px] text-[var(--text-tertiary)]">
                    {post.date}
                  </time>
                  <span className="text-[12px] text-[var(--text-tertiary)]">
                    {post.readingTime} read
                  </span>
                </div>
                <h2 className="text-lg font-medium mb-2 group-hover:text-[var(--accent)] transition-colors">
                  {post.title}
                </h2>
                <p className="text-[14px] text-[var(--text-secondary)] leading-6">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-0.5 rounded-full glass text-[var(--text-tertiary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
