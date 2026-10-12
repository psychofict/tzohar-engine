/**
 * The empty stand-in for `src/custom/pages.tsx`. The `@custom/*` alias in
 * tsconfig.json tries `src/custom/` first and resolves here when a client repo has
 * no code of its own, which is every repo until a client pays for a page of its
 * own. See ../custom-pages.ts.
 */
import type { CustomPages } from "../custom-pages";

export const customPages: CustomPages = {};
