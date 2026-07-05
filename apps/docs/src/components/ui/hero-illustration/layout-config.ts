export const LAYOUT = {
  glassPane: {
    left: -110,
    top: 10,
    width: 320,
    height: 210,
    elevation: 32, // translateZ height
    // End point of the chart line in the GlassPane's local SVG viewBox (0 0 320 140)
    chartEnd: { x: 320, y: 55 },
    chartHeight: 125, // Height of the chart SVG container
  },
  rateCards: {
    left: 180,
    top: -100,
    width: 190,
    cardHeight: 42,
    gap: 12,
    elevation: 48, // translateZ height
  },
};
