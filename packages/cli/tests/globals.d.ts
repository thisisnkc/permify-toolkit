import type { Assert } from "@japa/assert";
import type { FileSystem } from "@japa/file-system";

declare module "@japa/runner" {
  interface TestContext {
    assert: Assert;
    fs: FileSystem;
  }
}
