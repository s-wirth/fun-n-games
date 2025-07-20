"use client";
import styles from "./canvas.module.css";
import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  CANVAS_META,
  DEFAULT_CANVAS_STATE,
} from "./canvasMeta";

const BgCanvas = () => {
  /* -------------- SETUP -------------- */
  const canvasRef = useRef(null);
  const [bgCanvasState, setBgCanvasState] = useState({
    ...DEFAULT_CANVAS_STATE,
    canvasRef: canvasRef,
  });
  /* -------------- HELPERS -------------- */

  const drawHelperRows = useCallback(() => {
    const { context } = bgCanvasState;
    for (let i = 0; i < CANVAS_META.rows; i++) {
      context.fillStyle = `rgba(0, ${
        (255 * (i + 1)) / CANVAS_META.rows
      }, 0, 0.5)`;
      context.fillRect(0, 50 * i, CANVAS_META.width, 50);
    }
  }, [bgCanvasState]);

  const drawFixedElements = useCallback(() => {
    const { context, canvas } = bgCanvasState;
    // Draw spout
    context.beginPath();
    context.arc(canvas.width / 2, 0, 10, 0, Math.PI * 2, true);
    context.fillStyle = "black";
    context.fill();
    context.closePath();
  }, [bgCanvasState]);

  const draw = useCallback(() => {
    const { context } = bgCanvasState;
    context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
    drawHelperRows();
    drawFixedElements();
  }, [bgCanvasState, drawFixedElements, drawHelperRows]);

  /* ------------ USE EFFECT ------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    setBgCanvasState({ canvasRef, canvas, context: canvas.getContext("2d") });
  }, [canvasRef]);

  useEffect(() => {
    if (!bgCanvasState.context) {
      return;
    }
    draw();
  }, [bgCanvasState.context, draw]);
  

  /* -------------- CLICK LISTENER -------------- */

  /* -------------- RENDER -------------- */
  // console.log("shotAngleState", shotAngleState);
  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_META.width}
      height={CANVAS_META.height}
      style={{ border: "1px solid black" }}
      className={`${styles.canvas} ${styles.bg}`}
    />
  );
};

export default BgCanvas;
