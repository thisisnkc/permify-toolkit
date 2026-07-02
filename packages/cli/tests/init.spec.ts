import "@japa/assert";
import "@japa/file-system";

import { test } from "@japa/runner";

import Init from "../src/commands/init.js";
import { runCommand, stripAnsi } from "./helpers.js";

test.group("Init Command", () => {
  test("should scaffold permify.config.ts with the given tenant and endpoint", async ({
    assert,
    fs
  }) => {
    // Ensure the temp dir exists before the command chdir's into it
    await fs.create(".keep", "");

    const cwd = fs.basePath;
    await runCommand(Init as any, ["--tenant=acme", "--endpoint=remote:9999"], {
      cwd
    });

    const exists = await fs.exists("permify.config.ts");
    assert.isTrue(exists);

    const content = await fs.contents("permify.config.ts");
    assert.include(content, 'tenant: "acme"');
    assert.include(content, 'endpoint: "remote:9999"');
  });

  test("should refuse when permify.config.ts already exists and leave it untouched", async ({
    assert,
    fs
  }) => {
    await fs.create("permify.config.ts", "ORIGINAL CONTENT");

    const cwd = fs.basePath;
    try {
      await runCommand(Init as any, [], { cwd });
      assert.fail("Command should have failed");
    } catch (error: any) {
      assert.include(stripAnsi(error.message), "already exists");
    }

    const content = await fs.contents("permify.config.ts");
    assert.equal(content, "ORIGINAL CONTENT");
  });
});
