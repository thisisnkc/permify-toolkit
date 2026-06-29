import fs from "node:fs";
import path from "node:path";
import { Flags } from "@oclif/core";
import { readSchemaFromPermify } from "@permify-toolkit/core";

import { BaseCommand } from "../../base.js";

export default class SchemaPull extends BaseCommand {
  static description =
    "Pull the deployed schema from the server into a local .perm file";

  static args = {};

  static flags = {
    ...BaseCommand.baseFlags,
    output: Flags.string({
      char: "o",
      description: "Path to write the pulled schema",
      default: "./schema.perm"
    }),
    force: Flags.boolean({
      char: "f",
      description: "Overwrite the output file if it already exists",
      default: false
    })
  };

  async run() {
    const { flags } = await this.parse(SchemaPull);

    const { client, config } = await this.clientFromConfigLite();
    const tenantId = this.resolveTenant(flags, config);

    const outPath = path.resolve(flags.output);
    if (fs.existsSync(outPath) && !flags.force) {
      this.error(
        `File already exists: ${outPath}\nPass --force to overwrite it.`
      );
    }

    const { schema } = await readSchemaFromPermify({ tenantId, client });
    if (schema === null) {
      this.error(`No schema found on remote for tenant: ${tenantId}`);
    }

    fs.writeFileSync(outPath, schema, "utf-8");

    this.log(`✔ Schema pulled → ${flags.output} (tenant: ${tenantId})`);
  }
}
