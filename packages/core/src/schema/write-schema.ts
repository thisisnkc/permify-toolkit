import type { SchemaAST } from "../schema/ast.js";
import { compileToPermify } from "../schema/compiler.js";
import { createPermifyClient } from "../client/index.js";

export async function writeSchemaToPermify(params: {
  endpoint: string;
  tenantId: string;
  ast: SchemaAST;
}) {
  const { endpoint, tenantId, ast } = params;

  if (!endpoint) {
    throw new Error("Endpoint is required");
  }

  if (!tenantId) {
    throw new Error("Tenant ID is required");
  }

  if (!ast) {
    throw new Error("AST is required");
  }

  const client = createPermifyClient(endpoint);
  const compiled = compileToPermify(ast);

  await client.schema.write({
    tenantId: params.tenantId,
    schema: compiled
  });

  return { compiledSchema: compiled };
}
