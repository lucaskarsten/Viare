import { visit } from "unist-util-visit";

// Transforms :::directive{} containers and ::directive{} leaves into div[data-block] for ReactMarkdown component mapping.
export function remarkBlocks() {
  return (tree: unknown) => {
    visit(tree as Parameters<typeof visit>[0], (node: unknown) => {
      const n = node as Record<string, unknown>;
      if (n.type !== "containerDirective" && n.type !== "leafDirective") return;
      const data = (n.data as Record<string, unknown>) ?? {};
      n.data = data;
      const attrs = (n.attributes as Record<string, string | undefined>) ?? {};
      data.hName = "div";
      data.hProperties = {
        "data-block": n.name as string,
        ...(attrs.type ? { "data-type": attrs.type } : {}),
        ...(attrs.id ? { "data-id": attrs.id } : {}),
      };
    });
  };
}
