export type SourcePosition = {
  line: number;
  column: number;
  offset: number;
};

export type SourceRange = {
  start: SourcePosition;
  end: SourcePosition;
};

export type SchemaAST = {
  entities: Record<string, EntityNode>;
};

export type EntityNode = {
  name: string;
  relations: Record<string, RelationNode>;
  permissions: Record<string, PermissionNode>;
  attributes: Record<string, AttributeNode>;
  location?: SourceRange;
  nameLocation?: SourceRange;
};

export type RelationNode = {
  name: string;
  target: string[];
  location?: SourceRange;
  nameLocation?: SourceRange;
  targetLocations?: SourceRange[];
};

export type AttributeNode = {
  name: string;
  type: string;
  location?: SourceRange;
  nameLocation?: SourceRange;
  typeLocation?: SourceRange;
};

export type PermissionNode = {
  name: string;
  expression: string;
  location?: SourceRange;
  nameLocation?: SourceRange;
  expressionLocation?: SourceRange;
};
