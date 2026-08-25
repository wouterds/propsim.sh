import { Accordion } from "@base-ui/react/accordion";
import { href, Link } from "react-router";
import type { Question } from "~/lib/faq";

type Props = {
  questions: Question[];
  title: string;
  more?: boolean;
};

const Questions = ({ questions, title, more = false }: Props) => (
  <section className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="max-w-3xl">
        <h2 className="font-semibold text-2xl text-ink tracking-tight">{title}</h2>

        <Accordion.Root className="mt-8 border-line/70 border-t">
          {questions.map((question) => (
            <Accordion.Item key={question.q} className="border-line/70 border-b">
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between gap-4 py-4 text-left text-ink transition-colors hover:text-muted focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                  {question.q}
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="size-3 shrink-0 text-faint transition-transform data-[panel-open]:rotate-45"
                  >
                    <path
                      d="M8 3v10M3 8h10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </Accordion.Trigger>
              </Accordion.Header>

              <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] data-[ending-style]:h-0 data-[starting-style]:h-0">
                <p className="pb-4 text-muted text-sm leading-relaxed">{question.a}</p>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        {more && (
          <Link
            to={href("/faq")}
            className="mt-8 inline-flex rounded-sm text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            Read every question
          </Link>
        )}
      </div>
    </div>
  </section>
);

export default Questions;
