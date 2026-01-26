import { resolve } from "node:path";
import { assert } from "@japa/assert";
import { fileSystem } from "@japa/file-system";
import { expectTypeOf } from "@japa/expect-type";
import { processCLIArgs, configure, run } from "@japa/runner";

processCLIArgs(process.argv.slice(2));

const cwd = process.cwd();
const isRoot = !cwd.includes("packages");

function getPackageFiles(pkg: string, path: string) {
  if (isRoot) return [`packages/${pkg}/${path}`];
  if (cwd.endsWith(pkg)) return [path];
  return [];
}

configure({
  importer: (filePath: string | URL) => {
    if (
      typeof filePath === "string" &&
      !filePath.startsWith("file:") &&
      !filePath.startsWith("/")
    ) {
      return import(resolve(cwd, filePath));
    }
    return import(filePath.toString());
  },
  suites: [
    {
      name: "core",
      files: getPackageFiles("core", "tests/**/*.spec.ts")
    },
    {
      name: "cli",
      files: getPackageFiles("cli", "test/**/*.spec.ts")
    },
    {
      name: "nestjs",
      files: getPackageFiles("nestjs", "tests/**/*.spec.ts")
    }
  ],
  plugins: [
    assert(),
    expectTypeOf(),
    fileSystem({ autoClean: true, basePath: "./tests/tmp" })
  ]
});

run();
