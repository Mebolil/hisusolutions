import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  allPosts,
  formatDate,
  categoryLabels,
  categoryColors,
} from "@/lib/blog";
import { Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      {
        title:
          "Blog — Pusla & E-Ticaret Reklam Yönetimi | Hisu Solutions",
      },
      {
        name: "description",
        content:
          "Trendyol, Meta ve Google reklamlarında ROAS takibi, kâr marjı hesaplama ve e-ticaret bütçe yönetimi üzerine uzman yazılar. Pusla ile nasıl çalışırsınız?",
      },
      { name: "robots", content: "index, follow" },
      {
        property: "og:title",
        content: "Blog — Pusla & E-Ticaret Reklam Yönetimi | Hisu Solutions",
      },
      {
        property: "og:description",
        content:
          "E-ticaret satıcıları için reklam ROAS takibi, kâr marjı ve bütçe yönetimi üzerine pratik rehberler.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/blog" },
    ],
    links: [{ rel: "canonical", href: "https://hisusolutions.com/blog" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Hisu Solutions Blog",
          description:
            "E-ticaret reklam yönetimi, ROAS takibi ve Pusla üzerine uzman içerikler",
          url: "https://hisusolutions.com/blog",
          publisher: {
            "@type": "Organization",
            name: "Hisu Solutions",
            url: "https://hisusolutions.com",
          },
        }),
      },
    ],
  }),
  component: BlogListPage,
});

function BlogListPage() {
  return (
    <SiteLayout>
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="border-b border-neutral-100 bg-gradient-to-b from-neutral-50 to-white py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-500">
              Hisu Solutions Blog
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
              E-Ticaret Reklam Yönetimi<br />
              <span className="text-orange-500">ve Pusla Rehberleri</span>
            </h1>
            <p className="max-w-xl text-lg text-neutral-500">
              Trendyol, Meta ve Google reklamlarında ROAS takibi, kâr marjı
              hesaplama ve bütçe yönetimi üzerine pratik yazılar.
            </p>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {allPosts.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[post.frontmatter.category]}`}
                  >
                    {categoryLabels[post.frontmatter.category]}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-neutral-400">
                    <Clock className="h-3 w-3" />
                    {post.frontmatter.readingTime} dk okuma
                  </span>
                </div>

                <h2 className="mb-2 flex-1 text-base font-semibold leading-snug text-neutral-900 group-hover:text-orange-500 transition-colors">
                  <Link to="/blog/$slug" params={{ slug: post.slug }}>
                    {post.frontmatter.title}
                  </Link>
                </h2>

                <p className="mb-4 text-sm text-neutral-500 line-clamp-2">
                  {post.frontmatter.description}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-neutral-50 pt-4">
                  <time
                    dateTime={post.frontmatter.date}
                    className="text-xs text-neutral-400"
                  >
                    {formatDate(post.frontmatter.date)}
                  </time>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                  >
                    Oku <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-neutral-100 bg-neutral-50 py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="mb-3 text-2xl font-bold text-neutral-900">
              Pusla'i Ücretsiz Deneyin
            </h2>
            <p className="mb-6 text-neutral-500">
              30 gün ücretsiz, kredi kartı gerekmez. Reklam ROAS'ınızı ve kâr
              marjınızı tek ekranda görün.
            </p>
            <Link
              to="/pusla"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Hemen Başla <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
