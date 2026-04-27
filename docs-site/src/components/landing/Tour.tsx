import { useState, useRef } from "react";
import Link from "@docusaurus/Link";
import styles from "../../css/landing.module.css";

function CodeWin({
  filename,
  children
}: {
  filename: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  function handleCopy() {
    const text = preRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={styles.codewin}>
      <div className={styles.bar}>
        <div className={styles.dots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className={styles.barFilename}>{filename}</span>
        <span
          className={styles.codeCopy}
          onClick={handleCopy}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleCopy()}
        >
          {copied ? "copied!" : "copy"}
        </span>
      </div>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
}

function Block1Code() {
  return (
    <CodeWin filename="permify.config.ts">
      <span className={styles.k}>import</span>
      {" {"} defineConfig, schema, entity,{"\n"}
      {"  "}relation, permission {"}"} <span className={styles.k}>from</span>{" "}
      <span className={styles.s}>"@permify-toolkit/core"</span>;{"\n"}
      {"\n"}
      <span className={styles.k}>export default</span>{" "}
      <span className={styles.f}>defineConfig</span>({"{"}
      {"\n"}
      {"  "}
      <span className={styles.p}>tenant</span>:{" "}
      <span className={styles.s}>"t1"</span>,{"\n"}
      {"  "}
      <span className={styles.p}>client</span>: {"{"}{" "}
      <span className={styles.p}>endpoint</span>:{" "}
      <span className={styles.s}>"localhost:3478"</span>,{" "}
      <span className={styles.p}>insecure</span>:{" "}
      <span className={styles.t}>true</span> {"}"},{"\n"}
      {"  "}
      <span className={styles.p}>schema</span>:{" "}
      <span className={styles.f}>schema</span>({"{"}
      {"\n"}
      {"    "}
      <span className={styles.p}>user</span>:{" "}
      <span className={styles.f}>entity</span>({"{}"}),
      {"\n"}
      {"    "}
      <span className={styles.p}>document</span>:{" "}
      <span className={styles.f}>entity</span>({"{"}
      {"\n"}
      {"      "}
      <span className={styles.p}>relations</span>: {"{"}{" "}
      <span className={styles.p}>owner</span>:{" "}
      <span className={styles.f}>relation</span>(
      <span className={styles.s}>"user"</span>),{"\n"}
      {"                    "}
      <span className={styles.p}>viewer</span>:{" "}
      <span className={styles.f}>relation</span>(
      <span className={styles.s}>"user"</span>) {"}"},{"\n"}
      {"      "}
      <span className={styles.p}>permissions</span>: {"{"}
      {"\n"}
      {"        "}
      <span className={styles.p}>edit</span>:{" "}
      <span className={styles.f}>permission</span>(
      <span className={styles.s}>"owner"</span>),{"\n"}
      {"        "}
      <span className={styles.p}>view</span>:{" "}
      <span className={styles.f}>permission</span>(
      <span className={styles.s}>"viewer or owner"</span>),{"\n"}
      {"      "}
      {"}"},{"\n"}
      {"    "}
      {"}"}),
      {"\n"}
      {"  "}
      {"}"}),
      {"\n"}
      {"}"});
    </CodeWin>
  );
}

function Block2Code() {
  const green = { color: "#a3e8a0" };
  const yellow = { color: "#ffd966" };
  return (
    <CodeWin filename="Terminal">
      <span className={styles.c}>$ permify-toolkit schema push</span>
      {"\n"}
      <span style={green}>✓</span> Pushed schema · tenant=
      <span className={styles.s}>"t1"</span> · v=
      <span className={styles.n}>17</span>
      {"\n"}
      {"\n"}
      <span className={styles.c}>$ permify-toolkit relationships seed \</span>
      {"\n"}
      {"    "}
      <span className={styles.c}>--file ./data/relationships.json</span>
      {"\n"}
      <span style={green}>✓</span> Seeded <span className={styles.n}>42</span>{" "}
      relationships in <span className={styles.n}>240</span>ms{"\n"}
      {"\n"}
      <span className={styles.c}>$ permify-toolkit schema diff</span>
      {"\n"}
      {"  "}
      <span style={yellow}>~</span> document · permission{" "}
      <span className={styles.s}>"view"</span>
      {"\n"}
      {"    "}- owner{"\n"}
      {"    "}+ viewer or owner
    </CodeWin>
  );
}

function Block3Code() {
  return (
    <CodeWin filename="documents.controller.ts">
      <span className={styles.f}>@Get</span>(
      <span className={styles.s}>":id"</span>){"\n"}
      <span className={styles.f}>@UseGuards</span>(PermifyGuard){"\n"}
      <span className={styles.f}>@CheckPermission</span>({"{"}
      {"\n"}
      {"  "}
      <span className={styles.p}>resource</span>:{" "}
      <span className={styles.s}>"document"</span>,{"\n"}
      {"  "}
      <span className={styles.p}>action</span>:{" "}
      <span className={styles.s}>"view"</span>,{"\n"}
      {"  "}
      <span className={styles.p}>resourceId</span>: (
      <span className={styles.n}>req</span>) =&gt; req.params.id,{"\n"}
      {"}"}){"\n"}
      <span className={styles.f}>findOne</span>(@
      <span className={styles.f}>Param</span>(
      <span className={styles.s}>"id"</span>){" "}
      <span className={styles.n}>id</span>:{" "}
      <span className={styles.t}>string</span>) {"{"}
      {"\n"}
      {"  "}
      <span className={styles.k}>return</span> this.documentsService.
      <span className={styles.f}>findOne</span>(id);{"\n"}
      {"}"}
    </CodeWin>
  );
}

export default function Tour() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionNum}>
            <strong>02</strong> &nbsp;The five-minute tour
          </div>
          <h2 className={styles.sectionTitle}>
            Define, push, decorate. <em>That's the whole loop.</em>
          </h2>
        </div>

        {/* Block 1: copy left, code right */}
        <div className={styles.tour}>
          <div className={styles.copy}>
            <div className={styles.stepNum}>i.</div>
            <h3 className={styles.stepTitle}>
              Write your schema in TypeScript
            </h3>
            <p className={styles.stepBody}>
              Skip the <code>.perm</code> file. <code>defineConfig</code> gives
              you typed entities, relations, and permission expressions in the
              same project as your app code.
            </p>
            <Link to="/docs/configuration" className={styles.stepLink}>
              Configuration →
            </Link>
          </div>
          <Block1Code />
        </div>

        {/* Block 2: code left, copy right (flip) */}
        <div className={`${styles.tour} ${styles.flip}`}>
          <Block2Code />
          <div className={styles.copy}>
            <div className={styles.stepNum}>ii.</div>
            <h3 className={styles.stepTitle}>Push it from your terminal</h3>
            <p className={styles.stepBody}>
              No flags for tenants, endpoints, or auth tokens — the CLI reads
              your config. <code>diff</code> shows you what's about to change
              before you run <code>push</code>.
            </p>
            <Link to="/docs/packages/cli" className={styles.stepLink}>
              CLI reference →
            </Link>
          </div>
        </div>

        {/* Block 3: copy left, code right */}
        <div className={styles.tour}>
          <div className={styles.copy}>
            <div className={styles.stepNum}>iii.</div>
            <h3 className={styles.stepTitle}>Protect a route in one line</h3>
            <p className={styles.stepBody}>
              Add <code>@CheckPermission()</code> with the resource, action, and
              a function to extract the resource id. The guard does the rest.
            </p>
            <Link to="/docs/packages/nestjs" className={styles.stepLink}>
              NestJS docs →
            </Link>
          </div>
          <Block3Code />
        </div>
      </div>
    </section>
  );
}
