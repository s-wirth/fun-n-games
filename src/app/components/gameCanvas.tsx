"use client";
import styles from "./gameCanvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";

const CANVAS_META = {
  width: 500,
  height: 750,
  rows: 15,
  columns: 5,
};

const GameCanvas = () => {
  /* -------------- SETUP -------------- */
  const canvasRef = useRef(null);
  const [gameCanvasState, setGameCanvasState] = useState({
    canvasRef: canvasRef,
    canvas: null,
    context: null,
    raf: null,
  });
  const [ballsState, setBallsState] = useState([]);
  const [gameRunningState, setGameRunningState] = useState(false);

  /* -------------- HELPERS -------------- */

  const drawHelperRows = useCallback(() => {
    const { context } = gameCanvasState;
    for (let i = 0; i < CANVAS_META.rows; i++) {
      context.fillStyle = `rgba(0, ${
        (255 * (i + 1)) / CANVAS_META.rows
      }, 0, 0.5)`;
      context.fillRect(0, 50 * i, CANVAS_META.width, 50);
    }
  }, [gameCanvasState]);

  const drawFixedElements = useCallback(() => {
    const { context, canvas } = gameCanvasState;
    // Draw spout
    context.beginPath();
    context.arc(canvas.width / 2, 0, 10, 0, Math.PI * 2, true);
    context.fillStyle = "black";
    context.fill();
    context.closePath();
  }, [gameCanvasState]);

  const drawBall = useCallback(
    (ball) => {
      // console.log('drawBall');
      const { context } = gameCanvasState;
      const { x, y, radius, color } = ball;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2, true);
      context.fillStyle = color;
      context.fill();
      context.closePath();
    },
    [gameCanvasState]
  );

  const calculateTrajectory = useCallback((ball) => {
    // console.log('calculateTrajectory');
    // ball.x cant be smaller than 0 or larger than canvas width
    // ball.y cant be smaller than 0 or larger than canvas height
    if (ball.x >= CANVAS_META.width - ball.radius || ball.x <= ball.radius) {
      console.log("ball outside width, reversing vx");
      ball.vx *= -1;
    }
    if (ball.y >= CANVAS_META.height - ball.radius || ball.y <= ball.radius) {
      console.log("ball outside height, reversing vy");
      ball.vy *= -1;
    }
    ball.x += ball.vx;
    ball.y += ball.vy;
  }, []);

  const draw = useCallback(() => {
    // console.log('draw');
    const { context } = gameCanvasState;
    context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
    drawHelperRows();
    drawFixedElements();
    ballsState.forEach((ball) => {
      calculateTrajectory(ball);
      drawBall(ball);
    });
    setGameCanvasState({
      ...gameCanvasState,
      raf: requestAnimationFrame(draw),
    });
  }, [
    gameCanvasState,
    drawHelperRows,
    drawFixedElements,
    ballsState,
    calculateTrajectory,
    drawBall,
  ]);

  const gameStart = useCallback(() => {
    draw();
  }, [draw]);

  const gameOver = useCallback(() => {
    console.log("gameOver");
    const { raf } = gameCanvasState;
    if (raf) {
      cancelAnimationFrame(raf);
      setGameCanvasState({ ...gameCanvasState, raf: null });
    }
  }, [gameCanvasState]);

  /* ------------ USE EFFECT ------------- */

  useEffect(() => {
    console.log("gameCanvasState", gameCanvasState);
  }, [gameCanvasState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    setGameCanvasState({ canvasRef, canvas, context: canvas.getContext("2d") });
    setBallsState([
      {
        x: CANVAS_META.width / 2,
        y: 20,
        vx: 5,
        vy: 5,
        radius: 10,
        color: "blue",
      },
    ]);
  }, []);

  useEffect(() => {
    if (gameRunningState) {
      gameStart();
    } else {
      gameOver();
    }
  }, [gameRunningState]);

  // console.log('gameRunningState', gameRunningState)
  // console.log('gameCanvasState', gameCanvasState)

  /* -------------- RENDER -------------- */
  return (
    <div>
      <button onClick={() => setGameRunningState(!gameRunningState)}>
        {gameRunningState ? "Stop" : "Start"}
      </button>
      <canvas
        ref={canvasRef}
        width={CANVAS_META.width}
        height={CANVAS_META.height}
        style={{ border: "1px solid black" }}
        className={styles.canvas}
      />
    </div>
  );
};

export default GameCanvas;
