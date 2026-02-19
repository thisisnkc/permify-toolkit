import { test } from "@japa/runner";

import { runCommand, stripAnsi } from "./helpers.js";
import RelationshipSeed from "../src/commands/relationships/seed.js";

test.group("Relationships Seed Command", () => {
  const seedFile = "relationships.json";

  test("should fail if no tenant is provided", async ({ assert }) => {
    try {
      await runCommand(RelationshipSeed as any, ["-f", seedFile]);
      assert.fail("Command should have failed due to missing tenant");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Missing required flag tenant");
    }
  });

  test("should fail if no file is provided", async ({ assert }) => {
    try {
      await runCommand(RelationshipSeed as any, ["--tenant=t1"]);
      assert.fail("Command should have failed due to missing file-path");
    } catch (error: any) {
      assert.include(
        stripAnsi(error.message),
        "Missing required flag file-path"
      );
    }
  });

  test("should fail if file does not exist", async ({ assert, fs }) => {
    // Ensure the directory exists
    await fs.create("dummy", "");
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

  test("should validate schema of relationship JSON (missing required fields)", async ({
    assert,
    fs
  }) => {
    // A valid JSON but invalid schema for relationship seed
    await fs.create(
      seedFile,
      `
       [
         { "subject": "user:1" }
       ]
     `
    );
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipSeed as any,
        ["--tenant=t1", "-f", seedFile],
        { cwd }
      );
      assert.fail("Should fail validation");
    } catch (error: any) {
      assert.exists(error);
    }
  });
});
