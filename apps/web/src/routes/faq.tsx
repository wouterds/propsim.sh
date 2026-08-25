import Questions from "~/components/marketing/questions";
import { FAQ } from "~/lib/faq";
import type { Route } from "./+types/faq";

export const meta: Route.MetaFunction = () => [
  { title: "FAQ, propsim.sh" },
  {
    name: "description",
    content:
      "What propsim.sh is, where the prices come from, how the loss limits work, and what happens when you breach an account.",
  },
];

const Faq = () => (
  <>
    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 pt-20 pb-10 sm:px-8">
        <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight">Questions</h1>
        <p className="mt-6 max-w-2xl text-muted leading-relaxed">
          If something here is unclear, it is a fault in the writing. Say so and it gets fixed.
        </p>
      </div>
    </section>

    {FAQ.map((group) => (
      <Questions key={group.title} title={group.title} questions={group.questions} />
    ))}
  </>
);

export default Faq;
