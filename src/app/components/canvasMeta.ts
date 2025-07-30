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

const PHYSICS_META = {
  energy_loss: 0.5,
  def_shot_vy: 8,
}

const DEFAULT_BALL = {
  x: CANVAS_META.width / 2,
  y: 20,
  radius: 8,
  vx: null,
  vy: null,
  weight: 1,
  color: "blue",
};
const SQUARE_DIM = 40;

const DEFAULT_SQUARE_OBST = {
  x: null,
  y: null,
  width: SQUARE_DIM,
  height: SQUARE_DIM,
  shape: "square",
  health: 2,
  color: "green",
  original_color: "green",
  hit_color: "red",
};

const DEFAULT_ROUND_OBST = {
  x: null,
  y: null,
  radius: SQUARE_DIM/1.7,
  shape: "round",
  health: 2,
  color: "orange",
  original_color: "orange",
  hit_color: "red",
};

const DEFAULT_OBSTACLES = [DEFAULT_SQUARE_OBST, DEFAULT_ROUND_OBST];

export { CANVAS_META, DEFAULT_CANVAS_STATE, PHYSICS_META, DEFAULT_BALL, DEFAULT_SQUARE_OBST, DEFAULT_ROUND_OBST, DEFAULT_OBSTACLES };