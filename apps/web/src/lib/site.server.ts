/** Where the site answers. Built from configuration, never from the Host header. */
export const siteUrl = () => process.env.PUBLIC_URL ?? "http://localhost:5173";
