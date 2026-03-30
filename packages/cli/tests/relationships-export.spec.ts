import "@japa/assert";
import "@japa/file-system";

import { test } from "@japa/runner";

import { runCommand, stripAnsi } from "./helpers.js";
import RelationshipExport from "../src/commands/relationships/export.js";

test.group("Relationships Export Command", () => {
  const defaultConfig = `
    export default {
      client: { endpoint: "localhost:11111", insecure: true }
    };
  `;

  // --- Error path tests ---

  test("should fail if no --entity-type is provided", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-f", "out.json"],
        { cwd }
      );
      assert.fail("Should have failed due to missing --entity-type");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Missing required flag");
    }
  });

  test("should fail if no --file-path is provided", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document"],
        { cwd }
      );
      assert.fail("Should have failed due to missing --file-path");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Missing required flag");
    }
  });

  test("should fail if no tenant is provided", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["-e", "document", "-f", "out.json"],
        { cwd }
      );
      assert.fail("Should have failed due to missing tenant");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Tenant ID is required");
    }
  });

  test("should fail if file extension is not .json", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document", "-f", "out.yaml"],
        { cwd }
      );
      assert.fail("Should have failed due to invalid extension");
    } catch (error: any) {
      assert.include(
        stripAnsi(error.message),
        "Output file must have a .json extension"
      );
    }
  });

  test("should fail if file extension is .txt", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document", "-f", "out.txt"],
        { cwd }
      );
      assert.fail("Should have failed due to invalid extension");
    } catch (error: any) {
      assert.include(
        stripAnsi(error.message),
        "Output file must have a .json extension"
      );
    }
  });

  test("should fail if output directory does not exist", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document", "-f", "nonexistent/dir/out.json"],
        { cwd }
      );
      assert.fail("Should have failed due to missing directory");
    } catch (error: any) {
      assert.include(
        stripAnsi(error.message),
        "Output directory does not exist"
      );
    }
  });

  test("should not require schema in config", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document", "-f", "out.json"],
        { cwd }
      );
    } catch (error: any) {
      assert.notInclude(stripAnsi(error.message), "Schema not defined");
    }
  });

  test("should fail if config has no client endpoint", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", "export default {};");
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document", "-f", "out.json"],
        { cwd }
      );
      assert.fail("Should have failed due to missing endpoint");
    } catch (error: any) {
      assert.include(
        stripAnsi(error.message),
        "Client endpoint must be a string"
      );
    }
  });

  // --- Tenant resolution tests ---

  test("should resolve tenant from config when --tenant flag is not provided", async ({
    assert,
    fs
  }) => {
    await fs.create(
      "permify.config.ts",
      `
      export default {
        tenant: "config-tenant",
        client: { endpoint: "localhost:11111", insecure: true }
      };
      `
    );
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["-e", "document", "-f", "out.json"],
        { cwd }
      );
    } catch (error: any) {
      // Should NOT fail with tenant error — should resolve from config
      assert.notInclude(stripAnsi(error.message), "Tenant ID is required");
    }
  });

  // --- File path validation tests ---

  test("should accept .JSON extension (case-insensitive)", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document", "-f", "out.JSON"],
        { cwd }
      );
    } catch (error: any) {
      // Should NOT fail on file extension — should get past validation
      assert.notInclude(
        stripAnsi(error.message),
        "Output file must have a .json extension"
      );
    }
  });

  test("should accept file path in current directory", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document", "-f", "relationships.json"],
        { cwd }
      );
    } catch (error: any) {
      // Should NOT fail on directory check — cwd always exists
      assert.notInclude(
        stripAnsi(error.message),
        "Output directory does not exist"
      );
    }
  });

  test("should accept file path in existing subdirectory", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", defaultConfig);
    await fs.mkdir("output");
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document", "-f", "output/relationships.json"],
        { cwd }
      );
    } catch (error: any) {
      // Should NOT fail on directory check
      assert.notInclude(
        stripAnsi(error.message),
        "Output directory does not exist"
      );
    }
  });

  // --- Filter flag tests ---

  test("should accept all filter flags without error", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        [
          "--tenant=t1",
          "-e",
          "document",
          "-f",
          "out.json",
          "--entity-id=doc-1",
          "-r",
          "viewer",
          "-s",
          "user",
          "--subject-id=user-1"
        ],
        { cwd }
      );
    } catch (error: any) {
      // Should fail at gRPC connection, not at flag parsing
      assert.notInclude(stripAnsi(error.message), "Missing required flag");
      assert.notInclude(stripAnsi(error.message), "Unexpected argument");
    }
  });

  test("should accept --page-size flag", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipExport as any,
        ["--tenant=t1", "-e", "document", "-f", "out.json", "-p", "200"],
        { cwd }
      );
    } catch (error: any) {
      // Should get past flag parsing
      assert.notInclude(stripAnsi(error.message), "page-size");
    }
  });
});
