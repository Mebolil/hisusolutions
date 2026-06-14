import fs from "node:fs";
import path from "node:path";

const DOMAIN = "https://hisusolutions.com";
const BLOG_DIR = path.resolve("content/blog");
const SITEMAP_PATH = path.resolve("public/sitemap.xml");

const STATIC_URLS = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/butceleme", changefreq: "weekly", priority: "0.9" },
  { loc: "/otomasyon", changefreq: "weekly", priority: "0.9" },
  { loc: "/web-sitesi", changefreq: "weekly", priority: "0.9" },
  { loc: "/uctan-uca-yazilim", lastmod: "2026-05-29", changefreq: "monthly", priority: "0.9" },
  { loc: "/hakkimizda", changefreq: "monthly", priority: "0.7" },
  { loc: "/iletisim", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog", changefreq: "weekly", priority: "0.8" },
];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) {
      result[key.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

const mdxFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith(".mdx"));
const blogUrls = mdxFiles.map(file => {
  const content = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
  const fm = parseFrontmatter(content);
  return {
    loc: `/blog/${fm.slug || file.replace(".mdx", "")}`,
    lastmod: fm.date || undefined,
    changefreq: "monthly",
    priority: "0.7",
  };
});

const allUrls = [...STATIC_URLS, ...blogUrls];

const entries = allUrls.map(u => {
  const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${DOMAIN}${u.loc}</loc>${lastmod}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
}).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

fs.writeFileSync(SITEMAP_PATH, xml);
console.log(`✓ sitemap.xml güncellendi — ${allUrls.length} URL (${blogUrls.length} blog)`);
