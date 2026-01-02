import type { SchemaAST } from "./ast";

export function compileToPermify(ast: SchemaAST): string {
  return JSON.stringify(ast, null, 2);
}
