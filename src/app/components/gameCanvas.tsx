"use client";
import styles from "./gameCanvas.module.css";
import React, { useRef, useEffect, useState } from "react";

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
  const CANVAS_META = {
    width: 500,
    height: 750,
    rows: 15,
    columns: 5,
  };

  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);
  const [balls, setBalls] = useState([]);
  const [inMotion, setInMotion] = useState(false);
  const [raf, setRaf] = useState(null);

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
  }, []);

  useEffect(() => {
    if (!canvas || !context) {
      return;
    }

    // Display rows
    for (let i = 0; i < CANVAS_META.rows; i++) {
      context.fillStyle = `rgba(0, ${
        (255 * (i + 1)) / CANVAS_META.rows
      }, 0, 0.5)`;
      context.fillRect(0, 50 * i, CANVAS_META.width, 50);
    }

    // Draw spout
    context.beginPath();
    context.arc(canvas.width / 2, 0, 10, 0, Math.PI * 2, true);
    context.fillStyle = "black";
    context.fill();
    context.closePath();

    context.save();

    // Draw ball
    balls.forEach((ball) => {
      draw(context, ball);
    });
  }, [balls, canvas, context]);

  useEffect(() => { 
    if (!inMotion) {
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      return
    }
    const animate = () => {
      context.restore();
      balls.forEach((ball) => {
        const ballXBound = ball.x + ball.radius;
        const ballYBound = ball.y + ball.radius;
        // ball.x cant be smaller than 0 or larger than canvas width
        // ball.y cant be smaller than 0 or larger than canvas height
        if (ballXBound >= CANVAS_META.width || ballXBound <= 0) {
          console.log('ball outside width, reversing vx')
          ball.vx *= -1;
        }
        if (ballYBound >= CANVAS_META.height || ballYBound <= 0) {
          console.log('ball outside height, reversing vy')
          ball.vy *= -1;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;
        console.log('ballXBound', ballXBound)
        console.log('ballYBound', ballYBound)
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
