export interface BlogFrontmatter {
  title: string;
  description: string;
  slug: string;
  date: string;
  category: "reklam" | "bütçe" | "ürün";
  keywords: string[];
  readingTime: number;
  author: string;
  ogImage?: string;
}

export interface BlogPost {
  frontmatter: BlogFrontmatter;
  slug: string;
}

const modules = import.meta.glob<{ frontmatter: BlogFrontmatter }>(
  "../../content/blog/*.mdx",
  { eager: true }
);

export const allPosts: BlogPost[] = Object.entries(modules)
  .map(([path, mod]) => {
    const slug = path.split("/").pop()!.replace(".mdx", "");
    return { frontmatter: mod.frontmatter, slug };
  })
  .sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );

export function getPost(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const categoryLabels: Record<BlogFrontmatter["category"], string> = {
  reklam: "Reklam & ROAS",
  bütçe: "Bütçe Yönetimi",
  ürün: "BütçeCRM",
};

export const categoryColors: Record<BlogFrontmatter["category"], string> = {
  reklam: "bg-orange-100 text-orange-700",
  bütçe: "bg-blue-100 text-blue-700",
  ürün: "bg-violet-100 text-violet-700",
};
