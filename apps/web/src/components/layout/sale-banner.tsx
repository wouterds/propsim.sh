import { href, Link } from "react-router";

const SUBJECT = "Acquiring propsim.sh";

const SaleBanner = () => (
  <div className="border-accent/25 border-b bg-accent/10">
    <p className="mx-auto max-w-6xl px-5 py-2 text-center text-sm text-muted sm:px-8">
      propsim.sh is for sale, the brand and the project.{" "}
      <Link
        to={`${href("/contact")}?${new URLSearchParams({ subject: SUBJECT })}`}
        className="rounded-sm font-medium text-ink underline decoration-accent underline-offset-4 transition-colors hover:text-accent focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
      >
        Get in touch to acquire it
      </Link>
    </p>
  </div>
);

export default SaleBanner;
