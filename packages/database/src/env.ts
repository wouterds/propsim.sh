// Raised rather than defaulted: mysql2 falls back to localhost and an undefined
// database, so a missing variable would surface much later as a query against
// nothing rather than here.
export const required = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
};
