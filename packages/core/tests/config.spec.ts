import { test } from "@japa/runner";
import {
  defineConfig,
  validateConfig,
  schema,
  entity
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
      // @ts-ignore
      validateConfig("invalid");
    }, "Configuration must be an object");
  });

  test("should throw if client endpoint is missing or invalid", ({
    assert
  }) => {
    assert.throws(() => {
      validateConfig({
        client: {
          // @ts-ignore
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
          // @ts-ignore
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
});
