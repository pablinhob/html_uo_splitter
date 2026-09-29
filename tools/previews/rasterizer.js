/**
 * Renderizador por software para los previews de los ejemplos (no hay GPU en el
 * contenedor): proyección ortográfica, z-buffer y sombreado plano por cara.
 * Devuelve la imagen como RGB (3 bytes por píxel, filas de arriba abajo).
 */

const supersample = 2;
const ambient = 0.3;
const diffuse = 0.7;

const dot = (first, second) => first.reduce((sum, value, axis) => sum + value * second[axis], 0);
const subtract = (first, second) => first.map((value, axis) => value - second[axis]);
const cross = ([ax, ay, az], [bx, by, bz]) => [
  ay * bz - az * by,
  az * bx - ax * bz,
  ax * by - ay * bx,
];
const normalize = (vector) => {
  const length = Math.hypot(...vector);
  return vector.map((value) => value / length);
};

const hexToRgb = (hex) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

function vertexAt(positions, vertex) {
  const offset = 3 * vertex;
  return [positions[offset], positions[offset + 1], positions[offset + 2]];
}

function boundsCenter(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let offset = 0; offset < positions.length; offset += 3) {
    [0, 1, 2].forEach((axis) => {
      min[axis] = Math.min(min[axis], positions[offset + axis]);
      max[axis] = Math.max(max[axis], positions[offset + axis]);
    });
  }
  return min.map((value, axis) => (value + max[axis]) / 2);
}

// Base de la cámara: mira hacia -viewDirection con `up` como vertical de pantalla.
function cameraBasis(viewDirection, up) {
  const back = normalize(viewDirection);
  const right = normalize(cross(up, back));
  return { back, right, screenUp: cross(back, right) };
}

// Coordenadas de pantalla (x a la derecha, y hacia abajo) y profundidad (mayor = más cerca).
function projectVertices({ positions }, basis, sizePx, marginFraction) {
  const center = boundsCenter(positions);
  const vertexTotal = positions.length / 3;
  const projected = new Float64Array(vertexTotal * 3);
  let extent = 0;
  for (let vertex = 0; vertex < vertexTotal; vertex += 1) {
    const relative = subtract(vertexAt(positions, vertex), center);
    const screenX = dot(relative, basis.right);
    const screenY = dot(relative, basis.screenUp);
    projected.set([screenX, screenY, dot(relative, basis.back)], vertex * 3);
    extent = Math.max(extent, Math.abs(screenX), Math.abs(screenY));
  }
  const scale = ((sizePx / 2) * (1 - marginFraction)) / extent;
  for (let offset = 0; offset < projected.length; offset += 3) {
    projected[offset] = sizePx / 2 + projected[offset] * scale;
    projected[offset + 1] = sizePx / 2 - projected[offset + 1] * scale;
  }
  return projected;
}

// Pinta un triángulo en el z-buffer con la función de arista (coordenadas baricéntricas).
function rasterizeTriangle(target, corners, shade) {
  const { depth, shades, sizePx } = target;
  const [[x0, y0, z0], [x1, y1, z1], [x2, y2, z2]] = corners;
  const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  if (area === 0) return;
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
  const maxX = Math.min(sizePx - 1, Math.ceil(Math.max(x0, x1, x2)));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
  const maxY = Math.min(sizePx - 1, Math.ceil(Math.max(y0, y1, y2)));
  for (let pixelY = minY; pixelY <= maxY; pixelY += 1) {
    for (let pixelX = minX; pixelX <= maxX; pixelX += 1) {
      const sampleX = pixelX + 0.5;
      const sampleY = pixelY + 0.5;
      const weight0 = ((x1 - sampleX) * (y2 - sampleY) - (x2 - sampleX) * (y1 - sampleY)) / area;
      const weight1 = ((x2 - sampleX) * (y0 - sampleY) - (x0 - sampleX) * (y2 - sampleY)) / area;
      const weight2 = 1 - weight0 - weight1;
      const pixel = pixelY * sizePx + pixelX;
      const sampleDepth = weight0 * z0 + weight1 * z1 + weight2 * z2;
      if (weight0 >= 0 && weight1 >= 0 && weight2 >= 0 && sampleDepth > depth[pixel]) {
        depth[pixel] = sampleDepth;
        shades[pixel] = shade;
      }
    }
  }
}

function faceShade(positions, index, corner, light) {
  const [first, second, third] = [0, 1, 2].map((offset) =>
    vertexAt(positions, index[corner + offset]),
  );
  const normal = cross(subtract(second, first), subtract(third, first));
  const length = Math.hypot(...normal);
  if (length === 0) return ambient;
  // Doble cara: el lado visible siempre recibe la luz.
  return ambient + diffuse * Math.abs(dot(normal, light) / length);
}

// Promedia cada bloque de supersample x supersample en un píxel RGB final.
function downsample(target, sizePx, colorRgb, backgroundRgb) {
  const image = new Uint8Array(sizePx * sizePx * 3);
  const samples = supersample * supersample;
  for (let pixel = 0; pixel < sizePx * sizePx; pixel += 1) {
    const baseX = (pixel % sizePx) * supersample;
    const baseY = Math.floor(pixel / sizePx) * supersample;
    const sum = [0, 0, 0];
    for (let sample = 0; sample < samples; sample += 1) {
      const sampleIndex =
        (baseY + Math.floor(sample / supersample)) * target.sizePx + baseX + (sample % supersample);
      const shade = target.shades[sampleIndex];
      [0, 1, 2].forEach((channel) => {
        sum[channel] += shade < 0 ? backgroundRgb[channel] : colorRgb[channel] * shade;
      });
    }
    image.set(
      sum.map((value) => Math.round(value / samples)),
      pixel * 3,
    );
  }
  return image;
}

/**
 * options: { sizePx, color, background ('#rrggbb'), viewDirection, up, lightDirection,
 *            marginFraction }
 */
export default function renderMesh(meshData, options) {
  const { sizePx, color, background, viewDirection, up, lightDirection, marginFraction } = options;
  const targetSize = sizePx * supersample;
  const basis = cameraBasis(viewDirection, up);
  const projected = projectVertices(meshData, basis, targetSize, marginFraction);
  const target = {
    sizePx: targetSize,
    depth: new Float64Array(targetSize * targetSize).fill(-Infinity),
    shades: new Float32Array(targetSize * targetSize).fill(-1),
  };
  const light = normalize(lightDirection);
  const { positions, index } = meshData;
  for (let corner = 0; corner < index.length; corner += 3) {
    const corners = [0, 1, 2].map((offset) => {
      const start = index[corner + offset] * 3;
      return [projected[start], projected[start + 1], projected[start + 2]];
    });
    rasterizeTriangle(target, corners, faceShade(positions, index, corner, light));
  }
  return downsample(target, sizePx, hexToRgb(color), hexToRgb(background));
}
