import Link from '@docusaurus/Link';
import styles from '../../css/landing.module.css';

export default function Closing() {
  return (
    <section className={styles.closing}>
      <div className={styles.container}>
        <div>
          <h2>
            If it saves you an <em>afternoon,</em> that's the whole point.
          </h2>
          <p>
            Originally built to stop re-writing the same Permify wiring across NestJS projects.
            Open source, MIT, and shaped by issues from people using it.
          </p>
          <div className={styles.closingActions}>
            <Link
              to="/docs/getting-started"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Get started →
            </Link>
            <Link
              to="https://github.com/thisisnkc/permify-toolkit"
              className={`${styles.btn} ${styles.btnGhost}`}
            >
              ★ Star on GitHub
            </Link>
          </div>
        </div>
        <div>
          <blockquote className={styles.closingQuote}>
            "Permify is great, but using it from a Node app often ends up being more work than it
            should be. permify-toolkit is what I wish I had from the start."
            <div className={styles.closingQuoteAttr}>— Nikhil · author</div>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
