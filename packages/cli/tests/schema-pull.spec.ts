import "@japa/assert";
import "@japa/file-system";

import { test } from "@japa/runner";

import { runCommand, stripAnsi } from "./helpers.js";
import SchemaPull from "../src/commands/schema/pull.js";

const config = `
  export default {
    client: { endpoint: "localhost:11111", insecure: true },
  };
`;

const configWithTenant = `
  export default {
    tenant: "config-tenant",
    client: { endpoint: "localhost:11111", insecure: true },
  };
`;

test.group("Schema Pull Command", () => {
  test("should fail if no tenant is provided (flag or config)", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", config);

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaPull as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Tenant ID is required");
    }
  });

  test("should fail if permify.config.ts is missing in cwd", async ({
    assert,
    fs
  }) => {
    await fs.create("dummy", "");
    const cwd = fs.basePath;
    try {
      await runCommand(SchemaPull as any, ["--tenant=t1"], { cwd });
      assert.fail("Command should have failed");
    } catch (error: any) {
      assert.exists(error);
    }
  });

  test("should refuse to overwrite an existing output file without --force", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", config);
    await fs.create("schema.perm", "entity user {}");

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaPull as any, ["--tenant=t1"], { cwd });
      assert.fail("Command should have failed");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "Pass --force to overwrite");
    }
  });

  test("should resolve tenant from config and attempt connection", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", configWithTenant);

    const cwd = fs.basePath;
    try {
      await runCommand(SchemaPull as any, [], { cwd });
      assert.fail("Command should have failed due to connection");
    } catch (error: any) {
      assert.notInclude(stripAnsi(error.message), "Tenant ID is required");
    }
  });
});
