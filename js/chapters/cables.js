// Chapter 3: thick wires for big currents. A cable's resistance R = ρL/A turns into a voltage
// drop I×R and heat I²R. Low-voltage circuits need big currents for the same power, so they
// need much thicker cables.
// House: a 2 kW geyser at 230 V, 15 m run (30 m of conductor). Inverter: a 720 W load on a
// 12 V battery draws about 60 A, 1.5 m cables each way. Car starter: about 150 A while
// cranking (typical petrol car starters draw 100–200 A), about 2 m of cable including the return.
// Steady temperature rise ΔT = (heat per metre) / (h × π × d) with h ≈ 10 W/m²K for still air
// (convection plus radiation); d is the outer diameter with insulation. The starter only runs a
// few seconds, so for it we give the rise after 10 s of cranking with no cooling:
// ΔT = J² ρ t / (density × specific heat), copper 8,960 kg/m³ and 385 J/kg·K.
import { THREE, M, box, rod, tube, clamp, approach } from '../kit.js';
import { CU, copperR, makePath, flow, makeMeter, makeBattery, board, panelBg, axes, dot, fmtR, heatHaze, fitNarrow } from '../ohm.js';

export const SIZES = [0.75, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];   // standard cable sizes, mm²
const CIRC = {
  house: { label: 'House geyser', V: 230, loadR: (230 * 230) / 2000, L: 30, size: 2, run: '15 m each way', steady: true },
  inverter: { label: 'Inverter battery', V: 12, I: 60, L: 3, size: 6, run: '1.5 m each way', steady: true },
  car: { label: 'Car starter', V: 12, I: 150, L: 2, size: 7, run: 'about 2 m', steady: false },
};
export function cable(s) {
  const c = CIRC[s.circ] || CIRC.house, A = SIZES[clamp(Math.round(s.size), 0, SIZES.length - 1)], R = copperR(c.L, A);
  const I = c.I || c.V / (c.loadR + R);
  const drop = I * R, loss = I * I * R, perM = loss / c.L;
  const d = (2 * Math.sqrt(A / Math.PI) + 2 * (0.7 + 0.1 * Math.sqrt(A))) / 1000;
  const J = I / A;                                             // A/mm²
  const dT = c.steady ? perM / (10 * Math.PI * d) : (J * 1e6) ** 2 * CU.rho * 10 / (8960 * 385);
  return { c, A, R, I, drop, loss, perM, dT, J, pct: (drop / c.V) * 100 };
}
const verdict = (k) => (k.dT > 45 ? ['no', 'Too hot: the insulation will cook'] : k.pct > 5 ? ['no', 'Too much voltage lost on the way'] : k.dT > 25 ? ['', 'Warm, but within limits'] : ['ok', 'Cool and efficient']);

export default {
  id: 'cables',
  short: 'Thick wires',
  title: 'Big currents need fat cables',
  subtitle: 'Every wire has a little resistance. At 60 or 150 amps, a little is a lot.',
  view: { pos: [0.4, 3.4, 8.2], target: [0.1, 1.55, 0] },
  learn: `<p>A copper wire isn't a perfect conductor. Its resistance is <b>R = ρ × L ÷ A</b>: longer wire, more resistance; thicker wire (bigger area A), less. For 1 metre of 1 mm² copper, R is about 0.017 Ω. Tiny, until the current gets big.</p>
    <p>The cable steals two things. It <b>drops voltage</b>, V = I × R, so the appliance gets less than the socket gives. And it makes <b>heat</b>, I² × R, and that grows with the <b>square</b> of the current.</p>
    <p>Now compare. A 2 kW geyser on 230 V draws under 9 A, so ordinary 2.5 mm² house wire is fine. A home inverter's 720 W from a 12 V battery needs about <b>60 A</b>, seven times more. A car's starter motor gulps around <b>150 A</b>. Same power at a low voltage means a huge current, so battery cables are as thick as your finger. See UPSClear and CarClear.</p>
    <p class="tip"><b>Try it:</b> pick the car starter and slide the cable down to 4 mm². Watch the heat and the lost volts, then find the thinnest cable that stays cool.</p>`,
  terms: [
    { t: 'Resistivity (ρ)', d: 'How strongly a material resists current, for a 1 m cube. Copper: 1.7 × 10⁻⁸ Ω·m.' },
    { t: 'Cross-section', d: 'The area of the metal core, in mm². Double it and the resistance halves.' },
    { t: 'Voltage drop', d: 'Volts lost along a cable, I × R, so the load gets less than the supply.' },
    { t: 'Current density', d: 'Amps per mm² of conductor. Too many and the wire overheats.' },
  ],
  defaults: { circ: 'house', size: 2 },
  onChange(s, key) { if (key === 'circ') s.size = (CIRC[s.circ] || CIRC.house).size; },
  controls: [
    { key: 'circ', type: 'seg', label: 'Circuit', options: Object.entries(CIRC).map(([v, c]) => ({ v, label: c.label })), fmt: (v) => `${CIRC[v].V} V` },
    { key: 'size', type: 'range', label: 'Cable size', min: 0, max: SIZES.length - 1, step: 1, ends: ['0.75 mm²', '50 mm²'], fmt: (v) => SIZES[v] + ' mm²', hint: 'Standard cable sizes. The number is the area of the copper core.' },
  ],
  quiz: [
    { q: 'Why do inverter and car battery cables need to be so much thicker than house wiring?', options: ['Batteries are dangerous', 'At 12 V the same power needs about 20 times the current, and cable heat grows with current squared', 'DC is heavier than AC', 'To look strong'], answer: 1, why: 'P = V × I, so low voltage means high current, and heat in the cable is I²R.' },
    { q: 'You double a cable’s cross-section. Its resistance…', options: ['doubles', 'halves', 'stays the same', 'drops to a quarter'], answer: 1, why: 'R = ρL ÷ A. Twice the area, half the resistance.' },
    { q: 'A cable has 0.01 Ω and carries 100 A. How much heat does it make?', options: ['1 W', '10 W', '100 W', '1,000 W'], answer: 2, why: 'P = I²R = 100 × 100 × 0.01 = 100 W.' },
  ],
  reel: [
    { ms: 5600, caption: 'A car starter pulls about 150 amps. On a thin cable, the wire itself becomes a heater.', set: { circ: 'car' }, anim: { size: [7, 3] }, spin: 0.12 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const XS = -3.2, XL = 2.4, Y = 0.75;
    const bench = box(7.4, 0.1, 2.0, M.matte(0x3a3f4b, { roughness: 0.7 })); bench.position.set(-0.4, 0.3, 0); root.add(bench);
    // Sources
    const mains = new THREE.Group(); root.add(mains);
    const db = box(0.9, 1.2, 0.5, M.plastic(0xf2f2f2)); db.position.set(XS - 0.2, 0.95, 0); mains.add(db);
    const mcb = box(0.2, 0.4, 0.1, M.plastic(0x2a2e37)); mcb.position.set(XS - 0.2, 1.1, 0.28); mains.add(mcb);
    const batt = new THREE.Group(); root.add(batt);
    const bb = box(1.1, 0.8, 0.8, M.plastic(0x1f232b)); bb.position.set(XS - 0.25, 0.75, 0); batt.add(bb);
    for (const [dz, col] of [[0.22, 0xd23b3b], [-0.22, 0x222222]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 16), M.plastic(col)); t.position.set(XS + 0.1, 1.2, dz); batt.add(t); }
    // Loads
    const geyser = new THREE.Group(); root.add(geyser);
    const gb = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.3, 32), M.plastic(0xf4f4f4)); gb.position.set(XL + 0.5, 1.0, 0); geyser.add(gb);
    const inv = new THREE.Group(); root.add(inv);
    const ib = box(0.9, 0.7, 0.6, M.plastic(0x2a2e37)); ib.position.set(XL + 0.45, 0.7, 0); inv.add(ib);
    const scr = box(0.4, 0.16, 0.02, M.glow(0x5ce1a9)); scr.position.set(XL + 0.45, 0.85, 0.31); inv.add(scr);
    const starter = new THREE.Group(); root.add(starter);
    const sm = rod(XL + 0.1, XL + 1.0, 0.3, 0.3, M.metal(0x7a808c)); sm.position.y = 0.75; starter.add(sm);
    const sol = rod(XL + 0.2, XL + 0.8, 0.14, 0.14, M.metal(0x9aa3b2)); sol.position.y = 1.15; starter.add(sol);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 12), M.metal(0xd8dde6)); pin.rotation.z = Math.PI / 2; pin.position.set(XL + 1.07, 0.75, 0); starter.add(pin);

    // Two cables with a gentle sag, redrawn when the size changes.
    const cabMats = [M.plastic(0xd23b3b, { emissive: new THREE.Color(0, 0, 0) }), M.plastic(0x2a2a2a, { emissive: new THREE.Color(0, 0, 0) })];
    const cables = new THREE.Group(); root.add(cables);
    const cablePts = (dz) => [[XS + 0.2, Y + 0.3, dz], [XS + 0.8, Y + 0.05, dz], [-0.4, Y - 0.12, dz], [XL - 0.8, Y + 0.05, dz], [XL + 0.05, Y + 0.2, dz]];
    let builtSize = -1;
    const rebuild = (A) => {
      cables.children.forEach((c) => c.geometry.dispose()); cables.clear();
      const r = 0.03 + 0.02 * Math.sqrt(A);
      [0.28, -0.28].forEach((dz, i) => cables.add(tube(cablePts(dz), r, cabMats[i], false, 80)));
    };
    const pth = makePath(cablePts(0.28), false);
    const eDots = flow(pth, 70, 0.035, 0x8ef0ff, 1, { radius: 0 });
    eDots.mesh.material.depthTest = false; eDots.mesh.renderOrder = 3; root.add(eDots.mesh);
    const haze = heatHaze(9, 5, 1.0); haze.position.set(-0.4, Y, 0); root.add(haze);
    const meter = makeMeter('V', 250, { w: 0.9, h: 0.75 }); meter.position.set(XL + 1.75, 1.75, 0.1); root.add(meter);

    // Board: heat in the cable vs cable size, log–log, for this circuit.
    let cur = { circ: 'house', size: 2 };
    const chart = board(root, 3.4, 2.55, 640, 480, (g, w, h) => {
      panelBg(g, w, h);
      const lg = Math.log10;
      const { X, Y: Yp, x1 } = axes(g, w, h, { xMin: 0.75, xMax: 50, logX: true, yMin: -1, yMax: 3.3, xTicks: [1, 2.5, 6, 16, 50], yTicks: [-1, 0, 1, 2, 3], xFmt: (v) => v + '', yFmt: (v) => 10 ** v + ' W', xLabel: 'cable size, mm² →', yLabel: 'heat in the cable ↑' });
      g.fillStyle = '#e8eef8'; g.font = 'bold 24px sans-serif'; g.fillText('Cable heat vs thickness', 20, 34);
      for (const [key, col] of [['house', 'rgba(142,240,255,.35)'], ['inverter', 'rgba(255,181,71,.35)'], ['car', 'rgba(255,122,89,.35)']]) {
        const on = key === cur.circ;
        g.strokeStyle = on ? col.replace('.35', '1') : col; g.lineWidth = on ? 6 : 3; g.beginPath();
        let first = true;
        for (let i = 0; i <= 60; i++) { const A = 0.75 * (50 / 0.75) ** (i / 60), k = cable({ circ: key, size: 0 }), R = copperR(k.c.L, A), I = k.c.I || k.c.V / (k.c.loadR + R), y = clamp(lg(I * I * R), -1, 3.3); first ? g.moveTo(X(A), Yp(y)) : g.lineTo(X(A), Yp(y)); first = false; }
        g.stroke();
      }
      const k = cable(cur);
      dot(g, X(k.A), Yp(clamp(lg(k.loss), -1, 3.3)), '#fff', 10);
      g.fillStyle = '#e8eef8'; g.font = '19px sans-serif';
      const t = `${k.c.label}: ${Math.round(k.I)} A`; g.fillText(t, x1 - g.measureText(t).width, 34);
    }, [0.2, 2.85, -1.1]);

    const lSrc = stage.label('', [XS - 0.2, 1.85, 0.3], root, 'hot');
    const lLoad = stage.label('', [XL + 0.5, 0.05, 0.5], root);
    const lCab = stage.label('', [-0.4, Y - 0.55, 0.6], root);
    let heat = 0, key = '';
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        fitNarrow(stage, [lCab]);
        const k = cable(s);
        mains.visible = s.circ === 'house'; batt.visible = !mains.visible;
        geyser.visible = s.circ === 'house'; inv.visible = s.circ === 'inverter'; starter.visible = s.circ === 'car';
        if (builtSize !== k.A) { builtSize = k.A; rebuild(k.A); }
        heat = approach(heat, clamp((k.dT - 15) / 70, 0, 1), 2, dt);
        cabMats.forEach((m) => m.emissive.setRGB(heat * 0.9, heat * 0.25, 0));
        haze.update(time, (heat - 0.15) * 1.4);
        eDots.update(dt, -clamp(k.J * 0.12, 0.02, 4));
        meter.set(k.c.V - k.drop, `${(k.c.V - k.drop).toFixed(k.c.V > 100 ? 0 : 1)} V`, k.c.V > 100 ? 250 : 15);
        lSrc.element.innerHTML = s.circ === 'house' ? 'Mains <b>230 V</b>' : 'Battery <b>12 V</b>';
        lLoad.element.innerHTML = `${{ house: 'Geyser, 2 kW', inverter: 'Inverter, 720 W', car: 'Starter motor' }[s.circ]}: <b>${Math.round(k.I)} A</b>`;
        lCab.element.innerHTML = `${k.A} mm² × ${k.c.run} · <b>${fmtR(k.R)}</b> · ${k.loss < 10 ? k.loss.toFixed(1) : Math.round(k.loss)} W of heat`;
        const nk = `${s.circ}|${k.A}`; if (nk !== key) { key = nk; cur = { circ: s.circ, size: s.size }; chart.redraw(); }
      },
      readout: (s) => {
        const k = cable(s), [cls, say] = verdict(k);
        return `<div class="big ${cls}">${say}</div>
          <div class="row"><span>Current</span><b>${k.I < 20 ? k.I.toFixed(1) : Math.round(k.I)} A</b></div>
          <div class="row"><span>Cable resistance, ρL ÷ A</span><b>${fmtR(k.R)}</b></div>
          <div class="row"><span>Volts lost, I × R</span><b>${k.drop.toFixed(k.drop < 1 ? 2 : 1)} V (${k.pct.toFixed(1)}%)</b></div>
          <div class="row"><span>Heat in cable, I²R</span><b>${k.loss < 10 ? k.loss.toFixed(1) : Math.round(k.loss)} W</b></div>
          <div class="row"><span>${k.c.steady ? 'Cable warms by' : 'Warms in 10 s of cranking by'}</span><b>${Math.round(k.dT)} °C</b></div>`;
      },
    };
  },
};
