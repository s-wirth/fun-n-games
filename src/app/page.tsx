'use client';
import { useState } from "react";
import styles from "./page.module.css";
import GameCanvas from "./components/gameCanvas";
import BgCanvas from "./components/backgroundCanvas";
import ControlCanvas from "./components/controlCanvas";

export default function Home() {
  const [angleCoordsState, setAngleCoordsState] = useState({ x: 0, y: 0 });
  const [targetPointState, setTargetPointState] = useState({ x: 0, y: 0 });
  const [bounceInProgressState, setBounceInProgressState] = useState(false);
  const [endBounceState, setEndBounceState] = useState(false);
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <button onClick={() => setEndBounceState(true)}>Stop</button>
        <h2 className={styles.title}>{angleCoordsState.x} {angleCoordsState.y} || {targetPointState.x} {targetPointState.y}</h2>
        <div className={styles.gameContainer}>
          <BgCanvas />
          <GameCanvas props={{ targetPointState, bounceInProgressState, setBounceInProgressState, endBounceState, setEndBounceState }} />
          <ControlCanvas props={{ angleCoordsState, setAngleCoordsState, setTargetPointState, bounceInProgressState, setBounceInProgressState }} />
        </div>
      </main>
    </div>
  );
}
