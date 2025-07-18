"use client";
import styles from "./gameCanvas.module.css";
import React, { useRef, useEffect, useState, useMemo } from "react";

function draw(context, ball) {
  const { x, y, radius, color } = ball;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, true);
  context.fillStyle = color;
  context.fill();
  context.closePath();
}

const GameCanvas = () => {
  /* -------------- SETUP -------------- */
  const CANVAS_META = useMemo(() => ({
    width: 500,
    height: 750,
    rows: 15,
    columns: 5,
  }), []);
  const obstacle = useMemo(() => ({
    x: 250,
    y: 700,
    width: 20,
    height: 20,
    color: "red",
  }), []);
  const [obstacles, setObstacles] = useState([{...obstacle}]);
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);
  const [balls, setBalls] = useState([]);
  const [inMotion, setInMotion] = useState(false);
  const [raf, setRaf] = useState(null);

  /* -------------- HELPERS -------------- */
  
  const drawSquare = (x, y, width=10, height=10, color="black") => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  };

  const drawHelperRows = () => {
    for (let i = 0; i < CANVAS_META.rows; i++) {
      context.fillStyle = `rgba(0, ${
        (255 * (i + 1)) / CANVAS_META.rows
      }, 0, 0.5)`;
      context.fillRect(0, 50 * i, CANVAS_META.width, 50);
    }
  };

  const drawFixedElements = () => {
    // Draw spout
    context.beginPath();
    context.arc(canvas.width / 2, 0, 10, 0, Math.PI * 2, true);
    context.fillStyle = "black";
    context.fill();
    context.closePath();
  };
  
  /* -------------- INIT -------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    setCanvas(canvas);
    setContext(canvas.getContext("2d"));
    setBalls([
      {
        x: CANVAS_META.width / 2,
        y: 20,
        vx: 5,
        vy: 5,
        radius: 10,
        color: "blue",
      },
    ]);
  }, [CANVAS_META]);

  useEffect(() => {
    if (!canvas || !context) {
      return;
    }

    // Display rows
    drawHelperRows();
    drawFixedElements();

    context.save();

    // Draw ball
    balls.forEach((ball) => {
      draw(context, ball);
    });
  }, [CANVAS_META, balls, canvas, context]);

  useEffect(() => { 
    if (!inMotion) {
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      return
    }
    const animate = () => {
      context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
      balls.forEach((ball) => {
        // ball.x cant be smaller than 0 or larger than canvas width
        // ball.y cant be smaller than 0 or larger than canvas height
        if (ball.x >= (CANVAS_META.width - ball.radius) || ball.x <= ball.radius) {
          console.log('ball outside width, reversing vx')
          ball.vx *= -1;
        }
        if (ball.y >= (CANVAS_META.height - ball.radius) || ball.y <= ball.radius) {
          console.log('ball outside height, reversing vy')
          ball.vy *= -1;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;
        console.log('ball.x', ball.x)
        console.log('ball.y', ball.y)
        draw(context, ball);
      });
      if (inMotion) {
        setRaf(requestAnimationFrame(animate));
      }
    };
    if (inMotion) {
      setRaf(requestAnimationFrame(animate));
    }
  }, [inMotion]);

  /* -------------- RENDER -------------- */
  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_META.width}
      height={CANVAS_META.height}
      style={{ border: "1px solid black" }}
      className={styles.canvas}
      onClick={() => setInMotion(!inMotion)}
    />
  );
};

export default GameCanvas;
