import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "@japa/runner";
import { Test } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import {
  type ExecutionContext,
  type Type,
  Controller,
  Get
} from "@nestjs/common";

import { PermifyModule } from "../src/module.js";
import { PermifyService } from "../src/service.js";
import { PermifyResolvers } from "../src/interfaces.js";

function createMockContext(
  handler: ((...args: any[]) => any) | undefined,
  cls: Type<any> | undefined
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => cls
  } as unknown as ExecutionContext;
}

@PermifyResolvers({
  tenant: () => "controller-tenant",
  subject: () => "controller-subject"
})
@Controller("test")
class TestController {
  @PermifyResolvers({
    tenant: () => "route-tenant",
    subject: () => "route-subject"
  })
  @Get("route")
  route() {}

  @PermifyResolvers({
    subject: () => "route-subject-only"
  })
  @Get("route-partial")
  routePartial() {}

  @Get("none")
  none() {}
}

@Controller("empty")
class EmptyController {
  @Get("none")
  none() {}
}

test.group("PermifyResolvers Precedence", () => {
  test("should resolve from Route > Controller > Global", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      imports: [
        PermifyModule.forRoot({
          client: { endpoint: "localhost:3478", insecure: true },
          resolvers: {
            tenant: () => "global-tenant",
            subject: () => "global-subject"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      TestController.prototype.route,
      TestController
    );

    assert.equal(await service.resolveTenant(context), "route-tenant");
    assert.equal(await service.resolveSubject(context), "route-subject");
  });

  test("should resolve from Controller if Route is missing", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [Reflector],
      imports: [
        PermifyModule.forRoot({
          client: { endpoint: "localhost:3478", insecure: true },
          resolvers: {
            tenant: () => "global-tenant",
            subject: () => "global-subject"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      TestController.prototype.none,
      TestController
    );

    assert.equal(await service.resolveTenant(context), "controller-tenant");
    assert.equal(await service.resolveSubject(context), "controller-subject");
  });

  test("should resolve from Global if Controller/Route are missing", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmptyController],
      imports: [
        PermifyModule.forRoot({
          client: { endpoint: "localhost:3478", insecure: true },
          resolvers: {
            tenant: () => "global-tenant",
            subject: () => "global-subject"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      EmptyController.prototype.none,
      EmptyController
    );

    assert.equal(await service.resolveTenant(context), "global-tenant");
    assert.equal(await service.resolveSubject(context), "global-subject");
  });

  test("should resolve Global tenant if Route defines Subject only (No Merging/Fallback)", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [Reflector],
      imports: [
        PermifyModule.forRoot({
          client: { endpoint: "localhost:3478", insecure: true },
          resolvers: {
            tenant: () => "global-tenant",
            subject: () => "global-subject"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      TestController.prototype.routePartial,
      TestController
    );

    assert.equal(await service.resolveSubject(context), "route-subject-only");
    assert.equal(await service.resolveTenant(context), "global-tenant");
  });

  test("should resolve Resource from Route > Controller > Global", async ({
    assert
  }) => {
    @PermifyResolvers({
      resource: () => "controller-resource"
    })
    @Controller()
    class TestController {
      @PermifyResolvers({
        resource: () => "route-resource"
      })
      @Get()
      testRoute() {}

      @Get("controller-level")
      testControllerLevel() {}
    }

    const moduleRef = await Test.createTestingModule({
      providers: [Reflector],
      controllers: [TestController],
      imports: [
        PermifyModule.forRoot({
          client: { endpoint: "localhost:3478", insecure: true },
          resolvers: {
            tenant: () => "global-tenant",
            resource: () => "global-resource"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);

    // 1. Route Level
    const contextRoute = createMockContext(
      TestController.prototype.testRoute,
      TestController
    );
    assert.equal(await service.resolveResource(contextRoute), "route-resource");

    // 2. Controller Level
    const contextController = createMockContext(
      TestController.prototype.testControllerLevel,
      TestController
    );
    assert.equal(
      await service.resolveResource(contextController),
      "controller-resource"
    );

    // 3. Global Level (Generic Context)
    const contextGlobal = createMockContext(undefined, TestController);
    assert.equal(
      await service.resolveResource(contextGlobal),
      "controller-resource"
    );
  });

  test("should resolve from Global if Resource is missing in overrides", async ({
    assert
  }) => {
    @PermifyResolvers({
      tenant: () => "controller-tenant"
    })
    @Controller()
    class TestController {
      @Get()
      testRoute() {}
    }

    const moduleRef = await Test.createTestingModule({
      providers: [Reflector],
      controllers: [TestController],
      imports: [
        PermifyModule.forRoot({
          client: { endpoint: "localhost:3478", insecure: true },
          resolvers: {
            tenant: () => "global-tenant",
            resource: () => "global-resource"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      TestController.prototype.testRoute,
      TestController
    );

    assert.equal(await service.resolveResource(context), "global-resource");
  });

  test("should resolve Metadata from Route > Controller > Global", async ({
    assert
  }) => {
    @PermifyResolvers({
      metadata: () => ({
        depth: 10,
        snapToken: "controller-token",
        schemaVersion: "v1"
      })
    })
    @Controller()
    class TestController {
      @PermifyResolvers({
        metadata: () => ({ depth: 5, snapToken: "route-token" })
      })
      @Get()
      testRoute() {}

      @Get("controller-level")
      testControllerLevel() {}
    }

    const moduleRef = await Test.createTestingModule({
      providers: [Reflector],
      controllers: [TestController, EmptyController],
      imports: [
        PermifyModule.forRoot({
          client: { endpoint: "localhost:3478", insecure: true },
          resolvers: {
            tenant: () => "global-tenant",
            metadata: () => ({
              depth: 20,
              snapToken: "global-token"
            })
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);

    // 1. Route Level
    const contextRoute = createMockContext(
      TestController.prototype.testRoute,
      TestController
    );
    const routeMetadata = await service.resolveMetadata(contextRoute);
    assert.deepEqual(routeMetadata, { depth: 5, snapToken: "route-token" });

    // 2. Controller Level
    const contextController = createMockContext(
      TestController.prototype.testControllerLevel,
      TestController
    );
    const controllerMetadata = await service.resolveMetadata(contextController);
    assert.deepEqual(controllerMetadata, {
      depth: 10,
      snapToken: "controller-token",
      schemaVersion: "v1"
    });

    // 3. Global Level (Generic Context)
    const contextGlobal = createMockContext(undefined, EmptyController);
    const globalMetadata = await service.resolveMetadata(contextGlobal);
    assert.deepEqual(globalMetadata, { depth: 20, snapToken: "global-token" });
  });
});

test.group("Tenant Config Resolution", () => {
  test("should resolve tenant from config when no resolver is defined", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmptyController],
      imports: [
        PermifyModule.forRoot({
          config: {
            tenant: "config-tenant",
            client: { endpoint: "localhost:3478", insecure: true },
            schema: { ast: {}, compile: () => "" } as any
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      EmptyController.prototype.none,
      EmptyController
    );

    assert.equal(await service.resolveTenant(context), "config-tenant");
  });

  test("should use tenant resolver over config tenant", async ({ assert }) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmptyController],
      imports: [
        PermifyModule.forRoot({
          config: {
            tenant: "config-tenant",
            client: { endpoint: "localhost:3478", insecure: true },
            schema: { ast: {}, compile: () => "" } as any
          },
          resolvers: {
            tenant: () => "resolver-tenant"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      EmptyController.prototype.none,
      EmptyController
    );

    assert.equal(await service.resolveTenant(context), "resolver-tenant");
  });

  test("should throw when no tenant resolver and no config tenant", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmptyController],
      imports: [
        PermifyModule.forRoot({
          client: { endpoint: "localhost:3478", insecure: true }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      EmptyController.prototype.none,
      EmptyController
    );

    await assert.rejects(
      () => service.resolveTenant(context),
      "Tenant resolver is not defined and no tenant found in config"
    );
  });

  test("should resolve tenant from config with other resolvers working normally", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmptyController],
      imports: [
        PermifyModule.forRoot({
          config: {
            tenant: "config-tenant",
            client: { endpoint: "localhost:3478", insecure: true },
            schema: { ast: {}, compile: () => "" } as any
          },
          resolvers: {
            subject: () => "resolved-subject",
            resource: () => ({ type: "doc", id: "1" })
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      EmptyController.prototype.none,
      EmptyController
    );

    // Tenant from config
    assert.equal(await service.resolveTenant(context), "config-tenant");
    // Subject from resolver
    assert.equal(await service.resolveSubject(context), "resolved-subject");
    // Resource from resolver
    assert.deepEqual(await service.resolveResource(context), {
      type: "doc",
      id: "1"
    });
  });

  test("should use route-level tenant resolver over config tenant", async ({
    assert
  }) => {
    @PermifyResolvers({
      tenant: () => "route-tenant"
    })
    @Controller()
    class OverrideController {
      @Get()
      testRoute() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [OverrideController],
      providers: [Reflector],
      imports: [
        PermifyModule.forRoot({
          config: {
            tenant: "config-tenant",
            client: { endpoint: "localhost:3478", insecure: true },
            schema: { ast: {}, compile: () => "" } as any
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      OverrideController.prototype.testRoute,
      OverrideController
    );

    // Route resolver wins over config
    assert.equal(await service.resolveTenant(context), "route-tenant");
  });

  test("should resolve tenant from client mode with resolver", async ({
    assert
  }) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmptyController],
      imports: [
        PermifyModule.forRoot({
          client: { endpoint: "localhost:3478", insecure: true },
          resolvers: {
            tenant: () => "client-mode-tenant"
          }
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    const context = createMockContext(
      EmptyController.prototype.none,
      EmptyController
    );

    assert.equal(await service.resolveTenant(context), "client-mode-tenant");
  });
});

test.group("Tenant Resolution via configFile: true", () => {
  const originalCwd = process.cwd();

  function writeTempConfig(dir: string, content: string) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "permify.config.ts"), content);
  }

  function cleanupDir(dir: string) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  test("should resolve tenant from permify.config.ts when configFile: true", async ({
    assert
  }) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "permify-test-"));
    writeTempConfig(
      tmpDir,
      `export default {
        tenant: "file-tenant",
        client: { endpoint: "localhost:3478", insecure: true },
        schema: { ast: {}, compile: () => "entity user {}" }
      };`
    );
    process.chdir(tmpDir);

    try {
      const moduleRef = await Test.createTestingModule({
        controllers: [EmptyController],
        imports: [PermifyModule.forRoot({ configFile: true })]
      }).compile();

      const service = moduleRef.get(PermifyService);
      const context = createMockContext(
        EmptyController.prototype.none,
        EmptyController
      );

      assert.equal(await service.resolveTenant(context), "file-tenant");
    } finally {
      process.chdir(originalCwd);
      cleanupDir(tmpDir);
    }
  });

  test("should fall back to resolver when config file has no tenant", async ({
    assert
  }) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "permify-test-"));
    writeTempConfig(
      tmpDir,
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: { ast: {}, compile: () => "entity user {}" }
      };`
    );
    process.chdir(tmpDir);

    try {
      const moduleRef = await Test.createTestingModule({
        controllers: [EmptyController],
        imports: [
          PermifyModule.forRoot({
            configFile: true,
            resolvers: {
              tenant: () => "fallback-tenant"
            }
          })
        ]
      }).compile();

      const service = moduleRef.get(PermifyService);
      const context = createMockContext(
        EmptyController.prototype.none,
        EmptyController
      );

      assert.equal(await service.resolveTenant(context), "fallback-tenant");
    } finally {
      process.chdir(originalCwd);
      cleanupDir(tmpDir);
    }
  });

  test("should throw when config file has no tenant and no resolver defined", async ({
    assert
  }) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "permify-test-"));
    writeTempConfig(
      tmpDir,
      `export default {
        client: { endpoint: "localhost:3478", insecure: true },
        schema: { ast: {}, compile: () => "entity user {}" }
      };`
    );
    process.chdir(tmpDir);

    try {
      const moduleRef = await Test.createTestingModule({
        controllers: [EmptyController],
        imports: [PermifyModule.forRoot({ configFile: true })]
      }).compile();

      const service = moduleRef.get(PermifyService);
      const context = createMockContext(
        EmptyController.prototype.none,
        EmptyController
      );

      await assert.rejects(
        () => service.resolveTenant(context),
        "Tenant resolver is not defined and no tenant found in config"
      );
    } finally {
      process.chdir(originalCwd);
      cleanupDir(tmpDir);
    }
  });
});
