import { Avatar } from "~/components/identity/avatar";
import type { Persona } from "~/components/identity/persona";

type Props = {
  author: Persona;
  since: string;
  size?: number;
};

const Byline = ({ author, since, size = 26 }: Props) => (
  <div className="flex items-center gap-2.5">
    <Avatar persona={author} size={size} />

    <p className="text-xs">
      <span className="text-muted">{author.name}</span>
      <span className="text-faint">{` · ${since}`}</span>
    </p>
  </div>
);

export default Byline;
