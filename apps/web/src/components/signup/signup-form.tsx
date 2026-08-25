import { type FormEvent, useState } from "react";
import { href, useNavigate } from "react-router";

const FIELD =
  "h-10 w-full rounded border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors placeholder:text-faint focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent";

const LABEL = "mb-1.5 block text-[11px] text-faint uppercase tracking-wider";

const SignupForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Nothing is created and nothing is stored. The form exists so the shape of
  // the product is right, and the door opens for whatever gets typed into it.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(href("/dashboard"));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className={LABEL}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@desk.example"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="password" className={LABEL}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="anything at all"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={FIELD}
        />
      </div>

      <button
        type="submit"
        className="inline-flex h-10 w-full items-center justify-center rounded bg-accent font-medium text-sm text-sunken transition-colors hover:bg-accent/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
      >
        Create a desk
      </button>

      <p className="text-center text-[11px] text-faint leading-relaxed">
        No card, no broker, and no money. The account is simulated and so is every fill.
      </p>
    </form>
  );
};

export default SignupForm;
