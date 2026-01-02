export type SchemaAST = {
  entities: Record<string, EntityNode>;
};

export type EntityNode = {
  name: string;
  relations: Record<string, RelationNode>;
  permission: Record<string, PermissionNode>;
  attributes: Record<string, AttributeNode>;
};

export type RelationNode = {
  name: string;
  target: string[];
};

export type AttributeNode = {
  name: string;
  type: string;
};

export type PermissionNode = {
  name: string;
  expression: string;
};
