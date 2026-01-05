import { julr } from "@julr/tooling-configs/eslint";

export default await julr({
  typescript: {
    tsconfigPath: [
      "./tsconfig.json",
      "./packages/cli/tsconfig.json",
      "./packages/nestjs/tsconfig.json",
      "./packages/core/tsconfig.json"
    ]
  },

  rules: {
    "@typescript-eslint/no-redeclare": "off",
    "prettier/prettier": [
      "error",
      {
        trailingComma: "none"
      }
    ],
    "unicorn/filename-case": [
      "error",
      {
        case: "kebabCase"
      }
    ]
  },
  ignorePatterns: [
    "packages/**/node_modules/**",
    "packages/**/dist/**",
    "node_modules/**",
    "dist/**",
    "packages/**/types/**",
    "types/**"
  ]
});
