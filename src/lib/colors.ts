export interface PresetColor {
  name: string;
  hex: string;
}

export const PRESET_COLORS: PresetColor[] = [
  { name: "Red", hex: "#DC2626" },
  { name: "Maroon", hex: "#6E1313" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Green", hex: "#16A34A" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gold", hex: "#C9962F" },
];

export function colorHex(name: string): string {
  const found = PRESET_COLORS.find(
    (c) => c.name.toLowerCase() === name.trim().toLowerCase()
  );
  return found?.hex ?? "#A8A29E";
}

export function isPresetColor(name: string): boolean {
  return PRESET_COLORS.some(
    (c) => c.name.toLowerCase() === name.trim().toLowerCase()
  );
}
