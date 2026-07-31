import { Fragment, type ReactNode } from "react";
import { splitTex, tokenizeMath, hasTex } from "@tzohar/schema";

export { splitTex, tokenizeMath, hasTex, texToPlain, type TexToken } from "@tzohar/schema";

/**
 * Render inline TeX as React nodes.
 *
 * Returns a plain string unchanged when there is no maths in it, so the
 * overwhelmingly common case costs one regex and allocates nothing.
 */
export function Tex({ children }: { children: string | undefined | null }): ReactNode {
  if (!children) return null;
  if (!hasTex(children)) return children;

  return splitTex(children).map((part, i) => {
    if (!part.math) return <Fragment key={i}>{part.value}</Fragment>;
    return (
      <Fragment key={i}>
        {tokenizeMath(part.value).map((tok, j) => {
          if (tok.kind === "sub") return <sub key={j}>{tok.value}</sub>;
          if (tok.kind === "sup") return <sup key={j}>{tok.value}</sup>;
          return <Fragment key={j}>{tok.value}</Fragment>;
        })}
      </Fragment>
    );
  });
}
