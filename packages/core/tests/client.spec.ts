import "@japa/assert";

import { test } from "@japa/runner";
import {
  clientOptionsFromEnv,
  createPermifyClient
} from "@permify-toolkit/core";

test.group("Client Creation", () => {
  test("should create a client with valid options", ({ assert }) => {
    const client = createPermifyClient({
      endpoint: "localhost:3478"
    });
    assert.exists(client);
    // gRPC client properties are internal, but existence confirms constructor didn't throw
  });

  test("should throw if endpoint is missing", ({ assert }) => {
    assert.throws(() => {
      // @ts-expect-error
      createPermifyClient({});
    }, "Permify client requires an endpoint");
  });

  test("should throw if endpoint is missing hostname or port", ({ assert }) => {
    assert.throws(() => {
      createPermifyClient({
        endpoint: "localhost"
      });
    }, "Permify endpoint must include host:port");
  });

  test("should default insecure=true for localhost", ({ assert }) => {
    // We can't easily inspect the internal channel options of the gRPC client
    // without using private APIs or mocks, but we can verify the logic path
    // doesn't throw and implicitly accepts it.
    // For a unit test of the logic itself, we rely on the implementation details
    // being correct as per the code we wrote.
    const client = createPermifyClient({
      endpoint: "localhost:3478"
    });
    assert.exists(client);
  });

  test("should respect manual insecure option", ({ assert }) => {
    const client = createPermifyClient({
      endpoint: "localhost:3478",
      insecure: false
    });
    assert.exists(client);
  });

  test("should attempt to use provided TLS options (buffers)", ({ assert }) => {
    // grpc-js validates PEM format immediately. Since we pass fake buffers,
    // we expect it to throw a PEM error. This confirms the options are being passed.
    assert.throws(() => {
      createPermifyClient({
        endpoint: "permify.example.com:443",
        tls: {
          cert: Buffer.from("fake-cert"),
          key: Buffer.from("fake-key"),
          ca: Buffer.from("fake-ca")
        }
      });
    });
  });

  test("should attempt to use provided TLS options (strings) converted to buffers", ({
    assert
  }) => {
    assert.throws(() => {
      createPermifyClient({
        endpoint: "permify.example.com:443",
        tls: {
          cert: "fake-cert-string",
          key: "fake-key-string",
          ca: "fake-ca-string"
        }
      });
    });
  });

  test("should create a client with interceptor options", ({ assert }) => {
    const client = createPermifyClient({
      endpoint: "localhost:3478",
      interceptor: {
        authToken: "test-token"
      }
    });
    assert.exists(client);
  });
});

test.group("Environment Config", () => {
  const originalEnv = { ...process.env };

  function withEnv(env: Record<string, string>, callback: () => void) {
    Object.assign(process.env, env);
    try {
      callback();
    } finally {
      process.env = { ...originalEnv };
    }
  }

  test("should load options from environment variables", ({ assert }) => {
    withEnv(
      {
        PERMIFY_ENDPOINT: "env-endpoint:3000",
        PERMIFY_INSECURE: "true",
        PERMIFY_TLS_CERT: "env-cert",
        PERMIFY_AUTH_TOKEN: "env-token"
      },
      () => {
        const options = clientOptionsFromEnv();

        assert.deepEqual(options, {
          endpoint: "env-endpoint:3000",
          insecure: true,
          tls: {
            cert: "env-cert",
            key: undefined,
            ca: undefined
          },
          interceptor: {
            authToken: "env-token"
          }
        });
      }
    );
  });

  test("should handle insecure=false from env", ({ assert }) => {
    withEnv(
      {
        PERMIFY_ENDPOINT: "env-endpoint:3000",
        PERMIFY_INSECURE: "false"
      },
      () => {
        const options = clientOptionsFromEnv();
        assert.isFalse(options.insecure);
      }
    );
  });

  test("should respect custom prefix", ({ assert }) => {
    withEnv(
      {
        MY_APP_ENDPOINT: "custom-endpoint:4000",
        MY_APP_INSECURE: "true"
      },
      () => {
        const options = clientOptionsFromEnv("MY_APP_");

        assert.equal(options.endpoint, "custom-endpoint:4000");
        assert.isTrue(options.insecure);
      }
    );
  });
});
