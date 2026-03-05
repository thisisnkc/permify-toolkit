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

  // @ts-ignore - japa Group.each is available at runtime but missing from types
  group.each.setup(() => {
    mockCheckResult = { can: 1 };
    mockPermifyService = {
      resolveTenant: () => "tenant-id",
      resolveSubject: () => ({ type: "user", id: "user-id" }),
      resolveResource: () => ({ type: "document", id: "doc-id" }),
      resolveMetadata: () => ({ depth: 10, snapToken: "token" }),
      checkPermission: async () => mockCheckResult.can === 1,
      async evaluatePermissions(params: any) {
        return Promise.all(
          params.checks.map(async (check: any) => {
            const allowed = await this.checkPermission({
              ...params,
              entity: check.entity,
              permission: check.permission
            });
            return { permission: check.permission, allowed };
          })
        );
      }
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

    await assert.rejects(
      () => guard.canActivate(context),
      "Permission denied: edit failed (mode: AND)"
    );
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

  test("should correctly parse standard permission with string resource", async ({
    assert
  }) => {
    mockPermifyService.resolveResource = () => "doc-id";
    mockPermifyService.checkPermission = async (params: any) => {
      assert.equal(params.entity.type, "document");
      assert.equal(params.entity.id, "doc-id");
      assert.equal(params.permission, "view");
      return true;
    };

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
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await guard.canActivate(context);
  });

  test("should correctly infer permission type from resource object", async ({
    assert
  }) => {
    mockPermifyService.resolveResource = () => ({
      type: "document",
      id: "doc-id"
    });
    mockPermifyService.checkPermission = async (params: any) => {
      assert.equal(params.entity.type, "document");
      assert.equal(params.entity.id, "doc-id");
      assert.equal(params.permission, "view");
      return true;
    };

    @Controller()
    class TestController {
      @CheckPermission("view") // Inferred
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await guard.canActivate(context);
  });

  test("should correctly handle redundant permission type with resource object", async ({
    assert
  }) => {
    mockPermifyService.resolveResource = () => ({
      type: "document",
      id: "doc-id"
    });
    mockPermifyService.checkPermission = async (params: any) => {
      assert.equal(params.entity.type, "document"); // Used from resource, but matched
      assert.equal(params.entity.id, "doc-id");
      assert.equal(params.permission, "view");
      return true;
    };

    @Controller()
    class TestController {
      @CheckPermission("document.view") // Redundant
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await guard.canActivate(context);
  });

  test("should correctly override permission type with resource object", async ({
    assert
  }) => {
    mockPermifyService.resolveResource = () => ({
      type: "document",
      id: "doc-id"
    });
    mockPermifyService.checkPermission = async (params: any) => {
      assert.equal(params.entity.type, "organization"); // Overridden
      assert.equal(params.entity.id, "doc-id");
      assert.equal(params.permission, "manage");
      return true;
    };

    @Controller()
    class TestController {
      @CheckPermission("organization.manage") // Override
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await guard.canActivate(context);
  });

  test("should throw when shorthand used without resource resolver", async ({
    assert
  }) => {
    mockPermifyService.resolveResource = () => undefined;

    @Controller()
    class TestController {
      @CheckPermission("view")
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        { provide: PermifyService, useValue: mockPermifyService }
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

  test("AND mode fails if one permission denied", async ({ assert }) => {
    mockPermifyService.checkPermission = async (params: any) => {
      return params.permission === "view"; // "view" true, "edit" false
    };

    @Controller()
    class TestController {
      @CheckPermission(["document.view", "document.edit"])
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await assert.rejects(
      () => guard.canActivate(context),
      "Permission denied: edit failed (mode: AND)"
    );
  });

  test("AND mode fails if all permissions denied", async ({ assert }) => {
    mockPermifyService.checkPermission = async (_params: any) => {
      return false;
    };

    @Controller()
    class TestController {
      @CheckPermission(["document.view", "document.edit"])
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await assert.rejects(
      () => guard.canActivate(context),
      "Permission denied: view failed (mode: AND)"
    );
  });

  test("OR mode success if one granted", async ({ assert }) => {
    mockPermifyService.checkPermission = async (params: any) => {
      return params.permission === "edit";
    };

    @Controller()
    class TestController {
      @CheckPermission(["document.view", "document.edit"], { mode: "OR" })
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        { provide: PermifyService, useValue: mockPermifyService }
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

  test("OR mode fails if none granted", async ({ assert }) => {
    mockPermifyService.checkPermission = async (_params: any) => {
      return false;
    };

    @Controller()
    class TestController {
      @CheckPermission(["document.view", "document.edit"], { mode: "OR" })
      @UseGuards(PermifyGuard)
      @Get()
      test() {}
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermifyGuard,
        Reflector,
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await assert.rejects(
      () => guard.canActivate(context),
      "None of the required permissions were granted: document.view, document.edit"
    );
  });

  test("method decorator overrides class decorator", async ({ assert }) => {
    mockPermifyService.checkPermission = async (params: any) => {
      assert.equal(params.permission, "edit", "Should use method's permission");
      return true;
    };

    @CheckPermission("document.view")
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
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await guard.canActivate(context);
  });

  test("uses class decorator when method decorator missing", async ({
    assert
  }) => {
    mockPermifyService.checkPermission = async (params: any) => {
      assert.equal(params.permission, "view", "Should use class's permission");
      return true;
    };

    @CheckPermission("document.view")
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
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await guard.canActivate(context);
  });

  test("uses subject resolver correctly", async ({ assert }) => {
    mockPermifyService.resolveSubject = () => ({
      type: "admin",
      id: "admin-1"
    });
    mockPermifyService.checkPermission = async (params: any) => {
      assert.equal(params.subject.type, "admin");
      assert.equal(params.subject.id, "admin-1");
      return true;
    };

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
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await guard.canActivate(context);
  });

  test("permify client error propagates as 500", async ({ assert }) => {
    mockPermifyService.evaluatePermissions = async () => {
      throw new Error("gRPC disconnect");
    };

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
        { provide: PermifyService, useValue: mockPermifyService }
      ]
    }).compile();

    const guard = moduleRef.get(PermifyGuard);
    const context = createMockContext(
      TestController.prototype.test,
      TestController
    );

    await assert.rejects(
      () => guard.canActivate(context),
      "Permission check execution failed"
    );
  });
});
