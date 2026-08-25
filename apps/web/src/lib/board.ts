const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_SLUG = 60;

export const isUuid = (value: string) => UUID.test(value);

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG)
    .replace(/-+$/, "");

/**
 * The id leads, so a title can be edited without breaking the address it was
 * shared under, and the rest is there for whoever reads the link.
 */
export const featurePath = (id: string, title: string) => {
  const slug = slugify(title);

  return slug ? `/features/${id}-${slug}` : `/features/${id}`;
};

/** The id back out of that address, or nothing when it was never one of ours. */
export const featureIdOf = (slug: string) => {
  const id = slug.slice(0, 36).toLowerCase();

  return isUuid(id) ? id : null;
};
