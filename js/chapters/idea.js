// Chapter 1: Ohm's law as a live experiment. A battery pushes current round a loop through a
// rheostat and an ammeter. I = V / R, P = V × I = I²R. The V–I board shows the straight line.
// Drift speed v = I / (n A e) for 1 mm² copper (n = 8.49e28 m⁻³); a signal in a cable
// travels at roughly two thirds of the speed of light (typical velocity factor 0.6–0.8).
import { THREE, M, box, rod, clamp, approach } from '../kit.js';
import { makePath, wireMesh, flow, makeBattery, makeRheostat, makeMeter, board, panelBg, axes, dot, driftSpeed, si, fitNarrow } from '../ohm.js';

const TOP = 2.9, BOT = 0.75, XL = -3.1, XR = 0.9, RX0 = -2.2, RX1 = 0.0;
const SW = { x: -1.1 };                                   // knife switch on the bottom wire
const I_MAX = 3;                                           // chart's current axis, A
const RANGES = [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 15];       // the ammeter auto-ranges like a multimeter
const REF = [2, 5, 20, 50];
const fmtDur = (s) => (s < 60 ? `${s.toFixed(0)} s` : s < 3600 ? `${(s / 60).toFixed(0)} min` : s < 86400 * 2 ? `${(s / 3600).toFixed(1)} hours` : `${(s / 86400).toFixed(0)} days`);

export default {
  id: 'idea',
  short: 'The law, live',
  title: 'Push, flow and squeeze',
  subtitle: 'Current = voltage ÷ resistance. Turn the dials and watch it hold.',
  view: { pos: [0.3, 3.0, 9.0], target: [0.3, 2.45, 0] },
  learn: `<p>Every circuit has three things. <b>Voltage</b> (V, in volts) is the push the battery gives. <b>Current</b> (I, in amps) is how much charge flows past a point each second. <b>Resistance</b> (R, in ohms, Ω) is how hard the wire makes it for charge to get through.</p>
    <p><b>Ohm's law</b> ties them together: <b>V = I × R</b>, or turned round, <b>I = V ÷ R</b>. Double the push and the current doubles. Double the resistance and it halves. Plot current against voltage and you get a <b>straight line</b> whose steepness is 1 ÷ R.</p>
    <p>Everything that resists current gets warm. The heat each second is the <b>power</b>: <b>P = V × I</b>, which is the same as <b>I² × R</b>.</p>
    <p>Here's the surprise. The <b>electrons</b> themselves crawl. In a 1 mm² copper wire carrying 1 amp they drift at about <b>0.07 mm per second</b>, slower than a snail. But the <b>push</b> travels down the wire at about two thirds of the speed of light, so every electron in the loop starts moving almost at once. That's why the light comes on the instant you flip the switch.</p>
    <p class="tip"><b>Try it:</b> raise the voltage and watch the dot climb the straight line. Then flip the switch off and on, and switch on the water pipes.</p>`,
  terms: [
    { t: 'Voltage (V)', d: 'The push that drives charge round a circuit, measured in volts. A battery or a socket provides it.' },
    { t: 'Current (I)', d: 'How much electric charge flows past a point each second, measured in amps (A).' },
    { t: 'Resistance (R)', d: 'How strongly something opposes current, in ohms (Ω). One volt pushes one amp through one ohm.' },
    { t: 'Power (P)', d: 'Energy per second, in watts: P = V × I = I² × R. In a resistor it all becomes heat.' },
    { t: 'Drift speed', d: 'The slow average speed of electrons along a wire, a fraction of a millimetre per second.' },
  ],
  defaults: { V: 6, R: 10, on: true, water: false },
  controls: [
    { key: 'V', type: 'range', label: 'Battery voltage (V)', min: 0, max: 12, step: 0.1, ends: ['0 V', '12 V'], fmt: (v) => v.toFixed(1) + ' V' },
    { key: 'R', type: 'log', label: 'Resistance (R)', min: 1, max: 100, ends: ['1 Ω', '100 Ω'], fmt: (v) => (v < 10 ? v.toFixed(1) : v.toFixed(0)) + ' Ω', hint: 'Slide the rheostat’s contact: more coil in the circuit, more resistance.' },
    { key: 'on', type: 'toggle', label: 'Switch closed', hint: 'Close it and watch every electron start moving at once.' },
    { key: 'water', type: 'toggle', label: 'Show it as water in pipes', hint: 'Pump = battery (pressure = voltage), flow = current, narrow pipe = resistance.' },
  ],
  quiz: [
    { q: 'A 12 V battery is connected across a 4 Ω resistor. What current flows?', options: ['48 A', '3 A', '0.33 A', '8 A'], answer: 1, why: 'I = V ÷ R = 12 ÷ 4 = 3 A.' },
    { q: 'You double the resistance and keep the voltage the same. The current…', options: ['doubles', 'halves', 'stays the same', 'drops to a quarter'], answer: 1, why: 'I = V ÷ R, so twice the R gives half the I.' },
    { q: 'Why does a light come on the instant you flip the switch, when electrons crawl at under a millimetre per second?', options: ['Electrons really move at light speed', 'The push travels through the wire almost at light speed, so all the electrons start moving at once', 'The bulb stores light', 'It doesn’t: there is a delay of hours'], answer: 1, why: 'The wire is already full of electrons. The electric push reaches all of them in a few billionths of a second.' },
  ],
  reel: [
    { ms: 5600, caption: 'Ohm’s law: current equals voltage divided by resistance. Double the push, double the flow.', set: { R: 10, on: true, water: false }, anim: { V: [1, 12] }, spin: 0 },
    { ms: 5200, caption: 'Squeeze the flow with more resistance and the current falls. The line on the chart gets flatter.', set: { V: 9, on: true, water: true }, anim: { R: [4, 60, true] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // Bench
    const bench = box(5.4, 0.12, 2.2, M.matte(0x3a3f4b, { roughness: 0.7 })); bench.position.set(-1.1, 0.06, 0); root.add(bench);
    // The loop, drawn in the direction conventional current flows: out of + (top), right along the top.
    const path = makePath([[XL, TOP, 0], [XR, TOP, 0], [XR, BOT, 0], [XL, BOT, 0]]);
    const wireMat = M.metal(0xc8773a, { roughness: 0.3 });
    const wires = wireMesh(makePath([[SW.x + 0.33, BOT, 0], [XR, BOT, 0], [XR, TOP, 0], [XL, TOP, 0], [XL, BOT, 0], [SW.x - 0.3, BOT, 0]], false), 0.045, wireMat); root.add(wires);
    for (const x of [XL, XR]) { const post = box(0.12, BOT - 0.12, 0.12, M.matte(0x4a505c)); post.position.set(x, (BOT + 0.12) / 2, 0); root.add(post); }

    const bat = makeBattery(1.35, 0.36); bat.position.set(XL, (TOP + BOT) / 2, 0); root.add(bat);
    const rh = makeRheostat(RX1 - RX0, 0.24); rh.position.set((RX0 + RX1) / 2, TOP, 0); root.add(rh);
    const meter = makeMeter('A', 1); meter.position.set(XR, (TOP + BOT) / 2, 0.02); root.add(meter);

    // Knife switch: a hinged blade on the bottom wire.
    const swBase = box(0.8, 0.08, 0.36, M.matte(0x2a2e37)); swBase.position.set(SW.x, BOT - 0.1, 0); root.add(swBase);
    const hinge = new THREE.Group(); hinge.position.set(SW.x - 0.3, BOT, 0); root.add(hinge);
    const blade = rod(0, 0.62, 0.03, 0.03, M.metal(0xd8dde6)); hinge.add(blade);
    const knob = box(0.1, 0.22, 0.1, M.plastic(0xb3261e)); knob.position.set(0.62, 0.08, 0); hinge.add(knob);
    const swD = path.L - (TOP - BOT) - (SW.x - XL);          // distance along the loop to the switch

    // Electrons (or water) that flow round the loop.
    const eFlow = flow(path, 150, 0.05, 0x8ef0ff, 1, { radius: 0.03 });
    root.add(eFlow.mesh);
    const wMat = M.glow(0x4f9dff);
    const wFlow = flow(path, 220, 0.07, 0x4f9dff, 1, { radius: 0.12, mat: wMat });
    root.add(wFlow.mesh);

    // The water-pipe version: clear pipes over the wires, a narrow neck where the rheostat is.
    const pipe = new THREE.Group(); root.add(pipe);
    const pipeMat = M.clear(0x7fb6ff, 0.22);
    const pipePath = makePath([[RX1, TOP, 0], [XR, TOP, 0], [XR, BOT, 0], [XL, BOT, 0], [XL, TOP, 0], [RX0, TOP, 0]], false);
    pipe.add(wireMesh(pipePath, 0.2, pipeMat));
    const neck = rod(RX0, RX1, 1, 1, M.clear(0x7fb6ff, 0.35)); neck.position.y = TOP; pipe.add(neck);
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.5, 40), M.plastic(0x2e6bd6, { transparent: true, opacity: 0.85 })); pump.rotation.x = Math.PI / 2; pump.position.set(XL, (TOP + BOT) / 2, 0); pipe.add(pump);
    const impeller = new THREE.Group(); impeller.position.set(XL, (TOP + BOT) / 2, 0.27); pipe.add(impeller);
    for (let i = 0; i < 4; i++) { const v = box(0.8, 0.08, 0.04, M.plastic(0xe8eef8)); v.rotation.z = (i * Math.PI) / 4; impeller.add(v); }

    // Two pulses that run from the switch both ways when it closes: the push, not the electrons.
    const pulses = [0, 1].map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), M.glow(0xffe08a)); root.add(s); return s; });

    // The V–I board.
    let cur = { V: 6, R: 10 };
    const chart = board(root, 3.9, 2.93, 640, 480, (g, w, h) => {
      panelBg(g, w, h);
      const { X, Y, x0, x1, y1 } = axes(g, w, h, { xMax: 12, yMax: I_MAX, xTicks: [0, 3, 6, 9, 12], yTicks: [0, 1, 2, 3], xFmt: (v) => v + ' V', yFmt: (v) => v + ' A', xLabel: 'voltage →', yLabel: 'current ↑' });
      g.fillStyle = '#e8eef8'; g.font = 'bold 24px sans-serif'; g.fillText('Current vs voltage', 20, 34);
      const line = (R, col, lw) => { const Vend = Math.min(12, I_MAX * R); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(Vend), Y(Vend / R)); g.stroke(); return Vend; };
      g.font = '16px sans-serif';
      for (const R of REF) { const Ve = line(R, 'rgba(255,255,255,.18)', 2); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillText(R + ' Ω', X(Ve) - (Ve >= 12 ? 40 : 14), Y(Ve / R) - 8); }
      line(cur.R, '#8ef0ff', 6);
      const I = cur.V / cur.R;
      g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,181,71,.6)'; g.lineWidth = 2;
      if (I <= I_MAX) { g.beginPath(); g.moveTo(X(cur.V), Y(0)); g.lineTo(X(cur.V), Y(I)); g.lineTo(x0, Y(I)); g.stroke(); }
      g.setLineDash([]);
      if (I <= I_MAX) dot(g, X(cur.V), Y(I), '#ffb547', 11);
      else { g.fillStyle = '#ff7a59'; g.font = 'bold 20px sans-serif'; g.fillText(`↑ ${I.toFixed(1)} A: off the chart`, Math.min(X(cur.V), x1 - 230), y1 + 22); }
      g.fillStyle = '#8ef0ff'; g.font = 'bold 21px sans-serif';
      const t = `R = ${cur.R < 10 ? cur.R.toFixed(1) : cur.R.toFixed(0)} Ω · slope = 1/R`;
      g.fillText(t, x1 - g.measureText(t).width, 34);
    }, [2.95, 1.85, -0.2]);
    chart.mesh.rotation.y = -0.15;

    const lBat = stage.label('', [XL + 0.2, TOP + 0.55, 0], root, 'hot');
    const lR = stage.label('', [(RX0 + RX1) / 2, TOP + 0.85, 0], root);
    const lM = stage.label('', [XR + 0.1, (TOP + BOT) / 2 - 0.75, 0.3], root);
    const lSw = stage.label('', [SW.x, BOT - 0.45, 0.3], root);
    const lE = stage.label('', [-1.1, 1.45, 0.4], root);

    let Ishow = 0, front = path.L, wasOn = true, glow = 0, spin = 0, key = '';
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        fitNarrow(stage, [lE, lSw, lM]);
        const I = s.on ? s.V / s.R : 0;
        Ishow = approach(Ishow, I, 12, dt);
        if (s.on && !wasOn) front = 0;
        wasOn = s.on;
        front = Math.min(path.L, front + dt * 6);
        // The switch blade: closed lies flat, open tilts up.
        hinge.rotation.z = approach(hinge.rotation.z, s.on ? 0 : 0.9, 10, dt);
        // Rheostat contact: log of R.
        rh.setWiper(Math.log(s.R) / Math.log(100));
        glow = approach(glow, clamp((s.V * I - 4) / 60, 0, 1), 2, dt);
        rh.setGlow(glow);
        // Electrons drift against the conventional current, dots move in proportion to I.
        // Before the push reaches a stretch of wire, its electrons stay still.
        const gate = (d) => { const a = Math.abs(d - swD), dd = Math.min(a, path.L - a); return dd <= front; };
        const water = !!s.water;
        eFlow.mesh.visible = !water; wFlow.mesh.visible = water; pipe.visible = water;
        if (water) wFlow.update(dt, 0.28 * Ishow, gate); else eFlow.update(dt, -0.28 * Ishow, gate);
        const rn = 0.2 * Math.pow(s.R, -0.4);
        neck.scale.set(1, rn, rn);
        spin -= dt * Ishow * 3; impeller.rotation.z = spin;
        bat.visible = !water; rh.visible = !water;
        pulses.forEach((p, i) => { p.visible = front < path.L / 2 + 0.01; path.at(swD + (i ? 1 : -1) * front, p.position); });
        // Meter auto-ranges.
        const fs = RANGES.find((r) => r >= Ishow * 1.02) || 15;
        meter.set(Ishow, Ishow < 1 ? `${(Ishow * 1000).toFixed(0)} mA` : `${Ishow.toFixed(2)} A`, fs);
        const k = `${s.V.toFixed(2)}|${s.R.toFixed(3)}`;
        if (k !== key) { key = k; cur = { V: s.V, R: s.R }; chart.redraw(); }
        lBat.element.innerHTML = water ? `Pump: <b>${s.V.toFixed(1)} V</b> of pressure` : `Battery <b>+${s.V.toFixed(1)} V</b>`;
        lR.element.innerHTML = water ? `Narrow pipe: <b>${s.R < 10 ? s.R.toFixed(1) : s.R.toFixed(0)} Ω</b>` : `Rheostat <b>${s.R < 10 ? s.R.toFixed(1) : s.R.toFixed(0)} Ω</b>${glow > 0.15 ? ' · hot' : ''}`;
        lM.element.innerHTML = water ? 'Flow meter' : 'Ammeter';
        lSw.element.textContent = s.on ? 'Switch closed' : 'Switch open';
        lE.element.innerHTML = water ? 'Water flows from the pump round the loop' : (front < path.L / 2 ? 'The push races round the loop…' : 'Electrons drift from − to +');
      },
      readout: (s) => {
        const I = s.on ? s.V / s.R : 0, P = s.V * I, v = driftSpeed(I, 1);
        const cross = v > 0 ? 1 / v : Infinity;
        return `<div class="big">I = V ÷ R = ${I < 1 ? si(I, 'A', 2) : I.toFixed(2) + ' A'}</div>
          <div class="row"><span>Power, V × I = I²R</span><b>${P < 1 ? si(P, 'W', 2) : P.toFixed(1) + ' W'} of heat</b></div>
          <div class="row"><span>Electron drift (1 mm² copper)</span><b>${I ? (v * 1000).toFixed(3) + ' mm/s' : 'none'}</b></div>
          <small>${I ? `An electron needs ${fmtDur(cross)} to cross 1 m of wire. The push takes 5 billionths of a second.` : 'No current: the switch is open or the battery is at 0 V.'}</small>`;
      },
    };
  },
};
