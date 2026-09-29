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

import trimesh  # noqa: E402

from app.core.mesh_ops import compute_object_stats, load_stl  # noqa: E402

PACKAGES = ["trimesh", "numpy", "pymeshfix", "manifold3d", "shapely"]


def _mesh_summary(mesh):
    return {
        "vertices": int(len(mesh.vertices)),
        "faces": int(len(mesh.faces)),
        "is_watertight": bool(mesh.is_watertight),
    }


def section_load(model_path):
    """Paso 2 (motor geométrico): load_stl() y ensure_watertight()."""
    raw = trimesh.load(model_path, force="mesh")
    repaired = load_stl(model_path)
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


SECTIONS = {
    "load": section_load,
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
    for name in section_names:
        print(f"  - {name}")
        reference[name] = SECTIONS[name](model_path)
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
