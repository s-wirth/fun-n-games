"use client";
import styles from "./gameCanvas.module.css";
import React, { useRef, useEffect, useState } from "react";

const GameCanvas = () => {
  /* -------------- SETUP -------------- */
  const CANVAS_META = {
    width: 500,
    height: 750,
    rows: 15,
    columns: 5,
  };

  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);
  const [balls, setBalls] = useState([]);

  /* -------------- INIT -------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    setCanvas(canvas);
    setContext(canvas.getContext("2d"));
    setBalls([{ x: CANVAS_META.width / 2, y: 20, radius: 10, color: "blue" }]);
  }, []);

  useEffect(() => {
    if (!canvas || !context) {
      return;
    }

    // Display rows
    for (let i = 0; i < CANVAS_META.rows; i++) {
      context.fillStyle = `rgba(0, ${
        (255 * (i + 1)) / CANVAS_META.rows
      }, 0, 0.5)`;
      context.fillRect(0, 50 * i, CANVAS_META.width, 50);
    }
    // Draw spout
    context.beginPath();
    context.arc(canvas.width / 2, 0, 10, 0, Math.PI * 2, true);
    context.fillStyle = "black";
    context.fill();
    context.closePath();

    // Draw ball
    balls.forEach((ball) => {
      const { x, y, radius, color } = ball;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2, true);
      context.fillStyle = color;
      context.fill();
      context.closePath();
    });
  }, [balls, canvas, context]);

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

export default GameCanvas;
