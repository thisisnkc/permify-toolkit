import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "Permify Toolkit",
  tagline:
    "Type-safe TypeScript toolkit for fine-grained authorization with Permify",
  favicon: "favicons/favicon.ico",

  headTags: [
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "favicons/favicon-16x16.png"
      }
    },
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "favicons/favicon-32x32.png"
      }
    },
    {
      tagName: "link",
      attributes: {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "favicons/apple-touch-icon.png"
      }
    }
  ],

  future: {
    v4: true
  },

  url: "https://thisisnkc.github.io",
  baseUrl: "/permify-toolkit/",

  organizationName: "thisisnkc",
  projectName: "permify-toolkit",

  onBrokenLinks: "throw",

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn"
    }
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"]
  },

  stylesheets: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossorigin: "anonymous"
    },
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap"
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/thisisnkc/permify-toolkit/tree/main/docs-site/"
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css"
        }
      } satisfies Preset.Options
    ]
  ],

  themeConfig: {
    image: "img/logo.png",
    colorMode: {
      respectPrefersColorScheme: true
    },
    navbar: {
      title: "Permify Toolkit",
      logo: {
        alt: "Permify Toolkit Logo",
        src: "img/eagle_logo.png"
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs"
        },
        {
          href: "https://www.npmjs.com/package/@permify-toolkit/core",
          label: "npm",
          position: "right"
        },
        {
          href: "https://github.com/thisisnkc/permify-toolkit",
          label: "GitHub",
          position: "right"
        }
      ]
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/docs/getting-started"
            },
            {
              label: "Core",
              to: "/docs/packages/core"
            },
            {
              label: "NestJS",
              to: "/docs/packages/nestjs"
            },
            {
              label: "CLI",
              to: "/docs/packages/cli"
            }
          ]
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub Issues",
              href: "https://github.com/thisisnkc/permify-toolkit/issues"
            },
            {
              label: "GitHub Discussions",
              href: "https://github.com/thisisnkc/permify-toolkit/discussions"
            },
            {
              label: "Contributing",
              href: "https://github.com/thisisnkc/permify-toolkit/blob/main/CONTRIBUTING.md"
            }
          ]
        },
        {
          title: "More",
          items: [
            {
              label: "Permify",
              href: "https://github.com/Permify/permify"
            },
            {
              label: "npm",
              href: "https://www.npmjs.com/package/@permify-toolkit/core"
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Permify Toolkit. Built with Docusaurus.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json"]
    }
  } satisfies Preset.ThemeConfig
};

export default config;
