import "@japa/assert";
import "@japa/file-system";

import { test } from "@japa/runner";

import { runCommand, stripAnsi } from "./helpers.js";
import SchemaValidate from "../src/commands/schema/validate.js";

const validSchemaHandle = `{
  ast: {},
  compile: () => "entity user {}",
  validate: () => {}
}`;

const invalidSchemaHandle = `{
  ast: {},
  compile: () => "entity user {}",
  validate: () => { throw new Error('Entity "ghost" does not exist') }
}`;

const cyclicSchemaHandle = `{
  ast: {},
  compile: () => "entity user {}",
  validate: () => { throw new Error('Permission cycle detected in entity "document": "view" → "edit"') }
}`;

const schemaWithUnusedRelation = `{
  ast: {
    entities: {
      document: {
        name: 'document',
        relations: {
          owner: { name: 'owner', target: ['user'] },
          viewer: { name: 'viewer', target: ['user'] }
        },
        permissions: { view: { name: 'view', expression: 'owner' } },
        attributes: {}
      },
      user: { name: 'user', relations: {}, permissions: {}, attributes: {} }
    }
  },
  compile: () => 'entity document {}',
  validate: () => {}
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

  test("should fail when config has no schema defined", async ({
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
      assert.include(msg, "Schema must be provided");
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
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, "Config file not found");
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
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, ".perm extension");
    }
  });

  test("should fail when schema has a permission cycle", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${cyclicSchemaHandle}
      };`
    );

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaValidate as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, "cycle");
    }
  });

  test("should fail for a .perm file with a dangling operator", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "schema.perm",
      "entity document {\n  relation owner @user\n  permission view = owner or\n}\nentity user {}"
    );
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
      assert.include(msg, "dangling");
    }
  });

  test("should fail for a .perm file with unbalanced parentheses", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "schema.perm",
      "entity document {\n  relation owner @user\n  permission view = (owner\n}\nentity user {}"
    );
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
      assert.include(msg, "parenthes");
    }
  });

  test("should fail for a .perm file with double-dot traversal", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "schema.perm",
      "entity document {\n  relation parent @folder\n  permission view = parent..view\n}\nentity folder {}\nentity user {}"
    );
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
      assert.include(msg, "dot");
    }
  });

  test("should fail for a .perm file with two identifiers and no operator", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "schema.perm",
      "entity document {\n  relation owner @user\n  relation viewer @user\n  permission view = viewer owner\n}\nentity user {}"
    );
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
      assert.include(msg, "operator");
    }
  });

  test("should succeed for a .perm file that has inline comments", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "schema.perm",
      "entity document {\n  relation owner @user // the owner\n  permission view = owner // grant view\n}\nentity user {}"
    );
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

  test("should fail for a .perm file with an empty permission expression", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "schema.perm",
      "entity document {\n  relation owner @user\n  permission view =\n}\nentity user {}"
    );
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

  test("should succeed but print warnings for unused relations", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${schemaWithUnusedRelation}
      };`
    );

    const cwd = fs.basePath;
    const logs: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    (process.stdout as any).write = (chunk: unknown) => {
      logs.push(typeof chunk === "string" ? chunk : String(chunk));
      return true;
    };

    try {
      await runCommand(SchemaValidate as any, [], { cwd });
    } finally {
      (process.stdout as any).write = origWrite;
    }

    const output = logs.join("");
    assert.include(output, "viewer");
    assert.include(output, "never used");
  });
});
