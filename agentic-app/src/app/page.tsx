"use client";

import { useMemo, useState } from "react";

type FacadePattern = "grid" | "stacked" | "offset";
type BalconyFrequency = "none" | "alternate" | "every" | "corners";
type RoofStyle = "flat" | "pitched" | "sawtooth";

type BuildingConfig = {
  projectName: string;
  narrative: string;
  floors: number;
  floorHeight: number;
  lobbyHeight: number;
  width: number;
  depth: number;
  coreWidth: number;
  coreDepth: number;
  baseHeight: number;
  structuralGrid: number;
  unitsPerFloor: number;
  facadePattern: FacadePattern;
  windowModule: number;
  windowWidth: number;
  windowHeight: number;
  spandrelHeight: number;
  balconyDepth: number;
  balconyFrequency: BalconyFrequency;
  roofStyle: RoofStyle;
  podiumLevels: number;
  podiumSetback: number;
  includePodium: boolean;
  hasAtrium: boolean;
  addRooftopGarden: boolean;
  includeSolarPanels: boolean;
  includeLightShelves: boolean;
  colors: {
    base: string;
    accent: string;
    glazing: string;
    balcony: string;
    roof: string;
  };
};

type AiInference = {
  updates: Partial<BuildingConfig>;
  summary: string;
};

const defaultConfig: BuildingConfig = {
  projectName: "Aurora Habitat Tower",
  narrative:
    "A mixed-use tower prioritizing daylight, biophilic terraces, and a flexible core for future adaptation.",
  floors: 18,
  floorHeight: 3.6,
  lobbyHeight: 6,
  width: 38,
  depth: 26,
  coreWidth: 10,
  coreDepth: 8,
  baseHeight: 1.2,
  structuralGrid: 7.5,
  unitsPerFloor: 8,
  facadePattern: "grid",
  windowModule: 3.2,
  windowWidth: 2.6,
  windowHeight: 2.4,
  spandrelHeight: 0.8,
  balconyDepth: 2.1,
  balconyFrequency: "alternate",
  roofStyle: "flat",
  podiumLevels: 3,
  podiumSetback: 4,
  includePodium: true,
  hasAtrium: true,
  addRooftopGarden: true,
  includeSolarPanels: true,
  includeLightShelves: false,
  colors: {
    base: "#4d5c6f",
    accent: "#c48f5a",
    glazing: "#85c3ff",
    balcony: "#f2ede4",
    roof: "#37414f",
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const escapePythonString = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const hexToRgb = (hex: string) => {
  const cleaned = hex.replace("#", "");
  const chunk =
    cleaned.length === 3
      ? cleaned.split("").map((c) => c + c)
      : cleaned.match(/.{1,2}/g) ?? ["00", "00", "00"];
  const [r, g, b] = chunk.map((c) => parseInt(c, 16));
  return { r, g, b };
};

const lightenColor = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex);
  const lighten = (channel: number) =>
    Math.round(channel + (255 - channel) * clamp(amount, 0, 1));
  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
};

const mixWithBlack = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number) => Math.round(channel * (1 - clamp(amount, 0, 1)));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

const colorToPythonTuple = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const normalize = (channel: number) => (channel / 255).toFixed(4);
  return `(${normalize(r)}, ${normalize(g)}, ${normalize(b)}, 1.0)`;
};

const formatNumber = (value: number) =>
  Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);

const generateBlenderScript = (config: BuildingConfig) => {
  const pythonBoolean = (value: boolean) => (value ? "True" : "False");

  const dimsPython = [
    "{",
    `        "width": ${formatNumber(config.width)},`,
    `        "depth": ${formatNumber(config.depth)},`,
    `        "floor_height": ${formatNumber(config.floorHeight)},`,
    `        "lobby_height": ${formatNumber(config.lobbyHeight)},`,
    `        "base_height": ${formatNumber(config.baseHeight)},`,
    `        "core_width": ${formatNumber(config.coreWidth)},`,
    `        "core_depth": ${formatNumber(config.coreDepth)},`,
    `        "podium_levels": ${formatNumber(config.podiumLevels)},`,
    `        "podium_setback": ${formatNumber(config.podiumSetback)}`,
    "    }",
  ].join("\n");

  const facadePython = [
    "{",
    `        "pattern": "${config.facadePattern}",`,
    `        "module": ${formatNumber(config.windowModule)},`,
    `        "window_width": ${formatNumber(config.windowWidth)},`,
    `        "window_height": ${formatNumber(config.windowHeight)},`,
    `        "spandrel_height": ${formatNumber(config.spandrelHeight)},`,
    `        "balcony_depth": ${formatNumber(config.balconyDepth)},`,
    `        "balcony_frequency": "${config.balconyFrequency}",`,
    `        "include_light_shelves": ${pythonBoolean(config.includeLightShelves)}`,
    "    }",
  ].join("\n");

  const colors = {
    base: colorToPythonTuple(config.colors.base),
    accent: colorToPythonTuple(config.colors.accent),
    glazing: colorToPythonTuple(config.colors.glazing),
    balcony: colorToPythonTuple(config.colors.balcony),
    roof: colorToPythonTuple(config.colors.roof),
  };

  return `"""
Blender Building Assistant Script
Generated for: ${escapePythonString(config.projectName)}
Narrative: ${escapePythonString(config.narrative)}

Run inside Blender's scripting workspace.
"""

import bpy
import math

CONFIG = {
    "project_name": "${escapePythonString(config.projectName)}",
    "narrative": "${escapePythonString(config.narrative)}",
    "floors": ${formatNumber(config.floors)},
    "units_per_floor": ${formatNumber(config.unitsPerFloor)},
    "roof_style": "${config.roofStyle}",
    "include_podium": ${pythonBoolean(config.includePodium)},
    "has_atrium": ${pythonBoolean(config.hasAtrium)},
    "add_rooftop_garden": ${pythonBoolean(config.addRooftopGarden)},
    "include_solar_panels": ${pythonBoolean(config.includeSolarPanels)},
    "dimensions": ${dimsPython},
    "facade": ${facadePython},
    "colors": {
        "base": ${colors.base},
        "accent": ${colors.accent},
        "glazing": ${colors.glazing},
        "balcony": ${colors.balcony},
        "roof": ${colors.roof}
    }
}


# -------- Utility Helpers --------
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for collection in (bpy.data.meshes, bpy.data.lights, bpy.data.cameras):
        for block in list(collection):
            collection.remove(block, do_unlink=True)


def create_material(name, color_tuple):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
    nodes = mat.node_tree.nodes
    principled = nodes.get("Principled BSDF")
    principled.inputs[0].default_value = color_tuple
    principled.inputs[7].default_value = 0.05
    return mat


# -------- Core Systems --------
def create_site_grid(cfg):
    width = cfg["dimensions"]["width"]
    depth = cfg["dimensions"]["depth"]
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=12, y_subdivisions=12, size=max(width, depth) * 0.75)
    plane = bpy.context.active_object
    plane.name = f"{cfg['project_name']}::SiteGrid"
    plane.location = (0, 0, 0)
    plane_mat = create_material("GroundPlane", (0.12, 0.12, 0.12, 1.0))
    plane.data.materials.append(plane_mat)


def create_core(cfg, materials):
    dims = cfg["dimensions"]
    height = dims["floor_height"] * cfg["floors"] + dims["base_height"] * 2
    bpy.ops.mesh.primitive_cube_add(size=1)
    core = bpy.context.active_object
    core.name = "VerticalCore"
    core.scale = (dims["core_width"] / 2, dims["core_depth"] / 2, height / 2)
    core.location = (0, 0, height / 2)
    core.data.materials.append(materials["accent"])
    bpy.ops.object.modifier_add(type='BEVEL')
    core.modifiers['Bevel'].width = 0.2
    core.modifiers['Bevel'].segments = 2
    return core


def create_floor_plate(cfg, level, materials):
    dims = cfg["dimensions"]
    z = dims["base_height"] + dims["floor_height"] * level + dims["floor_height"] / 2
    height = dims["floor_height"]
    if level == 0:
        height = cfg["dimensions"]["lobby_height"]
        z = dims["base_height"] + height / 2
    bpy.ops.mesh.primitive_cube_add(size=1)
    block = bpy.context.active_object
    block.name = f"Floor_{level + 1:02d}"
    block.scale = (dims["width"] / 2, dims["depth"] / 2, height / 2)
    block.location = (0, 0, z)
    block.data.materials.append(materials["base"])
    return block


def create_balcony(cfg, level, col_index, total_cols, materials):
    facade = cfg["facade"]
    dims = cfg["dimensions"]
    if facade["balcony_depth"] <= 0.05:
        return
    spacing = dims["width"] / max(1, total_cols)
    x = -dims["width"] / 2 + spacing * (col_index + 0.5)
    z_base = dims["base_height"] + dims["floor_height"] * level + dims["floor_height"] * 0.6
    bpy.ops.mesh.primitive_cube_add(size=1)
    balcony = bpy.context.active_object
    balcony.name = f"Balcony_{level + 1:02d}_{col_index:02d}"
    balcony.scale = (facade["window_width"] / 2, facade["balcony_depth"] / 2, dims["floor_height"] * 0.18)
    balcony.location = (x, dims["depth"] / 2 + facade["balcony_depth"] / 2, z_base)
    balcony.data.materials.append(materials["balcony"])
    bpy.ops.object.modifier_add(type='BEVEL')
    balcony.modifiers['Bevel'].width = 0.08
    balcony.modifiers['Bevel'].segments = 2


def add_windows(cfg, level, side, materials):
    dims = cfg["dimensions"]
    facade = cfg["facade"]
    module = max(1.0, facade["module"])
    window_w = facade["window_width"]
    window_h = facade["window_height"]
    is_front_back = side in ("front", "back")
    width = dims["width"] if is_front_back else dims["depth"]
    depth = dims["depth"] if is_front_back else dims["width"]
    repetitions = max(1, int(width // module))
    forward = depth / 2 + 0.02
    forward = forward if side in ("front", "right") else -forward
    parent = bpy.data.objects.get(f"Floor_{level + 1:02d}")
    for idx in range(repetitions):
        bpy.ops.mesh.primitive_cube_add(size=1)
        win = bpy.context.active_object
        win.name = f"Window_{side}_{level + 1:02d}_{idx:03d}"
        spread = width / repetitions
        position = -width / 2 + spread * (idx + 0.5)
        if is_front_back:
            win.location = (position, forward, dims["base_height"] + dims["floor_height"] * level + window_h / 2 + facade["spandrel_height"])
            win.scale = (window_w / 2, 0.05, window_h / 2)
        else:
            win.location = (forward, position, dims["base_height"] + dims["floor_height"] * level + window_h / 2 + facade["spandrel_height"])
            win.scale = (0.05, window_w / 2, window_h / 2)
        win.data.materials.append(materials["glazing"])
        if parent:
            win.parent = parent


def create_podium(cfg, materials):
    dims = cfg["dimensions"]
    setback = cfg["dimensions"]["podium_setback"]
    for level in range(cfg["dimensions"]["podium_levels"]):
        bpy.ops.mesh.primitive_cube_add(size=1)
        pod = bpy.context.active_object
        pod.name = f"Podium_{level + 1}"
        shrink = setback * level
        height = dims["floor_height"]
        pod.scale = ((dims["width"] + setback * 2 - shrink) / 2, (dims["depth"] + setback * 2 - shrink) / 2, height / 2)
        pod.location = (0, 0, dims["base_height"] + height / 2 + level * height)
        pod.data.materials.append(materials["accent"])


def apply_roof(cfg, materials):
    dims = cfg["dimensions"]
    top_level = cfg["floors"]
    z = dims["base_height"] + dims["floor_height"] * top_level + dims["floor_height"] * 0.5
    bpy.ops.mesh.primitive_cube_add(size=1)
    roof = bpy.context.active_object
    roof.name = "Roof"
    roof.scale = (dims["width"] / 2, dims["depth"] / 2, 0.4)
    roof.location = (0, 0, z)
    roof.data.materials.append(materials["roof"])
    if cfg["roof_style"] == "pitched":
        bpy.ops.object.modifier_add(type='SIMPLE_DEFORM')
        roof.modifiers['SimpleDeform'].deform_method = 'BEND'
        roof.modifiers['SimpleDeform'].angle = math.radians(12)
    elif cfg["roof_style"] == "sawtooth":
        bpy.ops.object.modifier_add(type='ARRAY')
        roof.modifiers['Array'].count = 4
        roof.modifiers['Array'].relative_offset_displace[0] = 0.3

    if cfg["include_solar_panels"]:
        panel_count = 10
        for idx in range(panel_count):
            bpy.ops.mesh.primitive_cube_add(size=1)
            panel = bpy.context.active_object
            panel.name = f"Solar_{idx:02d}"
            panel.scale = (1.2, 2.4, 0.05)
            panel.location = (
                -dims["width"] / 2 + 2 + (idx % 5) * 3,
                -dims["depth"] / 2 + 2 + (idx // 5) * 3,
                z + 0.35,
            )
            panel.data.materials.append(materials["accent"])
            panel.rotation_euler[0] = math.radians(12)

    if cfg["add_rooftop_garden"]:
        bpy.ops.mesh.primitive_plane_add(size=min(dims["width"], dims["depth"]) * 0.65, location=(0, 0, z + 0.2))
        garden = bpy.context.active_object
        garden.name = "RooftopGarden"
        garden_mat = create_material("RooftopGarden", (0.18, 0.32, 0.18, 1))
        garden.data.materials.append(garden_mat)


def carve_atrium(cfg):
    if not cfg["has_atrium"]:
        return
    dims = cfg["dimensions"]
    bpy.ops.mesh.primitive_cube_add(size=1)
    atrium = bpy.context.active_object
    atrium.name = "AtriumCut"
    atrium.scale = (dims["width"] * 0.25, dims["depth"] * 0.25, dims["floor_height"] * cfg["floors"] / 2)
    atrium.location = (0, 0, dims["base_height"] + dims["floor_height"] * cfg["floors"] / 2)
    for obj in bpy.data.objects:
        if obj.name.startswith("Floor_"):
            bool_mod = obj.modifiers.new(name="AtriumBoolean", type='BOOLEAN')
            bool_mod.operation = 'DIFFERENCE'
            bool_mod.object = atrium
    atrium.hide_viewport = True
    atrium.hide_render = True


def tag_metadata(cfg):
    if "building_metadata" not in bpy.context.scene:
        bpy.context.scene["building_metadata"] = {}
    bpy.context.scene["building_metadata"][cfg["project_name"]] = cfg


def material_library(cfg):
    base = create_material("Facade_Base", cfg["colors"]["base"])
    accent = create_material("Facade_Accent", cfg["colors"]["accent"])
    glazing = create_material("Facade_Glass", cfg["colors"]["glazing"])
    balcony = create_material("Balcony_Frame", cfg["colors"]["balcony"])
    roof = create_material("Roof_Finish", cfg["colors"]["roof"])
    return {"base": base, "accent": accent, "glazing": glazing, "balcony": balcony, "roof": roof}


def build(cfg):
    clear_scene()
    create_site_grid(cfg)
    materials = material_library(cfg)
    create_core(cfg, materials)
    if cfg["include_podium"]:
        create_podium(cfg, materials)
    for level in range(cfg["floors"]):
        floor = create_floor_plate(cfg, level, materials)
        add_windows(cfg, level, "front", materials)
        add_windows(cfg, level, "back", materials)
        add_windows(cfg, level, "left", materials)
        add_windows(cfg, level, "right", materials)
        if cfg["facade"]["balcony_frequency"] != "none" and level > 0 and cfg["facade"]["balcony_depth"] > 0.05:
            module_count = max(3, int(cfg["dimensions"]["width"] // cfg["facade"]["module"]))
            if cfg["facade"]["balcony_frequency"] == "every" or (cfg["facade"]["balcony_frequency"] == "alternate" and level % 2 == 0):
                for col in range(module_count):
                    create_balcony(cfg, level, col, module_count, materials)
            elif cfg["facade"]["balcony_frequency"] == "corners":
                corner_cols = max(2, module_count)
                for col in (0, corner_cols - 1):
                    create_balcony(cfg, level, col, corner_cols, materials)
        if cfg["facade"]["include_light_shelves"] and level <= 6:
            bpy.ops.mesh.primitive_cube_add(size=1)
            shelf = bpy.context.active_object
            shelf.name = f"LightShelf_{level + 1:02d}"
            shelf.scale = (cfg["dimensions"]["width"] / 2, 0.25, 0.05)
            shelf.location = (0, cfg["dimensions"]["depth"] / 2 + 0.3, floor.location[2] + cfg["facade"]["window_height"] / 2)
            shelf.data.materials.append(materials["accent"])
    carve_atrium(cfg)
    apply_roof(cfg, materials)
    tag_metadata(cfg)
    bpy.context.view_layer.update()


if __name__ == "__main__":
    build(CONFIG)
`;
};

const applyAiInference = (prompt: string, current: BuildingConfig): AiInference => {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) {
    return { updates: {}, summary: "" };
  }

  const updates: Partial<BuildingConfig> = {};
  const summaryParts: string[] = [];

  const floorMatch = normalized.match(/(\d+)[-\s]*(story|storey|floor)s?/);
  if (floorMatch) {
    const floors = clamp(parseInt(floorMatch[1], 10), 1, 80);
    updates.floors = floors;
    summaryParts.push(`Set tower to ${floors} floors.`);
  } else if (normalized.includes("supertall")) {
    updates.floors = clamp(current.floors + 40, 30, 120);
    summaryParts.push("Adjusted height to supertall proportion.");
  } else if (normalized.includes("tall")) {
    updates.floors = clamp(current.floors + 8, 6, 80);
    summaryParts.push("Raised overall height.");
  } else if (normalized.includes("low-rise") || normalized.includes("mid-rise")) {
    updates.floors = clamp(current.floors, 4, 12);
    summaryParts.push("Shaped tower to mid-rise scale.");
  }

  const widthMatch = normalized.match(/(\d+(?:\.\d+)?)\s*m(?:eter)?s?\s*wide/);
  if (widthMatch) {
    const widthValue = clamp(parseFloat(widthMatch[1]), 10, 120);
    updates.width = widthValue;
    summaryParts.push(`Adjusted width to ${widthValue}m.`);
  }

  const depthMatch = normalized.match(/(\d+(?:\.\d+)?)\s*m(?:eter)?s?\s*(deep|depth)/);
  if (depthMatch) {
    const depthValue = clamp(parseFloat(depthMatch[1]), 10, 120);
    updates.depth = depthValue;
    summaryParts.push(`Adjusted depth to ${depthValue}m.`);
  }

  if (normalized.includes("slender")) {
    updates.width = clamp(current.width * 0.85, 12, current.width);
    updates.depth = clamp(current.depth * 0.85, 12, current.depth);
    summaryParts.push("Slenderized the floor plate.");
  }

  if (normalized.includes("atrium")) {
    updates.hasAtrium = true;
    summaryParts.push("Enabled multi-level atrium.");
  }

  if (normalized.includes("podium")) {
    updates.includePodium = true;
    updates.podiumLevels = Math.max(current.podiumLevels, 2);
    summaryParts.push("Activated urban podium interface.");
  }

  if (normalized.includes("garden") || normalized.includes("green roof")) {
    updates.addRooftopGarden = true;
    summaryParts.push("Reserved rooftop for green space.");
  }

  if (normalized.includes("solar")) {
    updates.includeSolarPanels = true;
    summaryParts.push("Integrated rooftop solar arrays.");
  }

  if (normalized.includes("balcon")) {
    updates.balconyFrequency = normalized.includes("every")
      ? "every"
      : normalized.includes("corner")
      ? "corners"
      : "alternate";
    summaryParts.push("Reconfigured balcony rhythm.");
  }

  if (normalized.includes("glass curtain")) {
    updates.facadePattern = "grid";
    updates.colors = {
      ...current.colors,
      base: "#2b3a55",
      accent: "#546a89",
      glazing: "#a7d9ff",
    };
    summaryParts.push("Shifted to glass curtain wall aesthetic.");
  } else if (normalized.includes("brick")) {
    updates.facadePattern = "stacked";
    updates.colors = {
      ...current.colors,
      base: "#884a39",
      accent: "#d46f4d",
      glazing: "#93c6ff",
    };
    summaryParts.push("Applied brick-inspired palette.");
  } else if (normalized.includes("timber") || normalized.includes("wood")) {
    updates.facadePattern = "offset";
    updates.colors = {
      ...current.colors,
      base: "#8c6b3e",
      accent: "#d9b382",
      glazing: "#9bc1ff",
    };
    summaryParts.push("Shifted to warm timber articulation.");
  }

  if (normalized.includes("light shelves")) {
    updates.includeLightShelves = true;
    summaryParts.push("Added daylight shelves to facade.");
  }

  if (normalized.includes("pitched roof")) {
    updates.roofStyle = "pitched";
    summaryParts.push("Configured pitched roof profile.");
  } else if (normalized.includes("sawtooth")) {
    updates.roofStyle = "sawtooth";
    summaryParts.push("Configured sawtooth roof profile.");
  } else if (normalized.includes("flat roof")) {
    updates.roofStyle = "flat";
    summaryParts.push("Kept clean flat roofline.");
  }

  if (normalized.includes("generous lobby") || normalized.includes("grand lobby")) {
    updates.lobbyHeight = clamp(current.lobbyHeight * 1.2, 4.5, 12);
    summaryParts.push("Expanded lobby volume.");
  }

  const unitMatch = normalized.match(/(\d+)\s*units?/);
  if (unitMatch) {
    const units = clamp(parseInt(unitMatch[1], 10), 2, 40);
    updates.unitsPerFloor = units;
    summaryParts.push(`Set ${units} flexible units per typical floor.`);
  }

  const combinedSummary = summaryParts.join(" ");
  return {
    updates,
    summary: combinedSummary,
  };
};

const BuildingPreview = ({ config }: { config: BuildingConfig }) => {
  const floors = Array.from({ length: config.floors }, (_, index) => config.floors - index);
  const modules = Math.max(1, Math.round(config.width / Math.max(config.windowModule, 1)));
  const windowColor = lightenColor(config.colors.glazing, 0.15);
  const mullionColor = mixWithBlack(config.colors.base, 0.45);

  return (
    <div className="w-full max-w-sm rounded-3xl border border-slate-900/20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-300">
        <span>{config.projectName}</span>
        <span>{config.floors} floors</span>
      </div>
      <div className="mt-4 h-72 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 p-3">
        <div className="flex h-full flex-col justify-end gap-1">
          {floors.map((level) => (
            <div
              key={level}
              className="flex flex-col gap-0.5 rounded-lg border border-white/5 p-1"
              style={{
                background: `linear-gradient(180deg, ${lightenColor(config.colors.base, 0.2)}, ${config.colors.base})`,
              }}
            >
              <div className="flex items-center justify-between gap-1">
                {Array.from({ length: modules }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-md border border-white/10"
                    style={{
                      background: `linear-gradient(180deg, ${windowColor}, ${mixWithBlack(config.colors.glazing, 0.25)})`,
                      boxShadow: `inset 0 0 8px ${mixWithBlack(config.colors.glazing, 0.4)}`,
                    }}
                  >
                    <div className="h-1 w-full" style={{ backgroundColor: mullionColor }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
        <span>Width {config.width.toFixed(1)} m</span>
        <span>Depth {config.depth.toFixed(1)} m</span>
        <span>Module {config.windowModule.toFixed(1)} m</span>
        <span>Units {config.unitsPerFloor}</span>
        <span>Roof {config.roofStyle}</span>
        <span>Balconies {config.balconyFrequency}</span>
      </div>
    </div>
  );
};

export default function Home() {
  const [config, setConfig] = useState<BuildingConfig>(defaultConfig);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSummary, setAiSummary] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const script = useMemo(() => generateBlenderScript(config), [config]);

  const updateConfig = (partial: Partial<BuildingConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...partial,
      colors: {
        ...prev.colors,
        ...(partial.colors ?? {}),
      },
    }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setStatusMessage("Script copied to clipboard.");
    } catch {
      setStatusMessage("Clipboard unavailable in this browser.");
    }
    setTimeout(() => setStatusMessage(null), 2400);
  };

  const handleDownload = () => {
    const blob = new Blob([script], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = config.projectName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    link.download = `${safeName || "building"}-blender-generator.py`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage("Python file downloaded.");
    setTimeout(() => setStatusMessage(null), 2400);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setAiSummary([]);
    setStatusMessage("Configuration reset.");
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleApplyAi = () => {
    const { updates, summary } = applyAiInference(aiPrompt, config);
    if (Object.keys(updates).length === 0) {
      setStatusMessage("No actionable design moves detected.");
      setTimeout(() => setStatusMessage(null), 2200);
      return;
    }
    updateConfig({
      ...updates,
      narrative: `${config.narrative}\n\nPrompt: ${aiPrompt.trim()}`,
    });
    if (summary) {
      setAiSummary((prev) => [summary, ...prev].slice(0, 5));
    }
    setAiPrompt("");
    setStatusMessage("AI design move applied.");
    setTimeout(() => setStatusMessage(null), 2200);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 lg:flex-row">
        <div className="flex w-full flex-col gap-6 lg:max-w-md">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-slate-900">Parametric Building Studio</h1>
            <p className="text-sm leading-6 text-slate-600">
              Define the tower geometry, facade rhythm, and rooftop systems. Generate a full Blender script that you can run to model the project instantly, then tweak every component further in Blender.
            </p>
          </div>
          <BuildingPreview config={config} />
          <div className="rounded-2xl border border-slate-900/10 bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900">AI Assistant Moves</h2>
              <button
                onClick={handleReset}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Reset
              </button>
            </div>
            <label className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
              Describe an architectural intent
              <textarea
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder="e.g. Add a mid-rise timber tower with generous balconies, green roof, and solar-ready roofline"
                className="min-h-[92px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>
            <button
              onClick={handleApplyAi}
              className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Apply AI Design Move
            </button>
            <div className="mt-5 space-y-2 text-xs text-slate-500">
              {aiSummary.length === 0 ? (
                <p>No AI adjustments logged yet.</p>
              ) : (
                aiSummary.map((entry, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
          {statusMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {statusMessage}
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-8">
          <section className="rounded-3xl border border-slate-900/10 bg-white p-8 shadow">
            <h2 className="text-xl font-semibold text-slate-900">Massing &amp; Program</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Project name
                <input
                  value={config.projectName}
                  onChange={(event) => updateConfig({ projectName: event.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Floors
                <input
                  type="range"
                  min={3}
                  max={80}
                  value={config.floors}
                  onChange={(event) => updateConfig({ floors: Number(event.target.value) })}
                  className="accent-slate-900"
                />
                <span className="text-xs text-slate-500">{config.floors} levels</span>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Floor-to-floor height (m)
                <input
                  type="number"
                  min={2.7}
                  max={8}
                  step={0.1}
                  value={config.floorHeight}
                  onChange={(event) => updateConfig({ floorHeight: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Lobby height (m)
                <input
                  type="number"
                  min={3}
                  max={12}
                  step={0.1}
                  value={config.lobbyHeight}
                  onChange={(event) => updateConfig({ lobbyHeight: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Overall width (m)
                <input
                  type="number"
                  min={12}
                  max={120}
                  step={0.5}
                  value={config.width}
                  onChange={(event) => updateConfig({ width: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Overall depth (m)
                <input
                  type="number"
                  min={12}
                  max={120}
                  step={0.5}
                  value={config.depth}
                  onChange={(event) => updateConfig({ depth: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Core width (m)
                <input
                  type="number"
                  min={4}
                  max={20}
                  step={0.1}
                  value={config.coreWidth}
                  onChange={(event) => updateConfig({ coreWidth: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Core depth (m)
                <input
                  type="number"
                  min={4}
                  max={20}
                  step={0.1}
                  value={config.coreDepth}
                  onChange={(event) => updateConfig({ coreDepth: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Units per floor
                <input
                  type="number"
                  min={2}
                  max={40}
                  value={config.unitsPerFloor}
                  onChange={(event) => updateConfig({ unitsPerFloor: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Base plinth height (m)
                <input
                  type="number"
                  min={0}
                  max={6}
                  step={0.1}
                  value={config.baseHeight}
                  onChange={(event) => updateConfig({ baseHeight: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Structural grid (m)
                <input
                  type="number"
                  min={4}
                  max={12}
                  step={0.1}
                  value={config.structuralGrid}
                  onChange={(event) => updateConfig({ structuralGrid: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                Narrative
                <textarea
                  value={config.narrative}
                  onChange={(event) => updateConfig({ narrative: event.target.value })}
                  className="min-h-[100px] rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-white p-8 shadow">
            <h2 className="text-xl font-semibold text-slate-900">Facade &amp; Lifestyle Features</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Facade pattern
                <select
                  value={config.facadePattern}
                  onChange={(event) => updateConfig({ facadePattern: event.target.value as FacadePattern })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="grid">Grid</option>
                  <option value="stacked">Stacked coursing</option>
                  <option value="offset">Offset bays</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Window module (m)
                <input
                  type="number"
                  min={2}
                  max={6}
                  step={0.1}
                  value={config.windowModule}
                  onChange={(event) => updateConfig({ windowModule: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Window width (m)
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={config.windowWidth}
                  onChange={(event) => updateConfig({ windowWidth: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Window height (m)
                <input
                  type="number"
                  min={1.5}
                  max={4.5}
                  step={0.1}
                  value={config.windowHeight}
                  onChange={(event) => updateConfig({ windowHeight: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Spandrel height (m)
                <input
                  type="number"
                  min={0.2}
                  max={2}
                  step={0.1}
                  value={config.spandrelHeight}
                  onChange={(event) => updateConfig({ spandrelHeight: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Balcony depth (m)
                <input
                  type="number"
                  min={0}
                  max={4}
                  step={0.1}
                  value={config.balconyDepth}
                  onChange={(event) => updateConfig({ balconyDepth: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Balcony frequency
                <select
                  value={config.balconyFrequency}
                  onChange={(event) => updateConfig({ balconyFrequency: event.target.value as BalconyFrequency })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="none">None</option>
                  <option value="alternate">Alternate floors</option>
                  <option value="every">Every floor</option>
                  <option value="corners">Corners</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Rooftop expression
                <select
                  value={config.roofStyle}
                  onChange={(event) => updateConfig({ roofStyle: event.target.value as RoofStyle })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="flat">Flat</option>
                  <option value="pitched">Pitched</option>
                  <option value="sawtooth">Saw-tooth</option>
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.includePodium}
                  onChange={(event) => updateConfig({ includePodium: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Include podium terraces
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Podium levels
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={config.podiumLevels}
                  onChange={(event) => updateConfig({ podiumLevels: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  disabled={!config.includePodium}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Podium setback (m)
                <input
                  type="number"
                  min={0}
                  max={12}
                  step={0.5}
                  value={config.podiumSetback}
                  onChange={(event) => updateConfig({ podiumSetback: Number(event.target.value) })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  disabled={!config.includePodium}
                />
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.hasAtrium}
                  onChange={(event) => updateConfig({ hasAtrium: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Carve vertical atrium
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.addRooftopGarden}
                  onChange={(event) => updateConfig({ addRooftopGarden: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Rooftop garden
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.includeSolarPanels}
                  onChange={(event) => updateConfig({ includeSolarPanels: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Solar array ready
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.includeLightShelves}
                  onChange={(event) => updateConfig({ includeLightShelves: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Daylight shelves
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-white p-8 shadow">
            <h2 className="text-xl font-semibold text-slate-900">Color Strategy</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Facade base
                <input
                  type="color"
                  value={config.colors.base}
                  onChange={(event) => updateConfig({ colors: { ...config.colors, base: event.target.value } })}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Accent metal
                <input
                  type="color"
                  value={config.colors.accent}
                  onChange={(event) => updateConfig({ colors: { ...config.colors, accent: event.target.value } })}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Glazing tone
                <input
                  type="color"
                  value={config.colors.glazing}
                  onChange={(event) => updateConfig({ colors: { ...config.colors, glazing: event.target.value } })}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Balcony finish
                <input
                  type="color"
                  value={config.colors.balcony}
                  onChange={(event) => updateConfig({ colors: { ...config.colors, balcony: event.target.value } })}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Roof finish
                <input
                  type="color"
                  value={config.colors.roof}
                  onChange={(event) => updateConfig({ colors: { ...config.colors, roof: event.target.value } })}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-white p-8 shadow">
            <h2 className="text-xl font-semibold text-slate-900">Blender Python Script</h2>
            <p className="mt-2 text-sm text-slate-600">
              Copy the script into Blender&apos;s scripting workspace and run. Every part of the massing, facade, podium, and roof systems can be refined further inside Blender once generated.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Copy script
              </button>
              <button
                onClick={handleDownload}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Download .py
              </button>
            </div>
            <pre className="mt-5 max-h-[540px] overflow-y-auto rounded-2xl border border-slate-900/10 bg-slate-950/90 p-6 text-xs text-emerald-100 shadow-inner">
              <code>{script}</code>
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
