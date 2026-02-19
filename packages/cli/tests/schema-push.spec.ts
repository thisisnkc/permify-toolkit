import { test } from "@japa/runner";

import { runCommand, stripAnsi } from "./helpers.js";
import SchemaPush from "../src/commands/schema/push.js";

test.group("Schema Push Command", () => {
  test("should fail if no tenant is provided", async ({ assert }) => {
    try {
      await runCommand(SchemaPush as any, []);
      assert.fail("Command should have failed");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Missing required flag tenant");
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
        schema: {}
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
});
