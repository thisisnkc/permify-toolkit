export type SchemaAST = {
  entities: Record<string, EntityNode>;
};

export type EntityNode = {
  name: string;
  relations: Record<string, RelationNode>;
  permissions: Record<string, PermissionNode>;
};

export type RelationNode = {
  name: string;
  target: string;
};

export type PermissionNode = {
  name: string;
  expression: string;
};
