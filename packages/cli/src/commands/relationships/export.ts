import fsNode from "node:fs";
import path from "node:path";
import { Flags } from "@oclif/core";
import { readRelationships } from "@permify-toolkit/core";

import { BaseCommand } from "../../base.js";
import { relationshipFilterFlags, buildTupleFilter } from "../../helpers.js";

export default class RelationshipExport extends BaseCommand {
  static description =
    "Export relationships from a Permify tenant to a JSON file";

  static flags = {
    ...BaseCommand.baseFlags,
    ...relationshipFilterFlags,
    "file-path": Flags.string({
      char: "f",
      description: "Output file path (.json)",
      required: true
    }),
    "page-size": Flags.integer({
      char: "p",
      description: "Results per page",
      default: 100
    })
  };

  async run() {
    const { flags } = await this.parse(RelationshipExport);

    // Validate file path
    const filePath = path.resolve(flags["file-path"]);
    if (!filePath.toLowerCase().endsWith(".json")) {
      this.error("Output file must have a .json extension");
    }

    const dir = path.dirname(filePath);
    if (!fsNode.existsSync(dir)) {
      this.error(`Output directory does not exist: ${dir}`);
    }

    const { client, config } = await this.clientFromConfigLite();
    const tenantId = this.resolveTenant(flags, config);

    const filter = buildTupleFilter(flags);

    const relationships = await readRelationships({
      client,
      tenantId,
      filter,
      pageSize: flags["page-size"]
    });

    const output = JSON.stringify({ tuples: relationships }, null, 2);
    fsNode.writeFileSync(filePath, output, "utf-8");

    this.log(
      `✔ Exported ${relationships.length} relationships to ${flags["file-path"]}`
    );
  }
}
