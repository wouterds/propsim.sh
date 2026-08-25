type Section = {
  title: string;
  body: string[];
};

type Props = {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
};

const LegalPage = ({ title, updated, intro, sections }: Props) => (
  <>
    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight">{title}</h1>
        <p className="mt-6 max-w-2xl text-muted leading-relaxed">{intro}</p>
        <p className="mt-6 text-[11px] text-faint uppercase tracking-wider">{`Last updated ${updated}`}</p>
      </div>
    </section>

    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl space-y-12">
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="font-semibold text-ink text-lg tracking-tight">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-muted leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default LegalPage;
