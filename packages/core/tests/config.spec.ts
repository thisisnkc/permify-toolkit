import "@japa/assert";
import "@japa/file-system";

import * as fs from "node:fs";
import { test } from "@japa/runner";
import {
  defineConfig,
  validateConfig,
  schema,
  entity,
  schemaFile
} from "@permify-toolkit/core";

test.group("Config Validation", () => {
  test("should define and validate a correct config", ({ assert }) => {
    const config = defineConfig({
      client: {
        endpoint: "localhost:3478"
      },
      schema: schema({
        user: entity({})
      })
    });

    assert.doesNotThrow(() => validateConfig(config));
    assert.deepEqual(config, {
      client: {
        endpoint: "localhost:3478"
      },
      schema: config.schema
    });
  });

  test("should throw if config is not an object", ({ assert }) => {
    assert.throws(() => {
      // @ts-expect-error
      validateConfig("invalid");
    }, "Configuration must be an object");
  });

  test("should throw if client endpoint is missing or invalid", ({
    assert
  }) => {
    assert.throws(() => {
      validateConfig({
        client: {
          // @ts-expect-error
          endpoint: 123
        }
      });
    }, "Client endpoint must be a string");
  });

  test("should throw if schema is invalid (missing AST)", ({ assert }) => {
    assert.throws(() => {
      validateConfig({
        client: {
          endpoint: "localhost:3478"
        },
        schema: {
          compile: () => ""
        } as any
      });
    }, "Invalid schema: missing AST");
  });

  test("should throw if schema is invalid (missing compile)", ({ assert }) => {
    assert.throws(() => {
      validateConfig({
        client: {
          endpoint: "localhost:3478"
        },
        schema: {
          ast: {}
        } as any
      });
    }, "Invalid schema: missing compile method");
  });

  test("should valid config with schema file path", ({ assert }) => {
    const tempFile = "temp-schema.perm";
    fs.writeFileSync(tempFile, "entity user {}");

    const config = defineConfig({
      client: {
        endpoint: "localhost:3478"
      },
      schema: schemaFile(tempFile)
    });

    try {
      assert.doesNotThrow(() => validateConfig(config));
      assert.deepEqual(config, {
        client: {
          endpoint: "localhost:3478"
        },
        schema: tempFile
      });
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should throw if schema file does not exist", ({ assert }) => {
    const config = defineConfig({
      client: {
        endpoint: "localhost:3478"
      },
      schema: schemaFile("./non-existent.perm")
    });

    assert.throws(() => {
      validateConfig(config);
    }, "Schema file not found: ./non-existent.perm");
  });

  test("should throw if schema file is empty", ({ assert }) => {
    const tempFile = "empty-schema.perm";
    fs.writeFileSync(tempFile, "");

    const config = defineConfig({
      client: {
        endpoint: "localhost:3478"
      },
      schema: schemaFile(tempFile)
    });

    try {
      assert.throws(() => {
        validateConfig(config);
      }, `Schema file cannot be empty: ${tempFile}`);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should throw if schema file extension is invalid", ({ assert }) => {
    const tempFile = "schema.txt";
    fs.writeFileSync(tempFile, "entity user {}");

    const config = defineConfig({
      client: {
        endpoint: "localhost:3478"
      },
      schema: schemaFile(tempFile)
    });

    try {
      assert.throws(() => {
        validateConfig(config);
      }, `Schema file must have a .perm extension: ${tempFile}`);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should validate config with tenant", ({ assert }) => {
    const config = defineConfig({
      tenant: "t1",
      client: {
        endpoint: "localhost:3478"
      },
      schema: schema({
        user: entity({})
      })
    });

    assert.doesNotThrow(() => validateConfig(config));
    assert.equal(config.tenant, "t1");
  });

  test("should validate config without tenant", ({ assert }) => {
    const config = defineConfig({
      client: {
        endpoint: "localhost:3478"
      },
      schema: schema({
        user: entity({})
      })
    });

    assert.doesNotThrow(() => validateConfig(config));
    assert.isUndefined(config.tenant);
  });

  test("should throw if tenant is not a string", ({ assert }) => {
    assert.throws(() => {
      validateConfig({
        // @ts-expect-error
        tenant: 123,
        client: {
          endpoint: "localhost:3478"
        },
        schema: schema({
          user: entity({})
        })
      });
    }, "Tenant must be a non-empty string");
  });

  test("should throw if tenant is an empty string", ({ assert }) => {
    assert.throws(() => {
      validateConfig({
        tenant: "",
        client: {
          endpoint: "localhost:3478"
        },
        schema: schema({
          user: entity({})
        })
      });
    }, "Tenant must be a non-empty string");
  });

  test("should throw if tenant is whitespace only", ({ assert }) => {
    assert.throws(() => {
      validateConfig({
        tenant: "   ",
        client: {
          endpoint: "localhost:3478"
        },
        schema: schema({
          user: entity({})
        })
      });
    }, "Tenant must be a non-empty string");
  });
});
