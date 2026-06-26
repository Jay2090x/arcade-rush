const ZenConfig = {
  GRID: 280,
  BASE_SAND: [232, 228, 222],
  LIGHT: { x: -0.45, y: -0.35, z: 0.82 },
  RAKE: {
    strength: 0.42,
    tineSpacing: 0.55,
    tineCount: 5,
    width: 2.2,
  },
  PILE: { strength: 3.2, radius: 20, dragStrength: 2.4, dragRadius: 16 },
  SMOOTH: { passes: 1, mix: 0.38 },
  RINGS: { spacing: 1.35, strength: 0.32, maxRadius: 0.48 },
  TRAY: { rim: '#d8d2ca', shadow: 'rgba(30, 28, 26, 0.28)' },
  PLAY: {
    speed: 0.022,
    innerR: 8,
    outerFrac: 0.47,
    rakeStrength: 0.45,
    levelMix: 0.55,
    corridor: 7,
    tineCount: 5,
  },
};