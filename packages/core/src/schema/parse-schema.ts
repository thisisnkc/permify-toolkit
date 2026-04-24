import type {
  AttributeNode,
  EntityNode,
  PermissionNode,
  RelationNode,
  SchemaAST,
  SourcePosition,
  SourceRange
} from "./ast.js";

export interface SchemaDiagnostic {
  code: string;
  message: string;
  severity: "error" | "warning";
  location?: SourceRange;
}

export interface ParseSchemaResult {
  ast: SchemaAST;
  diagnostics: SchemaDiagnostic[];
}

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TARGET_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*(?:#[A-Za-z_][A-Za-z0-9_]*)?$/;

export function parseSchema(text: string): SchemaAST {
  const result = parseSchemaWithDiagnostics(text);
  const firstError = result.diagnostics.find(
    (diagnostic) => diagnostic.severity === "error"
  );

  if (firstError) {
    throw new Error(firstError.message);
  }

  return result.ast;
}

export function parseSchemaWithDiagnostics(text: string): ParseSchemaResult {
  const source = text.replace(/\r\n/g, "\n");
  const lines = source.split("\n");
  const ast: SchemaAST = { entities: {} };
  const diagnostics: SchemaDiagnostic[] = [];

  let offset = 0;
  let currentEntity: EntityNode | null = null;

  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1;
    const originalLine = lines[index];
    const commentIndex = originalLine.indexOf("//");
    const line =
      commentIndex >= 0 ? originalLine.slice(0, commentIndex) : originalLine;
    const trimmed = line.trim();
    const firstColumn = firstNonWhitespaceColumn(line);

    if (!trimmed) {
      offset += originalLine.length + 1;
      continue;
    }

    if (trimmed === "}") {
      if (!currentEntity) {
        diagnostics.push(
          createDiagnostic(
            "unexpected-closing-brace",
            "Unexpected closing brace",
            "error",
            makeRange(lineNumber, firstColumn, firstColumn + 1, offset)
          )
        );
      } else {
        currentEntity.location = currentEntity.location
          ? {
              start: currentEntity.location.start,
              end: createPosition(lineNumber, firstColumn + 1, offset)
            }
          : undefined;
        currentEntity = null;
      }

      offset += originalLine.length + 1;
      continue;
    }

    if (!currentEntity) {
      currentEntity = parseEntityLine(
        trimmed,
        line,
        lineNumber,
        offset,
        ast,
        diagnostics
      );
      offset += originalLine.length + 1;
      continue;
    }

    parseEntityBodyLine(
      trimmed,
      line,
      lineNumber,
      offset,
      currentEntity,
      diagnostics
    );

    offset += originalLine.length + 1;
  }

  if (currentEntity) {
    diagnostics.push(
      createDiagnostic(
        "unclosed-entity",
        `Entity "${currentEntity.name}" is missing a closing brace`,
        "error",
        currentEntity.nameLocation ?? currentEntity.location
      )
    );
  }

  return { ast, diagnostics };
}

function parseEntityLine(
  trimmed: string,
  line: string,
  lineNumber: number,
  offset: number,
  ast: SchemaAST,
  diagnostics: SchemaDiagnostic[]
): EntityNode | null {
  const inlineMatch = /^entity\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{\s*\}$/.exec(
    trimmed
  );
  const openMatch = /^entity\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{$/.exec(trimmed);

  if (!inlineMatch && !openMatch && /^entity\s+/.test(trimmed)) {
    diagnostics.push(
      createDiagnostic(
        "invalid-entity",
        `Invalid entity declaration: "${trimmed}"`,
        "error",
        makeRange(
          lineNumber,
          firstNonWhitespaceColumn(line),
          line.trimEnd().length + 1,
          offset
        )
      )
    );
    return null;
  }

  if (inlineMatch) {
    registerEntity(inlineMatch[1], true);
    return null;
  }

  if (openMatch) {
    return registerEntity(openMatch[1], false);
  }

  diagnostics.push(
    createDiagnostic(
      "unexpected-top-level-token",
      `Unexpected statement outside entity block: "${trimmed}"`,
      "error",
      makeRange(
        lineNumber,
        firstNonWhitespaceColumn(line),
        line.trimEnd().length + 1,
        offset
      )
    )
  );

  return null;

  function registerEntity(name: string, inlineClosed: boolean): EntityNode {
    const nameColumn = line.indexOf(name) + 1;
    const nameLocation = makeRange(
      lineNumber,
      nameColumn,
      nameColumn + name.length,
      offset
    );
    const existing = ast.entities[name];
    if (existing) {
      diagnostics.push(
        createDiagnostic(
          "duplicate-entity",
          `Entity "${name}" is defined more than once`,
          "error",
          nameLocation
        )
      );
      return existing;
    }

    const entity: EntityNode = {
      name,
      relations: {},
      permissions: {},
      attributes: {},
      nameLocation,
      location: {
        start: createPosition(
          lineNumber,
          firstNonWhitespaceColumn(line),
          offset
        ),
        end: createPosition(
          lineNumber,
          inlineClosed ? line.trimEnd().length + 1 : nameColumn + name.length,
          offset
        )
      }
    };

    ast.entities[name] = entity;
    return entity;
  }
}

function parseEntityBodyLine(
  trimmed: string,
  line: string,
  lineNumber: number,
  offset: number,
  entity: EntityNode,
  diagnostics: SchemaDiagnostic[]
): void {
  if (/^relation\s+/.test(trimmed)) {
    parseRelationLine(trimmed, line, lineNumber, offset, entity, diagnostics);
    return;
  }

  if (/^permission\s+/.test(trimmed)) {
    parsePermissionLine(trimmed, line, lineNumber, offset, entity, diagnostics);
    return;
  }

  if (/^attribute\s+/.test(trimmed)) {
    parseAttributeLine(trimmed, line, lineNumber, offset, entity, diagnostics);
    return;
  }

  diagnostics.push(
    createDiagnostic(
      "unexpected-entity-statement",
      `Unsupported statement inside entity "${entity.name}": "${trimmed}"`,
      "error",
      makeRange(
        lineNumber,
        firstNonWhitespaceColumn(line),
        line.trimEnd().length + 1,
        offset
      )
    )
  );
}

function parseRelationLine(
  trimmed: string,
  line: string,
  lineNumber: number,
  offset: number,
  entity: EntityNode,
  diagnostics: SchemaDiagnostic[]
): void {
  const match = /^relation\s+([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/.exec(trimmed);
  if (!match) {
    diagnostics.push(
      createDiagnostic(
        "invalid-relation",
        `Invalid relation declaration: "${trimmed}"`,
        "error",
        makeRange(
          lineNumber,
          firstNonWhitespaceColumn(line),
          line.trimEnd().length + 1,
          offset
        )
      )
    );
    return;
  }

  const [, name, rawTargets] = match;
  const nameColumn = line.indexOf(name) + 1;
  const nameLocation = makeRange(
    lineNumber,
    nameColumn,
    nameColumn + name.length,
    offset
  );

  if (entity.relations[name]) {
    diagnostics.push(
      createDiagnostic(
        "duplicate-relation",
        `Relation "${entity.name}.${name}" is defined more than once`,
        "error",
        nameLocation
      )
    );
    return;
  }

  const targetStartColumn = line.indexOf(rawTargets, nameColumn - 1) + 1;
  const normalized = rawTargets.replace(/\s+or\s+/g, " ").trim();
  const parts = normalized ? normalized.split(/\s+/).filter(Boolean) : [];
  const targets: string[] = [];
  const targetLocations: SourceRange[] = [];
  let searchColumn = targetStartColumn - 1;

  for (const part of parts) {
    const token = part.startsWith("@") ? part.slice(1) : part;
    const tokenIndex = line.indexOf(part, searchColumn);
    const tokenColumn = tokenIndex + 1;
    const tokenLocation = makeRange(
      lineNumber,
      tokenColumn,
      tokenColumn + part.length,
      offset
    );
    searchColumn = tokenIndex + part.length;

    if (!token) {
      continue;
    }

    if (!TARGET_PATTERN.test(token)) {
      diagnostics.push(
        createDiagnostic(
          "invalid-relation-target",
          `Relation "${entity.name}.${name}" has invalid target "${token}"`,
          "error",
          tokenLocation
        )
      );
      continue;
    }

    targets.push(token);
    targetLocations.push(tokenLocation);
  }

  if (targets.length === 0) {
    diagnostics.push(
      createDiagnostic(
        "missing-relation-target",
        `Relation "${entity.name}.${name}" must declare at least one target`,
        "error",
        nameLocation
      )
    );
    return;
  }

  const relation: RelationNode = {
    name,
    target: targets,
    nameLocation,
    targetLocations,
    location: makeRange(
      lineNumber,
      firstNonWhitespaceColumn(line),
      line.trimEnd().length + 1,
      offset
    )
  };

  entity.relations[name] = relation;
}

function parsePermissionLine(
  trimmed: string,
  line: string,
  lineNumber: number,
  offset: number,
  entity: EntityNode,
  diagnostics: SchemaDiagnostic[]
): void {
  const match = /^permission\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(
    trimmed
  );
  if (!match) {
    diagnostics.push(
      createDiagnostic(
        "invalid-permission",
        `Invalid permission declaration: "${trimmed}"`,
        "error",
        makeRange(
          lineNumber,
          firstNonWhitespaceColumn(line),
          line.trimEnd().length + 1,
          offset
        )
      )
    );
    return;
  }

  const [, name, expression] = match;
  const nameColumn = line.indexOf(name) + 1;
  const nameLocation = makeRange(
    lineNumber,
    nameColumn,
    nameColumn + name.length,
    offset
  );

  if (entity.permissions[name]) {
    diagnostics.push(
      createDiagnostic(
        "duplicate-permission",
        `Permission "${entity.name}.${name}" is defined more than once`,
        "error",
        nameLocation
      )
    );
    return;
  }

  const equalsIndex = line.indexOf("=", nameColumn - 1);
  const expressionIndex = expression
    ? line.indexOf(
        expression,
        equalsIndex >= 0 ? equalsIndex + 1 : nameColumn - 1
      )
    : -1;
  const expressionColumn =
    expressionIndex >= 0
      ? expressionIndex + 1
      : equalsIndex >= 0
        ? equalsIndex + 2
        : nameColumn + name.length;
  const expressionLocation = makeRange(
    lineNumber,
    expressionColumn,
    Math.max(expressionColumn, line.trimEnd().length + 1),
    offset
  );

  if (!expression.trim()) {
    diagnostics.push(
      createDiagnostic(
        "empty-permission-expression",
        `Permission "${entity.name}.${name}" has an empty expression`,
        "error",
        expressionLocation
      )
    );
  } else if (!hasBalancedParentheses(expression)) {
    diagnostics.push(
      createDiagnostic(
        "unbalanced-parentheses",
        `Permission "${entity.name}.${name}" has unbalanced parentheses`,
        "error",
        expressionLocation
      )
    );
  }

  const permission: PermissionNode = {
    name,
    expression,
    nameLocation,
    expressionLocation,
    location: makeRange(
      lineNumber,
      firstNonWhitespaceColumn(line),
      line.trimEnd().length + 1,
      offset
    )
  };

  entity.permissions[name] = permission;
}

function parseAttributeLine(
  trimmed: string,
  line: string,
  lineNumber: number,
  offset: number,
  entity: EntityNode,
  diagnostics: SchemaDiagnostic[]
): void {
  const match =
    /^attribute\s+([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(
      trimmed
    );
  if (!match) {
    diagnostics.push(
      createDiagnostic(
        "invalid-attribute",
        `Invalid attribute declaration: "${trimmed}"`,
        "error",
        makeRange(
          lineNumber,
          firstNonWhitespaceColumn(line),
          line.trimEnd().length + 1,
          offset
        )
      )
    );
    return;
  }

  const [, name, type] = match;
  const nameColumn = line.indexOf(name) + 1;
  const typeColumn = line.lastIndexOf(type) + 1;
  const nameLocation = makeRange(
    lineNumber,
    nameColumn,
    nameColumn + name.length,
    offset
  );

  if (entity.attributes[name]) {
    diagnostics.push(
      createDiagnostic(
        "duplicate-attribute",
        `Attribute "${entity.name}.${name}" is defined more than once`,
        "error",
        nameLocation
      )
    );
    return;
  }

  const attribute: AttributeNode = {
    name,
    type,
    nameLocation,
    typeLocation: makeRange(
      lineNumber,
      typeColumn,
      typeColumn + type.length,
      offset
    ),
    location: makeRange(
      lineNumber,
      firstNonWhitespaceColumn(line),
      line.trimEnd().length + 1,
      offset
    )
  };

  entity.attributes[name] = attribute;
}

function createDiagnostic(
  code: string,
  message: string,
  severity: "error" | "warning",
  location?: SourceRange
): SchemaDiagnostic {
  return { code, message, severity, location };
}

function firstNonWhitespaceColumn(line: string): number {
  const index = line.search(/\S/);
  return index >= 0 ? index + 1 : 1;
}

function hasBalancedParentheses(expression: string): boolean {
  let depth = 0;

  for (const char of expression) {
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }

  return depth === 0;
}

function makeRange(
  line: number,
  startColumn: number,
  endColumn: number,
  lineOffset: number
): SourceRange {
  return {
    start: createPosition(line, startColumn, lineOffset),
    end: createPosition(line, endColumn, lineOffset)
  };
}

function createPosition(
  line: number,
  column: number,
  lineOffset: number
): SourcePosition {
  return {
    line,
    column,
    offset: lineOffset + Math.max(column - 1, 0)
  };
}

export function isValidIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value);
}
