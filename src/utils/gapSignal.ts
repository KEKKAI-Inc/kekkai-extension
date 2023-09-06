import { GapSignal, GapSignalRule } from "../types/valuation";

export function getGapSignal (inputValue: number, outputValue: number): GapSignal {
  const RULES: GapSignalRule[] = [
    {
      color: GapSignal.YELLOW,
      percentage: (inputValue, outputValue) => (outputValue - inputValue) / outputValue >= 0.2,
      distance: (inputValue, outputValue) => (outputValue - inputValue) >= 10,
    },
    {
      color: GapSignal.RED,
      percentage: (inputValue, outputValue) => (outputValue - inputValue) / outputValue >= 0.5,
      distance: (inputValue, outputValue) => (outputValue - inputValue) >= 20,
    },
  ];

  let color = GapSignal.SAFE
  RULES.forEach(rule => {
    if (rule.distance(inputValue, outputValue) && rule.percentage(inputValue, outputValue)) {
      color = rule.color;
    }
  });
  return color;
}