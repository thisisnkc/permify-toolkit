import { test } from "@japa/runner";
import { Test } from "@nestjs/testing";

import { PermifyModule } from "../src/module.js";
import { PermifyService } from "../src/service.js";
import { PERMIFY_MODULE_OPTIONS } from "../src/constant.js";
import type { ResolvedPermifyOptions } from "../src/interfaces.js";

test.group("PermifyModule", () => {
  test("should compile with client mode (backwards compatible)", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PermifyModule.forRoot({
          client: {
            endpoint: "localhost:3478",
            insecure: true
          },
          resolvers: {
            tenant: () => "tenant-1",
            subject: () => "user-1"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    assert.exists(service);
  });

  test("should compile with config object mode", async ({ assert }) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PermifyModule.forRoot({
          config: {
            client: {
              endpoint: "localhost:3478",
              insecure: true
            },
            schema: { ast: {}, compile: () => "" } as any
          },
          resolvers: {
            subject: () => "user-1"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    assert.exists(service);
  });

  test("should resolve tenant from config object", async ({ assert }) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PermifyModule.forRoot({
          config: {
            tenant: "config-tenant",
            client: {
              endpoint: "localhost:3478",
              insecure: true
            },
            schema: { ast: {}, compile: () => "" } as any
          }
        })
      ]
    }).compile();

    const resolved = moduleRef.get<ResolvedPermifyOptions>(
      PERMIFY_MODULE_OPTIONS
    );
    assert.equal(resolved.tenant, "config-tenant");
    assert.equal(resolved.client.endpoint, "localhost:3478");
  });

  test("should resolve async module configuration with client mode", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PermifyModule.forRootAsync({
          useFactory: () => ({
            client: {
              endpoint: "localhost:3478",
              insecure: true
            },
            resolvers: {
              tenant: () => "tenant-2",
              subject: () => "user-2"
            }
          })
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    assert.exists(service);
    assert.exists(service.resolveTenant);
  });

  test("should resolve async module configuration with config mode", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PermifyModule.forRootAsync({
          useFactory: () => ({
            config: {
              tenant: "async-tenant",
              client: {
                endpoint: "localhost:3478",
                insecure: true
              },
              schema: { ast: {}, compile: () => "" } as any
            }
          })
        })
      ]
    }).compile();

    const resolved = moduleRef.get<ResolvedPermifyOptions>(
      PERMIFY_MODULE_OPTIONS
    );
    assert.equal(resolved.tenant, "async-tenant");
  });

  test("should compile with subject resolver returning object", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PermifyModule.forRoot({
          client: {
            endpoint: "localhost:3478",
            insecure: true
          },
          resolvers: {
            tenant: () => "tenant-1",
            subject: () => ({
              type: "user",
              id: "user-1"
            })
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    assert.exists(service);
  });

  test("should not include tenant in resolved options for client mode", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PermifyModule.forRoot({
          client: {
            endpoint: "localhost:3478",
            insecure: true
          }
        })
      ]
    }).compile();

    const resolved = moduleRef.get<ResolvedPermifyOptions>(
      PERMIFY_MODULE_OPTIONS
    );
    assert.isUndefined(resolved.tenant);
  });

  test("should not include tenant when config has no tenant", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PermifyModule.forRoot({
          config: {
            client: {
              endpoint: "localhost:3478",
              insecure: true
            },
            schema: { ast: {}, compile: () => "" } as any
          }
        })
      ]
    }).compile();

    const resolved = moduleRef.get<ResolvedPermifyOptions>(
      PERMIFY_MODULE_OPTIONS
    );
    assert.isUndefined(resolved.tenant);
  });
});
