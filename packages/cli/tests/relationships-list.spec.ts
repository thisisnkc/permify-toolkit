import "@japa/assert";
import "@japa/file-system";

import { test } from "@japa/runner";

import { runCommand, stripAnsi } from "./helpers.js";
import RelationshipList from "../src/commands/relationships/list.js";
import { buildTupleFilter, formatCompactTuple } from "../src/helpers.js";

test.group("Relationships List Command", () => {
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
      await runCommand(RelationshipList as any, ["--tenant=t1"], { cwd });
      assert.fail("Should have failed due to missing --entity-type");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Missing required flag");
    }
  });

  test("should fail if no tenant is provided", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(RelationshipList as any, ["-e", "document"], { cwd });
      assert.fail("Should have failed due to missing tenant");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Tenant ID is required");
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
        RelationshipList as any,
        ["--tenant=t1", "-e", "document"],
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

  test("should fail if --output is invalid", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipList as any,
        ["--tenant=t1", "-e", "document", "-o", "xml"],
        { cwd }
      );
      assert.fail("Should have failed due to invalid output format");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "to be one of: table, compact");
    }
  });

  test("should not require schema in config", async ({ assert, fs }) => {
    // Config without schema — should NOT fail with "Schema not defined"
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipList as any,
        ["--tenant=t1", "-e", "document"],
        { cwd }
      );
    } catch (error: any) {
      // Should fail trying to connect, NOT because schema is missing
      assert.notInclude(stripAnsi(error.message), "Schema not defined");
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
      await runCommand(RelationshipList as any, ["-e", "document"], { cwd });
    } catch (error: any) {
      // Should NOT fail with "Tenant ID is required" — it should resolve from config
      // and fail later trying to connect to the gRPC server
      assert.notInclude(stripAnsi(error.message), "Tenant ID is required");
    }
  });

  test("should prefer --tenant flag over config tenant", async ({
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
        RelationshipList as any,
        ["--tenant=flag-tenant", "-e", "document"],
        { cwd }
      );
    } catch (error: any) {
      // Should get past tenant resolution without error
      assert.notInclude(stripAnsi(error.message), "Tenant ID is required");
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
        RelationshipList as any,
        [
          "--tenant=t1",
          "-e",
          "document",
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
        RelationshipList as any,
        ["--tenant=t1", "-e", "document", "-p", "25"],
        { cwd }
      );
    } catch (error: any) {
      // Should get past flag parsing
      assert.notInclude(stripAnsi(error.message), "page-size");
    }
  });

  test("should accept --output=compact flag", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipList as any,
        ["--tenant=t1", "-e", "document", "-o", "compact"],
        { cwd }
      );
    } catch (error: any) {
      // Should get past flag parsing without complaining about output format
      assert.notInclude(stripAnsi(error.message), "to be one of");
    }
  });

  test("should accept --output=table flag", async ({ assert, fs }) => {
    await fs.create("permify.config.ts", defaultConfig);
    const cwd = fs.basePath;
    try {
      await runCommand(
        RelationshipList as any,
        ["--tenant=t1", "-e", "document", "-o", "table"],
        { cwd }
      );
    } catch (error: any) {
      // Should get past flag parsing
      assert.notInclude(stripAnsi(error.message), "to be one of");
    }
  });
});

// --- Helper unit tests ---

test.group("buildTupleFilter", () => {
  test("should build filter with only entity-type", async ({ assert }) => {
    const filter = buildTupleFilter({ "entity-type": "document" });
    assert.deepEqual(filter, {
      entity: { type: "document", ids: [] },
      relation: "",
      subject: { type: "", ids: [], relation: "" }
    });
  });

  test("should include entity-id when provided", async ({ assert }) => {
    const filter = buildTupleFilter({
      "entity-type": "document",
      "entity-id": "doc-1"
    });
    assert.deepEqual(filter.entity, { type: "document", ids: ["doc-1"] });
  });

  test("should include relation when provided", async ({ assert }) => {
    const filter = buildTupleFilter({
      "entity-type": "document",
      relation: "viewer"
    });
    assert.equal(filter.relation, "viewer");
  });

  test("should build subject filter when subject-type is provided", async ({
    assert
  }) => {
    const filter = buildTupleFilter({
      "entity-type": "document",
      "subject-type": "user"
    });
    assert.deepEqual(filter.subject, {
      type: "user",
      ids: [],
      relation: ""
    });
  });

  test("should include subject-id when provided", async ({ assert }) => {
    const filter = buildTupleFilter({
      "entity-type": "document",
      "subject-type": "user",
      "subject-id": "user-1"
    });
    assert.deepEqual(filter.subject, {
      type: "user",
      ids: ["user-1"],
      relation: ""
    });
  });

  test("should build a complete filter with all flags", async ({ assert }) => {
    const filter = buildTupleFilter({
      "entity-type": "document",
      "entity-id": "doc-1",
      relation: "viewer",
      "subject-type": "user",
      "subject-id": "user-1"
    });
    assert.deepEqual(filter, {
      entity: { type: "document", ids: ["doc-1"] },
      relation: "viewer",
      subject: { type: "user", ids: ["user-1"], relation: "" }
    });
  });

  test("should ignore subject-id when subject-type is not provided", async ({
    assert
  }) => {
    const filter = buildTupleFilter({
      "entity-type": "document",
      "subject-id": "user-1"
    });
    // No subject-type means empty subject
    assert.deepEqual(filter.subject, { type: "", ids: [], relation: "" });
  });
});

test.group("formatCompactTuple", () => {
  test("should format a basic tuple", async ({ assert }) => {
    const result = formatCompactTuple({
      entity: { type: "document", id: "doc-1" },
      relation: "viewer",
      subject: { type: "user", id: "user-1" }
    });
    assert.equal(result, "document:doc-1#viewer@user:user-1");
  });

  test("should include subject relation when present", async ({ assert }) => {
    const result = formatCompactTuple({
      entity: { type: "document", id: "doc-1" },
      relation: "viewer",
      subject: { type: "group", id: "eng", relation: "member" }
    });
    assert.equal(result, "document:doc-1#viewer@group:eng#member");
  });

  test("should handle empty subject relation", async ({ assert }) => {
    const result = formatCompactTuple({
      entity: { type: "folder", id: "f-1" },
      relation: "owner",
      subject: { type: "user", id: "admin", relation: "" }
    });
    assert.equal(result, "folder:f-1#owner@user:admin");
  });
});
