"use client";
import styles from "./canvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  CANVAS_META,
  DEFAULT_BALL,
  DEFAULT_SQUARE_OBST,
  DEFAULT_OBSTACLES,
} from "./canvasMeta";

function cloData(data) {
  data.forEach((d) => {
    console.log(d);
  })
}
const randomColor = () => {
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


function generateObstacles(canvas) {
  const { columns: canvasColumns, rows: canvasRows } = CANVAS_META;
  const { width: canvasWidth, height: canvasHeight } = canvas;
  const columnWidth = canvasWidth / canvasColumns;

  const numObstacles = randomNumber(1, canvasColumns);
  const obstacleColumns = [];
  const newObstacles = [];

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

  return newObstacles.map((randObst) => {
    const { obst } = randObst;
    const oW = obst.shape === "round" ? obst.radius : obst.width;
    const oH = obst.shape === "round" ? obst.radius * 2 : obst.height;
    const x = randObst.randCol * columnWidth + (columnWidth - oW) / 2; // center it
    const y = canvasHeight - oH - randomNumber(10, canvasHeight / canvasRows);
    return { ...obst, x, y };
    // return { ...obst, x, y, color: randomColor() };
  });
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
        const { x, y, radius } = obstacle;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
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
        ? obstacle.x
        : obstacle.x + obstacle.width / 2;
      const textY = isRound
        ? obstacle.y
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
    const { x: bX, y: bY, radius: bR } = ball;
    obstaclesRef.current.forEach((obstacle) => {
      switch (obstacle.shape) {
        case "round":
          const { x: oRX, y: oRY, radius: oRR } = obstacle;
          const dist = Math.sqrt((oRX - bX) ** 2 + (oRY - bY) ** 2);
          if (dist < oRR + bR) {
            if (ball.vx > 0) {
              ball.vx *= -1;
            } else {
              ball.vx *= 1;
            }
            if (ball.vy > 0) {
              ball.vy *= -1;
            } else {
              ball.vy *= 1;
            }
          }
          break;
        case "square":
          const { x: oX, y: oY, width: oW, height: oH } = obstacle;
          const oTop = oY;
          const oBottom = oY + oH;
          const oLeft = oX;
          const oRight = oX + oW;
          const bTop = ball.y - ball.radius;
          const bBottom = ball.y + ball.radius;
          const bLeft = ball.x - ball.radius;
          const bRight = ball.x + ball.radius;
          if (
            bTop < oBottom &&
            bBottom > oTop &&
            bLeft < oRight &&
            bRight > oLeft
          ) {
            if (ball.vx > 0) {
              ball.vx *= -1;
            } else {
              ball.vx *= 1;
            }
            if (ball.vy > 0) {
              ball.vy *= -1;
            } else {
              ball.vy *= 1;
            }
          }
      
        default:
          break;
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
      cloData(ballsRef.current);
      cloData(obstaclesRef.current);
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
