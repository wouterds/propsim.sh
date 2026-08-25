import { Form } from "react-router";
import DeviceIcon from "~/components/settings/device-icon";
import Badge from "~/components/ui/badge";

export type SessionRow = {
  id: string;
  current: boolean;
  label: string;
  kind: string | null;
  place: string | null;
  lastSeen: string;
  since: string;
};

type Props = {
  sessions: SessionRow[];
  /** The session being signed out, so the other rows stay usable. */
  revoking: string | null;
};

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const SessionList = ({ sessions, revoking }: Props) => (
  <ul className="divide-y divide-line/60">
    {sessions.map((session) => (
      <li key={session.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
        <span className="mt-0.5">
          <DeviceIcon kind={session.kind} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-ink text-sm">{session.label}</p>
            {session.current && <Badge tone="up">This device</Badge>}
          </div>
          <p className="mt-0.5 text-faint text-xs">
            {session.place ? `${session.place} · ` : ""}
            {session.lastSeen}
          </p>
          <p className="mt-0.5 text-faint text-xs">Signed in {session.since}</p>
        </div>

        {!session.current && (
          <Form method="post" className="shrink-0">
            <input type="hidden" name="intent" value="revoke" />
            <input type="hidden" name="session" value={session.id} />
            <button
              type="submit"
              disabled={revoking === session.id}
              className={`inline-flex h-8 items-center rounded border border-line px-3 text-muted text-xs transition-colors hover:border-line-strong hover:text-ink disabled:opacity-60 ${FOCUS}`}
            >
              Sign out
            </button>
          </Form>
        )}
      </li>
    ))}
  </ul>
);

export default SessionList;
