"use client";
import styles from "./canvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  PHYSICS_META,
  CANVAS_META,
  DEFAULT_BALL,
  DEFAULT_SQUARE_OBST,
  DEFAULT_OBSTACLES,
} from "./canvasMeta";

function cloData(data) {
  data.forEach((d) => {
    console.log(d);
  });
}
function reflectVector(velocity, normal) {
  const dot = velocity.vx * normal.x + velocity.vy * normal.y;
  return {
    vx: velocity.vx - 2 * dot * normal.x,
    vy: velocity.vy - 2 * dot * normal.y,
  };
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
    ballTargetPState,
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
      const textX = isRound ? obstacle.x : obstacle.x + obstacle.width / 2;
      const textY = isRound ? obstacle.y : obstacle.y + obstacle.height / 2;
      context.fillText(obstacle.health, textX, textY);
    });
  }, [gameCanvasState]);

  /* ------------ BALL PHYSICS ------------ */
  const calculateVelocity = useCallback(
    (ball) => {
      const { x: tx, y: ty } = ballTargetPState;
      const { x: bx, y: by } = ball;
      const {def_shot_vy: vy} = PHYSICS_META;
      const dx = tx - bx; // direction is target - current
      const dy = ty - by;
      const vx = (vy / dy) * dx;
      ball.vx = vx;

      ball.vy = vy;
    },
    [ballTargetPState]
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
      setEndBounceState(true);
      return;
    }
    ball.x += ball.vx;
    ball.y += ball.vy;
  }, [setEndBounceState]);

  const collisionDetection = useCallback((ball) => {
    obstaclesRef.current.forEach((obstacle) => {
      let normal = null;
      let isColliding = false;

      if (obstacle.shape === "round") {
        // Circle vs Circle
        const dx = ball.x - obstacle.x;
        const dy = ball.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const sumRadii = ball.radius + obstacle.radius;

        if (distance < sumRadii) {
          isColliding = true;
          normal = { x: dx / distance, y: dy / distance }; // normalized
        }
      } else {
        // Default to rectangular collision
        const inX =
          ball.x + ball.radius >= obstacle.x &&
          ball.x - ball.radius <= obstacle.x + obstacle.width;
        const inY =
          ball.y + ball.radius >= obstacle.y &&
          ball.y - ball.radius <= obstacle.y + obstacle.height;

        if (inX && inY) {
          isColliding = true;

          // Compute normal using AABB center method
          const dx =
            (ball.x - (obstacle.x + obstacle.width / 2)) / (obstacle.width / 2);
          const dy =
            (ball.y - (obstacle.y + obstacle.height / 2)) /
            (obstacle.height / 2);

          if (Math.abs(dx) > Math.abs(dy)) {
            normal = { x: dx > 0 ? 1 : -1, y: 0 }; // horizontal
          } else {
            normal = { x: 0, y: dy > 0 ? 1 : -1 }; // vertical
          }
        }
      }

      if (isColliding && normal) {
        const reflected = reflectVector(ball, normal);
        ball.vx = reflected.vx;
        ball.vy = reflected.vy;

        // Damage obstacle
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
      if (ball.vx === null || ball.vy === null) {
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

  const drawInit = useCallback(() => {
    const { context } = gameCanvasState;
    context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
    drawObstacles();
    ballsRef.current.forEach((ball) => {
      drawBall(ball);
    });
  }, [gameCanvasState, drawObstacles, drawBall]);
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
      drawBall(ballsRef.current[0]);
    }
  }, [gameCanvasState, drawObstacles, drawBall]);

  // Start animation loop
  useEffect(() => {
    if (bounceInProgressState) {
      initRaf();
    }
  }, [bounceInProgressState, initRaf]);

  // End animation loop
  useEffect(() => {
    if (endBounceState) {
      ballsRef.current.forEach((b) => {
        b.x = DEFAULT_BALL.x;
        b.y = DEFAULT_BALL.y;
        b.vx = DEFAULT_BALL.vx;
        b.vy = DEFAULT_BALL.vy;
      });
      drawInit();
      setBounceInProgressState(false);
      setEndBounceState(false);
      cancelRaf();
    }
    return () => cancelRaf(); // cleanup on unmount
  }, [endBounceState, cancelRaf, setBounceInProgressState, setEndBounceState, drawInit]);

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
