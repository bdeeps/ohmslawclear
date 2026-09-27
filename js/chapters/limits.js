// Chapter 5: where Ohm's law bends or breaks.
// Bulb: a 60 W, 230 V tungsten lamp. Hot R = 230²/60 = 882 Ω at about 2,700 K. Tungsten's
// resistivity rises roughly as T^1.2, so cold R ≈ 882 / (2700/293)^1.2 ≈ 61 Ω, about 14× lower.
// Steady state: V²/R(T) = K (T⁴ − T0⁴), K from the rated point. Warm-up uses a filament heat
// capacity of 6 mJ/K, which gives a surge lasting a few hundredths of a second.
// LED: a red indicator LED like a TV's standby light, on a 5 V rail. Diode law
// V = a ln(I/Is) + I Rs with a = 0.052 V, Is = 2.4e-18 A, Rs = 5 Ω: 1.75 V at 1 mA, 2.0 V at 20 mA.
// Rated 20 mA; well above about 30 mA it overheats. The series resistor sets the current.
// Mercury: Kamerlingh Onnes found its resistance vanish at 4.2 K (1911). Above Tc the curve here is a
// smooth sketch of a metal's resistance falling with temperature to a small residual value.
import { THREE, M, box, rod, torus, tube, clamp, approach } from '../kit.js';
import { makeBulb, makeResistor, board, panelBg, axes, dot, fmtR, fitNarrow } from '../ohm.js';

// ---- bulb
const T0 = 293, T_HOT = 2700, R_HOT = (230 * 230) / 60, EXP = 1.2;
const R0 = R_HOT / Math.pow(T_HOT / T0, EXP);
const Rb = (T) => R0 * Math.pow(T / T0, EXP);
const KRAD = 60 / (T_HOT ** 4 - T0 ** 4), CFIL = 0.006;
export function bulbT(V) {                                  // steady filament temperature at voltage V
  let lo = T0, hi = 4000;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; (V * V) / Rb(m) > KRAD * (m ** 4 - T0 ** 4) ? (lo = m) : (hi = m); }
  return lo;
}
// ---- LED
const VS = 5, LA = 0.052, LIS = 2.4e-18, LRS = 5, I_BURN = 0.06;
const vLed = (I) => (I <= 0 ? 0 : LA * Math.log(I / LIS + 1) + I * LRS);
export function ledI(R) {                                   // solve VS = I R + vLed(I)
  let lo = 0, hi = VS / R;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; m * R + vLed(m) > VS ? (hi = m) : (lo = m); }
  return lo;
}
// ---- mercury
const TC = 4.15;
const hgR = (T) => (T < TC ? 0 : 0.0015 + (T / 273) * (T ** 3 / (T ** 3 + 15 ** 3)));   // R / R(273 K)

const VIEWS = {
  bulb: { pos: [-4.4, 2.6, 6.4], target: [-4.1, 1.75, 0] },
  led: { pos: [2.4, 2.8, 6.2], target: [2.5, 1.7, 0] },
  super: { pos: [9.2, 2.6, 6.4], target: [9.3, 1.75, 0] },
};

export default {
  id: 'limits',
  short: 'Where it breaks',
  title: 'When the line bends',
  subtitle: 'Hot filaments, LEDs and superconductors: where Ohm’s law stops being simple.',
  view: VIEWS.bulb,
  learn: `<p>Ohm's law says current is <b>proportional</b> to voltage, as long as R stays the same. Things that obey it are called <b>ohmic</b>. Plenty of things don't.</p>
    <p><b>A light bulb filament.</b> Tungsten's resistance rises as it heats. A 60 W bulb has about <b>61 Ω</b> cold and about <b>880 Ω</b> glowing at 2,700 K, around <b>14 times</b> more. So its I–V line bends over.</p>
    <p><b>Myth-buster:</b> “A bulb draws the same current the moment you switch it on.” No! For a few hundredths of a second the cold filament lets through <b>over ten times</b> its normal current. That surge is why old bulbs usually blow just as you flick the switch.</p>
    <p><b>LEDs and diodes</b> are far from ohmic. Below about 1.7 V a red LED passes almost nothing; a little above, the current shoots up. So an LED always needs something to <b>limit its current</b>. A TV's red standby light uses a simple resistor: (5 V − 2 V) ÷ 0.02 A = 150 Ω. The strings of LEDs behind the screen use a driver chip that measures current through a tiny resistor, using V = I × R, and holds it steady. See TVClear.</p>
    <p><b>Superconductors.</b> In 1911 Heike Kamerlingh Onnes cooled mercury to 4.2 K and its resistance simply vanished. A current started in a superconducting ring keeps flowing with no battery at all.</p>
    <p>Physicists also write Ohm's law for a tiny piece of material: <b>J = σE</b>, current density equals conductivity times electric field. It's the same idea, a property of the stuff itself.</p>
    <p class="tip"><b>Try it:</b> switch the bulb on from cold and watch the current spike. Then shrink the LED's resistor until it burns out, and cool the mercury below 4.2 K.</p>`,
  terms: [
    { t: 'Ohmic', d: 'Obeys Ohm’s law: current in proportion to voltage, so the I–V graph is a straight line.' },
    { t: 'Inrush current', d: 'The surge when a device is switched on cold, before it settles to its normal current.' },
    { t: 'Diode', d: 'A one-way valve for current. It conducts only above a threshold voltage.' },
    { t: 'Current-limiting resistor', d: 'A resistor in series with an LED that sets its current with Ohm’s law.' },
    { t: 'Superconductor', d: 'A material whose resistance drops to exactly zero below a critical temperature.' },
    { t: 'J = σE', d: 'Ohm’s law for a material: current per area = conductivity × electric field.' },
  ],
  defaults: { focus: 'bulb', bulbV: 230, ledR: 150, temp: 77 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'bulb', label: 'Bulb' }, { v: 'led', label: 'LED' }, { v: 'super', label: 'Superconductor' }] },
    { key: 'bulbV', type: 'range', label: 'Dimmer: volts on the bulb', min: 0, max: 230, step: 1, ends: ['0 V', '230 V'], fmt: (v) => Math.round(v) + ' V' },
    { key: 'go', type: 'buttons', label: 'Bulb', items: [{ label: 'Switch on from cold', act: (s, inst) => inst.coldStart(s) }] },
    { key: 'ledR', type: 'log', label: 'LED’s series resistor', min: 22, max: 2200, ends: ['22 Ω', '2.2 kΩ'], fmt: (v) => fmtR(v) },
    { key: 'go2', type: 'buttons', label: 'LED', items: [{ label: 'Fit a new LED', act: (s, inst) => inst.newLed() }] },
    { key: 'temp', type: 'log', label: 'Mercury temperature', min: 2, max: 300, ends: ['2 K', '300 K'], fmt: (v) => (v < 10 ? v.toFixed(2) : Math.round(v)) + ' K', hint: '4.2 K is −269 °C. Liquid helium boils at 4.2 K.' },
    { key: 'go3', type: 'buttons', label: 'Mercury ring', items: [{ label: 'Start a current in the ring', act: (s, inst) => inst.kick() }] },
  ],
  quiz: [
    { q: 'A bulb’s filament has 61 Ω cold and 880 Ω hot. What happens at the instant you switch it on?', options: ['A small current that slowly rises', 'A surge of over ten times the normal current, which falls as it heats', 'No current until it warms', 'Exactly the normal current'], answer: 1, why: 'Cold, R is low, so I = V ÷ R is high. As the filament heats, R rises and the current falls.' },
    { q: 'Why does an LED need a series resistor?', options: ['To make it a different colour', 'Its current rises steeply with voltage, so something must set the current', 'To store charge', 'It doesn’t'], answer: 1, why: 'An LED isn’t ohmic. The resistor takes up the spare voltage and fixes I = (V − V_LED) ÷ R.' },
    { q: 'What did Kamerlingh Onnes find in 1911?', options: ['Mercury’s resistance vanished below about 4.2 K', 'Copper becomes magnetic', 'Resistance doubles when cold', 'Electrons are waves'], answer: 0, why: 'He discovered superconductivity: zero resistance in mercury cooled with liquid helium.' },
  ],
  reel: [
    { ms: 5400, caption: 'Myth: a bulb draws steady current. Switched on cold, it surges to over ten times normal.', set: { focus: 'bulb', bulbV: 230 }, act: (s, inst) => inst.coldStart(s), spin: 0.1 },
    { ms: 5000, caption: 'An LED isn’t ohmic. A small resistor sets its current: too small, and it burns out.', set: { focus: 'led' }, act: (s, inst) => inst.newLed(), anim: { ledR: [680, 33, true] }, spin: 0.1 },
    { ms: 5000, caption: 'Cool mercury below 4.2 kelvin and its resistance vanishes: a superconductor.', set: { focus: 'super' }, act: (s, inst) => inst.kick(), anim: { temp: [12, 3, true] }, spin: 0.1 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const st = { T: bulbT(230), cold: null, peakI: 0, ledDead: false, over: 0, ringI: 0, ringA: 0 };
    const cur = { V: 230, T: st.T, R: 150, I: 0, temp: 77 };

    // ---------------- bulb on a stand with a dimmer
    const BX = -5.4;
    const base = box(1.2, 0.3, 1.0, M.matte(0x2a2e37)); base.position.set(BX, 0.15, 0); root.add(base);
    const post = rod(0, 1.0, 0.07, 0.07, M.metal(0x9aa3b2)); post.rotation.z = Math.PI / 2; post.position.set(BX, 0.8, 0); root.add(post);
    const bulb = makeBulb(0.55); bulb.position.set(BX, 1.4, 0); root.add(bulb);
    const dimmer = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 24), M.plastic(0xf2f2f2)); dimmer.rotation.x = Math.PI / 2; dimmer.position.set(BX + 0.35, 0.15, 0.52); root.add(dimmer);
    const bulbBoard = board(root, 2.9, 2.18, 640, 480, (g, w, h) => drawBulb(g, w, h), [BX + 2.55, 1.85, -0.5]);
    bulbBoard.mesh.rotation.y = -0.15;

    // ---------------- LED on a small board, fed from 5 V through a resistor
    const LX = 1.1;
    const pcb = box(2.4, 0.06, 1.2, M.matte(0x1f7a4a)); pcb.position.set(LX, 0.6, 0); root.add(pcb);
    const legs = box(2.4, 0.54, 1.1, M.matte(0x2a2e37)); legs.position.set(LX, 0.28, 0); root.add(legs);
    const supply = box(0.5, 0.35, 0.5, M.plastic(0x2a2e37)); supply.position.set(LX - 0.85, 0.82, 0); root.add(supply);
    const res = makeResistor(0.7, 0.1); res.position.set(LX, 0.75, 0.25); root.add(res);
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x7a1010, emissive: new THREE.Color(0, 0, 0), roughness: 0.2, transparent: true, opacity: 0.9 });
    const led = new THREE.Group(); led.position.set(LX + 0.8, 0.63, 0.2); root.add(led);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), ledMat); dome.position.y = 0.3; led.add(dome);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.3, 24), ledMat); body.position.y = 0.15; led.add(body);
    const ledLight = new THREE.PointLight(0xff3030, 0, 3, 1.5); ledLight.position.y = 0.4; led.add(ledLight);
    const soot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), M.matte(0x111111)); soot.position.y = 0.2; led.add(soot);
    const trMat = M.metal(0xd4a24a);
    root.add(tube([[LX - 0.6, 0.66, 0.1], [LX - 0.4, 0.66, 0.25], [LX - 0.35, 0.66, 0.25]], 0.02, trMat, false, 10));
    root.add(tube([[LX + 0.35, 0.66, 0.25], [LX + 0.6, 0.66, 0.25], [LX + 0.8, 0.66, 0.2]], 0.02, trMat, false, 10));
    root.add(tube([[LX + 0.8, 0.66, 0.2], [LX + 0.8, 0.66, -0.3], [LX - 0.6, 0.66, -0.3], [LX - 0.6, 0.66, -0.1]], 0.02, trMat, false, 20));
    const ledBoard = board(root, 2.9, 2.18, 640, 480, (g, w, h) => drawLed(g, w, h), [LX + 2.85, 1.85, -0.5]);
    ledBoard.mesh.rotation.y = -0.15;

    // ---------------- mercury ring in a glass dewar
    const SX = 8.0;
    const dewar = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.9, 48, 1, true), M.clear(0xdfeaff, 0.18)); dewar.position.set(SX, 1.0, 0); root.add(dewar);
    const dBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.12, 48), M.metal(0x7a808c)); dBase.position.set(SX, 0.06, 0); root.add(dBase);
    const heLiq = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.0, 48), M.clear(0xa8d8ff, 0.2)); heLiq.position.set(SX, 0.6, 0); root.add(heLiq);
    const ring = torus(0.5, 0.05, M.metal(0xd8dde6, { roughness: 0.15 })); ring.rotation.x = Math.PI / 2; ring.position.set(SX, 0.95, 0); root.add(ring);
    const ringDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 10, 8), M.glow(0x8ef0ff), 24); root.add(ringDots);
    const tmp = new THREE.Object3D();
    const hgBoard = board(root, 2.7, 2.03, 640, 480, (g, w, h) => drawHg(g, w, h), [SX + 2.55, 1.85, -0.5]);
    hgBoard.mesh.rotation.y = -0.15;

    const lBulb = stage.label('', [BX, 2.35, 0], root, 'hot');
    const lLed = stage.label('', [LX + 0.8, 1.25, 0.2], root, 'hot');
    const lRes = stage.label('', [LX, 0.3, 0.75], root);
    const lSup = stage.label('5 V', [LX - 0.85, 1.2, 0], root);
    const lHg = stage.label('', [SX, 2.2, 0], root, 'hot');

    // ---------------- state
    function drawBulb(g, w, h) {
      panelBg(g, w, h);
      const IMAX = 0.5;
      const { X, Y, x1, y1 } = axes(g, w, h, { xMax: 230, yMax: IMAX, xTicks: [0, 50, 100, 150, 200], yTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5], xFmt: (v) => v + ' V', yFmt: (v) => v.toFixed(1) + ' A', xLabel: 'voltage →', yLabel: 'current ↑' });
      g.fillStyle = '#e8eef8'; g.font = 'bold 24px sans-serif'; g.fillText('A 60 W bulb: I vs V', 20, 34);
      g.setLineDash([8, 7]); g.lineWidth = 3;
      g.strokeStyle = 'rgba(142,240,255,.55)'; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(IMAX * R0), Y(IMAX)); g.stroke();
      g.strokeStyle = 'rgba(255,181,71,.55)'; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(230), Y(230 / R_HOT)); g.stroke();
      g.setLineDash([]);
      g.font = '17px sans-serif'; g.fillStyle = 'rgba(142,240,255,.85)'; g.fillText('if R stayed 61 Ω (cold)', X(IMAX * R0) + 8, y1 + 20);
      g.fillStyle = 'rgba(255,181,71,.85)'; g.fillText('if R were always 882 Ω', X(118), Y(118 / R_HOT) + 26);
      g.strokeStyle = '#ffb547'; g.lineWidth = 6; g.beginPath();
      for (let i = 0; i <= 80; i++) { const V = (230 * i) / 80, I = V ? V / Rb(bulbT(V)) : 0; i ? g.lineTo(X(V), Y(I)) : g.moveTo(X(V), Y(I)); }
      g.stroke();
      g.fillStyle = '#ffb547'; g.font = 'bold 18px sans-serif'; g.fillText('real bulb', X(160), Y(160 / Rb(bulbT(160))) - 14);
      const I = cur.V / Rb(cur.T);
      if (I <= IMAX) dot(g, X(cur.V), Y(I), '#fff', 10);
      else { g.fillStyle = '#ff7a59'; g.font = 'bold 20px sans-serif'; const t = `↑ ${I.toFixed(1)} A: switch-on surge`; g.fillText(t, Math.min(X(cur.V), x1 - g.measureText(t).width), y1 + 48); }
    }
    function drawLed(g, w, h) {
      panelBg(g, w, h);
      const IM = 60;
      const { X, Y, x0, x1, y1 } = axes(g, w, h, { xMax: 5, yMax: IM, xTicks: [0, 1, 2, 3, 4, 5], yTicks: [0, 20, 40, 60], xFmt: (v) => v + ' V', yFmt: (v) => v + ' mA', xLabel: 'volts across the LED →', yLabel: 'current ↑' });
      g.fillStyle = '#e8eef8'; g.font = 'bold 24px sans-serif'; g.fillText('Red LED on 5 V', 20, 34);
      // LED curve
      g.strokeStyle = '#ff5a5a'; g.lineWidth = 6; g.beginPath();
      let first = true;
      for (let i = 0; i <= 200; i++) { const I = (IM * 1.05 * i) / 200 / 1000, V = vLed(I); if (V > 5) break; first ? g.moveTo(X(V), Y(I * 1000)) : g.lineTo(X(V), Y(I * 1000)); first = false; }
      g.moveTo(X(0), Y(0)); g.lineTo(X(vLed(1e-6)), Y(0.001)); g.stroke();
      g.fillStyle = '#ff5a5a'; g.font = 'bold 18px sans-serif'; g.fillText('LED', X(2.08), Y(52));
      // Resistor load line: I = (5 − V) / R
      g.strokeStyle = '#8ef0ff'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath();
      const i0 = (VS / cur.R) * 1000;
      if (i0 <= IM) { g.moveTo(X(0), Y(i0)); } else { g.moveTo(X(VS - (IM / 1000) * cur.R), Y(IM)); }
      g.lineTo(X(VS), Y(0)); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#8ef0ff'; g.font = '17px sans-serif'; g.fillText(`resistor: I = (5 V − V) ÷ ${fmtR(cur.R)}`, X(2.6), y1 + 18);
      g.strokeStyle = 'rgba(255,181,71,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, Y(20)); g.lineTo(x1, Y(20)); g.stroke();
      g.fillStyle = 'rgba(255,181,71,.8)'; g.fillText('rated 20 mA', x0 + 8, Y(20) - 6);
      if (!st.ledDead) { const I = cur.I * 1000; if (I <= IM) dot(g, X(vLed(cur.I)), Y(I), '#fff', 10); else { g.fillStyle = '#ff7a59'; g.font = 'bold 20px sans-serif'; g.fillText(`↑ ${I.toFixed(0)} mA`, X(2.2), y1 + 44); } }
      else { g.fillStyle = '#ff7a59'; g.font = 'bold 26px sans-serif'; g.fillText('Burnt out', X(0.3), Y(40)); }
    }
    function drawHg(g, w, h) {
      panelBg(g, w, h);
      const lg = Math.log10;
      const { X, Y, x0, x1, y0 } = axes(g, w, h, { xMin: 2, xMax: 300, logX: true, yMin: -3.3, yMax: 0.1, xTicks: [2, 4.2, 10, 30, 100, 300], yTicks: [-3, -2, -1, 0], xFmt: (v) => v + ' K', yFmt: (v) => (v === 0 ? '100%' : v === -1 ? '10%' : v === -2 ? '1%' : '0.1%'), xLabel: 'temperature →', yLabel: 'resistance (vs 0 °C) ↑' });
      g.fillStyle = '#e8eef8'; g.font = 'bold 24px sans-serif'; g.fillText('Mercury, cooled', 20, 34);
      g.strokeStyle = '#8ef0ff'; g.lineWidth = 5; g.beginPath();
      for (let i = 0; i <= 150; i++) { const T = 2 * 150 ** (i / 150), r = hgR(T), y = r > 0 ? Y(Math.max(-3.3, lg(r))) : y0; i ? g.lineTo(X(T), y) : g.moveTo(X(T), y); }
      g.stroke();
      g.fillStyle = '#5ce1a9'; g.font = 'bold 18px sans-serif'; g.fillText('zero!', X(2.3), y0 - 10);
      g.strokeStyle = 'rgba(255,181,71,.6)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(TC), Y(0.1)); g.lineTo(X(TC), y0); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,181,71,.9)'; g.font = '17px sans-serif'; g.fillText('4.2 K', X(TC) + 6, Y(-0.4));
      const r = hgR(cur.temp); dot(g, X(cur.temp), r > 0 ? Y(Math.max(-3.3, lg(r))) : y0, '#fff', 10);
    }

    let focus = '', kB = '', kL = '', kH = '', ringPh = 0, clock = 0;
    const api = {
      coldStart: (s) => { st.T = T0; st.cold = { t: 0 }; st.peakI = 0; },
      newLed: () => { st.ledDead = false; st.over = 0; },
      kick: () => { st.ringI = 1; },
    };
    return {
      ...api,
      update(dt, s, time) {
        dt = Math.max(0, dt);
        fitNarrow(stage, [lRes, lSup]);
        if (s.focus !== focus) { focus = s.focus; const v = VIEWS[focus] || VIEWS.bulb; stage.setView(v.pos, v.target, 1.1); }
        // Bulb: during a cold start, filament physics runs 40× slower than real time.
        if (st.cold) {
          const sim = dt / 40;
          for (let k = 0; k < 10; k++) { const P = (s.bulbV ** 2) / Rb(st.T), L = KRAD * (st.T ** 4 - T0 ** 4); st.T = Math.max(T0, st.T + ((P - L) / CFIL) * (sim / 10)); }
          st.peakI = Math.max(st.peakI, s.bulbV / Rb(st.T));
          st.cold.t += dt; if (st.cold.t > 4.5) st.cold = null;
        } else st.T = approach(st.T, bulbT(s.bulbV), 6, dt);
        bulb.setT(st.T);
        dimmer.rotation.y = (s.bulbV / 230) * 4;
        const Ib = s.bulbV / Rb(st.T);
        lBulb.element.innerHTML = `<b>${Math.round(st.T).toLocaleString('en-IN')} K</b> · R = ${Math.round(Rb(st.T))} Ω · ${Ib.toFixed(2)} A`;
        const nb = `${Math.round(s.bulbV)}|${Math.round(st.T / 5)}`; if (nb !== kB) { kB = nb; cur.V = s.bulbV; cur.T = st.T; bulbBoard.redraw(); }

        // LED
        const I = st.ledDead ? 0 : ledI(s.ledR);
        if (!st.ledDead) { st.over = I > I_BURN ? st.over + dt : Math.max(0, st.over - dt); if (st.over > 0.4) st.ledDead = true; }
        const b = st.ledDead ? 0 : clamp(I / 0.02, 0, 2.5);
        ledMat.emissive.setRGB(b * 1.2, b * 0.08, b * 0.05); ledLight.intensity = b * 1.5; soot.visible = st.ledDead;
        ledMat.color.setHex(st.ledDead ? 0x2a1010 : 0x7a1010);
        lLed.element.innerHTML = st.ledDead ? '<b>Burnt out!</b>' : `LED <b>${(I * 1000).toFixed(1)} mA</b> · ${vLed(I).toFixed(2)} V`;
        lRes.element.innerHTML = `Resistor <b>${fmtR(s.ledR)}</b> · ${(I * s.ledR).toFixed(2)} V across it`;
        const nl = `${s.ledR.toFixed(1)}|${st.ledDead}`; if (nl !== kL) { kL = nl; cur.R = s.ledR; cur.I = I; ledBoard.redraw(); }

        // Mercury ring: a current decays at a rate set by its resistance; at R = 0 it never does.
        const r = hgR(s.temp);
        st.ringI *= Math.exp(-dt * r * 250);
        st.ringA = approach(st.ringA, st.ringI, 8, dt);
        ringPh += dt * st.ringI * 2.2;
        for (let i = 0; i < 24; i++) { const a = ringPh + (i / 24) * Math.PI * 2; tmp.position.set(SX + Math.cos(a) * 0.5, 1.03, Math.sin(a) * 0.5); tmp.scale.setScalar(st.ringI > 0.01 ? 1 : 0.001); tmp.updateMatrix(); ringDots.setMatrixAt(i, tmp.matrix); }
        ringDots.instanceMatrix.needsUpdate = true;
        heLiq.visible = s.temp < 4.3;
        lHg.element.innerHTML = r === 0 ? `<b>${s.temp.toFixed(2)} K · zero resistance</b>` : `${s.temp < 10 ? s.temp.toFixed(2) : Math.round(s.temp)} K · R = <b>${(r * 100).toPrecision(2)}%</b> of 0 °C`;
        const nh = s.temp.toFixed(3); if (nh !== kH) { kH = nh; cur.temp = s.temp; hgBoard.redraw(); }
        clock = time;
      },
      readout: (s) => {
        if (s.focus === 'led') {
          const I = st.ledDead ? 0 : ledI(s.ledR), mA = I * 1000;
          const [cls, say] = st.ledDead ? ['no', 'Burnt out: fit a new one'] : mA > 30 ? ['no', 'Far too much current!'] : mA < 5 ? ['', 'Very dim'] : ['ok', 'Glowing nicely'];
          return `<div class="big ${cls}">${say}</div>
            <div class="row"><span>Volts across the LED</span><b>${vLed(I).toFixed(2)} V</b></div>
            <div class="row"><span>Left for the resistor</span><b>${(I * s.ledR).toFixed(2)} V</b></div>
            <div class="row"><span>Current, I = V ÷ R</span><b>${mA.toFixed(1)} mA</b></div>
            <small>Rated 20 mA: R = (5 − 2.0) ÷ 0.02 = 150 Ω.</small>`;
        }
        if (s.focus === 'super') {
          const r = hgR(s.temp);
          return `<div class="big ${r === 0 ? 'ok' : ''}">${r === 0 ? 'Resistance: exactly zero' : `Resistance: ${(r * 100).toPrecision(2)}% of 0 °C`}</div>
            <div class="row"><span>Temperature</span><b>${s.temp < 10 ? s.temp.toFixed(2) : Math.round(s.temp)} K (${Math.round(s.temp - 273.15)} °C)</b></div>
            <div class="row"><span>Current in the ring</span><b>${Math.round(st.ringI * 100)}% of its start</b></div>
            <small>${r === 0 ? 'No resistance, no loss: the current goes round and round.' : 'Any resistance turns the current into heat, so it dies away.'}</small>`;
        }
        const Rn = Rb(st.T), Ib = s.bulbV / Rn;
        return `<div class="big">R = ${Math.round(Rn)} Ω, ${(Rn / R0).toFixed(1)}× its cold value</div>
          <div class="row"><span>Filament</span><b>${Math.round(st.T).toLocaleString('en-IN')} K</b></div>
          <div class="row"><span>Current, I = V ÷ R</span><b>${Ib.toFixed(2)} A</b></div>
          <div class="row"><span>Cold resistance</span><b>${Math.round(R0)} Ω</b></div>
          <small>${st.peakI > 0.5 ? `Switch-on surge peaked at ${st.peakI.toFixed(1)} A, ${Math.round(st.peakI / (230 / R_HOT))}× the running current.` : 'Each instant obeys V = I × R, but R itself changes with temperature.'}</small>`;
      },
    };
  },
};
