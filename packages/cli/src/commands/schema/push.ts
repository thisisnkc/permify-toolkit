import { writeSchemaToPermify } from "@permify-toolkit/core";

import { BaseCommand } from "../../base.js";
import { loadSchemaFromConfig } from "../../helpers.js";

export default class SchemaPush extends BaseCommand {
  static description = "Push Permify schema to the server";

  static args = {};

  static flags = {
    ...BaseCommand.baseFlags
  };

  async run() {
    const { flags } = await this.parse(SchemaPush);

    // 1️⃣ Load config and client
    const { client, config } = await this.clientFromConfig();

    // 2️⃣ Load schema (compile AST or read file)
    let dsl: string;
    try {
      dsl = loadSchemaFromConfig(config.schema);
    } catch (err: any) {
      this.error(`Failed to load schema: ${err.message}`);
    }

    // 3️⃣ Resolve tenant
    const tenantId = this.resolveTenant(flags, config);

    // 4️⃣ Push schema via core
    await this.pushSchema(dsl, client, tenantId, flags["create-tenant"]);

    this.log(`✔ Schema pushed successfully`);
    this.log(`Tenant: ${tenantId}`);
  }

  private async pushSchema(
    schema: string,
    client: any,
    tenantId: string,
    createTenantIfNotExists?: boolean
  ) {
    try {
      const { tenantStatus } = await writeSchemaToPermify({
        endpoint: "",
        tenantId,
        schema,
        createTenantIfNotExists,
        client
      });

      if (tenantStatus.created) {
        this.log(`✔ Tenant created successfully`);
      } else if (tenantStatus.alreadyExisted && createTenantIfNotExists) {
        this.log(`ℹ Tenant already exists`);
      }
    } catch (err: any) {
      this.error(`Schema push failed:\n${err.message}`);
    }
  }
}
