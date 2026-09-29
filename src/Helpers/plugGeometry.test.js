import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { boxSTL, textBuffer } from '../../tests/support/geometry';
import {
  FUTURES_BODY_LENGTH_MM,
  FUTURES_BODY_WIDTH_MM,
  FUTURES_DEPTH_SIDE_MM,
  FUTURES_FLANGE_DEPTH_MM,
  FUTURES_FLANGE_MARGIN_MM,
  PLUG_GLUE_CLEARANCE_MM,
  SINGLE_FIN_CORNER_RADIUS_MM,
} from '../config';
import { loadManifoldModule } from './manifold';
import {
  futuresFinCavitySide,
  futuresFinSupportSide,
  leashPlugCavity,
  leashPlugSupport,
  singleFinCavity,
} from './plugGeometry';
import { parseSTL } from './stl';
import { createSurfaceProbe } from './surface';

// Tabla plana de 400 x 100 x 40 mm: cara superior en z = 40 e inferior en z = 0.
const probe = createSurfaceProbe(parseSTL(textBuffer(boxSTL({ x: 400, y: 100, z: 40 }))));
// Los contornos son polígonos de 96 lados: su área queda un poco por debajo del círculo.
const polygonTolerance = 0.005;
const clearance = PLUG_GLUE_CLEARANCE_MM;

let board;
const solids = [];
const keep = (solid) => {
  solids.push(solid);
  return solid;
};

beforeAll(async () => {
  board = { wasm: await loadManifoldModule(), probe };
});
afterEach(() => solids.splice(0).forEach((solid) => solid.delete()));
afterAll(() => probe.dispose());

const expectVolume = (solid, expected) =>
  expect(Math.abs(solid.volume() / expected - 1)).toBeLessThan(polygonTolerance);

const stadiumArea = (length, width) => (length - width) * width + Math.PI * (width / 2) ** 2;

describe('leash plug', () => {
  const params = { tailDistanceMm: 60, centerOffsetMm: 10, diameterMm: 26, depthMm: 20 };

  it('es un cilindro de radio + holgura que entra en la cubierta', () => {
    const cavity = keep(leashPlugCavity(board, params, 1));
    const radius = params.diameterMm / 2 + clearance;
    expectVolume(cavity, Math.PI * radius ** 2 * (params.depthMm + clearance + 1));
    const { min, max } = cavity.boundingBox();
    expect(max[2]).toBeCloseTo(41, 5);
    expect(min[2]).toBeCloseTo(40 - params.depthMm - clearance, 5);
    expect((min[0] + max[0]) / 2).toBeCloseTo(60, 1);
    expect((min[1] + max[1]) / 2).toBeCloseTo(60, 1);
  });

  it('su soporte se ensancha y se alarga según los márgenes', () => {
    const support = keep(leashPlugSupport(board, params, { contourMm: 4, bottomMm: 2 }));
    const radius = params.diameterMm / 2 + clearance + 4;
    expectVolume(support, Math.PI * radius ** 2 * (params.depthMm + clearance + 2));
  });
});

describe('caja de quilla central', () => {
  it('es un rectángulo redondeado que entra por el casco', () => {
    const params = { tailDistanceMm: 250, boxLongMm: 267, boxWidthMm: 26, boxDepthMm: 26 };
    const cavity = keep(singleFinCavity(board, params, 1));
    const long = params.boxLongMm + 2 * clearance;
    const wide = params.boxWidthMm + 2 * clearance;
    const radius = SINGLE_FIN_CORNER_RADIUS_MM + clearance;
    const area = long * wide - (4 - Math.PI) * radius ** 2;
    expectVolume(cavity, area * (params.boxDepthMm + clearance + 1));
    const { min, max } = cavity.boundingBox();
    expect(min[2]).toBeCloseTo(-1, 5);
    expect(max[2]).toBeCloseTo(params.boxDepthMm + clearance, 5);
  });
});

describe('caja Futures lateral', () => {
  const params = { tailDistanceMm: 150, centerOffsetMm: 20, angleDeg: 0 };

  it('une una pestaña ancha y poco profunda con el cuerpo estrecho', () => {
    const cavity = keep(futuresFinCavitySide(board, params, 1));
    const flangeExpand = clearance + FUTURES_FLANGE_MARGIN_MM;
    const flangeArea = stadiumArea(
      FUTURES_BODY_LENGTH_MM + 2 * flangeExpand,
      FUTURES_BODY_WIDTH_MM + 2 * flangeExpand,
    );
    const bodyArea = stadiumArea(
      FUTURES_BODY_LENGTH_MM + 2 * clearance,
      FUTURES_BODY_WIDTH_MM + 2 * clearance,
    );
    const flangeHeight = FUTURES_FLANGE_DEPTH_MM + clearance + 1;
    const bodyBelowFlange = FUTURES_DEPTH_SIDE_MM - FUTURES_FLANGE_DEPTH_MM;
    expectVolume(cavity, flangeArea * flangeHeight + bodyArea * bodyBelowFlange);
  });

  it('el toe-in apunta hacia la línea central a ambos lados', () => {
    const toed = { ...params, angleDeg: 10 };
    const right = keep(futuresFinCavitySide(board, { ...toed, centerOffsetMm: 30 }, 1));
    const left = keep(futuresFinCavitySide(board, { ...toed, centerOffsetMm: -30 }, 1));
    const rightBox = right.boundingBox();
    const leftBox = left.boundingBox();
    // Simétricas respecto a la línea central (y = 50).
    expect(rightBox.min[1] - 50).toBeCloseTo(50 - leftBox.max[1], 4);
    expect(rightBox.max[1] - 50).toBeCloseTo(50 - leftBox.min[1], 4);
  });

  it('su soporte envuelve la pestaña con la pared de contorno', () => {
    const support = keep(futuresFinSupportSide(board, params, { contourMm: 4, bottomMm: 2 }));
    const expand = clearance + FUTURES_FLANGE_MARGIN_MM + 4;
    const area = stadiumArea(
      FUTURES_BODY_LENGTH_MM + 2 * expand,
      FUTURES_BODY_WIDTH_MM + 2 * expand,
    );
    expectVolume(support, area * (FUTURES_DEPTH_SIDE_MM + clearance + 2));
  });
});
