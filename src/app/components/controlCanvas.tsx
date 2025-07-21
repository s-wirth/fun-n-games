"use client";
import styles from "./canvas.module.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import { CANVAS_META } from "./canvasMeta";

const ControlCanvas = ({
  props: { angleCoordsState, setAngleCoordsState, setTrajCoordsState },
}) => {
  /* -------------- SETUP -------------- */
  const canvasRef = useRef(null);
  const [controlCanvasState, setControlCanvasState] = useState({
    canvasRef: canvasRef,
    canvas: null,
    context: null,
  });
  const [rafState, setRafState] = useState(null);
  const [userActiveState, setUserActiveState] = useState(false);

  /* -------------- HELPERS -------------- */
  const drawLine = useCallback(
    (mouseX, mouseY) => {
      const { context } = controlCanvasState;
      const originX = 250; // Starting X
      const originY = 0; // Starting Y

      // Direction vector from origin to mouse
      const dx = mouseX - originX;
      const dy = mouseY - originY;

      // Avoid divide-by-zero
      if (dx === 0 && dy === 0) {
        return;
      }

      // Determine which vertical wall we will hit first
      const targetWallX = dx > 0 ? CANVAS_META.width : 0;
      const t = (targetWallX - originX) / dx;
      const targetWallY = originY + dy * t;

      // Reflect horizontally for bounce
      const reflectedDx = -dx;
      const reflectedDy = dy;

      // Extend bounce from wall
      const bounceLength = 2000; // adjust as needed
      const norm = Math.sqrt(reflectedDx ** 2 + reflectedDy ** 2);
      const bounceX = targetWallX + (reflectedDx / norm) * bounceLength;
      const bounceY = targetWallY + (reflectedDy / norm) * bounceLength;

      // Draw initial path to wall
      context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
      context.beginPath();
      context.moveTo(originX, originY);
      context.lineTo(targetWallX, targetWallY);
      context.strokeStyle = "red";
      context.stroke();
      context.closePath();

      // Draw bounce path
      context.beginPath();
      context.moveTo(targetWallX, targetWallY);
      context.lineTo(bounceX, bounceY);
      context.strokeStyle = "orange";
      context.stroke();
      context.closePath();
    },
    [controlCanvasState]
  );

  const initRaf = useCallback(() => {
    const { context } = controlCanvasState;
    if (userActiveState && context) {
      context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
      const dL = () => drawLine(angleCoordsState.x, angleCoordsState.y);
      const raf = requestAnimationFrame(dL);
      setRafState(raf);
    }
  }, [
    angleCoordsState.x,
    angleCoordsState.y,
    controlCanvasState,
    drawLine,
    userActiveState,
  ]);

  const cancelRaf = useCallback(() => {
    const { context } = controlCanvasState;
    if (rafState) {
      context.clearRect(0, 0, CANVAS_META.width, CANVAS_META.height);
      cancelAnimationFrame(rafState);
      setRafState(null);
    }
  }, [controlCanvasState, rafState]);

  /* ------------ USE EFFECT ------------- */
  useEffect(() => {
    if (userActiveState) {
      initRaf();
    }
  }, [userActiveState, initRaf]);

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
    cancelRaf();
  }
  function handleMouseLeave() {
    const { canvas } = controlCanvasState;
    if (!canvas) {
      return;
    }
    setUserActiveState(false);
    setAngleCoordsState({ x: 0, y: 0 });
    cancelRaf();
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
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default ControlCanvas;
