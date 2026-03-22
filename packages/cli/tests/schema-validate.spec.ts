import "@japa/assert";
import "@japa/file-system";

import { test } from "@japa/runner";

import SchemaValidate from "../src/commands/schema/validate.js";
import { runCommand, stripAnsi } from "./helpers.js";

// Inline SchemaHandle mock — Jiti evaluates this at runtime inside the config file
const validSchemaHandle = `{
  ast: {},
  compile: () => "entity user {}",
  validate: () => {}
}`;

// The mock's validate() throws to simulate a semantic error
// (In real usage, schema() throws at construction — this mock is the test-only path)
const invalidSchemaHandle = `{
  ast: {},
  compile: () => "entity user {}",
  validate: () => { throw new Error('Entity "ghost" does not exist') }
}`;

test.group("Schema Validate Command", () => {
  test("should succeed with a valid DSL schema", async ({ assert, fs }) => {
    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${validSchemaHandle}
      };`
    );

    const cwd = fs.basePath;
    // Should not throw
    await runCommand(SchemaValidate as any, [], { cwd });
    assert.isTrue(true); // no throw = success
  });

  test("should fail with a descriptive error for an invalid DSL schema", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${invalidSchemaHandle}
      };`
    );

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaValidate as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, "ghost");
    }
  });

  test("should fail with 'Schema not defined' when config has no schema", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true }
      };`
    );

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaValidate as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, "Schema not defined");
    }
  });

  test("should fail if permify.config.ts is missing", async ({
    assert,
    fs
  }) => {
    await fs.create("dummy", "");
    const cwd = fs.basePath;
    try {
      await runCommand(SchemaValidate as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      assert.exists(error);
    }
  });

  test("should succeed for a valid .perm file", async ({ assert, fs }) => {
    await fs.create("schema.perm", "entity user {}\nentity document {}");
    const permPath = `${fs.basePath}/schema.perm`;

    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: "${permPath}"
      };`
    );

    const cwd = fs.basePath;
    await runCommand(SchemaValidate as any, [], { cwd });
    assert.isTrue(true);
  });

  test("should fail for an empty .perm file (caught by loadConfig)", async ({
    assert,
    fs
  }) => {
    // Note: loadConfig() → validateConfig() checks stats.size === 0 first.
    // The error message comes from core, not from validateSchemaContent().
    // It contains the word "empty".
    await fs.create("schema.perm", "");
    const permPath = `${fs.basePath}/schema.perm`;

    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: "${permPath}"
      };`
    );

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaValidate as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, "empty");
    }
  });

  test("should fail for a .perm file with no entity blocks", async ({
    assert,
    fs
  }) => {
    await fs.create("schema.perm", "// just a comment, no entities");
    const permPath = `${fs.basePath}/schema.perm`;

    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: "${permPath}"
      };`
    );

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaValidate as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, "entity definitions");
    }
  });

  test("should fail for a schema file without .perm extension", async ({
    assert,
    fs
  }) => {
    await fs.create("schema.txt", "entity user {}");
    const txtPath = `${fs.basePath}/schema.txt`;

    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: "${txtPath}"
      };`
    );

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaValidate as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      assert.exists(error);
    }
  });
});
