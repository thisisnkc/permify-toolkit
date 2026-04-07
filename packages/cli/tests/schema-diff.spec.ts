import "@japa/assert";
import "@japa/file-system";

import { test } from "@japa/runner";

import { runCommand, stripAnsi } from "./helpers.js";
import SchemaDiff from "../src/commands/schema/diff.js";

const localSchema = `{
  ast: {},
  compile: () => "entity user {}\\nentity document {\\n    relation owner @user\\n    permission edit = owner\\n}",
  validate: () => {}
}`;

const identicalSourceSchema =
  "entity user {}\nentity document {\n    relation owner @user\n    permission edit = owner\n}";

const differentSourceSchema =
  "entity user {}\nentity team {\n    relation member @user\n    permission view = member\n}";

function captureOutput(): { logs: string[]; restore: () => void } {
  const logs: string[] = [];
  const origWrite = process.stdout.write.bind(process.stdout);
  (process.stdout as any).write = (chunk: unknown) => {
    logs.push(typeof chunk === "string" ? chunk : String(chunk));
    return true;
  };
  return {
    logs,
    restore: () => {
      (process.stdout as any).write = origWrite;
    }
  };
}

// --- --source flag ---

test.group("Schema Diff Command - --source flag", () => {
  test("should compare local config against source .perm file", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", differentSourceSchema);
    const sourcePath = `${fs.basePath}/source.perm`;

    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(SchemaDiff as any, ["--source", sourcePath], {
        cwd: fs.basePath
      });
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.include(text, "Schema Diff");
    assert.include(text, "document");
  });

  test("should fail if source file does not exist", async ({ assert, fs }) => {
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", "/tmp/nonexistent.perm"],
        { cwd: fs.basePath }
      );
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, "not found");
    }
  });

  test("should fail if source file is not a .perm file", async ({
    assert,
    fs
  }) => {
    await fs.create("source.txt", "entity user {}");
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.txt`],
        { cwd: fs.basePath }
      );
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, ".perm");
    }
  });

  test("should accept -s alias for --source", async ({ assert, fs }) => {
    await fs.create("source.perm", differentSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["-s", `${fs.basePath}/source.perm`],
        { cwd: fs.basePath }
      );
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.include(text, "Schema Diff");
  });
});

// --- --verbose flag ---

test.group("Schema Diff Command - --verbose flag", () => {
  test("should show unified text diff when --verbose is set", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", differentSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`, "--verbose"],
        { cwd: fs.basePath }
      );
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.include(text, "---");
    assert.include(text, "+++");
    assert.include(text, "@@");
  });

  test("should not show text diff without --verbose", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", differentSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`],
        { cwd: fs.basePath }
      );
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.notInclude(text, "@@");
  });

  test("should accept -v alias for --verbose", async ({ assert, fs }) => {
    await fs.create("source.perm", differentSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`, "-v"],
        { cwd: fs.basePath }
      );
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.include(text, "@@");
  });
});

// --- --exit-code flag ---

test.group("Schema Diff Command - --exit-code flag", () => {
  test("should exit with code 1 when changes detected and --exit-code set", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", differentSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`, "--exit-code"],
        { cwd: fs.basePath }
      );
      assert.fail("Command should have exited with code 1");
    } catch (error: any) {
      // oclif wraps this.exit(1) as an error with oclif.exit = 1
      assert.equal(error.oclif?.exit, 1);
    } finally {
      output.restore();
    }
  });

  test("should exit with code 0 when no changes and --exit-code set", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", identicalSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`, "--exit-code"],
        { cwd: fs.basePath }
      );
      // Should not throw — exit code 0
      assert.isTrue(true);
    } finally {
      output.restore();
    }
  });

  test("should accept -e alias for --exit-code", async ({ assert, fs }) => {
    await fs.create("source.perm", differentSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`, "-e"],
        { cwd: fs.basePath }
      );
      assert.fail("Command should have exited with code 1");
    } catch (error: any) {
      assert.equal(error.oclif?.exit, 1);
    } finally {
      output.restore();
    }
  });
});

// --- --tenant flag ---

test.group("Schema Diff Command - --tenant flag", () => {
  test("should fail if no tenant is provided (flag or config)", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", differentSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`],
        { cwd: fs.basePath }
      );
      assert.fail("Command should have failed");
    } catch (error: unknown) {
      const msg = stripAnsi((error as Error).message);
      assert.include(msg, "Tenant ID is required");
    }
  });

  test("should resolve tenant from config when --tenant flag is not provided", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", identicalSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "config-tenant",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`],
        { cwd: fs.basePath }
      );
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.include(text, "config-tenant");
  });

  test("should prefer --tenant flag over config tenant", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", identicalSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "config-tenant",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`, "--tenant", "flag-tenant"],
        { cwd: fs.basePath }
      );
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.include(text, "flag-tenant");
    assert.notInclude(text, "config-tenant");
  });
});

// --- no changes ---

test.group("Schema Diff Command - no changes", () => {
  test("should show up-to-date message when schemas are identical", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", identicalSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`],
        { cwd: fs.basePath }
      );
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.include(text, "up to date");
    assert.include(text, "no changes detected");
  });
});

// --- structural output ---

test.group("Schema Diff Command - structural output", () => {
  test("should show added, removed, and modified entities", async ({
    assert,
    fs
  }) => {
    await fs.create("source.perm", differentSourceSchema);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`],
        { cwd: fs.basePath }
      );
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.include(text, "+ document");
    assert.include(text, "- team");
    assert.include(text, "Summary:");
  });

  test("should show changed permissions when expression differs", async ({
    assert,
    fs
  }) => {
    const source =
      "entity user {}\nentity document {\n    relation owner @user\n    permission edit = owner or viewer\n}";
    await fs.create("source.perm", source);
    await fs.create(
      "permify.config.ts",
      `export default {
        tenant: "t1",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: ${localSchema}
      };`
    );

    const output = captureOutput();
    try {
      await runCommand(
        SchemaDiff as any,
        ["--source", `${fs.basePath}/source.perm`],
        { cwd: fs.basePath }
      );
    } finally {
      output.restore();
    }

    const text = stripAnsi(output.logs.join(""));
    assert.include(text, "~ document");
    assert.include(text, "~ edit");
  });
});
