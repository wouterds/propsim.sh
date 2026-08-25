type Props = {
  done?: string | null;
  error?: string | null;
};

const Notice = ({ done, error }: Props) => {
  if (error) {
    return (
      <p
        role="alert"
        className="mb-4 rounded border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
      >
        {error}
      </p>
    );
  }

  if (done) {
    return (
      <p className="mb-4 rounded border border-up/40 bg-up/10 px-3 py-2 text-sm text-up">{done}</p>
    );
  }

  return null;
};

export default Notice;
