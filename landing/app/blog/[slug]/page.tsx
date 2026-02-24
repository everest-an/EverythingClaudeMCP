import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost, getAllSlugs } from "@/lib/blog";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "AwesomeContext" },
    publisher: { "@type": "Organization", name: "AwesomeContext" },
    url: `https://awesomecontext.awareness.market/blog/${post.slug}`,
    keywords: post.tags.join(", "),
  };

  return (
    <>
      <Nav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen px-6 pt-28 pb-20">
        <article className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--foreground)] transition-colors mb-8"
          >
            &larr; Back to blog
          </Link>

          <header className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <time className="text-[12px] text-[var(--text-tertiary)]">
                {post.date}
              </time>
              <span className="text-[12px] text-[var(--text-tertiary)]">
                {post.readingTime} read
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)] leading-7">
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
          </header>

          <div className="glass-card rounded-2xl p-6 md:p-10">
            <div className="space-y-8 text-[14px] text-[var(--text-secondary)] leading-7">
              {post.sections.map((section, i) => (
                <section key={i}>
                  {section.heading && (
                    <h2 className="text-[16px] font-medium text-[var(--foreground)] mb-3">
                      {section.heading}
                    </h2>
                  )}
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className={j > 0 ? "mt-3" : ""}>
                      {p}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 glass-card rounded-2xl p-6 md:p-8 text-center">
            <h3 className="text-[16px] font-medium mb-2">
              Ready to supercharge Claude Code?
            </h3>
            <p className="text-[14px] text-[var(--text-secondary)] mb-4">
              Get free access to 122+ engineering rules, architecture patterns,
              and compliance checks.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-5 py-2 rounded-lg bg-[var(--accent)] text-white text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Get Your Free API Key
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
