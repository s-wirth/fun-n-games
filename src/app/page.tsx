'use client';
import { useState } from "react";
import styles from "./page.module.css";
import GameCanvas from "./components/gameCanvas";
import BgCanvas from "./components/backgroundCanvas";
import ControlCanvas from "./components/controlCanvas";

export default function Home() {
  const [angleCoordsState, setAngleCoordsState] = useState({ x: 0, y: 0 });
  const [trajCoordsState, setTrajCoordsState] = useState({ x: 0, y: 0 });
  const [bounceInProgressState, setBounceInProgressState] = useState(false);
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h2 className={styles.title}>{angleCoordsState.x} {angleCoordsState.y} || {trajCoordsState.x} {trajCoordsState.y}</h2>
        <div className={styles.gameContainer}>
          <BgCanvas />
          <GameCanvas props={{ trajCoordsState, bounceInProgressState, setBounceInProgressState }} />
          <ControlCanvas props={{ angleCoordsState, setAngleCoordsState, setTrajCoordsState, bounceInProgressState, setBounceInProgressState }} />
        </div>
      </main>
    </div>
  );
}
