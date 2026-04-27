import styles from "../../css/landing.module.css";

const features = [
  {
    num: "/01",
    title: "Schema, in TypeScript",
    desc: (
      <>
        Entities, relations, and permissions defined with a tiny DSL. IDE
        autocomplete, compile-time checks, and no <code>.perm</code> file to
        keep in sync.
      </>
    ),
    tag: "core"
  },
  {
    num: "/02",
    title: "NestJS, in one decorator",
    desc: (
      <>
        Drop in <code>PermifyModule</code>, mark a controller with{" "}
        <code>@CheckPermission()</code>, and the guard handles AND / OR
        evaluation for you.
      </>
    ),
    tag: "nestjs"
  },
  {
    num: "/03",
    title: "CLI for the boring parts",
    desc: (
      <>
        Push schemas, seed relationships, diff against the live tenant. The CLI
        reads your config — no flags, no extra scripts, no drift.
      </>
    ),
    tag: "cli"
  },
  {
    num: "/04",
    title: "One config, three consumers",
    desc: (
      <>
        <code>permify.config.ts</code> is the single source of truth. Your
        runtime, the CLI, and your tests all read the same file.
      </>
    ),
    tag: "core"
  },
  {
    num: "/05",
    title: "No gRPC paperwork",
    desc: (
      <>
        <code>createPermifyClient()</code> wires connectivity.{" "}
        <code>checkPermission()</code> and <code>writeRelationships()</code>{" "}
        hide the stubs.
      </>
    ),
    tag: "core"
  },
  {
    num: "/06",
    title: "Production-ready defaults",
    desc: (
      <>
        TLS, auth tokens, custom timeouts, env-driven config, and async NestJS
        module init — without re-reading the gRPC docs.
      </>
    ),
    tag: "prod"
  }
];

export default function FeatureTable() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionNum}>
            <strong>01</strong> &nbsp;Why this exists
          </div>
          <h2 className={styles.sectionTitle}>
            A friendlier wrapper for the parts of Permify you'd{" "}
            <em>rather not</em> write twice.
          </h2>
        </div>

        <div className={styles.featureTable}>
          {features.map((f) => (
            <div key={f.num} className={styles.featureRow}>
              <div className={styles.num}>{f.num}</div>
              <div className={styles.title}>{f.title}</div>
              <div className={styles.desc}>{f.desc}</div>
              <div className={styles.tag}>{f.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
