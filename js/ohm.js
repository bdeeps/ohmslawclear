// Shared parts for OhmsLawClear: wires as paths, flowing electrons, a battery, a rheostat,
// meters with live dials, a bulb, chart boards and the physics constants used in readouts.
import { THREE, M, rod, box, sphere, spring, canvasTexture, clamp } from './kit.js';

// ---------------------------------------------------------------- physics
// Copper: resistivity 1.72e-8 Ω·m at 20 °C (annealed copper standard, IACS);
// free-electron density 8.49e28 per m³ (one conduction electron per atom).
export const CU = { rho: 1.72e-8, n: 8.49e28 };
export const QE = 1.602e-19;                           // electron charge, C
export const MAINS = 230;                              // Indian and European mains, V rms
// Drift speed v = I / (n A e). For 1 A in a 1 mm² copper wire that is about 0.07 mm/s.
export const driftSpeed = (I, areaMm2) => I / (CU.n * areaMm2 * 1e-6 * QE);
// Resistance of a copper run: R = ρ L / A.
export const copperR = (lengthM, areaMm2) => (CU.rho * lengthM) / (areaMm2 * 1e-6);

// Numbers with sensible units: 0.0023 A → "2.3 mA", 35.27 Ω → "35 Ω", 12000 Ω → "12 kΩ".
export function si(v, unit, sig = 2) {
  const a = Math.abs(v);
  if (!isFinite(v)) return '∞ ' + unit;
  if (a === 0) return '0 ' + unit;
  const pre = a >= 1e6 ? [1e6, 'M'] : a >= 1e3 ? [1e3, 'k'] : a >= 1 ? [1, ''] : a >= 1e-3 ? [1e-3, 'm'] : [1e-6, 'µ'];
  const x = v / pre[0], ax = Math.abs(x);
  const d = ax >= 100 ? 0 : ax >= 10 ? Math.max(0, sig - 2) : Math.max(0, sig - 1);
  return `${x.toFixed(d)} ${pre[1]}${unit}`;
}
export const fmtR = (r) => (r < 1 ? r.toFixed(r < 0.01 ? 4 : 3) + ' Ω' : si(r, 'Ω', 3));

// ---------------------------------------------------------------- boards
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
// Axes with a grid. Returns X(x) and Y(y) mapping functions for the plot area.
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', logX = false }) {
  const X = logX ? (x) => x0 + ((Math.log(x) - Math.log(xMin)) / (Math.log(xMax) - Math.log(xMin))) * (x1 - x0) : (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }

// ---------------------------------------------------------------- wires
// A polyline you can walk along by distance. Used for wires, pipes and the dots that flow in them.
export function makePath(points, closed = true) {
  const pts = points.map((p) => new THREE.Vector3(...p));
  if (closed) pts.push(pts[0].clone());
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = cum[cum.length - 1];
  const at = (d, out = new THREE.Vector3()) => {
    d = closed ? ((d % L) + L) % L : clamp(d, 0, L);
    let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
    const k = (d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    return out.copy(pts[i - 1]).lerp(pts[i], k);
  };
  const dir = (d, out = new THREE.Vector3()) => {
    d = closed ? ((d % L) + L) % L : clamp(d, 0, L);
    let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
    return out.copy(pts[i]).sub(pts[i - 1]).normalize();
  };
  return { pts, cum, L, at, dir, closed };
}
// A round wire along a path, with balls at the corners so the joints look soldered.
export function wireMesh(path, r, mat) {
  const g = new THREE.Group();
  for (let i = 1; i < path.pts.length; i++) {
    const a = path.pts[i - 1], b = path.pts[i], len = a.distanceTo(b);
    if (len < 1e-4) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true; g.add(m);
    const j = sphere(r, mat, 16); j.position.copy(b); g.add(j);
  }
  return g;
}
// Dots that flow along a path. update(dt, speed) moves them; gate(d) can hold some still.
export function flow(path, n, r, color, spread = 0.6, opts = {}) {
  const mat = opts.mat || M.glow(color);
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 10, 8), mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const o = new THREE.Object3D(), p = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3();
  const dots = Array.from({ length: n }, (_, i) => ({ d: (i / n) * path.L + ((i * 0.618) % 1) * (path.L / n) * 0.8, a: (i * 2.39996) % (Math.PI * 2), rr: Math.sqrt(((i * 0.7548) % 1)) * spread }));
  const api = {
    mesh, dots, scale: 1,
    update(dt, speed, gate) {
      for (let i = 0; i < n; i++) {
        const q = dots[i];
        if (!gate || gate(q.d)) q.d = (((q.d + speed * dt) % path.L) + path.L) % path.L;
        path.at(q.d, p); const t = path.dir(q.d, side);
        up.set(0, 0, 1); if (Math.abs(t.z) > 0.9) up.set(0, 1, 0);
        const n1 = new THREE.Vector3().crossVectors(t, up).normalize(), n2 = new THREE.Vector3().crossVectors(t, n1);
        p.addScaledVector(n1, Math.cos(q.a) * q.rr * (opts.radius || 0)).addScaledVector(n2, Math.sin(q.a) * q.rr * (opts.radius || 0));
        o.position.copy(p); o.scale.setScalar(api.scale); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
  return api;
}

// ---------------------------------------------------------------- parts
// A big battery standing on its end, + terminal on top. Origin at its centre.
export function makeBattery(h = 1.3, r = 0.34, color = 0x2a2e37) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), M.plastic(color, { roughness: 0.35 })); body.castShadow = true; g.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.005, r + 0.005, h * 0.3, 40), M.metal(0xd98b2b, { roughness: 0.35 })); band.position.y = h * 0.35; g.add(band);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.12, 24), M.metal(0xd8dde6)); cap.position.y = h / 2 + 0.06; g.add(cap);
  const bot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.04, 24), M.metal(0xb9bec8)); bot.position.y = -h / 2 - 0.02; g.add(bot);
  return g;
}
// A rheostat: a coil of resistance wire on a ceramic tube along X, with a sliding wiper.
// setWiper(k): 0 = little wire in the circuit, 1 = all of it. setGlow(k) warms the coil.
export function makeRheostat(len = 2.2, R = 0.26) {
  const g = new THREE.Group();
  const tube = rod(-len / 2, len / 2, R, R, M.matte(0xe9e1cf, { roughness: 0.6 })); g.add(tube);
  const coilMat = M.metal(0xb87333, { roughness: 0.35, emissive: new THREE.Color(0x000000) });
  const coil = spring(-len / 2 + 0.08, len / 2 - 0.08, R + 0.02, 0.022, 34, coilMat); g.add(coil);
  for (const x of [-len / 2 - 0.05, len / 2 + 0.05]) { const e = box(0.1, 0.9, 0.7, M.matte(0x3a3f4b)); e.position.set(x, -0.1, 0); g.add(e); }
  const bar = rod(-len / 2, len / 2, 0.035, 0.035, M.metal(0xd8dde6)); bar.position.y = R + 0.28; g.add(bar);
  const wiper = new THREE.Group();
  const blk = box(0.18, 0.16, 0.18, M.plastic(0x2a2e37)); wiper.add(blk);
  const finger = box(0.05, 0.22, 0.05, M.metal(0xd8dde6)); finger.position.y = -0.17; wiper.add(finger);
  wiper.position.y = R + 0.28; g.add(wiper);
  g.len = len;
  g.setWiper = (k) => { wiper.position.x = -len / 2 + 0.1 + clamp(k, 0, 1) * (len - 0.2); };
  g.setGlow = (k) => { k = clamp(k, 0, 1); coilMat.emissive.setRGB(k * 1.0, k * 0.28, k * 0.04); coilMat.emissiveIntensity = 1; };
  g.coilMat = coilMat;
  return g;
}
// A plain resistor with colour bands along X.
export function makeResistor(len = 1, r = 0.16, bands = [0xff7a00, 0xff7a00, 0x8b4513, 0xd4af37]) {
  const g = new THREE.Group();
  const body = rod(-len / 2, len / 2, r, r, M.plastic(0xd9c49a)); g.add(body);
  bands.forEach((c, i) => { const b = rod(-len / 2 + len * (0.18 + i * 0.17) - 0.03, -len / 2 + len * (0.18 + i * 0.17) + 0.03, r + 0.01, r + 0.01, M.plastic(c)); g.add(b); });
  return g;
}
// A meter with a round dial drawn on a canvas. set(value) moves the needle; max sets full scale.
export function makeMeter(unit = 'A', max = 2, { w = 1.1, h = 0.9, color = '#ffb547' } = {}) {
  const g = new THREE.Group();
  const body = box(w, h, 0.35, M.plastic(0x1f232b, { roughness: 0.5 })); g.add(body);
  let val = 0, fullScale = max, text = '';
  const dial = canvasTexture(320, 260, (c, W, H) => {
    c.fillStyle = '#f4efe2'; c.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.86, R = H * 0.66, a0 = Math.PI * 1.18, a1 = Math.PI * 1.82;
    c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, a0, a1); c.stroke();
    c.fillStyle = '#222'; c.font = '20px sans-serif';
    for (let i = 0; i <= 10; i++) { const a = a0 + (a1 - a0) * (i / 10), L = i % 5 ? 12 : 22; c.lineWidth = i % 5 ? 2 : 3; c.beginPath(); c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.lineTo(cx + Math.cos(a) * (R - L), cy + Math.sin(a) * (R - L)); c.stroke(); }
    for (const i of [0, 5, 10]) { const a = a0 + (a1 - a0) * (i / 10), s = +(fullScale * i / 10).toPrecision(3) + ''; c.fillText(s, cx + Math.cos(a) * (R - 44) - c.measureText(s).width / 2, cy + Math.sin(a) * (R - 44) + 8); }
    c.font = 'bold 36px sans-serif'; c.fillStyle = '#b3261e'; c.fillText(unit, 18, 42);
    c.font = 'bold 26px monospace'; c.fillStyle = '#222'; c.fillText(text, W - 18 - c.measureText(text).width, 40);
    const k = clamp(val / fullScale, -0.02, 1.04), a = a0 + (a1 - a0) * k;
    c.strokeStyle = '#b3261e'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8)); c.stroke();
    c.fillStyle = '#222'; c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2); c.fill();
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, h * 0.8), new THREE.MeshBasicMaterial({ map: dial.tex, toneMapped: false }));
  face.position.z = 0.176; g.add(face);
  let last = '';
  g.set = (v, label, fs = fullScale) => { const key = v.toFixed(4) + label + fs; if (key === last) return; last = key; val = v; text = label; fullScale = fs; dial.redraw(); };
  return g;
}
// Blackbody-ish glow colour for a hot wire at T kelvin (dark below ~800 K).
export function glowRGB(T) {
  const k = clamp((T - 700) / 1900, 0, 1);
  const r = clamp(k * 3, 0, 1), gg = clamp(k * 2.2 - 0.35, 0, 1), b = clamp(k * 2 - 1.05, 0, 1);
  const bright = Math.pow(k, 0.7) * 4;
  return [r * bright, gg * bright * 0.95, b * bright * 0.8];
}
// A clear bulb with a coiled filament. setT(kelvin) sets the glow.
export function makeBulb(r = 0.55) {
  const g = new THREE.Group();
  const glass = sphere(r, M.clear(0xfff6e0, 0.16, { depthWrite: false }), 40); glass.position.y = r * 1.25; glass.castShadow = false; g.add(glass);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.55, r * 0.5, 32), M.clear(0xfff6e0, 0.16)); neck.position.y = r * 0.35; g.add(neck);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, r * 0.5, 32), M.metal(0xc9ced8)); cap.position.y = -r * 0.1; g.add(cap);
  const filMat = new THREE.MeshStandardMaterial({ color: 0x55504a, emissive: new THREE.Color(0, 0, 0), roughness: 0.4, metalness: 0.6 });
  const fil = spring(-r * 0.35, r * 0.35, 0.035, 0.012, 14, filMat); fil.position.y = r * 1.3; g.add(fil);
  for (const x of [-r * 0.35, r * 0.35]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, r * 1.2, 8), M.metal(0x9aa3b2)); s.position.set(x, r * 0.72, 0); g.add(s); }
  const light = new THREE.PointLight(0xffc27a, 0, 6, 1.6); light.position.y = r * 1.3; g.add(light);
  g.setT = (T) => { const [a, b, c] = glowRGB(T); filMat.emissive.setRGB(a, b, c); light.intensity = Math.max(0, (T - 1200) / 1500) * 6; glass.material.opacity = 0.16 + Math.max(0, (T - 1500) / 1300) * 0.25; glass.material.color.setRGB(1, 0.95, 0.85); };
  g.setT(300);
  return g;
}
// Wavy heat lines rising above something hot. update(time, k) with k 0→1.
export function heatHaze(n = 5, w = 1, h = 1, color = 0xff9a4a) {
  const g = new THREE.Group(), lines = [];
  for (let i = 0; i < n; i++) {
    const pts = []; for (let j = 0; j <= 16; j++) pts.push(new THREE.Vector3(Math.sin(j * 0.8 + i) * 0.06, (j / 16) * h, 0));
    const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 }));
    m.position.x = -w / 2 + (w * (i + 0.5)) / n; g.add(m); lines.push(m);
  }
  g.update = (time, k) => lines.forEach((m, i) => { const ph = (time * 0.6 + i * 0.37) % 1; m.position.y = ph * h * 0.5; m.material.opacity = clamp(k, 0, 1) * Math.sin(ph * Math.PI) * 0.8; m.visible = k > 0.02; });
  return g;
}
// On a phone-width stage: hide the minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { l.visible = !narrow; });
  const y = narrow ? -0.12 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
}
