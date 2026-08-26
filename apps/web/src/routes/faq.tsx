import { href, redirect } from "react-router";

/**
 * The questions moved into the knowledge base. Permanent, so the address that
 * was linked and indexed for months keeps its weight instead of dropping.
 */
export const loader = () => redirect(href("/knowledge-base"), 301);
