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
          tenantResolver: () => "tenant-1"
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    assert.exists(service);
    assert.exists(service.client);
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
            tenantResolver: () => "tenant-2"
          })
        })
      ]
    }).compile();

    const service = moduleRef.get(PermifyService);
    assert.exists(service);
    assert.exists(service.getTenantResolver());
  });
});
