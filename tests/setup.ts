import { assert } from "@japa/assert";
import { fileSystem } from "@japa/file-system";
import { expectTypeOf } from "@japa/expect-type";
import { processCLIArgs, configure, run } from "@japa/runner";

processCLIArgs(process.argv.slice(2));

configure({
  suites: [
    {
      name: "core",
      files: ["packages/core/test/**/*.test.ts"]
    },
    {
      name: "cli",
      files: ["packages/cli/test/**/*.test.ts"]
    },
    {
      name: "nestjs",
      files: ["packages/nestjs/test/**/*.test.ts"]
    }
  ],
  plugins: [
    assert(),
    expectTypeOf(),
    fileSystem({ autoClean: true, basePath: "./" })
  ]
});

run();
