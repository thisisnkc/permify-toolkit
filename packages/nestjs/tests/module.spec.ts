import { test } from "@japa/runner";
import { Test } from "@nestjs/testing";

import { PermifyModule } from "../src/module.js";
import { PermifyService } from "../src/service.js";

test.group("PermifyModule", () => {
  test("should compile the module and resolve service", async ({ assert }) => {
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
    assert.exists(service);
  });

  test("should resolve async module configuration", async ({ assert }) => {
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
});
