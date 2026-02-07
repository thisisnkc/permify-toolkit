import { test } from "@japa/runner";

import { runCli, stripAnsi } from "./helpers.js";

test.group("Schema Push Command", (group: any) => {
  // timeout for each test (required for file system operations), tweak if needed
  group.each.timeout(6000);

  test("should fail if no tenant is provided", async ({ assert }) => {
    try {
      await runCli("schema push");
      assert.fail("Command should have failed");
    } catch (error: any) {
      assert.include(stripAnsi(error.stderr), "Missing required flag tenant");
    }
  });

  test("should fail if permify.config.ts is missing in cwd", async ({
    assert,
    fs
  }) => {
    // Ensure dirt exists
    await fs.create("dummy", "");
    // fs creates files in a temp dir, we need to execute in that dir
    const cwd = fs.basePath;
    try {
      await runCli("schema push --tenant=t1", { cwd });
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
      await runCli("schema push --tenant=t1", { cwd });
      assert.fail("Command should have failed due to connection");
    } catch (error: any) {
      assert.exists(error);
    }
  });
});
