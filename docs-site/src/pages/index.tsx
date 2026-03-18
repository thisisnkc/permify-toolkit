import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import type { ReactNode } from "react";
import CodeBlock from "@theme/CodeBlock";
import { useCallback, useState } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import styles from "./index.module.css";

/* =============================================
   SVG Icons (Heroicons / Lucide style)
   ============================================= */

function IconCode() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconTerminal() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function _IconGitHub() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="yellow"
      stroke="yellow"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CopyableInstall({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(command).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    },
    [command]
  );

  return (
    <div className={styles.packageInstall} onClick={handleCopy}>
      <div className={styles.packageInstallLeft}>
        <span className={styles.packageInstallPrompt}>$</span>
        <code>{command}</code>
      </div>
      <button
        className={`${styles.packageInstallCopy} ${copied ? styles.packageInstallCopied : ""}`}
        type="button"
        onClick={handleCopy}
        aria-label="Copy install command"
        title={copied ? "Copied!" : "Copy to clipboard"}
      >
        {copied ? <IconCheck /> : <IconCopy />}
        <span className={styles.packageInstallCopyText}>
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
    </div>
  );
}

/* =============================================
   Code examples
   ============================================= */

const schemaExample = `import { defineConfig, schema, entity, relation, permission } from "@permify-toolkit/core";

export default defineConfig({
  tenant: "t1",
  client: { endpoint: "localhost:3478", insecure: true },
  schema: schema({
    user: entity({}),
    document: entity({
      relations: { owner: relation("user"), viewer: relation("user") },
      permissions: {
        edit: permission("owner"),
        view: permission("viewer or owner"),
      },
    }),
  }),
});`;

const nestjsExample = `@Get(":id")
@UseGuards(PermifyGuard)
@CheckPermission("document.view")
findOne(@Param("id") id: string) {
  return this.documentsService.findOne(id);
}`;

const cliExample = `$ permify-toolkit schema push
Schema pushed successfully to tenant "t1"

$ permify-toolkit relationships seed -f ./data/relationships.json
Seeded 42 relationships to tenant "t1"`;

/* =============================================
   Sections
   ============================================= */

function HeroSection() {
  return (
    <div className={styles.hero}>
      <div className={styles.heroInner}>
        {/* <div className={styles.heroBadge}>
          Authorization Toolkit for TypeScript
        </div>
        <div className={styles.heroIconMark} aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div> */}
        <Heading as="h1" className={styles.heroTitle}>
          Permify Toolkit
        </Heading>
        <p className={styles.heroSubtitle}>
          The TypeScript toolkit for{" "}
          <a
            href="https://github.com/Permify/permify"
            target="_blank"
            rel="noopener noreferrer"
          >
            Permify
          </a>
          .<br />
          Type-safe schemas, NestJS guards, and CLI — all from one config file.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.heroPrimary} to="/docs/getting-started">
            Get Started <IconArrowRight />
          </Link>
          <Link className={styles.heroSecondary} to="/docs/packages/core">
            API Reference
          </Link>
        </div>
        {/* <div className={styles.heroInstall}> */}
        {/* <code className={styles.heroInstall}>
          pnpm add @permify-toolkit/core
        </code> */}
        {/* </div> */}
        <div className={styles.heroTechBadges}>
          <span className={styles.techBadge}>TypeScript</span>
          <span className={styles.techBadge}>NestJS</span>
          <span className={styles.techBadge}>gRPC</span>
          <span className={styles.techBadge}>Permify</span>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <IconCode />,
      title: "Type-Safe Schema DSL",
      description:
        "Define entities, relations, and permissions in TypeScript. Full IDE autocomplete — catch schema errors at compile time, not at runtime."
    },
    {
      icon: <IconLayers />,
      title: "NestJS-First",
      description:
        "Drop-in PermifyModule, @CheckPermission() decorator, and guard with AND/OR multi-permission logic. One line to protect a route."
    },
    {
      icon: <IconTerminal />,
      title: "CLI Included",
      description:
        "Push schemas and seed relationships from your terminal. Reads your permify.config.ts — no flags, no duplication."
    },
    {
      icon: <IconSettings />,
      title: "One Config File",
      description:
        "permify.config.ts is the single source of truth. Your app, NestJS module, and CLI all consume it."
    },
    {
      icon: <IconZap />,
      title: "Zero gRPC Boilerplate",
      description:
        "Connect with a single function call. checkPermission() and writeRelationships() handle all the plumbing."
    },
    {
      icon: <IconShield />,
      title: "Production Ready",
      description:
        "TLS support, auth tokens, custom timeouts, environment variable config, and async NestJS module initialization."
    }
  ];

  return (
    <div className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Why Permify Toolkit</span>
          <Heading as="h2" className={styles.sectionTitle}>
            Everything you need, nothing you don't
          </Heading>
          <p className={styles.sectionSubtitle}>
            Fine-grained authorization for TypeScript apps — without the gRPC
            boilerplate.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <div key={idx} className={styles.featureCard}>
              <div className={styles.featureIconWrap}>{feature.icon}</div>
              <Heading as="h3" className={styles.featureTitle}>
                {feature.title}
              </Heading>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeShowcase() {
  return (
    <div className={styles.codeShowcase}>
      <div className="container">
        <div className={styles.codeSection}>
          <div className={styles.codeText}>
            <span className={styles.codeSectionNum}>01 / Config</span>
            <Heading as="h2">Define your schema once</Heading>
            <p>
              Write your authorization model in TypeScript with full type
              safety. The same config file powers your app, CLI, and NestJS
              module.
            </p>
            <Link className={styles.codeLink} to="/docs/configuration">
              Learn about configuration <IconArrowRight />
            </Link>
          </div>
          <div className={styles.codeBlock}>
            <CodeBlock language="typescript" title="permify.config.ts">
              {schemaExample}
            </CodeBlock>
          </div>
        </div>

        <div className={styles.codeSection}>
          <div className={styles.codeBlock}>
            <CodeBlock language="typescript" title="documents.controller.ts">
              {nestjsExample}
            </CodeBlock>
          </div>
          <div className={styles.codeText}>
            <span className={styles.codeSectionNum}>02 / NestJS</span>
            <Heading as="h2">Protect routes in one line</Heading>
            <p>
              Use the <code>@CheckPermission()</code> decorator with{" "}
              <code>PermifyGuard</code> to enforce authorization. Supports
              single permissions, AND, and OR evaluation modes.
            </p>
            <Link className={styles.codeLink} to="/docs/packages/nestjs">
              NestJS docs <IconArrowRight />
            </Link>
          </div>
        </div>

        <div className={styles.codeSection}>
          <div className={styles.codeText}>
            <span className={styles.codeSectionNum}>03 / CLI</span>
            <Heading as="h2">Push from your terminal</Heading>
            <p>
              Push schemas and seed relationships without writing scripts. The
              CLI reads your config — no flags needed for tenant or endpoint.
            </p>
            <Link className={styles.codeLink} to="/docs/packages/cli">
              CLI docs <IconArrowRight />
            </Link>
          </div>
          <div className={styles.codeBlock}>
            <CodeBlock language="bash" title="Terminal">
              {cliExample}
            </CodeBlock>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackagesSection() {
  const packages = [
    {
      name: "@permify-toolkit/core",
      badge: "SDK",
      description:
        "Schema DSL, client factory, permission & relationship helpers",
      install: "pnpm add @permify-toolkit/core",
      link: "/docs/packages/core"
    },
    {
      name: "@permify-toolkit/nestjs",
      badge: "Framework",
      description: "NestJS module, guard, service, and decorators",
      install: "pnpm add @permify-toolkit/nestjs",
      link: "/docs/packages/nestjs"
    },
    {
      name: "@permify-toolkit/cli",
      badge: "CLI",
      description: "Schema push and relationship seeding from the terminal",
      install: "pnpm add -D @permify-toolkit/cli",
      link: "/docs/packages/cli"
    }
  ];

  return (
    <div className={styles.packages}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Packages</span>
          <Heading as="h2" className={styles.sectionTitle}>
            Three focused packages
          </Heading>
          <p className={styles.sectionSubtitle}>
            Install only what you need. Each package is independently versioned
            and published.
          </p>
        </div>
        <div className={styles.packagesGrid}>
          {packages.map((pkg, idx) => (
            <Link key={idx} to={pkg.link} className={styles.packageCard}>
              <div className={styles.packageCardHeader}>
                <span className={styles.packageName}>{pkg.name}</span>
                <span className={styles.packageBadge}>{pkg.badge}</span>
              </div>
              <div className={styles.packageCardBody}>
                <p className={styles.packageDescription}>{pkg.description}</p>
                <CopyableInstall command={pkg.install} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function CTASection() {
  return (
    <div className={styles.cta}>
      <div className={styles.ctaInner}>
        <Heading as="h2" className={styles.ctaTitle}>
          Ready to add fine-grained authorization?
        </Heading>
        <p className={styles.ctaSubtitle}>
          Get started in under 5 minutes. Define your schema, push it, and
          protect your routes.
        </p>
        <div className={styles.ctaActions}>
          <Link className={styles.ctaPrimary} to="/docs/getting-started">
            Get Started <IconArrowRight />
          </Link>
          <a
            className={styles.ctaSecondary}
            href="https://github.com/thisisnkc/permify-toolkit"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconStar /> Star on GitHub <IconExternalLink />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <main>
        <HeroSection />
        <FeaturesSection />
        <CodeShowcase />
        <PackagesSection />
        <CTASection />
      </main>
    </Layout>
  );
}
