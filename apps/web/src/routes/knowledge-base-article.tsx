import { ArrowLeft } from "lucide-react";
import { href, Link } from "react-router";
import { categoryOf, findArticle } from "~/lib/knowledge-base";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/knowledge-base-article";

export const loader = ({ params }: Route.LoaderArgs) => {
  const article = findArticle(params.slug);

  if (!article) {
    throw new Response("Not found", { status: 404 });
  }

  return {
    article,
    category: categoryOf(article.slug),
    related: article.related?.flatMap((slug) => findArticle(slug) ?? []) ?? [],
  };
};

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) {
    return [];
  }

  return pageMeta({
    title: `${loaderData.article.title}, propsim.sh`,
    description: loaderData.article.summary,
    path: `/knowledge-base/${loaderData.article.slug}`,
  });
};

const Article = ({ loaderData: { article, category, related } }: Route.ComponentProps) => (
  <section className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="max-w-3xl">
        <Link
          to={href("/knowledge-base")}
          className="inline-flex items-center gap-2 rounded-sm text-faint text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
          {category ? category.title : "Knowledge base"}
        </Link>

        <h1 className="mt-6 font-semibold text-3xl text-ink leading-[1.15] tracking-tight">
          {article.title}
        </h1>
        <p className="mt-5 text-ink leading-relaxed">{article.summary}</p>

        <div className="mt-10 border-line/70 border-t pt-10">
          {article.body.map((paragraph) => (
            <p key={paragraph} className="mt-5 text-muted leading-relaxed first:mt-0">
              {paragraph}
            </p>
          ))}
        </div>

        {related.length > 0 && (
          <div className="mt-14 border-line/70 border-t pt-6">
            <p className="text-[11px] text-faint uppercase tracking-wider">Read next</p>
            <ul className="mt-3 space-y-1.5">
              {related.map((next) => (
                <li key={next.slug}>
                  <Link
                    to={href("/knowledge-base/:slug", { slug: next.slug })}
                    className="rounded-sm text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    {next.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  </section>
);

export default Article;
