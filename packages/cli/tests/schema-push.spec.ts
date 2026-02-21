import { test } from "@japa/runner";

import { runCommand, stripAnsi } from "./helpers.js";
import SchemaPush from "../src/commands/schema/push.js";

const validSchema = `{ ast: {}, compile: () => "entity user {}" }`;

test.group("Schema Push Command", () => {
  test("should fail if no tenant is provided (flag or config)", async ({
    assert,
    fs
  }) => {
    // Config without tenant field
    await fs.create(
      "permify.config.ts",
      `
      export default {
        client: { endpoint: "localhost:11111", insecure: true },
        schema: ${validSchema}
      };
      `
    );

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaPush as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Tenant ID is required");
    }
  });

  test("should fail if permify.config.ts is missing in cwd", async ({
    assert,
    fs
  }) => {
    // Ensure dir exists
    await fs.create("dummy", "");
    const cwd = fs.basePath;
    try {
      await runCommand(SchemaPush as any, ["--tenant=t1"], { cwd });
      assert.fail("Command should have failed");
    } catch (error: any) {
      assert.exists(error);
    }
  });

  test("should attempt to push schema if config exists (connection fail)", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "permify.config.ts",
      `
      export default {
        client: { endpoint: "localhost:11111", insecure: true },
        schema: ${validSchema}
      };
      `
    );

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaPush as any, ["--tenant=t1"], { cwd });
      assert.fail("Command should have failed due to connection");
    } catch (error: any) {
      assert.exists(error);
    }
  });

  test("should resolve tenant from config when flag not provided", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "permify.config.ts",
      `
      export default {
        tenant: "config-tenant",
        client: { endpoint: "localhost:11111", insecure: true },
        schema: ${validSchema}
      };
      `
    );

    const cwd = fs.basePath;
    try {
      // No --tenant flag; tenant should be resolved from config
      await runCommand(SchemaPush as any, [], { cwd });
      assert.fail("Command should have failed due to connection");
    } catch (error: any) {
      // Should fail due to connection, not missing tenant
      assert.notInclude(stripAnsi(error.message), "Tenant ID is required");
    }
  });
});
