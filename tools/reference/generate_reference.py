"""Genera los datos de referencia de los tests a partir del programa Python original.

Ejecuta el ``app/core`` de ``_legacy/ulaola_surfboard_splitter`` sin interfaz sobre
los modelos de ``tests/fixtures/models`` y escribe un JSON por modelo en
``tests/fixtures/reference``. Los tests de Vitest comparan la versión web con esos
valores (ver ``tests/support/reference.js``).

Uso, desde la raíz del proyecto web (venv del contenedor, ver requirements.txt):

    tools/reference/.venv/bin/python tools/reference/generate_reference.py

Cada paso de la migración añade aquí su sección (``SECTIONS``); ``--sections``
permite generar solo algunas.
"""

import argparse
import json
import platform
import sys
from datetime import datetime, timezone
from importlib import metadata
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
LEGACY_ROOT = PROJECT_ROOT / "_legacy" / "ulaola_surfboard_splitter"
MODELS_DIR = PROJECT_ROOT / "tests" / "fixtures" / "models"
OUTPUT_DIR = PROJECT_ROOT / "tests" / "fixtures" / "reference"

sys.path.insert(0, str(LEGACY_ROOT))


def _stub_gui_modules():
    """Sustituye PySide6 y PyVista por esqueletos vacíos, para poder importar
    app.gui.export_window y usar sus métodos de geometría sin interfaz."""
    import types

    class _Stub:
        def __init__(self, *args, **kwargs):
            pass

        def __getattr__(self, name):
            return _Stub()

        def __call__(self, *args, **kwargs):
            return _Stub()

    def _module(name):
        module = types.ModuleType(name)
        module.__getattr__ = lambda attribute: _Stub
        sys.modules[name] = module
        return module

    for name in ("PySide6", "PySide6.QtCore", "PySide6.QtGui", "PySide6.QtWidgets"):
        _module(name)
    _module("app.gui.viewer")


_stub_gui_modules()

import numpy as np  # noqa: E402
import trimesh  # noqa: E402

from app import config  # noqa: E402
from app.core.hollow import hollow_piece  # noqa: E402
from app.gui.export_window import ExportWindow, _is_hollowable, _piece_name  # noqa: E402
from app.core.mesh_ops import (  # noqa: E402
    board_axes,
    detect_thickness_axis,
    compute_object_stats,
    load_stl,
    split_board,
    surface_frame,
    surface_height,
)
from app.core.plug_position import (  # noqa: E402
    MARKER_PROTRUSION_MM,
    SUBTRACTION_MARGIN_MM,
    leash_plug_markers,
    leash_plug_supports,
    single_fin_markers,
    single_fin_supports,
    twin_fin_markers,
    twin_fin_supports,
)

PACKAGES = ["trimesh", "numpy", "pymeshfix", "manifold3d", "shapely"]


def _mesh_summary(mesh):
    return {
        "vertices": int(len(mesh.vertices)),
        "faces": int(len(mesh.faces)),
        "is_watertight": bool(mesh.is_watertight),
    }


# Puntos de muestreo de la sección "surface", relativos al bounding box: fracción
# del largo desde el mínimo y desplazamiento desde el centro en fracción del
# semiancho. Los tests de JS leen los puntos del JSON, así que solo viven aquí.
LENGTH_FRACTIONS = [0.05, 0.25, 0.5, 0.75, 0.95]
WIDTH_OFFSETS = [-0.5, 0.0, 0.5]
FRAME_LENGTH_FRACTIONS = [0.03, 0.15, 0.5, 0.85]
FRAME_SPANS_MM = [(30.0, 30.0), (120.0, 20.0)]


def section_load(model_path, repaired):
    """Paso 2 (motor geométrico): load_stl() y ensure_watertight()."""
    raw = trimesh.load(model_path, force="mesh")
    stats = compute_object_stats(repaired)
    min_bounds, max_bounds = repaired.bounds
    return {
        "input": _mesh_summary(raw),
        "repaired": _mesh_summary(repaired),
        "bounds_mm": [min_bounds.tolist(), max_bounds.tolist()],
        "size_mm": (max_bounds - min_bounds).tolist(),
        "volume_mm3": float(abs(repaired.volume)),
        "stats": {
            "size_cm": [float(value) for value in stats["size_cm"]],
            "volume_cm3": float(stats["volume_cm3"]),
            "volume_liters": float(stats["volume_liters"]),
        },
    }


def _plane_point(axes, length_pos, width_pos):
    length_axis, width_axis, _ = axes
    point = np.zeros(3)
    point[length_axis] = length_pos
    point[width_axis] = width_pos
    return point


def section_surface(_model_path, mesh):
    """Paso 3 (ejes y superficie): board_axes, surface_height y surface_frame."""
    axes = board_axes(mesh)
    length_axis, width_axis, thickness_axis = axes
    min_bounds, max_bounds = mesh.bounds
    size = max_bounds - min_bounds
    width_center = (min_bounds[width_axis] + max_bounds[width_axis]) / 2

    def length_at(fraction):
        return float(min_bounds[length_axis] + fraction * size[length_axis])

    heights = []
    for length_fraction in LENGTH_FRACTIONS:
        for width_offset in WIDTH_OFFSETS:
            width_pos = float(width_center + width_offset * size[width_axis] / 2)
            point = _plane_point(axes, length_at(length_fraction), width_pos)
            height = surface_height(mesh, thickness_axis, point)
            heights.append({"point": point.tolist(), "height": float(height)})

    frames = []
    for length_fraction in FRAME_LENGTH_FRACTIONS:
        for length_span, width_span in FRAME_SPANS_MM:
            for bottom in (False, True):
                length_pos = length_at(length_fraction)
                point, normal = surface_frame(
                    mesh,
                    axes,
                    length_pos,
                    float(width_center),
                    length_span,
                    width_span,
                    bottom,
                )
                frames.append(
                    {
                        "length_pos": length_pos,
                        "width_pos": float(width_center),
                        "length_span": length_span,
                        "width_span": width_span,
                        "bottom": bottom,
                        "point": np.asarray(point, dtype=float).tolist(),
                        "normal": np.asarray(normal, dtype=float).tolist(),
                    }
                )

    return {"axes": [int(axis) for axis in axes], "heights": heights, "frames": frames}


def _solid_summary(solid):
    min_bounds, max_bounds = solid.bounds
    return {
        "volume_mm3": float(abs(solid.volume)),
        "bounds_mm": [min_bounds.tolist(), max_bounds.tolist()],
        "is_watertight": bool(solid.is_watertight),
    }


def _default_plugs():
    """Parámetros por defecto de la interfaz (config.py), con los nombres de JS."""
    return {
        "leash": {
            "diameterMm": config.LEASH_PLUG_DIAMETER_DEFAULT_MM,
            "depthMm": config.LEASH_PLUG_DEPTH_DEFAULT_MM,
            "tailDistanceMm": config.LEASH_PLUG_TAIL_DISTANCE_DEFAULT_MM,
            "centerMm": config.LEASH_PLUG_CENTER_DEFAULT_MM,
        },
        "fin": {
            "singleBoxLongMm": config.FIN_SINGLE_BOX_LONG_DEFAULT_MM,
            "singleBoxWidthMm": config.FIN_SINGLE_BOX_WIDTH_DEFAULT_MM,
            "singleBoxDepthMm": config.FIN_SINGLE_BOX_DEPTH_DEFAULT_MM,
            "singleTailDistanceMm": config.FIN_SINGLE_TAIL_DISTANCE_DEFAULT_MM,
            "twinTailDistanceMm": config.FIN_TWIN_TAIL_DISTANCE_DEFAULT_MM,
            "twinCenterDistanceMm": config.FIN_TWIN_CENTER_DISTANCE_DEFAULT_MM,
            "twinAngleDeg": config.FIN_TWIN_ANGLE_DEFAULT_DEG,
        },
    }


def _plug_cavities(mesh, plugs, fin_type, above_mm):
    """_collect_plug_solids() de main_window.py."""
    leash, fin = plugs["leash"], plugs["fin"]
    solids = leash_plug_markers(
        mesh,
        leash["tailDistanceMm"],
        leash["centerMm"],
        leash["diameterMm"],
        leash["depthMm"],
        above_mm=above_mm,
    )
    if fin_type == "single":
        solids += single_fin_markers(
            mesh,
            fin["singleTailDistanceMm"],
            fin["singleBoxLongMm"],
            fin["singleBoxWidthMm"],
            fin["singleBoxDepthMm"],
            above_mm=above_mm,
        )
    else:
        solids += twin_fin_markers(
            mesh,
            fin["twinTailDistanceMm"],
            fin["twinCenterDistanceMm"],
            fin["twinAngleDeg"],
            above_mm=above_mm,
        )
    return solids


def _plug_supports(mesh, plugs, fin_type):
    """_collect_plug_supports() de main_window.py."""
    leash, fin = plugs["leash"], plugs["fin"]
    supports = leash_plug_supports(
        mesh,
        leash["tailDistanceMm"],
        leash["centerMm"],
        leash["diameterMm"],
        leash["depthMm"],
    )
    if fin_type == "single":
        supports += single_fin_supports(
            mesh,
            fin["singleTailDistanceMm"],
            fin["singleBoxLongMm"],
            fin["singleBoxWidthMm"],
            fin["singleBoxDepthMm"],
        )
    else:
        supports += twin_fin_supports(
            mesh,
            fin["twinTailDistanceMm"],
            fin["twinCenterDistanceMm"],
            fin["twinAngleDeg"],
        )
    return supports


def section_plugs(_model_path, mesh):
    """Paso 4 (plugs): cavidades (marcador y resta) y soportes, single y twin fin."""
    plugs = _default_plugs()
    result = {"plugs": plugs}
    for fin_type in ("single", "twin"):
        result[fin_type] = {
            "markers": [
                _solid_summary(solid)
                for solid in _plug_cavities(mesh, plugs, fin_type, MARKER_PROTRUSION_MM)
            ],
            "cavities": [
                _solid_summary(solid)
                for solid in _plug_cavities(mesh, plugs, fin_type, SUBTRACTION_MARGIN_MM)
            ],
            "supports": [
                _solid_summary(solid) for solid in _plug_supports(mesh, plugs, fin_type)
            ],
        }
    return result


def _json_key(key):
    return [part if isinstance(part, str) else int(part) for part in key]


def section_split(_model_path, mesh):
    """Paso 5 (split): split_board() con hexágonos y triángulos, valores por defecto."""
    params = {
        "pieceRadiusMm": config.PIECE_RADIUS_DEFAULT_MM,
        "stringerWidthMm": config.STRINGER_WIDTH_DEFAULT_MM,
        "cutlapWidthMm": config.CUTLAP_WIDTH_DEFAULT_MM,
    }
    result = {"params": params}
    for shape, pattern in (("Hexagon", "hexagon"), ("Triangle", "triangle")):
        pieces, cut_outlines = split_board(
            mesh,
            piece_radius_mm=params["pieceRadiusMm"],
            stringer_width_mm=params["stringerWidthMm"],
            cutlap_width_mm=params["cutlapWidthMm"],
            split_pattern=pattern,
        )
        result[shape] = {
            "pieces": [
                {"key": _json_key(key), **_solid_summary(piece)}
                for key, piece in pieces.items()
            ],
            "cut_outlines": [
                {
                    "borders": [_json_key(key) for key in entry["borders"]],
                    "has_outline": entry["outline"] is not None
                    and len(entry["outline"].discrete) > 0,
                }
                for entry in cut_outlines
            ],
        }
    return result


def _default_hollow():
    return {
        "wallMm": config.WALL_WIDTH_DEFAULT_MM,
        "topMm": config.TOP_WIDTH_DEFAULT_MM,
        "bottomMm": config.BOTTOM_WIDTH_DEFAULT_MM,
        "holePct": config.HOLE_RADIUS_DEFAULT_PCT,
    }


def section_hollow(_model_path, mesh):
    """Paso 6 (vaciado): hollow_piece() de cada pieza del núcleo (split hexagonal)."""
    pieces, _ = split_board(
        mesh,
        piece_radius_mm=config.PIECE_RADIUS_DEFAULT_MM,
        stringer_width_mm=config.STRINGER_WIDTH_DEFAULT_MM,
        cutlap_width_mm=config.CUTLAP_WIDTH_DEFAULT_MM,
        split_pattern="hexagon",
    )
    params = _default_hollow()
    thickness_axis = detect_thickness_axis(mesh)
    hollowed = []
    for key, piece in pieces.items():
        if len(key) != 2 or key[1] == "cutlap":
            continue
        result = hollow_piece(
            piece,
            params["wallMm"],
            params["topMm"],
            params["bottomMm"],
            params["holePct"],
            thickness_axis,
        )
        cavity_only = hollow_piece(
            piece, params["wallMm"], params["topMm"], params["bottomMm"], 0, thickness_axis
        )
        hollowed.append(
            {
                "key": _json_key(key),
                "solid_volume_mm3": float(abs(piece.volume)),
                "cavity_only_volume_mm3": float(abs(cavity_only.volume)),
                **_solid_summary(result),
            }
        )
    return {"params": params, "shape": "Hexagon", "pieces": hollowed}


def _json_piece_key(key):
    """Claves de exportación: los soportes llevan anidada la clave de su celda."""
    if key[0] == "support":
        return ["support", int(key[1]), _json_key(key[2])]
    return _json_key(key)


def section_export(_model_path, mesh):
    """Paso 7 (exportación): process_and_show() de export_window.py, sin interfaz."""
    pieces, _ = split_board(
        mesh,
        piece_radius_mm=config.PIECE_RADIUS_DEFAULT_MM,
        stringer_width_mm=config.STRINGER_WIDTH_DEFAULT_MM,
        cutlap_width_mm=config.CUTLAP_WIDTH_DEFAULT_MM,
        split_pattern="hexagon",
    )
    plugs = _default_plugs()
    hollow = _default_hollow()
    thickness_axis = detect_thickness_axis(mesh)

    window = ExportWindow.__new__(ExportWindow)
    window._plug_solids = _plug_cavities(mesh, plugs, "single", SUBTRACTION_MARGIN_MM)
    window._plug_supports = _plug_supports(mesh, plugs, "single")

    final = {}
    for key, piece_mesh in pieces.items():
        if _is_hollowable(key):
            piece = hollow_piece(
                piece_mesh,
                hollow["wallMm"],
                hollow["topMm"],
                hollow["bottomMm"],
                hollow["holePct"],
                thickness_axis,
            )
        else:
            piece = piece_mesh.copy()
        final[key] = window._subtract_plugs(key, piece)
        final.update(window._support_fragments(key, piece_mesh))

    return {
        "plugs": plugs,
        "hollow": hollow,
        "shape": "Hexagon",
        "pieces": [
            {"key": _json_piece_key(key), "name": _piece_name(key), **_solid_summary(piece)}
            for key, piece in final.items()
        ],
    }


SECTIONS = {
    "load": section_load,
    "surface": section_surface,
    "plugs": section_plugs,
    "split": section_split,
    "hollow": section_hollow,
    "export": section_export,
}


def _versions():
    versions = {"python": platform.python_version()}
    for package in PACKAGES:
        try:
            versions[package] = metadata.version(package)
        except metadata.PackageNotFoundError:
            versions[package] = None
    return versions


def generate(model_path, section_names):
    reference = {
        "model": model_path.stem,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "versions": _versions(),
    }
    # Todas las secciones trabajan sobre la malla ya reparada, como la app.
    mesh = load_stl(model_path)
    for name in section_names:
        print(f"  - {name}")
        reference[name] = SECTIONS[name](model_path, mesh)
    return reference


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--sections",
        nargs="+",
        choices=sorted(SECTIONS),
        default=list(SECTIONS),
        help="secciones a generar (por defecto, todas)",
    )
    args = parser.parse_args()

    models = sorted(MODELS_DIR.glob("*.stl"))
    if not models:
        sys.exit(f"No hay modelos en {MODELS_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for model_path in models:
        print(model_path.name)
        reference = generate(model_path, args.sections)
        output_path = OUTPUT_DIR / f"{model_path.stem}.json"
        output_path.write_text(json.dumps(reference, indent=2) + "\n")
        print(f"  -> {output_path.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
