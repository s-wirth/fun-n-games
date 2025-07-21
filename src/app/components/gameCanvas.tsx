"use client";
import styles from "./canvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import { CANVAS_META, DEFAULT_BALL, DEFAULT_SQUARE_OBST } from "./canvasMeta";

const GameCanvas = ({
  // props: { trajCoordsState, bounceInProgressState, setBounceInProgressState },
  props: { bounceInProgressState, setBounceInProgressState },
}) => {
  /* -------------- SETUP -------------- */
  const canvasRef = useRef(null);
  const [gameCanvasState, setGameCanvasState] = useState({
    canvasRef: canvasRef,
    canvas: null,
    context: null,
  });
  const [rafState, setRafState] = useState(null);
  const [endBounceState, setEndBounceState] = useState(false);
  const animationFrameRef = useRef();
  const ballsRef = useRef([]);
  const obstaclesRef = useRef([]);

  /* ------------- OBSTACLES ------------- */
  const drawObstacles = useCallback(() => {
    const { context } = gameCanvasState;

    obstaclesRef.current.forEach((obstacle) => {
      context.fillStyle = obstacle.color;
      context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      const font = "bold 20px serif";
      context.fillStyle = "black"; 
      context.font = font;
      context.fillText(obstacle.health, obstacle.x + 5, obstacle.y + obstacle.height - 2);

    });
  }, [gameCanvasState]);

  /* ------------ BALL PHYSICS ------------ */
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

  const collisionDetection = useCallback(
    (ball) => {
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
            obstaclesRef.current.splice(obstaclesRef.current.indexOf(obstacle), 1);
          }
        }
      });
    },
    []
  );

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
      collisionDetection(ball);
      calculateTrajectory(ball);
      drawBall(ball);
    });
    console.log("ballsRef", ballsRef);
    animationFrameRef.current = requestAnimationFrame(drawBalls); // loop!
  }, [
    gameCanvasState,
    drawObstacles,
    collisionDetection,
    calculateTrajectory,
    drawBall,
  ]);

  /* -------------- HELPERS -------------- */
  const cancelRaf = useCallback(() => {
    const { context } = gameCanvasState;
    if (rafState) {
      context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
      cancelAnimationFrame(rafState);
      setRafState(null);
    }
  }, [gameCanvasState, rafState]);

  const initRaf = useCallback(() => {
    if (bounceInProgressState) {
      animationFrameRef.current = requestAnimationFrame(drawBalls);
    }
  }, [bounceInProgressState, drawBalls]); // only things it truly depends on

  /* ------------ USE EFFECT ------------- */

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    setGameCanvasState({ canvasRef, canvas, context: canvas.getContext("2d") });
    obstaclesRef.current = [{ ...DEFAULT_SQUARE_OBST }];
    ballsRef.current = [{ ...DEFAULT_BALL }];
  }, []);

  // Start animation loop
  useEffect(() => {
    if (bounceInProgressState) {
      initRaf();
    }
  }, [bounceInProgressState, initRaf]);

  useEffect(() => {
    if (endBounceState) {
      setBounceInProgressState(false);
      setEndBounceState(false);
      cancelRaf();
    }
    return () => cancelRaf(); // cleanup on unmount
  }, [endBounceState, cancelRaf, setBounceInProgressState]);

  // console.log('bounceInProgressState', bounceInProgressState)
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
