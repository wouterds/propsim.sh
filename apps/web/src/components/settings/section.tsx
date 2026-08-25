import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

const Section = ({ title, description, children }: Props) => (
  <section className="rounded-lg border border-line bg-raised">
    <div className="border-line/70 border-b px-5 py-4">
      <h2 className="font-medium text-ink">{title}</h2>
      {description && <p className="mt-1 text-faint text-xs leading-relaxed">{description}</p>}
    </div>
    <div className="px-5 py-4">{children}</div>
  </section>
);

export default Section;
