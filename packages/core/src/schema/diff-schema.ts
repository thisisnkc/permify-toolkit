import type { SchemaEntityMap } from "./read-schema.js";

export interface EntityDiff {
  name: string;
  relations: Record<string, string>;
  permissions: Record<string, string>;
}

export interface ModifiedEntityDiff {
  name: string;
  relations: { added: string[]; removed: string[]; changed: string[] };
  permissions: { added: string[]; removed: string[]; changed: string[] };
}

export interface SchemaDiffResult {
  hasChanges: boolean;
  added: EntityDiff[];
  removed: EntityDiff[];
  modified: ModifiedEntityDiff[];
}

/**
 * Computes a structural diff between two schema entity maps.
 * @param local - The local (source) schema entities
 * @param remote - The remote (target) schema entities
 */
export function diffSchema(
  local: SchemaEntityMap,
  remote: SchemaEntityMap
): SchemaDiffResult {
  const localNames = new Set(Object.keys(local));
  const remoteNames = new Set(Object.keys(remote));

  const added: EntityDiff[] = [];
  const removed: EntityDiff[] = [];
  const modified: ModifiedEntityDiff[] = [];

  for (const name of localNames) {
    if (!remoteNames.has(name)) {
      added.push({
        name,
        relations: local[name].relations,
        permissions: local[name].permissions
      });
    }
  }

  for (const name of remoteNames) {
    if (!localNames.has(name)) {
      removed.push({
        name,
        relations: remote[name].relations,
        permissions: remote[name].permissions
      });
    }
  }

  for (const name of localNames) {
    if (!remoteNames.has(name)) continue;

    const l = local[name];
    const r = remote[name];

    const lRelKeys = Object.keys(l.relations);
    const rRelKeys = Object.keys(r.relations);
    const relAdded = lRelKeys.filter((k) => !(k in r.relations));
    const relRemoved = rRelKeys.filter((k) => !(k in l.relations));
    const relChanged = lRelKeys.filter(
      (k) => k in r.relations && l.relations[k] !== r.relations[k]
    );

    const lPermKeys = Object.keys(l.permissions);
    const rPermKeys = Object.keys(r.permissions);
    const permAdded = lPermKeys.filter((k) => !(k in r.permissions));
    const permRemoved = rPermKeys.filter((k) => !(k in l.permissions));
    const permChanged = lPermKeys.filter(
      (k) => k in r.permissions && l.permissions[k] !== r.permissions[k]
    );

    if (
      relAdded.length ||
      relRemoved.length ||
      relChanged.length ||
      permAdded.length ||
      permRemoved.length ||
      permChanged.length
    ) {
      modified.push({
        name,
        relations: {
          added: relAdded,
          removed: relRemoved,
          changed: relChanged
        },
        permissions: {
          added: permAdded,
          removed: permRemoved,
          changed: permChanged
        }
      });
    }
  }

  const hasChanges =
    added.length > 0 || removed.length > 0 || modified.length > 0;

  return { hasChanges, added, removed, modified };
}

/**
 * Generates a unified text diff between two DSL strings.
 * Returns an empty string if both are identical.
 */
export function textDiff(
  localDsl: string,
  remoteDsl: string,
  localLabel: string,
  remoteLabel: string
): string {
  const localLines = localDsl.split("\n");
  const remoteLines = remoteDsl.split("\n");

  if (localDsl === remoteDsl) return "";

  const lcs = computeLcs(remoteLines, localLines);
  const hunks = buildHunks(remoteLines, localLines, lcs, 3);

  if (hunks.length === 0) return "";

  const output: string[] = [`--- ${remoteLabel}`, `+++ ${localLabel}`];

  for (const hunk of hunks) {
    output.push(hunk.header);
    output.push(...hunk.lines);
  }

  return output.join("\n");
}

interface Hunk {
  header: string;
  lines: string[];
}

function computeLcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from<number>({ length: n + 1 }).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp;
}

function buildHunks(
  a: string[],
  b: string[],
  dp: number[][],
  context: number
): Hunk[] {
  const edits: Array<{
    type: " " | "-" | "+";
    aIdx: number;
    bIdx: number;
    text: string;
  }> = [];

  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      edits.unshift({ type: " ", aIdx: i - 1, bIdx: j - 1, text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      edits.unshift({ type: "+", aIdx: i, bIdx: j - 1, text: b[j - 1] });
      j--;
    } else {
      edits.unshift({ type: "-", aIdx: i - 1, bIdx: j, text: a[i - 1] });
      i--;
    }
  }

  const changeIndices = edits
    .map((e, idx) => (e.type !== " " ? idx : -1))
    .filter((idx) => idx >= 0);

  if (changeIndices.length === 0) return [];

  const hunks: Hunk[] = [];
  let hunkStart = Math.max(0, changeIndices[0] - context);
  let hunkEnd = Math.min(edits.length - 1, changeIndices[0] + context);

  for (let ci = 1; ci < changeIndices.length; ci++) {
    const nextStart = Math.max(0, changeIndices[ci] - context);
    const nextEnd = Math.min(edits.length - 1, changeIndices[ci] + context);

    if (nextStart <= hunkEnd + 1) {
      hunkEnd = nextEnd;
    } else {
      hunks.push(buildSingleHunk(edits, hunkStart, hunkEnd));
      hunkStart = nextStart;
      hunkEnd = nextEnd;
    }
  }

  hunks.push(buildSingleHunk(edits, hunkStart, hunkEnd));
  return hunks;
}

function buildSingleHunk(
  edits: Array<{ type: " " | "-" | "+"; text: string }>,
  start: number,
  end: number
): Hunk {
  let aStart = 1;
  let bStart = 1;
  let aCount = 0;
  let bCount = 0;

  for (let i = 0; i < start; i++) {
    if (edits[i].type !== "+") aStart++;
    if (edits[i].type !== "-") bStart++;
  }

  const lines: string[] = [];
  for (let i = start; i <= end; i++) {
    lines.push(`${edits[i].type}${edits[i].text}`);
    if (edits[i].type !== "+") aCount++;
    if (edits[i].type !== "-") bCount++;
  }

  return {
    header: `@@ -${aStart},${aCount} +${bStart},${bCount} @@`,
    lines
  };
}
