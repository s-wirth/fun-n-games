"use client";
import styles from "./gameCanvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";

const CANVAS_META = {
  width: 500,
  height: 750,
  rows: 15,
  columns: 5,
};

const DEFAULT_BALL = {
  x: CANVAS_META.width / 2,
  y: 20,
  radius: 10,
  vx: 0,
  vy: 0,
  maxVy: 10,
  bounceFactor: 0.5,
  bounceStartX: 0,
  bounceStartY: 0,
  color: "blue",
};

const DEFAULT_SQUARE_OBST = {
  x: 250,
  y: CANVAS_META.height - 20,
  width: 20,
  height: 20,
  color: "red",
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
  const [shotAngleState, setShotAngleState] = useState({x: 0, y: 0});
  const [settingAngleState, setSettingAngleState] = useState(false);
  const [ballsState, setBallsState] = useState([]);
  const [obstaclesState, setObstaclesState] = useState([]);
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

  const drawObstacles = useCallback(() => {
    const { context } = gameCanvasState;

    obstaclesState.forEach((obstacle) => {
      context.fillStyle = obstacle.color;
      context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
  }, [gameCanvasState, obstaclesState]);

  const drawBall = useCallback(
    (ball) => {
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

  const collisionDetection = useCallback(
    (ball) => {
      obstaclesState.forEach((obstacle) => {
        if (
          ball.x + ball.radius >= obstacle.x &&
          ball.x - ball.radius <= obstacle.x + obstacle.width &&
          ball.y + ball.radius >= obstacle.y &&
          ball.y - ball.radius <= obstacle.y + obstacle.height
        ) {
          ball.vx *= -1;
          ball.vy *= -1;
        }
      });
    },
    [obstaclesState]
  );

  const drawAngleLine = useCallback(() => {
    const { context } = gameCanvasState;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(shotAngleState.x, shotAngleState.y);
    context.stroke();
  }, [gameCanvasState, shotAngleState]);

  const calculateTrajectory = useCallback((ball) => {
    // ball.x cant be smaller than 0 or larger than canvas width
    if (ball.x >= CANVAS_META.width - ball.radius || ball.x <= ball.radius) {
      console.log("ball outside width, reversing vx");
      ball.vx *= -1;
    }
    // ball.y cant be smaller than 0
    if (ball.y <= ball.radius) {
      console.log("ball outside height, reversing vy");
      ball.vy *= -1;
    }
    if (ball.y >= CANVAS_META.height - ball.radius) {
      ball.vx = 0;
      ball.vy = 0;
    }
    ball.x += ball.vx;
    ball.y += ball.vy;
  }, []);

  const draw = useCallback(() => {
    const { context } = gameCanvasState;
    context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
    drawHelperRows();
    drawFixedElements();
    drawObstacles();
    if (settingAngleState) drawAngleLine();
    ballsState.forEach((ball) => {
      collisionDetection(ball);
      calculateTrajectory(ball);
      drawBall(ball);
    });
    setGameCanvasState({
      ...gameCanvasState,
      raf: requestAnimationFrame(draw),
    });
  }, [gameCanvasState, drawHelperRows, drawFixedElements, drawObstacles, settingAngleState, drawAngleLine, ballsState, collisionDetection, calculateTrajectory, drawBall]);

  const gameStart = useCallback(() => {
    draw();
  }, [draw]);

  const gameOver = useCallback(() => {
    const { raf } = gameCanvasState;
    if (raf) {
      cancelAnimationFrame(raf);
      setGameCanvasState({ ...gameCanvasState, raf: null });
    }
  }, [gameCanvasState]);

  /* ------------ USE EFFECT ------------- */

  useEffect(() => {
    // console.log("gameCanvasState", gameCanvasState);
  }, [gameCanvasState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    setGameCanvasState({ canvasRef, canvas, context: canvas.getContext("2d") });
    setObstaclesState([{ ...DEFAULT_SQUARE_OBST }]);
    setBallsState([{ ...DEFAULT_BALL }]);
  }, []);

  useEffect(() => {
    if (gameRunningState) {
      gameStart();
    } else {
      gameOver();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameRunningState]);

  /* -------------- CLICK LISTENER -------------- */

  const handleMouseDown = useCallback((event) => {
    setSettingAngleState(true);
    const { clientX, clientY } = event;
    const { canvas } = gameCanvasState;
    const { left, top } = canvas.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    setShotAngleState({ x, y });

  }, [gameCanvasState]);

  const handleMouseUp = useCallback(() => {
    setSettingAngleState(false);
    const newBallsState = ballsState.map((ball) => ({ ...ball, vx: ball.x - shotAngleState.x, vy: ball.y - shotAngleState.y }));
    setBallsState(newBallsState);
  }, [ballsState, shotAngleState.x, shotAngleState.y]);

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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};

export default GameCanvas;
