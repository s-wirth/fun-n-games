"use client";
import styles from "./canvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import { CANVAS_META, DEFAULT_BALL, DEFAULT_SQUARE_OBST } from "./canvasMeta";

const ControlCanvas = () => {
  /* -------------- SETUP -------------- */
  const canvasRef = useRef(null);
  const [controlCanvasState, setControlCanvasState] = useState({
    canvasRef: canvasRef,
    canvas: null,
    context: null,
    raf: null,
  });
  const [shotAngleState, setShotAngleState] = useState({
    beingSet: false,
    angleTrajectory: { x: 0, y: 0 },
    shotTrajectory: { x: 0, y: 0 },
  });

  /* -------------- HELPERS -------------- */


  /* ------------ USE EFFECT ------------- */

  /* -------------- CLICK LISTENER -------------- */


  /* -------------- RENDER -------------- */
  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_META.width}
      height={CANVAS_META.height}
      style={{ border: "1px solid black" }}
      className={styles.canvas}
    />
  );
};

export default ControlCanvas;
