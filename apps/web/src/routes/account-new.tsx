import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { DEFAULT_PLAN_ID, findPlan, PLANS, planOr } from "@propsim/plans";
import { useState } from "react";
import { Form, href, Link, redirect, useNavigation } from "react-router";
import PlanRules from "~/components/plans/plan-rules";
import { PRIMARY, SECONDARY } from "~/components/ui/button";
import { createAccount } from "~/lib/accounts";
import { formatDollars } from "~/lib/format";
import { PRIVATE } from "~/lib/seo";
import type { Route } from "./+types/account-new";

export const meta: Route.MetaFunction = () => [{ title: "New account, propsim.sh" }, ...PRIVATE];

export const loader = ({ request }: Route.LoaderArgs) => {
  const wanted = new URL(request.url).searchParams.get("plan");

  return { planId: findPlan(wanted)?.id ?? DEFAULT_PLAN_ID };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const form = await request.formData();
  const plan = findPlan(String(form.get("plan") ?? ""));

  if (!plan) {
    return { error: "Pick a plan to carry on." };
  }

  const openedOn = new Date().toISOString().slice(0, 10);
  const account = createAccount(plan.id, openedOn);

  return redirect(href("/accounts/:id", { id: account.id }));
};

const CARD =
  "group flex items-start gap-3 rounded-lg border border-line bg-raised p-4 text-left transition-colors hover:border-line-strong focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent data-[checked]:border-accent";

const NewAccount = ({ loaderData, actionData }: Route.ComponentProps) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const [planId, setPlanId] = useState(loaderData.planId);
  const plan = planOr(planId);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <h1 className="font-semibold text-ink text-xl tracking-tight">New account</h1>
      <p className="mt-2 max-w-xl text-muted text-sm leading-relaxed">
        Every plan is free. They differ in the balance you start with and in how much room the rules
        give you before the account is cut.
      </p>

      <Form method="post" className="mt-8">
        <RadioGroup
          name="plan"
          value={planId}
          onValueChange={(value) => setPlanId(String(value))}
          aria-label="Account plan"
          className="grid gap-3 sm:grid-cols-2"
        >
          {PLANS.map((option) => (
            <Radio.Root key={option.id} value={option.id} className={CARD}>
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-line-strong group-data-[checked]:border-accent"
              >
                <Radio.Indicator className="size-2 rounded-full bg-accent" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-ink">{option.label} Daily</span>
                  <span className="text-faint text-xs tabular">{formatDollars(option.size)}</span>
                </span>
                <span className="mt-1 block text-muted text-xs leading-relaxed">
                  {formatDollars(option.profitTarget)} to pass,{" "}
                  {formatDollars(option.trailingDrawdown)} of trailing room, {option.maxMicros}{" "}
                  micros.
                </span>
              </span>
            </Radio.Root>
          ))}
        </RadioGroup>

        <div className="mt-6 rounded-lg border border-line bg-raised px-4 py-3">
          <p className="text-[11px] text-faint uppercase tracking-wider">
            {plan.label} Daily, the rules
          </p>
          <PlanRules plan={plan} className="mt-2" />
        </div>

        {actionData?.error && (
          <p
            role="alert"
            className="mt-4 rounded border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
          >
            {actionData.error}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={busy} className={PRIMARY}>
            {busy ? "One moment" : "Get free account"}
          </button>

          <Link to={href("/accounts")} className={SECONDARY}>
            Cancel
          </Link>
        </div>
      </Form>
    </main>
  );
};

export default NewAccount;
