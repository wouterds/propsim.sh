// Throws rather than defaults. mysql2 falls back to localhost and an undefined database.
export const required = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
};
