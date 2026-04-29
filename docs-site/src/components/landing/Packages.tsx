import { useState, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import styles from "../../css/landing.module.css";

const packages: {
  name: string;
  tag: string;
  desc: ReactNode;
  install: string;
  docs: string;
}[] = [
  {
    name: "@permify-toolkit/core",
    tag: "SDK",
    desc: "The schema DSL, a typed Permify client, and a shared config loader. Use this on its own if you don't run NestJS.",
    install: "@permify-toolkit/core",
    docs: "/docs/packages/core"
  },
  {
    name: "@permify-toolkit/nestjs",
    tag: "framework",
    desc: (
      <>
        A NestJS module, a guard, and the <code>@CheckPermission()</code>{" "}
        decorator with AND / OR logic.
      </>
    ),
    install: "@permify-toolkit/nestjs",
    docs: "/docs/packages/nestjs"
  },
  {
    name: "@permify-toolkit/cli",
    tag: "cli",
    desc: (
      <>
        Schema push, relationship seeding, and a few other chores. Reads the
        same <code>permify.config.ts</code>.
      </>
    ),
    install: "@permify-toolkit/cli",
    docs: "/docs/packages/cli"
  }
];

function PkgCard({ pkg }: { pkg: (typeof packages)[number] }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(`pnpm add ${pkg.install}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={styles.pkg}>
      <div className={styles.pkgHead}>
        <span className={styles.pkgName}>{pkg.name}</span>
        <span className={styles.pkgTag}>{pkg.tag}</span>
      </div>
      <p className={styles.pkgDesc}>{pkg.desc}</p>
      <div className={styles.pkgInstall}>
        <span className={styles.dl}>$</span>
        <span className={styles.pkgCmd}>pnpm add {pkg.install}</span>
        <span className={styles.pkgCopy} onClick={handleCopy}>
          {copied ? "copied!" : "copy"}
        </span>
      </div>

      <Link to={pkg.docs} className={styles.stepLink}>
        Docs →
      </Link>
    </div>
  );
}

export default function Packages() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionNum}>
            <strong>03</strong> &nbsp;What's in the box
          </div>
          <h2 className={styles.sectionTitle}>
            Three small packages. <em>Pick what you need.</em>
          </h2>
        </div>

        <div className={styles.packages}>
          {packages.map((pkg) => (
            <PkgCard key={pkg.name} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  );
}
