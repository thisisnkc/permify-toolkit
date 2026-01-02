import type { SchemaAST } from "./ast.js";

export function compileToPermify(ast: SchemaAST): string {
  let out = "";

  for (const entity of Object.values(ast.entities)) {
    out += `entity ${entity.name} {\n`;

    if (entity.attributes) {
      for (const attr of Object.values(entity.attributes)) {
        out += `  attribute ${attr.name} ${attr.type}\n`;
      }
    }

    for (const rel of Object.values(entity.relations)) {
      out += `  relation ${rel.name} @${rel.target.join(" or ")}\n`;
    }

    for (const perm of Object.values(entity.permission)) {
      out += `  permission ${perm.name} = ${perm.expression}\n`;
    }

    out += `}\n\n`;
  }

  return out.trim();
}
