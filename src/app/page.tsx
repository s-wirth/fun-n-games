import styles from "./page.module.css";
import GameCanvas from "./components/gameCanvas";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <GameCanvas />
      </main>
    </div>
  );
}
