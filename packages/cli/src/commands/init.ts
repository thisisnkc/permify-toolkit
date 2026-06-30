import fs from "node:fs";
import path from "node:path";
import { Command, Flags } from "@oclif/core";

const template = (tenant: string, endpoint: string) => `import {
  defineConfig,
  schema,
  entity,
  relation,
  permission
} from "@permify-toolkit/core";

export default defineConfig({
  tenant: "${tenant}",
  client: {
    endpoint: "${endpoint}",
    insecure: true,
    interceptor: {
      authToken: process.env.PERMIFY_AUTH_TOKEN
    }
  },
  schema: schema({
    user: entity({}),
    document: entity({
      relations: {
        owner: relation("user"),
        viewer: relation("user")
      },
      permissions: {
        view: permission("viewer or owner"),
        edit: permission("owner")
      }
    })
  })
});
`;

export default class Init extends Command {
  static description =
    "Scaffold a starter permify.config.ts in the current directory";

  static args = {};

  static flags = {
    tenant: Flags.string({
      char: "t",
      description: "Tenant ID to prefill into the config",
      default: "t1"
    }),
    endpoint: Flags.string({
      char: "e",
      description: "Permify server endpoint to prefill into the config",
      default: "localhost:3478"
    })
  };

  async run() {
    const { flags } = await this.parse(Init);

    const outPath = path.resolve("permify.config.ts");
    if (fs.existsSync(outPath)) {
      this.error("permify.config.ts already exists. Delete it to re-scaffold.");
    }

    fs.writeFileSync(outPath, template(flags.tenant, flags.endpoint), "utf-8");

    this.log(`✔ Created permify.config.ts (tenant: ${flags.tenant})`);
    this.log("Next: run `permify-toolkit schema push` to deploy your schema.");
    this.log(
      "If your server needs auth, set PERMIFY_AUTH_TOKEN in your environment."
    );
  }
}
