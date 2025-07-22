"use client";
import styles from "./canvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  CANVAS_META,
  DEFAULT_BALL,
  DEFAULT_SQUARE_OBST,
  DEFAULT_OBSTACLES,
} from "./canvasMeta";

const RANDOM_COLOR = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

function randomNumber(from, to) {
  return Math.floor(Math.random() * (to - from + 1) + from);
}

function randomObstacle() {
  const rO = randomNumber(0, DEFAULT_OBSTACLES.length - 1);
  return { ...DEFAULT_OBSTACLES[rO] };
}

function generateObstacles(canvas, obstacle) {
  const { columns: canvasColumns, rows: canvasRows } = CANVAS_META;
  const { width: canvasWidth, height: canvasHeight } = canvas;
  const { width: obstacleWidth, height: obstacleHeight } = obstacle;
  const columnWidth = canvasWidth / canvasColumns;

  const numObstacles = randomNumber(1, canvasColumns);
  const obstacleColumns = [];
  const newObstacles = [];

  // const obstAmount = randomNumber(0, canvasColumns);
  // for (let i = 0; i < obstAmount; i++) {
  //   obstacleColumns.push(randomObstacle());
  // }
  // Pick unique random column indices
  while (obstacleColumns.length < numObstacles) {
    const randCol = randomNumber(0, canvasColumns - 1);
    if (!obstacleColumns.includes(randCol)) {
      obstacleColumns.push(randCol);
    }
  }

  obstacleColumns.forEach((randCol) => {
    newObstacles.push({
      randCol,
      obst: randomObstacle(),
    });
  });
  console.log("obstacleColumns", obstacleColumns);
  console.log("newObstacles", newObstacles);

  const obstacles = newObstacles.map((randObst) => {
    const { obst } = randObst;
    const oW = obst.shape === "round" ? obst.radius : obst.width;
    const oH = obst.shape === "round" ? obst.radius * 2 : obst.height;
    const x = randObst.randCol * columnWidth + (columnWidth - oW) / 2; // center it
    console.log(
      "x",
      x,
      "randCol",
      randObst.randCol,
      "columnWidth",
      columnWidth,
      "oW",
      oW
    );
    const y = canvasHeight - oH - randomNumber(10, canvasHeight / canvasRows);
    return { ...obst, x, y, color: RANDOM_COLOR() };
  });

  console.log("obstacles", obstacles);
  return obstacles;
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
      const isRound = obstacle.shape === "round";
      const fontSize = 26;

      // Draw shape
      context.fillStyle = obstacle.color;
      if (isRound) {
        const cx = obstacle.x + obstacle.radius;
        const cy = obstacle.y + obstacle.radius;
        context.beginPath();
        context.arc(cx, cy, obstacle.radius, 0, Math.PI * 2);
        context.fill();
        context.closePath();
      } else {
        context.fillRect(
          obstacle.x,
          obstacle.y,
          obstacle.width,
          obstacle.height
        );
      }

      // Draw health
      context.fillStyle = "black";
      context.font = `bold ${fontSize}px serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      const textX = isRound
        ? obstacle.x + obstacle.radius
        : obstacle.x + obstacle.width / 2;
      const textY = isRound
        ? obstacle.y + obstacle.radius
        : obstacle.y + obstacle.height / 2;
      context.fillText(obstacle.health, textX, textY);
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
      let isColliding = false;

      if (obstacle.shape === "round") {
        // Circle vs Circle collision
        const dx = (obstacle.x + obstacle.radius) - ball.x;
        const dy = (obstacle.y + obstacle.radius) - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        isColliding = distance < ball.radius + obstacle.radius;
      } else {
        // Circle vs Rectangle collision
        const closestX = Math.max(obstacle.x, Math.min(ball.x, obstacle.x + obstacle.width));
        const closestY = Math.max(obstacle.y, Math.min(ball.y, obstacle.y + obstacle.height));
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        isColliding = dx * dx + dy * dy < ball.radius * ball.radius;
      }
      if (isColliding) {
        // Compute ball center
        const ballCenterX = ball.x;
        const ballCenterY = ball.y;

        // Compute obstacle center
        const obstacleCenterX = obstacle.x + obstacle.width / 2;
        const obstacleCenterY = obstacle.y + obstacle.height / 2;

        // Get distances
        const dx = ballCenterX - obstacleCenterX;
        const dy = ballCenterY - obstacleCenterY;

        // Normalize direction
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal collision
          if (dx > 0) {
            // Hit from the right
            ball.x = obstacle.x + obstacle.width + ball.radius;
          } else {
            // Hit from the left
            ball.x = obstacle.x - ball.radius;
          }
          ball.vx *= -1;
        } else {
          // Vertical collision
          if (dy > 0) {
            // Hit from bottom
            ball.y = obstacle.y + obstacle.height + ball.radius;
          } else {
            // Hit from top
            ball.y = obstacle.y - ball.radius;
          }
          ball.vy *= -1;
        }

        // Damage the obstacle
        obstacle.health -= 1;
        if (obstacle.health <= 0) {
          const index = obstaclesRef.current.indexOf(obstacle);
          if (index !== -1) {
            obstaclesRef.current.splice(index, 1);
          }
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
    const newObstacles = generateObstacles(
      canvasRef.current,
      DEFAULT_SQUARE_OBST
    );
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
