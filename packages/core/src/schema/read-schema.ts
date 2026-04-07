import { createPermifyClient } from "../client/index.js";

export interface ReadSchemaParams {
  tenantId: string;
  client?: any;
  endpoint?: string;
}

export interface SchemaEntityMap {
  [entityName: string]: {
    relations: Record<string, string>;
    permissions: Record<string, string>;
  };
}

export interface ReadSchemaResult {
  /** Raw schema DSL string, or null if no schema exists on the server */
  schema: string | null;
  /** Flat entity map for diffing */
  entities: SchemaEntityMap;
}

/**
 * Reads the current schema from a Permify server for a given tenant.
 * Returns a flat entity map and a reconstructed DSL string.
 */
export async function readSchemaFromPermify(
  params: ReadSchemaParams
): Promise<ReadSchemaResult> {
  if (!params.client && !params.endpoint) {
    throw new Error("Either endpoint or client must be provided");
  }
  if (!params.tenantId) {
    throw new Error("Tenant ID is required");
  }

  const client =
    params.client || createPermifyClient({ endpoint: params.endpoint! });

  let schemaVersion: string;
  try {
    const listResponse = await client.schema.list({
      tenantId: params.tenantId,
      pageSize: 1
    });
    if (!listResponse.head) {
      return { schema: null, entities: {} };
    }
    schemaVersion = listResponse.head;
  } catch {
    return { schema: null, entities: {} };
  }

  const response = await client.schema.read({
    tenantId: params.tenantId,
    metadata: { schemaVersion }
  });

  if (!response.schema?.entityDefinitions) {
    return { schema: null, entities: {} };
  }

  const entities: SchemaEntityMap = {};
  const dslParts: string[] = [];

  for (const [name, def] of Object.entries<any>(
    response.schema.entityDefinitions
  )) {
    const relations: Record<string, string> = {};
    for (const [relName, relDef] of Object.entries<any>(def.relations || {})) {
      relations[relName] = extractRelationTypes(relDef);
    }

    const permissions: Record<string, string> = {};
    for (const [permName, permDef] of Object.entries<any>(
      def.permissions || {}
    )) {
      permissions[permName] = reconstructPermissionExpr(permDef);
    }

    entities[name] = { relations, permissions };

    dslParts.push(reconstructEntityDsl(name, def));
  }

  return {
    schema: dslParts.join("\n\n"),
    entities
  };
}

function reconstructEntityDsl(name: string, def: any): string {
  const lines: string[] = [`entity ${name} {`];

  if (def.relations) {
    for (const [relName, relDef] of Object.entries<any>(def.relations)) {
      const types = extractRelationTypes(relDef);
      lines.push(`    relation ${relName} ${types}`);
    }
  }

  if (def.permissions) {
    for (const [permName, permDef] of Object.entries<any>(def.permissions)) {
      const expr = reconstructPermissionExpr(permDef);
      lines.push(`    permission ${permName} = ${expr}`);
    }
  }

  lines.push("}");
  return lines.join("\n");
}

function extractRelationTypes(relDef: any): string {
  if (!relDef.relationReferences?.length) return "@unknown";

  return relDef.relationReferences
    .map((ref: any) => {
      const base = `@${ref.type}`;
      return ref.relation ? `${base}#${ref.relation}` : base;
    })
    .join(" or ");
}

function reconstructPermissionExpr(permDef: any): string {
  if (!permDef.child) return "unknown";
  return reconstructNode(permDef.child);
}

function reconstructNode(node: any): string {
  if (!node) return "unknown";

  if (node.leaf) {
    const leaf = node.leaf;
    if (leaf.computedUserSet) {
      return leaf.computedUserSet.relation || "unknown";
    }
    if (leaf.tupleToUserSet) {
      const ttu = leaf.tupleToUserSet;
      return `${ttu.tupleSet?.relation || "unknown"}.${ttu.computed?.relation || "unknown"}`;
    }
    if (leaf.computedAttribute) {
      return leaf.computedAttribute.name || "unknown";
    }
  }

  if (node.rewrite) {
    const rewrite = node.rewrite;
    const children = rewrite.children || [];

    if (rewrite.rewriteOperation === "OPERATION_UNION") {
      return children.map(reconstructNode).join(" or ");
    }
    if (rewrite.rewriteOperation === "OPERATION_INTERSECTION") {
      return children.map(reconstructNode).join(" and ");
    }
    if (rewrite.rewriteOperation === "OPERATION_EXCLUSION") {
      return children.map(reconstructNode).join(" not ");
    }
  }

  return "unknown";
}
