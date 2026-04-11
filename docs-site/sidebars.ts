import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    "getting-started",
    "configuration",
    {
      type: "category",
      label: "Packages",
      collapsed: false,
      items: ["packages/core", "packages/nestjs", "packages/cli"]
    },
    "roadmap",
    "examples"
  ]
};

export default sidebars;
