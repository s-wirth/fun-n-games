"use client";
import styles from "./gameCanvas.module.css";
import React, { useRef, useEffect, useState, useMemo } from "react";

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
  /* ______________ functions _____________ */

  function drawBall(ball) {
    const { context } = gameCanvasState;
    const { x, y, radius, color } = ball;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, true);
    context.fillStyle = color;
    context.fill();
    context.closePath();
  }
  function draw() {
    const { context } = gameCanvasState;
    context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
    ballsState.forEach((ball) => {
      drawBallCB(ball);
    });
  }

  function gameStart(gaC, ballsState) {
    drawCB(gaC, ballsState);
  }
  function gameOver() {}
  /* ______________ callbacks _____________ */

  const drawCB = useCallback(draw, [ballsState, drawBallCB, gameCanvasState]);
  const drawBallCB = useCallback(drawBall, [gameCanvasState]);
  const gameStartCB = useCallback(gameStart, [drawCB]);

  /* ------------ USE EFFECT ------------- */

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
      gameStartCB(gameCanvasState, ballsState);
    } else {
      gameOver();
    }
  }, [ballsState, gameCanvasState, gameRunningState, gameStartCB]);

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
