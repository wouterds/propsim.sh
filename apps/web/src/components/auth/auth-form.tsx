import { Field } from "@base-ui/react/field";
import { useRef, useState } from "react";
import { Form, useNavigation } from "react-router";
import { type AuthMode, COPY } from "./mode";

const CONTROL =
  "h-10 w-full rounded border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors placeholder:text-faint focus-visible:border-accent focus-visible:ring-[0.5px] focus-visible:ring-accent";

const LABEL = "mb-1.5 block text-[11px] text-faint uppercase tracking-wider";

type Props = {
  mode: AuthMode;
  error?: string;
  /** Answers whether this submit may go through now. See `useSignupNotice`. */
  gate: (go: () => void) => boolean;
};

const AuthForm = ({ mode, error, gate }: Props) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const [password, setPassword] = useState("");
  const form = useRef<HTMLFormElement>(null);

  // Signing up asks for it twice, but only once there is something to confirm.
  const confirming = mode === "signup" && password.length > 0;

  return (
    <Form
      method="post"
      ref={form}
      className="space-y-3"
      onSubmit={(event) => {
        // Held rather than cancelled. Confirming the notice submits this same
        // form again, and the gate waves the second one through.
        if (!gate(() => form.current?.requestSubmit())) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="mode" value={mode} />

      <Field.Root className="block">
        <Field.Label className={LABEL}>Email</Field.Label>
        <Field.Control
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={CONTROL}
        />
        <Field.Error className="mt-1.5 block text-down text-xs" />
      </Field.Root>

      <Field.Root className="block">
        <Field.Label className={LABEL}>Password</Field.Label>
        <Field.Control
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder={mode === "signup" ? "at least 8 characters" : "your password"}
          className={CONTROL}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Field.Error className="mt-1.5 block text-down text-xs" />
      </Field.Root>

      {confirming && (
        <Field.Root className="block animate-fade-in">
          <Field.Label className={LABEL}>Confirm password</Field.Label>
          <Field.Control
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="the same one again"
            className={CONTROL}
          />
          <Field.Error className="mt-1.5 block text-down text-xs" />
        </Field.Root>
      )}

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
        className="inline-flex h-10 w-full items-center justify-center rounded bg-accent-strong font-medium text-sm text-white transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60"
      >
        {busy ? "One moment" : COPY[mode].submit}
      </button>
    </Form>
  );
};

export default AuthForm;
