import styles from "./page.module.css";
import GameCanvas from "./components/gameCanvas";
import BgCanvas from "./components/backgroundCanvas";
import ControlCanvas from "./components/controlCanvas";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <BgCanvas />
        <GameCanvas />
        <ControlCanvas />
      </main>
    </div>
  );
}
