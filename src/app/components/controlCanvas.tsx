"use client";
import styles from "./canvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import { CANVAS_META, DEFAULT_BALL, DEFAULT_SQUARE_OBST } from "./canvasMeta";

const ControlCanvas = ({
  props: {
    angleCoordsState,
    trajCoordsState,
    setAngleCoordsState,
    setTrajCoordsState,
  },
}) => {
  /* -------------- SETUP -------------- */
  const canvasRef = useRef(null);
  const [controlCanvasState, setControlCanvasState] = useState({
    canvasRef: canvasRef,
    canvas: null,
    context: null,
    raf: null,
  });
  const [userActiveState, setUserActiveState] = useState(false);

  /* -------------- HELPERS -------------- */
  const drawLine = useCallback((x,y) => {
    console.log('drawLine', controlCanvasState )
    const { context } = controlCanvasState;
    context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
    context.beginPath();
    context.moveTo(250, 0);
    context.lineTo(x, y);
    context.strokeStyle = "red";
    context.stroke();
    context.closePath();
  }, [controlCanvasState]);
  

  /* ------------ USE EFFECT ------------- */
  useEffect(() => {
    if (userActiveState) {
      console.log("hi");
      const dL = () => {
        drawLine(angleCoordsState.x, angleCoordsState.y);
      }
      requestAnimationFrame(dL);
    } else if (!userActiveState && controlCanvasState.raf) {
      cancelAnimationFrame(controlCanvasState.raf);
    }
  }, [controlCanvasState.raf, userActiveState, drawLine, angleCoordsState.x, angleCoordsState.y]);

  useEffect(() => {
    const canvas = canvasRef.current;
    setControlCanvasState({
      canvasRef,
      canvas,
      context: canvas.getContext("2d"),
    });
  }, []);

  /* -------------- CLICK LISTENER -------------- */
  function handleCoords(event) {
    const { clientX, clientY } = event;
    const { canvas } = controlCanvasState;
    if (!canvas) {
      return;
    }
    const { left, top } = canvas.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    return { x, y };
  }
  function handleMouseDown(event) {
    setUserActiveState(true);
    const { canvas } = controlCanvasState;
    if (!canvas) {
      return;
    }
    setAngleCoordsState(handleCoords(event));
  }
  function handleMouseDrag(event) {
    const { canvas } = controlCanvasState;
    if (!canvas) {
      return;
    }
    setAngleCoordsState(handleCoords(event));
  }
  function handleMouseUp(event) {
    const { canvas } = controlCanvasState;
    if (!canvas) {
      return;
    }
    setUserActiveState(false);
    setTrajCoordsState(handleCoords(event));
    setAngleCoordsState({ x: 0, y: 0 });
  }

  /* -------------- RENDER -------------- */
  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_META.width}
      height={CANVAS_META.height}
      style={{ border: "1px solid black" }}
      className={`${styles.canvas} ${styles.control}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseDrag}
      onMouseUp={handleMouseUp}
    />
  );
};

export default ControlCanvas;
