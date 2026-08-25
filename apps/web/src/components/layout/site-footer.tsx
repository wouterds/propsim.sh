import Brand from "~/components/layout/brand";

const SiteFooter = () => (
  <footer className="border-line/70 border-t">
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <Brand className="text-[15px] text-ink" />
      <p className="mt-3 max-w-sm text-faint text-sm leading-relaxed">
        A prop trading simulator. Live market data on a short delay, simulated fills, and no real
        money.
      </p>
    </div>

    <div className="border-line/70 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-faint text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Simulated fills against delayed market data. Not a broker and not investment advice.</p>
        <p className="tabular">© 2026 propsim.sh</p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
