// Data-driven level definitions for Area 1: Coral Garden
// Each obstacle: { xFrac (0-1 fraction of level scroll width), yFrac, w, h, type }
// Each collectible: { xFrac, yFrac, type: 'shell'|'starfish'|'shield' }
// speed: scroll pixels per second
// gapH: minimum vertical gap between top/bottom obstacles (fraction of canvas height)

const CoralGardenLevels = [
  {
    id: 1,
    name: "First Breath",
    tutorial: true,
    noPunishment: true,
    speed: 120,
    length: 2400,
    obstacles: [
      { xFrac: 0.55, yFrac: 0.0, w: 50, h: 160, type: 'coral' },
      { xFrac: 0.55, yFrac: 0.72, w: 50, h: 160, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.38, yFrac: 0.46, type: 'shell' },
    ]
  },
  {
    id: 2,
    name: "Soft Coral Path",
    speed: 130,
    length: 3000,
    obstacles: [
      { xFrac: 0.35, yFrac: 0.0,  w: 55, h: 175, type: 'coral' },
      { xFrac: 0.35, yFrac: 0.68, w: 55, h: 175, type: 'coral' },
      { xFrac: 0.65, yFrac: 0.0,  w: 55, h: 145, type: 'coral' },
      { xFrac: 0.65, yFrac: 0.72, w: 55, h: 145, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.5, yFrac: 0.44, type: 'shell' },
      { xFrac: 0.8, yFrac: 0.5, type: 'starfish' },
    ]
  },
  {
    id: 3,
    name: "Bubble Gate",
    speed: 135,
    length: 3200,
    obstacles: [
      { xFrac: 0.3,  yFrac: 0.0,  w: 48, h: 170, type: 'bubble' },
      { xFrac: 0.3,  yFrac: 0.68, w: 48, h: 170, type: 'bubble' },
      { xFrac: 0.58, yFrac: 0.0,  w: 48, h: 155, type: 'bubble' },
      { xFrac: 0.58, yFrac: 0.70, w: 48, h: 155, type: 'bubble' },
      { xFrac: 0.82, yFrac: 0.0,  w: 48, h: 165, type: 'bubble' },
      { xFrac: 0.82, yFrac: 0.69, w: 48, h: 165, type: 'bubble' },
    ],
    collectibles: [
      { xFrac: 0.44, yFrac: 0.46, type: 'shell' },
      { xFrac: 0.7,  yFrac: 0.44, type: 'starfish' },
    ]
  },
  {
    id: 4,
    name: "Seaweed Corridor",
    speed: 140,
    length: 3400,
    obstacles: [
      { xFrac: 0.28, yFrac: 0.0,  w: 36, h: 200, type: 'seaweed' },
      { xFrac: 0.28, yFrac: 0.65, w: 36, h: 200, type: 'seaweed' },
      { xFrac: 0.5,  yFrac: 0.0,  w: 36, h: 185, type: 'seaweed' },
      { xFrac: 0.5,  yFrac: 0.67, w: 36, h: 185, type: 'seaweed' },
      { xFrac: 0.75, yFrac: 0.0,  w: 36, h: 195, type: 'seaweed' },
      { xFrac: 0.75, yFrac: 0.66, w: 36, h: 195, type: 'seaweed' },
    ],
    collectibles: [
      { xFrac: 0.39, yFrac: 0.47, type: 'shell' },
      { xFrac: 0.62, yFrac: 0.45, type: 'starfish' },
      { xFrac: 0.88, yFrac: 0.48, type: 'shield' },
    ]
  },
  {
    id: 5,
    name: "Shell Trail",
    speed: 145,
    length: 3600,
    obstacles: [
      { xFrac: 0.4,  yFrac: 0.0,  w: 52, h: 175, type: 'coral' },
      { xFrac: 0.4,  yFrac: 0.67, w: 52, h: 175, type: 'coral' },
      { xFrac: 0.72, yFrac: 0.0,  w: 52, h: 160, type: 'coral' },
      { xFrac: 0.72, yFrac: 0.69, w: 52, h: 160, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.22, yFrac: 0.5,  type: 'shell' },
      { xFrac: 0.32, yFrac: 0.46, type: 'shell' },
      { xFrac: 0.55, yFrac: 0.44, type: 'shell' },
      { xFrac: 0.85, yFrac: 0.46, type: 'starfish' },
    ]
  },
  {
    id: 6,
    name: "Coral Maze Lite",
    speed: 148,
    length: 3800,
    obstacles: [
      { xFrac: 0.25, yFrac: 0.0,  w: 50, h: 190, type: 'coral' },
      { xFrac: 0.25, yFrac: 0.65, w: 50, h: 190, type: 'coral' },
      { xFrac: 0.45, yFrac: 0.0,  w: 50, h: 160, type: 'coral' },
      { xFrac: 0.45, yFrac: 0.70, w: 50, h: 160, type: 'coral' },
      { xFrac: 0.63, yFrac: 0.0,  w: 50, h: 185, type: 'bubble' },
      { xFrac: 0.63, yFrac: 0.66, w: 50, h: 185, type: 'bubble' },
      { xFrac: 0.82, yFrac: 0.0,  w: 50, h: 172, type: 'coral' },
      { xFrac: 0.82, yFrac: 0.68, w: 50, h: 172, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.35, yFrac: 0.47, type: 'shell' },
      { xFrac: 0.54, yFrac: 0.45, type: 'starfish' },
      { xFrac: 0.72, yFrac: 0.46, type: 'shield' },
    ]
  },
  {
    id: 7,
    name: "Current Drift",
    speed: 165,
    length: 4000,
    currentDrift: true,
    obstacles: [
      { xFrac: 0.28, yFrac: 0.0,  w: 52, h: 175, type: 'coral' },
      { xFrac: 0.28, yFrac: 0.67, w: 52, h: 175, type: 'coral' },
      { xFrac: 0.48, yFrac: 0.0,  w: 52, h: 163, type: 'coral' },
      { xFrac: 0.48, yFrac: 0.68, w: 52, h: 163, type: 'coral' },
      { xFrac: 0.68, yFrac: 0.0,  w: 52, h: 180, type: 'bubble' },
      { xFrac: 0.68, yFrac: 0.66, w: 52, h: 180, type: 'bubble' },
      { xFrac: 0.86, yFrac: 0.0,  w: 52, h: 168, type: 'coral' },
      { xFrac: 0.86, yFrac: 0.68, w: 52, h: 168, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.38, yFrac: 0.46, type: 'shell' },
      { xFrac: 0.58, yFrac: 0.44, type: 'starfish' },
      { xFrac: 0.77, yFrac: 0.45, type: 'starfish' },
    ]
  },
  {
    id: 8,
    name: "Tight Passage",
    speed: 155,
    length: 4200,
    obstacles: [
      { xFrac: 0.24, yFrac: 0.0,  w: 52, h: 205, type: 'coral' },
      { xFrac: 0.24, yFrac: 0.62, w: 52, h: 205, type: 'coral' },
      { xFrac: 0.42, yFrac: 0.0,  w: 52, h: 218, type: 'seaweed' },
      { xFrac: 0.42, yFrac: 0.60, w: 52, h: 218, type: 'seaweed' },
      { xFrac: 0.60, yFrac: 0.0,  w: 52, h: 210, type: 'coral' },
      { xFrac: 0.60, yFrac: 0.61, w: 52, h: 210, type: 'coral' },
      { xFrac: 0.78, yFrac: 0.0,  w: 52, h: 208, type: 'bubble' },
      { xFrac: 0.78, yFrac: 0.61, w: 52, h: 208, type: 'bubble' },
    ],
    collectibles: [
      { xFrac: 0.33, yFrac: 0.47, type: 'shell' },
      { xFrac: 0.51, yFrac: 0.45, type: 'shield' },
      { xFrac: 0.69, yFrac: 0.46, type: 'starfish' },
    ]
  },
  {
    id: 9,
    name: "Memory Shell Trial",
    speed: 158,
    length: 4400,
    mustCollectShells: 2,
    obstacles: [
      { xFrac: 0.30, yFrac: 0.0,  w: 54, h: 185, type: 'coral' },
      { xFrac: 0.30, yFrac: 0.66, w: 54, h: 185, type: 'coral' },
      { xFrac: 0.50, yFrac: 0.0,  w: 54, h: 195, type: 'bubble' },
      { xFrac: 0.50, yFrac: 0.64, w: 54, h: 195, type: 'bubble' },
      { xFrac: 0.70, yFrac: 0.0,  w: 54, h: 188, type: 'coral' },
      { xFrac: 0.70, yFrac: 0.65, w: 54, h: 188, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.20, yFrac: 0.44, type: 'shell' },
      { xFrac: 0.40, yFrac: 0.46, type: 'shell' },
      { xFrac: 0.60, yFrac: 0.44, type: 'starfish' },
      { xFrac: 0.80, yFrac: 0.45, type: 'starfish' },
    ]
  },
  {
    id: 10,
    name: "Coral Gate Exit",
    speed: 170,
    length: 5000,
    finalLevel: true,
    obstacles: [
      { xFrac: 0.20, yFrac: 0.0,  w: 56, h: 190, type: 'coral' },
      { xFrac: 0.20, yFrac: 0.65, w: 56, h: 190, type: 'coral' },
      { xFrac: 0.36, yFrac: 0.0,  w: 56, h: 200, type: 'seaweed' },
      { xFrac: 0.36, yFrac: 0.63, w: 56, h: 200, type: 'seaweed' },
      { xFrac: 0.52, yFrac: 0.0,  w: 56, h: 195, type: 'bubble' },
      { xFrac: 0.52, yFrac: 0.64, w: 56, h: 195, type: 'bubble' },
      { xFrac: 0.67, yFrac: 0.0,  w: 56, h: 205, type: 'coral' },
      { xFrac: 0.67, yFrac: 0.62, w: 56, h: 205, type: 'coral' },
      { xFrac: 0.82, yFrac: 0.0,  w: 56, h: 192, type: 'coral' },
      { xFrac: 0.82, yFrac: 0.64, w: 56, h: 192, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.28, yFrac: 0.46, type: 'shell' },
      { xFrac: 0.44, yFrac: 0.44, type: 'shell' },
      { xFrac: 0.60, yFrac: 0.45, type: 'starfish' },
      { xFrac: 0.75, yFrac: 0.44, type: 'starfish' },
      { xFrac: 0.90, yFrac: 0.44, type: 'shield' },
    ]
  }
];
