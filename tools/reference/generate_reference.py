"""Genera los datos de referencia de los tests a partir del programa Python original.

Ejecuta el ``app/core`` de ``_legacy/ulaola_surfboard_splitter`` sin interfaz sobre
los modelos de ``tests/fixtures/models`` y escribe un JSON por modelo en
``tests/fixtures/reference``. Los tests de Vitest comparan la versión web con esos
valores (ver ``tests/support/reference.js``).

Uso (en el Mac, con el venv del proyecto original), desde la raíz del proyecto web:

    _legacy/ulaola_surfboard_splitter/venv/bin/python tools/reference/generate_reference.py

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

import numpy as np  # noqa: E402
import trimesh  # noqa: E402

from app.core.mesh_ops import (  # noqa: E402
    board_axes,
    compute_object_stats,
    load_stl,
    surface_frame,
    surface_height,
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


SECTIONS = {
    "load": section_load,
    "surface": section_surface,
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
