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
