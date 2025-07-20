"use client";
import styles from "./canvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  CANVAS_META,
  DEFAULT_CANVAS_STATE,
  DEFAULT_BALL,
  DEFAULT_SQUARE_OBST,
} from "./canvasMeta";

const GameCanvas = () => {
  /* -------------- SETUP -------------- */
  const canvasRef = useRef(null);
  const [gameCanvasState, setGameCanvasState] = useState({
    ...DEFAULT_CANVAS_STATE,
    canvasRef: canvasRef,
  });
  const [ballsState, setBallsState] = useState([]);
  const [obstaclesState, setObstaclesState] = useState([]);
  const [gameRunningState, setGameRunningState] = useState(false);

  /* -------------- HELPERS -------------- */
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
    drawObstacles();
    ballsState.forEach((ball) => {
      collisionDetection(ball);
      calculateTrajectory(ball);
      drawBall(ball);
    });
    setGameCanvasState({
      ...gameCanvasState,
      raf: requestAnimationFrame(draw),
    });
  }, [gameCanvasState, drawObstacles, ballsState, collisionDetection, calculateTrajectory, drawBall]);

  const gameStart = useCallback(() => {
    draw();
  }, [draw]);

  const gameEnd = useCallback(() => {
    const { raf } = gameCanvasState;
    if (raf) {
      cancelAnimationFrame(raf);
      setGameCanvasState({ ...gameCanvasState, raf: null });
    }
  }, [gameCanvasState]);

  /* ------------ USE EFFECT ------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    setGameCanvasState({ canvasRef, canvas, context: canvas.getContext("2d") });
    setObstaclesState([{ ...DEFAULT_SQUARE_OBST }]);
    setBallsState([{ ...DEFAULT_BALL }]);
  }, []);

  useEffect(() => {
    if (gameRunningState) {
      gameEnd();
      gameStart();
    } else {
      gameEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameRunningState]);

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
