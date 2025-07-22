"use client";
import styles from "./canvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import { CANVAS_META, DEFAULT_BALL, DEFAULT_SQUARE_OBST } from "./canvasMeta";

function randomNumber(from, to) {
  return Math.floor(Math.random() * (to - from + 1) + from);
}

function generateObstacles(canvas, obstacle) {
  const {columns: canvasColumns, rows: canvasRows} = CANVAS_META;
  const{ width: canvasWidth, height: canvasHeight} = canvas
  const{ width: obstacleWidth, height: obstacleHeight} = obstacle
  const columnWidth = canvasWidth / canvasColumns;

  const numObstacles = randomNumber(1, canvasColumns);
  const obstacleColumns = [];

  // Pick unique random column indices
  while (obstacleColumns.length < numObstacles) {
    const randCol = randomNumber(0, canvasColumns);
    if (!obstacleColumns.includes(randCol)) {
      obstacleColumns.push(randCol);
    }
  }

  // Create obstacle objects spaced by columns
  const obs =  obstacleColumns.map((colIdx) => {
    const x = colIdx * columnWidth + (columnWidth - obstacleWidth) / 2; // center it
    const y = canvasHeight - obstacleHeight - randomNumber(10, canvasHeight/canvasRows);
    return {
      x,
      y,
      width: obstacleWidth,
      height: obstacleHeight,
      health: 2,
      color: "red", // or randomized
    };
  });

  console.log('obs', obs)
  return obs
}

const GameCanvas = ({
  props: {
    targetPointState,
    bounceInProgressState,
    setBounceInProgressState,
    endBounceState,
    setEndBounceState,
  },
}) => {
  /* -------------- SETUP -------------- */
  const canvasRef = useRef(null);
  const [gameCanvasState, setGameCanvasState] = useState({
    canvasRef: canvasRef,
    canvas: null,
    context: null,
  });
  const animationFrameRef = useRef(null);
  const ballsRef = useRef([]);
  const obstaclesRef = useRef([]);

  /* ------------- OBSTACLES ------------- */
  const drawObstacles = useCallback(() => {
    const { context } = gameCanvasState;

    obstaclesRef.current.forEach((obstacle) => {
      context.fillStyle = obstacle.color;
      context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      const fontS = obstacle.height * 0.7;
      const font = "bold " + fontS + "px serif";
      context.fillStyle = "black";
      context.font = font;
      context.fillText(
        obstacle.health,
        obstacle.x + obstacle.width - fontS,
        obstacle.y + obstacle.height - fontS / 3
      );
    });
  }, [gameCanvasState]);

  /* ------------ BALL PHYSICS ------------ */
  const calculateVelocity = useCallback(
    (ball) => {
      const { x: tx, y: ty } = targetPointState;
      const { x: bx, y: by, vy } = ball;
      const dx = tx - bx; // direction is target - current
      const dy = ty - by;
      const vx = (vy / dy) * dx;
      ball.vx = vx;
    },
    [targetPointState]
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

  const collisionDetection = useCallback((ball) => {
    obstaclesRef.current.forEach((obstacle) => {
      if (
        ball.x + ball.radius >= obstacle.x &&
        ball.x - ball.radius <= obstacle.x + obstacle.width &&
        ball.y + ball.radius >= obstacle.y &&
        ball.y - ball.radius <= obstacle.y + obstacle.height
      ) {
        ball.vx *= -1;
        ball.vy *= -1;
        obstacle.health -= 1;
        if (obstacle.health <= 0) {
          obstaclesRef.current.splice(
            obstaclesRef.current.indexOf(obstacle),
            1
          );
        }
      }
    });
  }, []);

  /* --------------- BALLS --------------- */
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

  const drawBalls = useCallback(() => {
    const { context } = gameCanvasState;
    context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
    drawObstacles();
    ballsRef.current.forEach((ball) => {
      if (ball.vx === null) {
        calculateVelocity(ball);
      }
      collisionDetection(ball);
      calculateTrajectory(ball);
      drawBall(ball);
    });
    animationFrameRef.current = requestAnimationFrame(drawBalls); // loop!
  }, [
    gameCanvasState,
    drawObstacles,
    collisionDetection,
    calculateVelocity,
    calculateTrajectory,
    drawBall,
  ]);

  /* -------------- HELPERS -------------- */
  const cancelRaf = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const initRaf = useCallback(() => {
    if (bounceInProgressState) {
      animationFrameRef.current = requestAnimationFrame(drawBalls);
    }
  }, [bounceInProgressState, drawBalls]); // only things it truly depends on

  const initObstacles = useCallback(() => {
    const newObstacles = generateObstacles(canvasRef.current, DEFAULT_SQUARE_OBST);
    obstaclesRef.current.push(...newObstacles);
  }, []);

  /* ------------ USE EFFECT ------------- */

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    setGameCanvasState({ canvasRef, canvas, context });
    initObstacles();
    ballsRef.current = [{ ...DEFAULT_BALL }];
  }, [initObstacles]);

  useEffect(() => {
    const { context } = gameCanvasState;
    if (context && obstaclesRef.current.length > 0) {
      // Clear and draw obstacles once
      context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
      drawObstacles();
    }
  }, [gameCanvasState, drawObstacles]);

  // Start animation loop
  useEffect(() => {
    if (bounceInProgressState) {
      initRaf();
    }
  }, [bounceInProgressState, initRaf]);

  // End animation loop
  useEffect(() => {
    if (endBounceState) {
      setBounceInProgressState(false);
      setEndBounceState(false);
      cancelRaf();
    }
    return () => cancelRaf(); // cleanup on unmount
  }, [endBounceState, cancelRaf, setBounceInProgressState, setEndBounceState]);

  /* -------------- RENDER -------------- */
  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_META.width}
      height={CANVAS_META.height}
      style={{ border: "1px solid black" }}
      className={`${styles.canvas} ${styles.noControl}`}
    />
  );
};

export default GameCanvas;
