import { Flags } from "@oclif/core";
import { readRelationships } from "@permify-toolkit/core";

import { BaseCommand } from "../../base.js";
import {
  relationshipFilterFlags,
  buildTupleFilter,
  formatCompactTuple
} from "../../helpers.js";

export default class RelationshipList extends BaseCommand {
  static description = "List relationships from a Permify tenant";

  static flags = {
    ...BaseCommand.baseFlags,
    ...relationshipFilterFlags,
    output: Flags.string({
      char: "o",
      description: "Output format",
      default: "table",
      options: ["table", "compact"]
    }),
    "page-size": Flags.integer({
      char: "p",
      description: "Results per page",
      default: 50
    })
  };

  async run() {
    const { flags } = await this.parse(RelationshipList);

    const { client, config } = await this.clientFromConfigLite();
    const tenantId = this.resolveTenant(flags, config);

    const filter = buildTupleFilter(flags);

    const relationships = await readRelationships({
      client,
      tenantId,
      filter,
      pageSize: flags["page-size"]
    });

    if (relationships.length === 0) {
      this.log("ℹ No relationships found.");
      return;
    }

    const bold = (s: string) => `\x1B[1m${s}\x1B[0m`;
    const dim = (s: string) => `\x1B[2m${s}\x1B[0m`;
    const cyan = (s: string) => `\x1B[36m${s}\x1B[0m`;
    const yellow = (s: string) => `\x1B[33m${s}\x1B[0m`;
    const green = (s: string) => `\x1B[32m${s}\x1B[0m`;

    if (flags.output === "compact") {
      for (const r of relationships) {
        this.log(formatCompactTuple(r));
      }
    } else {
      const columns = [
        "Entity Type",
        "Entity ID",
        "Relation",
        "Subject Type",
        "Subject ID",
        "Subject Relation"
      ] as const;
      const rows = relationships.map((r) => [
        r.entity.type,
        r.entity.id,
        r.relation,
        r.subject.type,
        r.subject.id,
        r.subject.relation ?? ""
      ]);

      const widths = columns.map((col, i) =>
        Math.max(col.length, ...rows.map((row) => row[i].length))
      );

      const padRow = (vals: readonly string[]) =>
        vals.map((v, i) => v.padEnd(widths[i])).join("  ");

      this.log(bold(padRow(columns)));
      this.log(dim(widths.map((w) => "─".repeat(w)).join("──")));
      for (const row of rows) {
        const colored = row.map((v, i) => {
          const padded = v.padEnd(widths[i]);
          if (i === 0 || i === 3) return cyan(padded); // types
          if (i === 2) return yellow(padded); // relation
          return padded;
        });
        this.log(colored.join("  "));
      }
    }

    this.log(green(`✔ Found ${relationships.length} relationships`));
  }
}
