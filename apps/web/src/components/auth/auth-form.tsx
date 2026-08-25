import { Form, useNavigation } from "react-router";
import { type AuthMode, COPY } from "./mode";

const FIELD =
  "h-10 w-full rounded border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors placeholder:text-faint focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent";

const LABEL = "mb-1.5 block text-[11px] text-faint uppercase tracking-wider";

type Props = {
  mode: AuthMode;
  error?: string;
};

const AuthForm = ({ mode, error }: Props) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="mode" value={mode} />

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
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="password" className={LABEL}>
          Password
        </label>
        <input
          key={mode}
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder={mode === "signup" ? "at least 8 characters" : "your password"}
          className={FIELD}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-10 w-full items-center justify-center rounded bg-accent font-medium text-sm text-sunken transition-colors hover:bg-accent/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60"
      >
        {busy ? "One moment" : COPY[mode].submit}
      </button>

      <p className="text-center text-[11px] text-faint leading-relaxed">
        No card, no broker, and no money. The account is simulated and so is every fill.
      </p>
    </Form>
  );
};

export default AuthForm;
