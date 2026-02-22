import "@japa/assert";
import "@japa/file-system";

import { test } from "@japa/runner";

import { runCommand, stripAnsi } from "./helpers.js";
import RelationshipSeed from "../src/commands/relationships/seed.js";

test.group("Relationships Seed Command", () => {
  const seedFile = "relationships.json";
  const defaultConfig = `
    export default {
      client: { endpoint: "localhost:11111", insecure: true },
      schema: { ast: {}, compile: () => "entity user {}" }
    };
  `;

  test("should fail if no tenant is provided (flag or config)", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", defaultConfig);
    await fs.create(
      seedFile,
      JSON.stringify({
        tuples: [
          {
            entity: { type: "doc", id: "1" },
            relation: "owner",
            subject: { type: "user", id: "1" }
          }
        ]
      })
    );

    const cwd = fs.basePath;
    try {
      await runCommand(RelationshipSeed as any, ["-f", seedFile], { cwd });
      assert.fail("Command should have failed due to missing tenant");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Tenant ID is required");
    }
  });

  test("should fail if no file is provided", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(RelationshipSeed as any, ["--tenant=t1"], { cwd });
      assert.fail("Command should have failed due to missing file-path");
    } catch (error: any) {
      assert.include(
        stripAnsi(error.message),
        "Relationship file path is required"
      );
    }
  });

  test("should fail if file does not exist", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipSeed as any,
        ["--tenant=t1", "-f", "non-existent.json"],
        { cwd }
      );
      assert.fail("Should fail if file does not exist");
    } catch (error: any) {
      assert.include(error.message, "File not found");
    }
  });

  test("should fail if JSON file is invalid", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    await fs.create(seedFile, "{ invalid json }");
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipSeed as any,
        ["--tenant=t1", "-f", seedFile],
        { cwd }
      );
      assert.fail("Should fail on invalid JSON");
    } catch (error: any) {
      assert.include(error.message, "Invalid JSON");
    }
  });

  test("should use seedFile from config if flag is missing", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "permify.config.ts",
      `
      export default {
        client: { endpoint: "localhost:11111", insecure: true },
        schema: { ast: {}, compile: () => "entity user {}" },
        relationships: { seedFile: "${seedFile}" }
      };
      `
    );
    // Invalid JSON so it fails at validation, but confirms it resolved the file path
    await fs.create(seedFile, "{ invalid json }");
    const cwd = fs.basePath;
    try {
      await runCommand(RelationshipSeed as any, ["--tenant=t1"], { cwd });
    } catch (error: any) {
      assert.include(error.message, "Invalid JSON");
    }
  });

  test("should prefer --file-path flag over config", async ({ assert, fs }) => {
    await fs.create(
      "permify.config.ts",
      `
      export default {
        client: { endpoint: "localhost:11111", insecure: true },
        schema: { ast: {}, compile: () => "entity user {}" },
        relationships: { seedFile: "wrong.json" }
      };
      `
    );
    await fs.create(seedFile, "{ invalid json }");
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipSeed as any,
        ["--tenant=t1", "-f", seedFile],
        { cwd }
      );
    } catch (error: any) {
      assert.include(error.message, "Invalid JSON");
      // If it used wrong.json, it would fail with "File not found" instead of "Invalid JSON"
      assert.notInclude(error.message, "wrong.json");
    }
  });

  test("should fail if mode is invalid in config", async ({ assert, fs }) => {
    await fs.create(
      "permify.config.ts",
      `
      export default {
        client: { endpoint: "localhost:11111", insecure: true },
        schema: { ast: {}, compile: () => "entity user {}" },
        relationships: { seedFile: "${seedFile}", mode: "invalid" }
      };
      `
    );
    const cwd = fs.basePath;
    try {
      await runCommand(RelationshipSeed as any, ["--tenant=t1"], { cwd });
      assert.fail("Should fail on invalid mode");
    } catch (error: any) {
      assert.include(error.message, "Relationships mode must be");
    }
  });
});
