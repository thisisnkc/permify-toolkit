import { test } from "@japa/runner";
import { Test } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import {
  Controller,
  Get,
  UseGuards,
  type ExecutionContext
} from "@nestjs/common";

import { PermifyGuard } from "../src/guard.js";
import { PermifyService } from "../src/service.js";
import { CheckPermission } from "../src/decorators.js";

function createMockContext(
  handler: ((...args: any[]) => any) | undefined,
  cls: any
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => cls
  } as unknown as ExecutionContext;
}

test.group("PermifyGuard", (group) => {
  let mockCheckResult = { can: 1 }; // Allowed by default
  let mockPermifyService: any;

  (group as any).each.setup(() => {
    mockCheckResult = { can: 1 };
    mockPermifyService = {
      resolveTenant: () => "tenant-id",
      resolveSubject: () => ({ type: "user", id: "user-id" }),
      resolveResource: () => ({ type: "document", id: "doc-id" }),
      checkPermission: async () => mockCheckResult.can === 1
    };
  });

  test("should allow access when permission is granted", async ({ assert }) => {
    @Controller()
    class TestController {
      @CheckPermission("document.view")
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        {
          provide: PermifyService,
          useValue: mockPermifyService
        }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    const result = await guard.canActivate(context);
    assert.isTrue(result);
  });

  test("should deny access when permission is denied", async ({ assert }) => {
    mockCheckResult = { can: 2 }; // Denied (assuming != 1 is denied)

    @Controller()
    class TestController {
      @CheckPermission("document.edit")
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        {
          provide: PermifyService,
          useValue: mockPermifyService
        }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    const result = await guard.canActivate(context);
    assert.isFalse(result);
  });

  test("should allow access when no permission is defined", async ({
    assert
  }) => {
    @Controller()
    class TestController {
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        {
          provide: PermifyService,
          useValue: mockPermifyService
        }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    const result = await guard.canActivate(context);
    assert.isTrue(result);
  });

  test("should throw ForbiddenException when resource resolution fails", async ({
    assert
  }) => {
    mockPermifyService.resolveResource = () => undefined;

    @Controller()
    class TestController {
      @CheckPermission("document.view")
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        {
          provide: PermifyService,
          useValue: mockPermifyService
        }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await assert.rejects(
      () => guard.canActivate(context),
      "Resource could not be resolved"
    );
  });
});
