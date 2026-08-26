import { Accordion } from "@base-ui/react/accordion";
import { Plus } from "lucide-react";
import { href, Link } from "react-router";
import type { Article } from "~/lib/knowledge-base";

type Props = {
  articles: Article[];
  title: string;
  more?: boolean;
};

const Questions = ({ articles, title, more = false }: Props) => (
  <section className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="max-w-3xl">
        <h2 className="font-semibold text-2xl text-ink tracking-tight">{title}</h2>

        <Accordion.Root className="mt-8 border-line/70 border-t">
          {articles.map((article) => (
            <Accordion.Item key={article.slug} className="border-line/70 border-b">
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between gap-4 py-4 text-left text-muted transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                  {article.title}
                  <Plus
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-faint transition-transform data-[panel-open]:rotate-45"
                    strokeWidth={1.5}
                  />
                </Accordion.Trigger>
              </Accordion.Header>

              <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] data-[ending-style]:h-0 data-[starting-style]:h-0">
                <p className="pb-4 text-muted text-sm leading-relaxed">
                  {article.summary}{" "}
                  <Link
                    to={href("/knowledge-base/:slug", { slug: article.slug })}
                    className="rounded-sm text-accent transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    Read more
                  </Link>
                </p>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        {more && (
          <Link
            to={href("/knowledge-base")}
            className="mt-8 inline-flex rounded-sm text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            Read the knowledge base
          </Link>
        )}
      </div>
    </div>
  </section>
);

export default Questions;
