const CANVAS_META = {
  width: 500,
  height: 750,
  rows: 15,
  columns: 5,
};

const DEFAULT_CANVAS_STATE = {
  canvasRef: null,
  canvas: null,
  context: null,
  raf: null,
};

const DEFAULT_BALL = {
  x: CANVAS_META.width / 2,
  y: 20,
  radius: 10,
  vx: 0,
  vy: 2,
  maxVy: 10,
  bounceFactor: 0.5,
  bounceStartX: 0,
  bounceStartY: 0,
  color: "blue",
};

const DEFAULT_SQUARE_OBST = {
  x: 250,
  y: CANVAS_META.height - 20,
  width: 20,
  height: 20,
  color: "red",
};

export { CANVAS_META, DEFAULT_CANVAS_STATE, DEFAULT_BALL, DEFAULT_SQUARE_OBST };