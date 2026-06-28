// Data-driven level definitions for Area 1: Coral Garden
// obstacle.move = { axis:'y', amp:px, spd:cycles/ms, phase:rad }
// collectible types: shell | starfish | shield

const CoralGardenLevels = [
  {
    id: 1, name: 'First Breath',
    tutorial: true, noPunishment: true,
    speed: 115, length: 2400,
    obstacles: [
      { xFrac: 0.55, yFrac: 0.0, w: 50, h: 158, type: 'coral' },
      { xFrac: 0.55, yFrac: 0.71, w: 50, h: 158, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.35, yFrac: 0.45, type: 'shell' },
    ]
  },
  {
    id: 2, name: 'Soft Coral Path',
    speed: 128, length: 3000,
    obstacles: [
      { xFrac: 0.34, yFrac: 0.0,  w: 54, h: 172, type: 'coral' },
      { xFrac: 0.34, yFrac: 0.68, w: 54, h: 172, type: 'coral' },
      { xFrac: 0.64, yFrac: 0.0,  w: 54, h: 152, type: 'coral' },
      { xFrac: 0.64, yFrac: 0.72, w: 54, h: 152, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.49, yFrac: 0.44, type: 'shell' },
      { xFrac: 0.79, yFrac: 0.49, type: 'starfish' },
    ]
  },
  {
    id: 3, name: 'Bubble Gate',
    speed: 133, length: 3200,
    obstacles: [
      { xFrac: 0.30, yFrac: 0.0,  w: 46, h: 168, type: 'bubble' },
      { xFrac: 0.30, yFrac: 0.69, w: 46, h: 168, type: 'bubble' },
      { xFrac: 0.57, yFrac: 0.0,  w: 46, h: 155, type: 'bubble' },
      { xFrac: 0.57, yFrac: 0.71, w: 46, h: 155, type: 'bubble' },
      { xFrac: 0.82, yFrac: 0.0,  w: 46, h: 163, type: 'bubble' },
      { xFrac: 0.82, yFrac: 0.70, w: 46, h: 163, type: 'bubble' },
    ],
    collectibles: [
      { xFrac: 0.43, yFrac: 0.45, type: 'shell' },
      { xFrac: 0.69, yFrac: 0.44, type: 'starfish' },
    ]
  },
  {
    id: 4, name: 'Seaweed Corridor',
    speed: 138, length: 3400,
    obstacles: [
      { xFrac: 0.27, yFrac: 0.0,  w: 35, h: 196, type: 'seaweed' },
      { xFrac: 0.27, yFrac: 0.64, w: 35, h: 196, type: 'seaweed' },
      { xFrac: 0.49, yFrac: 0.0,  w: 35, h: 183, type: 'seaweed' },
      { xFrac: 0.49, yFrac: 0.66, w: 35, h: 183, type: 'seaweed' },
      { xFrac: 0.74, yFrac: 0.0,  w: 35, h: 192, type: 'seaweed' },
      { xFrac: 0.74, yFrac: 0.65, w: 35, h: 192, type: 'seaweed' },
    ],
    collectibles: [
      { xFrac: 0.38, yFrac: 0.46, type: 'shell' },
      { xFrac: 0.61, yFrac: 0.44, type: 'starfish' },
      { xFrac: 0.87, yFrac: 0.47, type: 'shield' },
    ]
  },
  {
    id: 5, name: 'Shell Trail',
    speed: 143, length: 3600,
    obstacles: [
      { xFrac: 0.40, yFrac: 0.0,  w: 52, h: 173, type: 'coral' },
      { xFrac: 0.40, yFrac: 0.68, w: 52, h: 173, type: 'coral' },
      { xFrac: 0.71, yFrac: 0.0,  w: 52, h: 160, type: 'coral' },
      { xFrac: 0.71, yFrac: 0.70, w: 52, h: 160, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.22, yFrac: 0.49, type: 'shell' },
      { xFrac: 0.31, yFrac: 0.45, type: 'shell' },
      { xFrac: 0.54, yFrac: 0.44, type: 'shell' },
      { xFrac: 0.84, yFrac: 0.45, type: 'starfish' },
    ]
  },
  {
    id: 6, name: 'Coral Maze Lite',
    speed: 146, length: 3800,
    obstacles: [
      { xFrac: 0.24, yFrac: 0.0,  w: 50, h: 186, type: 'coral' },
      { xFrac: 0.24, yFrac: 0.66, w: 50, h: 186, type: 'coral' },
      { xFrac: 0.43, yFrac: 0.0,  w: 50, h: 160, type: 'coral' },
      { xFrac: 0.43, yFrac: 0.70, w: 50, h: 160, type: 'coral' },
      { xFrac: 0.62, yFrac: 0.0,  w: 50, h: 182, type: 'bubble', move: { axis:'y', amp:30, spd:0.0013, phase:0 } },
      { xFrac: 0.62, yFrac: 0.66, w: 50, h: 182, type: 'bubble', move: { axis:'y', amp:-30, spd:0.0013, phase:0 } },
      { xFrac: 0.82, yFrac: 0.0,  w: 50, h: 170, type: 'coral' },
      { xFrac: 0.82, yFrac: 0.69, w: 50, h: 170, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.33, yFrac: 0.46, type: 'shell' },
      { xFrac: 0.52, yFrac: 0.44, type: 'starfish' },
      { xFrac: 0.72, yFrac: 0.45, type: 'shield' },
    ]
  },
  {
    id: 7, name: 'Current Drift',
    speed: 160, length: 4000,
    obstacles: [
      { xFrac: 0.27, yFrac: 0.0,  w: 52, h: 173, type: 'coral', move: { axis:'y', amp:28, spd:0.0014, phase:0 } },
      { xFrac: 0.27, yFrac: 0.68, w: 52, h: 173, type: 'coral', move: { axis:'y', amp:-28, spd:0.0014, phase:0 } },
      { xFrac: 0.47, yFrac: 0.0,  w: 52, h: 162, type: 'coral' },
      { xFrac: 0.47, yFrac: 0.69, w: 52, h: 162, type: 'coral' },
      { xFrac: 0.67, yFrac: 0.0,  w: 52, h: 178, type: 'bubble', move: { axis:'y', amp:35, spd:0.0012, phase:1.0 } },
      { xFrac: 0.67, yFrac: 0.67, w: 52, h: 178, type: 'bubble', move: { axis:'y', amp:-35, spd:0.0012, phase:1.0 } },
      { xFrac: 0.86, yFrac: 0.0,  w: 52, h: 166, type: 'coral' },
      { xFrac: 0.86, yFrac: 0.69, w: 52, h: 166, type: 'coral' },
    ],
    collectibles: [
      { xFrac: 0.37, yFrac: 0.45, type: 'shell' },
      { xFrac: 0.57, yFrac: 0.43, type: 'starfish' },
      { xFrac: 0.76, yFrac: 0.44, type: 'starfish' },
    ]
  },
  {
    id: 8, name: 'Tight Passage',
    speed: 152, length: 4200,
    obstacles: [
      { xFrac: 0.23, yFrac: 0.0,  w: 52, h: 202, type: 'coral' },
      { xFrac: 0.23, yFrac: 0.63, w: 52, h: 202, type: 'coral' },
      { xFrac: 0.41, yFrac: 0.0,  w: 52, h: 214, type: 'seaweed', move: { axis:'y', amp:22, spd:0.0016, phase:0.5 } },
      { xFrac: 0.41, yFrac: 0.61, w: 52, h: 214, type: 'seaweed', move: { axis:'y', amp:-22, spd:0.0016, phase:0.5 } },
      { xFrac: 0.59, yFrac: 0.0,  w: 52, h: 208, type: 'coral' },
      { xFrac: 0.59, yFrac: 0.62, w: 52, h: 208, type: 'coral' },
      { xFrac: 0.78, yFrac: 0.0,  w: 52, h: 206, type: 'bubble', move: { axis:'y', amp:30, spd:0.0018, phase:2.0 } },
      { xFrac: 0.78, yFrac: 0.62, w: 52, h: 206, type: 'bubble', move: { axis:'y', amp:-30, spd:0.0018, phase:2.0 } },
    ],
    collectibles: [
      { xFrac: 0.32, yFrac: 0.46, type: 'shell' },
      { xFrac: 0.50, yFrac: 0.44, type: 'shield' },
      { xFrac: 0.68, yFrac: 0.45, type: 'starfish' },
    ]
  },
  {
    id: 9, name: 'Memory Shell Trial',
    speed: 155, length: 4400,
    mustCollectShells: 2,
    obstacles: [
      { xFrac: 0.29, yFrac: 0.0,  w: 54, h: 183, type: 'coral', move: { axis:'y', amp:35, spd:0.0015, phase:0 } },
      { xFrac: 0.29, yFrac: 0.66, w: 54, h: 183, type: 'coral', move: { axis:'y', amp:-35, spd:0.0015, phase:0 } },
      { xFrac: 0.49, yFrac: 0.0,  w: 54, h: 193, type: 'bubble' },
      { xFrac: 0.49, yFrac: 0.64, w: 54, h: 193, type: 'bubble' },
      { xFrac: 0.69, yFrac: 0.0,  w: 54, h: 186, type: 'coral', move: { axis:'y', amp:28, spd:0.0017, phase:1.5 } },
      { xFrac: 0.69, yFrac: 0.65, w: 54, h: 186, type: 'coral', move: { axis:'y', amp:-28, spd:0.0017, phase:1.5 } },
    ],
    collectibles: [
      { xFrac: 0.19, yFrac: 0.44, type: 'shell' },
      { xFrac: 0.39, yFrac: 0.45, type: 'shell' },
      { xFrac: 0.59, yFrac: 0.43, type: 'starfish' },
      { xFrac: 0.79, yFrac: 0.44, type: 'starfish' },
    ]
  },
  {
    id: 10, name: 'Coral Gate Exit',
    speed: 168, length: 5000,
    finalLevel: true,
    obstacles: [
      { xFrac: 0.19, yFrac: 0.0,  w: 56, h: 188, type: 'coral' },
      { xFrac: 0.19, yFrac: 0.65, w: 56, h: 188, type: 'coral' },
      { xFrac: 0.34, yFrac: 0.0,  w: 56, h: 197, type: 'seaweed', move: { axis:'y', amp:30, spd:0.0016, phase:0 } },
      { xFrac: 0.34, yFrac: 0.63, w: 56, h: 197, type: 'seaweed', move: { axis:'y', amp:-30, spd:0.0016, phase:0 } },
      { xFrac: 0.50, yFrac: 0.0,  w: 56, h: 193, type: 'bubble', move: { axis:'y', amp:38, spd:0.0014, phase:1.0 } },
      { xFrac: 0.50, yFrac: 0.63, w: 56, h: 193, type: 'bubble', move: { axis:'y', amp:-38, spd:0.0014, phase:1.0 } },
      { xFrac: 0.65, yFrac: 0.0,  w: 56, h: 202, type: 'coral' },
      { xFrac: 0.65, yFrac: 0.63, w: 56, h: 202, type: 'coral' },
      { xFrac: 0.81, yFrac: 0.0,  w: 56, h: 190, type: 'coral', move: { axis:'y', amp:25, spd:0.002, phase:2.0 } },
      { xFrac: 0.81, yFrac: 0.65, w: 56, h: 190, type: 'coral', move: { axis:'y', amp:-25, spd:0.002, phase:2.0 } },
    ],
    collectibles: [
      { xFrac: 0.27, yFrac: 0.45, type: 'shell' },
      { xFrac: 0.42, yFrac: 0.44, type: 'shell' },
      { xFrac: 0.57, yFrac: 0.43, type: 'starfish' },
      { xFrac: 0.73, yFrac: 0.44, type: 'starfish' },
      { xFrac: 0.88, yFrac: 0.43, type: 'shield' },
    ]
  }
];
