import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { allPosts, getPost, formatDate, categoryLabels, categoryColors } from "@/lib/blog";
import { Clock, ArrowLeft, User, Calendar, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) return {};
    const { frontmatter: fm } = post;
    const url = `https://hisusolutions.com/blog/${fm.slug}`;
    const ogImage = fm.ogImage ?? "https://hisusolutions.com/og-image.png";

    return {
      meta: [
        { title: `${fm.title} | Hisu Solutions Blog` },
        { name: "description", content: fm.description },
        { name: "keywords", content: fm.keywords.join(", ") },
        { name: "robots", content: "index, follow" },
        { name: "author", content: fm.author },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:title", content: fm.title },
        { property: "og:description", content: fm.description },
        { property: "og:image", content: ogImage },
        { property: "article:published_time", content: fm.date },
        { property: "article:author", content: fm.author },
        { property: "article:section", content: categoryLabels[fm.category] },
        ...(fm.keywords.map((k) => ({ property: "article:tag", content: k }))),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: fm.title,
            description: fm.description,
            url,
            datePublished: fm.date,
            dateModified: fm.date,
            author: {
              "@type": "Person",
              name: fm.author,
              url: "https://hisusolutions.com/hakkimizda",
            },
            publisher: {
              "@type": "Organization",
              name: "Hisu Solutions",
              url: "https://hisusolutions.com",
              logo: {
                "@type": "ImageObject",
                url: "https://hisusolutions.com/favicon.svg",
              },
            },
            image: ogImage,
            keywords: fm.keywords.join(", "),
            inLanguage: "tr-TR",
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
      ],
    };
  },
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  component: BlogPostPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">Yazı bulunamadı</h1>
        <Link to="/blog" className="text-orange-500 hover:underline">
          ← Blog'a dön
        </Link>
      </div>
    </SiteLayout>
  ),
});

const mdxModules = import.meta.glob<{ default: React.ComponentType }>(
  "../../content/blog/*.mdx"
);

function BlogPostPage() {
  const post = Route.useLoaderData();
  const { frontmatter: fm, slug } = post;

  const related = allPosts
    .filter(p => p.slug !== slug && p.frontmatter.category === fm.category)
    .slice(0, 3);

  const modulePath = Object.keys(mdxModules).find((p) =>
    p.endsWith(`/${slug}.mdx`)
  );
  const LazyContent = modulePath
    ? lazy(mdxModules[modulePath] as () => Promise<{ default: React.ComponentType }>)
    : null;

  return (
    <SiteLayout>
      <main className="min-h-screen bg-white">
        {/* Back */}
        <div className="border-b border-neutral-100 bg-neutral-50 py-3">
          <div className="mx-auto max-w-3xl px-6">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Blog
            </Link>
          </div>
        </div>

        {/* Header */}
        <header className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${categoryColors[fm.category]}`}
            >
              {categoryLabels[fm.category]}
            </span>
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <Clock className="h-3 w-3" />
              {fm.readingTime} dk okuma
            </span>
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-neutral-900 md:text-4xl">
            {fm.title}
          </h1>

          <p className="mb-6 text-lg text-neutral-500">{fm.description}</p>

          <div className="flex flex-wrap items-center gap-4 border-t border-neutral-100 pt-6 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {fm.author}
            </span>
            <time
              dateTime={fm.date}
              className="flex items-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(fm.date)}
            </time>
          </div>
        </header>

        {/* Content */}
        <article className="mx-auto max-w-3xl px-6 pb-16">
          <div className="prose prose-neutral prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline prose-strong:text-neutral-900 prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none">
            {LazyContent ? (
              <Suspense
                fallback={
                  <div className="animate-pulse space-y-4 py-8">
                    <div className="h-4 w-3/4 rounded bg-neutral-100" />
                    <div className="h-4 w-full rounded bg-neutral-100" />
                    <div className="h-4 w-5/6 rounded bg-neutral-100" />
                  </div>
                }
              >
                <LazyContent />
              </Suspense>
            ) : (
              <p className="text-neutral-400">İçerik yüklenemedi.</p>
            )}
          </div>
        </article>

        {/* İlgili Yazılar */}
        {related.length > 0 && (
          <section className="border-t border-neutral-100 mx-auto max-w-3xl px-6 py-10">
            <h3 className="text-lg font-bold text-neutral-900 mb-5">İlgili Yazılar</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map(r => (
                <Link key={r.slug} to="/blog/$slug" params={{ slug: r.slug }}
                  className="rounded-xl border border-neutral-100 p-4 text-sm hover:border-neutral-300 transition-colors">
                  <span className="text-xs text-neutral-400 block mb-1">{r.frontmatter.readingTime} dk okuma</span>
                  <span className="font-medium text-neutral-900 line-clamp-2">{r.frontmatter.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <aside className="border-t border-neutral-100 bg-gradient-to-br from-orange-50 to-white py-12">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
              <h2 className="mb-2 text-xl font-bold text-neutral-900">
                Pusla ile Reklam ROAS'ınızı Takip Edin
              </h2>
              <p className="mb-6 text-neutral-500">
                Trendyol, Meta ve Google reklamlarınızı tek panelde görün.
                Komisyon, kargo ve reklam maliyetlerini hesaba katarak gerçek kâr
                marjınızı anlık izleyin. 30 gün ücretsiz, kredi kartı gerekmez.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/pusla"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  Ücretsiz Dene <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:border-neutral-300 transition-colors"
                >
                  Tüm Yazılar
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </SiteLayout>
  );
}
