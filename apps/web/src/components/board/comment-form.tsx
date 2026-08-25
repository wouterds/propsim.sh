import { useId } from "react";
import { Form, Link } from "react-router";
import { PRIMARY_SM, SECONDARY_SM } from "~/components/ui/button";

type Props = {
  /** Set when this answers a comment rather than the request itself. */
  parentId?: string;
  label: string;
  placeholder: string;
  submit: string;
  limit: number;
  busy: boolean;
  /** Where cancel goes. A reply box is an address, not a piece of state. */
  cancelTo?: string;
};

const CONTROL =
  "w-full resize-y rounded-lg border border-line bg-sunken px-3 py-2.5 text-ink text-sm outline-hidden transition-colors placeholder:text-faint focus-visible:border-accent focus-visible:ring-[0.5px] focus-visible:ring-accent";

const CommentForm = ({ parentId, label, placeholder, submit, limit, busy, cancelTo }: Props) => {
  const field = useId();

  return (
    <Form method="post">
      <input type="hidden" name="intent" value="comment" />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      <label htmlFor={field} className="sr-only">
        {label}
      </label>
      <textarea
        id={field}
        name="body"
        rows={parentId ? 3 : 4}
        required
        maxLength={limit}
        placeholder={placeholder}
        className={CONTROL}
      />

      <div className="mt-2.5 flex items-center justify-end gap-2">
        {cancelTo && (
          <Link to={cancelTo} preventScrollReset className={SECONDARY_SM}>
            Cancel
          </Link>
        )}

        <button type="submit" disabled={busy} className={PRIMARY_SM}>
          {busy ? "Posting" : submit}
        </button>
      </div>
    </Form>
  );
};

export default CommentForm;
