import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import styles from '../../css/landing.module.css';

const packages: { name: string; tag: string; desc: ReactNode; install: string; docs: string }[] = [
  {
    name: '@permify-toolkit/core',
    tag: 'SDK',
    desc: "The schema DSL, a typed Permify client, and a shared config loader. Use this on its own if you don't run NestJS.",
    install: '@permify-toolkit/core',
    docs: '/docs/packages/core',
  },
  {
    name: '@permify-toolkit/nestjs',
    tag: 'framework',
    desc: (<>A NestJS module, a guard, and the <code>@CheckPermission()</code> decorator with AND / OR logic.</>),
    install: '@permify-toolkit/nestjs',
    docs: '/docs/packages/nestjs',
  },
  {
    name: '@permify-toolkit/cli',
    tag: 'cli',
    desc: (<>Schema push, relationship seeding, and a few other chores. Reads the same <code>permify.config.ts</code>.</>),
    install: '-D @permify-toolkit/cli',
    docs: '/docs/packages/cli',
  },
];

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
            <div key={pkg.name} className={styles.pkg}>
              <div className={styles.pkgHead}>
                <span className={styles.pkgName}>{pkg.name}</span>
                <span className={styles.pkgTag}>{pkg.tag}</span>
              </div>
              <p className={styles.pkgDesc}>{pkg.desc}</p>
              <div className={styles.pkgInstall}>
                <span className={styles.dl}>$</span> pnpm add {pkg.install}
              </div>

              <Link to={pkg.docs} className={styles.stepLink}>
                Docs →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
