import fs from "node:fs";
import { Flags } from "@oclif/core";
import {
  readSchemaFromPermify,
  diffSchema,
  textDiff,
  type SchemaEntityMap,
  type SchemaDiffResult
} from "@permify-toolkit/core";

import { BaseCommand } from "../../base.js";
import { loadSchemaFromConfig, validateSchemaFile } from "../../helpers.js";

export default class SchemaDiff extends BaseCommand {
  static description =
    "Preview what will change before pushing a schema update";

  static args = {};

  static flags = {
    ...BaseCommand.baseFlags,
    verbose: Flags.boolean({
      char: "v",
      description: "Show raw unified text diff after structural summary",
      default: false
    }),
    "exit-code": Flags.boolean({
      char: "e",
      description: "Exit with code 1 if changes are detected (for CI)",
      default: false
    }),
    source: Flags.string({
      char: "s",
      description:
        "Path to a .perm file to compare against (local-vs-local mode, skips remote)",
      required: false
    })
  };

  async run() {
    const { flags } = await this.parse(SchemaDiff);

    const { client, config } = await this.clientFromConfig();

    let localDsl: string;
    try {
      localDsl = loadSchemaFromConfig(config.schema);
    } catch (err: any) {
      this.error(`Failed to load schema: ${err.message}`);
    }

    const localEntities = parseEntitiesFromDsl(localDsl);
    const tenantId = this.resolveTenant(flags, config);

    let remoteDsl: string;
    let remoteEntities: SchemaEntityMap;
    let remoteLabel: string;

    if (flags.source) {
      const fullPath = validateSchemaFile(flags.source);
      remoteDsl = fs.readFileSync(fullPath, "utf-8");
      remoteEntities = parseEntitiesFromDsl(remoteDsl);
      remoteLabel = `source (${flags.source})`;
    } else {
      const remote = await readSchemaFromPermify({ tenantId, client });
      remoteDsl = remote.schema ?? "";
      remoteEntities = remote.entities;
      remoteLabel = `remote (tenant: ${tenantId})`;
    }

    const result = diffSchema(localEntities, remoteEntities);

    if (!result.hasChanges) {
      this.log(
        `\x1B[32m✔ Schema is up to date — no changes detected\x1B[0m (tenant: ${tenantId})`
      );
      return;
    }

    const isFirstTime = !flags.source && remoteDsl === "";
    this.renderStructuralDiff(result, tenantId, isFirstTime);

    if (flags.verbose) {
      const localLabel = "local (permify.config.ts)";
      const diff = textDiff(localDsl, remoteDsl, localLabel, remoteLabel);
      if (diff) {
        this.log("");
        this.log(colorizeTextDiff(diff));
      }
    }

    if (flags["exit-code"] && result.hasChanges) {
      this.exit(1);
    }
  }

  private renderStructuralDiff(
    result: SchemaDiffResult,
    tenantId: string,
    isFirstTime: boolean
  ) {
    this.log(`\x1B[1mSchema Diff\x1B[0m — tenant: ${tenantId}\n`);

    if (isFirstTime) {
      this.log(
        `\x1B[36mℹ No schema found on remote — showing full schema as additions\x1B[0m\n`
      );
    }

    if (
      result.added.length ||
      result.removed.length ||
      result.modified.length
    ) {
      this.log("\x1B[1mEntities:\x1B[0m");
    }

    for (const e of result.added) {
      this.log(`  \x1B[32m+ ${e.name}\x1B[0m`);
      this.renderEntityDetails(e.relations, e.permissions, "+");
    }

    for (const e of result.removed) {
      this.log(`  \x1B[31m- ${e.name}\x1B[0m`);
      this.renderEntityDetails(e.relations, e.permissions, "-");
    }

    for (const e of result.modified) {
      this.log(`  \x1B[33m~ ${e.name}\x1B[0m`);

      if (
        e.relations.added.length ||
        e.relations.removed.length ||
        e.relations.changed.length
      ) {
        this.log(`    \x1B[2mRelations:\x1B[0m`);
        for (const r of e.relations.added) {
          this.log(`      \x1B[32m+ ${r}\x1B[0m`);
        }
        for (const r of e.relations.removed) {
          this.log(`      \x1B[31m- ${r}\x1B[0m`);
        }
        for (const r of e.relations.changed) {
          this.log(`      \x1B[33m~ ${r}\x1B[0m`);
        }
      }

      if (
        e.permissions.added.length ||
        e.permissions.removed.length ||
        e.permissions.changed.length
      ) {
        this.log(`    \x1B[2mPermissions:\x1B[0m`);
        for (const p of e.permissions.added) {
          this.log(`      \x1B[32m+ ${p}\x1B[0m`);
        }
        for (const p of e.permissions.removed) {
          this.log(`      \x1B[31m- ${p}\x1B[0m`);
        }
        for (const p of e.permissions.changed) {
          this.log(`      \x1B[33m~ ${p}\x1B[0m`);
        }
      }
    }

    this.log("");
    const parts: string[] = [];
    if (result.added.length) parts.push(`${result.added.length} added`);
    if (result.removed.length) parts.push(`${result.removed.length} removed`);
    if (result.modified.length)
      parts.push(`${result.modified.length} modified`);
    this.log(
      `\x1B[2mSummary: ${parts.join(", ")} ${result.added.length + result.removed.length + result.modified.length === 1 ? "entity" : "entities"}\x1B[0m`
    );
  }

  private renderEntityDetails(
    relations: Record<string, string>,
    permissions: Record<string, string>,
    prefix: string
  ) {
    const color = prefix === "+" ? "\x1B[32m" : "\x1B[31m";
    const relKeys = Object.keys(relations);
    const permKeys = Object.keys(permissions);
    if (relKeys.length) {
      this.log(`    \x1B[2mRelations:\x1B[0m`);
      for (const r of relKeys) {
        this.log(`      ${color}${prefix} ${r}\x1B[0m`);
      }
    }
    if (permKeys.length) {
      this.log(`    \x1B[2mPermissions:\x1B[0m`);
      for (const p of permKeys) {
        this.log(`      ${color}${prefix} ${p}\x1B[0m`);
      }
    }
  }
}

/**
 * Parses a DSL string into a flat SchemaEntityMap.
 * Extracts entity names, relation names, and permission names.
 */
function parseEntitiesFromDsl(dsl: string): SchemaEntityMap {
  const entities: SchemaEntityMap = {};
  const entityRegex = /entity\s+(\w+)\s*{([^}]*)}/gs;

  for (const match of dsl.matchAll(entityRegex)) {
    const name = match[1];
    const body = stripComments(match[2]);

    const relations: Record<string, string> = {};
    for (const m of body.matchAll(/relation\s+(\w+)\s+(.*)/g)) {
      relations[m[1]] = m[2].trim();
    }

    const permissions: Record<string, string> = {};
    for (const m of body.matchAll(/permission\s+(\w+)\s*=\s*(.*)/g)) {
      permissions[m[1]] = m[2].trim();
    }

    entities[name] = { relations, permissions };
  }

  return entities;
}

function stripComments(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
}

function colorizeTextDiff(diff: string): string {
  return diff
    .split("\n")
    .map((line) => {
      if (line.startsWith("+++") || line.startsWith("---")) {
        return `\x1B[1m${line}\x1B[0m`;
      }
      if (line.startsWith("+")) return `\x1B[32m${line}\x1B[0m`;
      if (line.startsWith("-")) return `\x1B[31m${line}\x1B[0m`;
      if (line.startsWith("@@")) return `\x1B[36m${line}\x1B[0m`;
      return line;
    })
    .join("\n");
}
