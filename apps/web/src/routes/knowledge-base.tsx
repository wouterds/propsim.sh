import { ArrowRight } from "lucide-react";
import { href, Link } from "react-router";
import { CATEGORIES } from "~/lib/knowledge-base";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/knowledge-base";

export const meta: Route.MetaFunction = () => [
  ...pageMeta({
    title: "Knowledge base, propsim.sh",
    description:
      "What propsim.sh is, where the prices come from, how the two loss limits differ, what commission costs you, and every place this differs from a real funded account.",
    path: "/knowledge-base",
  }),
];

const KnowledgeBase = () => (
  <>
    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 pt-20 pb-10 sm:px-8">
        <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight">
          Knowledge base
        </h1>
        <p className="mt-6 max-w-2xl text-muted leading-relaxed">
          Everything the simulator does and every place it falls short of the real thing. If
          something here is unclear, it is a fault in the writing. Say so and it gets fixed.
        </p>

        <nav
          aria-label="Categories"
          className="mt-10 grid max-w-3xl gap-6 border-line/70 border-t pt-6 sm:grid-cols-2"
        >
          {CATEGORIES.map((category) => (
            <div key={category.slug}>
              <a
                href={`#${category.slug}`}
                className="rounded-sm text-ink text-sm transition-colors hover:text-accent focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
              >
                {category.title}
              </a>
              <p className="mt-1 text-faint text-sm leading-relaxed">{category.description}</p>
            </div>
          ))}
        </nav>
      </div>
    </section>

    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl space-y-16">
          {CATEGORIES.map((category) => (
            <section key={category.slug} id={category.slug} className="scroll-mt-20">
              <h2 className="font-semibold text-2xl text-ink tracking-tight">{category.title}</h2>
              <p className="mt-3 text-muted leading-relaxed">{category.description}</p>

              <ul className="mt-8 border-line/70 border-t">
                {category.articles.map((article) => (
                  <li key={article.slug} className="border-line/70 border-b">
                    <Link
                      to={href("/knowledge-base/:slug", { slug: article.slug })}
                      className="group flex items-start gap-4 py-4 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-ink transition-colors group-hover:text-accent">
                          {article.title}
                        </span>
                        <span className="mt-1 block text-faint text-sm leading-relaxed">
                          {article.summary}
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default KnowledgeBase;
