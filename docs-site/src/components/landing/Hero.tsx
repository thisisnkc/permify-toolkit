import { useState } from 'react';
import Link from '@docusaurus/Link';
import styles from '../../css/landing.module.css';

const INSTALL_CMD = 'pnpm add @permify-toolkit/core @permify-toolkit/nestjs';

export default function Hero() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className={styles.hero}>
      <div className={styles.container} style={{ position: 'relative' }}>
        <div className={styles.heroTextCol}>
          <div className={styles.heroEyebrow}>A typed front-end for Permify</div>

          <h1>
            Authorization, written like the <em>rest of your code.</em>
          </h1>

          <p className={styles.heroLede}>
            Define your schema in TypeScript, push it from the CLI, and protect routes with a single
            decorator. One config file feeds your app, your scripts, and your CI — with no{' '}
            <code>.perm</code> drift to maintain.
          </p>

          <div className={styles.heroActions}>
            <Link to="/docs/getting-started" className={`${styles.btn} ${styles.btnPrimary}`}>
              Read the five-minute tour <span className={styles.arrow}>→</span>
            </Link>
            <Link to="/docs/packages/core" className={`${styles.btn} ${styles.btnGhost}`}>
              API Reference
            </Link>
          </div>

          <div className={styles.installLine}>
            <span className={styles.dollar}>$</span>
            <span>{INSTALL_CMD}</span>
            <span className={styles.copy} onClick={handleCopy} role="button" tabIndex={0}>
              {copied ? 'copied!' : 'copy'}
            </span>
          </div>
        </div>

        {/* Floating code card */}
        <div className={styles.heroFigure} aria-hidden="true">
          <div className={styles.heroFigureBar}>
            <div className={styles.dots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            permify.config.ts
          </div>
          <div className={styles.heroFigureBody}>
            <span className={styles.k}>import</span>{' {'} defineConfig, schema, entity,{'\n'}
            {'  '}relation, permission {'}'} <span className={styles.k}>from</span>{' '}
            <span className={styles.s}>"@permify-toolkit/core"</span>;{'\n'}
            {'\n'}
            <span className={styles.k}>export default</span>{' '}
            <span className={styles.f}>defineConfig</span>({'{'}
            {'\n'}
            {'  '}
            <span className={styles.p}>tenant</span>:{' '}
            <span className={styles.s}>"t1"</span>,{'\n'}
            {'  '}
            <span className={styles.p}>client</span>: {'{'}{' '}
            <span className={styles.p}>endpoint</span>:{' '}
            <span className={styles.s}>"localhost:3478"</span> {'}'},{'\n'}
            {'  '}
            <span className={styles.p}>schema</span>:{' '}
            <span className={styles.f}>schema</span>({'{'}
            {'\n'}
            {'    '}
            <span className={styles.p}>user</span>:{' '}
            <span className={styles.f}>entity</span>({'{}'}),{'\n'}
            {'    '}
            <span className={styles.p}>document</span>:{' '}
            <span className={styles.f}>entity</span>({'{'}
            {'\n'}
            {'      '}
            <span className={styles.p}>relations</span>: {'{'}{' '}
            <span className={styles.p}>owner</span>:{' '}
            <span className={styles.f}>relation</span>(
            <span className={styles.s}>"user"</span>) {'}'},{'\n'}
            {'      '}
            <span className={styles.p}>permissions</span>: {'{'}
            {'\n'}
            {'        '}
            <span className={styles.p}>view</span>:{' '}
            <span className={styles.f}>permission</span>(
            <span className={styles.s}>"owner"</span>),{'\n'}
            {'      '}
            {'}'},
            {'\n'}
            {'    '}
            {'}'}),
            {'\n'}
            {'  '}
            {'}'}),
            {'\n'}
            {'}'});
          </div>
        </div>

        {/* Meta strip */}
        <div className={styles.heroMeta}>
          <div className={styles.item}>
            <div className={styles.label}>In the box</div>
            <div className={styles.val}>
              <em>3</em> packages
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>Setup</div>
            <div className={styles.val}>
              ~ <em>5</em> minutes
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>Boilerplate</div>
            <div className={styles.val}>
              <em>0</em> gRPC stubs
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>Type safety</div>
            <div className={styles.val}>end-to-end</div>
          </div>
        </div>
      </div>
    </section>
  );
}
