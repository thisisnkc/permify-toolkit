import styles from "../../css/landing.module.css";

export default function Masthead() {
  return (
    <div className={styles.masthead}>
      <div className={styles.container}>
        <div className={styles.mastheadRow}>
          <span>Issue · Authorization</span>
          <span>TypeScript · NestJS · gRPC</span>
          <span style={{ marginLeft: "auto" }}>Built on Permify</span>
        </div>
      </div>
    </div>
  );
}
