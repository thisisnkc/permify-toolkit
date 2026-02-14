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
  cls: Type<any>
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

    // Route defines subject, but NOT tenant.
    // Logic: Get resolvers from Route.
    // Resolvers = { subject: ... }
    // resolvers.tenant is undefined.
    // Fallback?
    // Code says: `const resolver = resolvers?.tenant || this.options.resolvers.tenant;`
    // So it falls back to GLOBAL.
    // It does NOT check Controller, because `getAllAndOverride` returned Route metadata.
    // Controller metadata is ignored completely.
    // This matches "No merging" between Route and Controller.

    assert.equal(await service.resolveSubject(context), "route-subject-only");
    assert.equal(await service.resolveTenant(context), "global-tenant");
  });
});
