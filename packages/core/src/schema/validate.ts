import type { SchemaAST } from "./ast";

export function validateSchema(ast: SchemaAST) {
  for (const entity of Object.values(ast.entities)) {
    for (const relation of Object.values(entity.relations)) {
      if (!ast.entities[relation.target]) {
        throw new Error(
          `Entity "${relation.target}" referenced in relation "${entity.name}.${relation.name}" does not exist`
        );
      }
    }
  }
}
