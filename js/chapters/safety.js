// Chapter 4: when current gets dangerous.
// MCB: a 16 A B-curve breaker on 2.5 mm² wire. Thermal trip modelled as a heat store that fills
// at a rate ∝ (I/In)² − 1.13² (IEC 60898: no trip at 1.13 In for an hour, trip at 1.45 In
// within an hour), τ = 120 s; that gives ~2.5 min at 1.45 In, ~45 s at 2 In. Above 5 In the
// magnetic coil trips it at once. Played ten times faster than real time.
// Body: NIOSH (Worker Deaths by Electrocution, pub. 98-131) gives dry skin up to about
// 100,000 Ω, wet skin about 1,000 Ω, and the inside of the body about 500 Ω. The damp value
// (10,000 Ω) is an illustrative midpoint. Effects of current follow OSHA's table: ~1 mA felt,
// ~5 mA slight shock, 6–30 mA painful and hard to let go, 50–150 mA breathing can stop and
// death is possible. An RCCB (30 mA) trips within 300 ms at 30 mA and within 40 ms at 150 mA.
import { THREE, M, box, rod, tube, spring, clamp, approach } from '../kit.js';
import { MAINS, copperR, fitNarrow } from '../ohm.js';

const IN = 16, TAU = 120, LAPSE = 10;
const LOADS = { geyser: ['Geyser', 2000], heater: ['Room heater', 2000], kettle: ['Kettle', 1500], iron: ['Iron', 1000] };
const WIRE_PER_M = copperR(2, 2.5);                  // live + neutral, per metre of run
const SKIN = { dry: 100000, damp: 10000, wet: 1000 };
const INSIDE = 500;
const loadW = (s) => Object.keys(LOADS).reduce((a, k) => a + (s[k] ? LOADS[k][1] : 0), 0);
function effect(mA) {
  if (mA < 1) return ['ok', 'Not felt'];
  if (mA < 5) return ['ok', 'A faint tingle'];
  if (mA < 30) return ['no', 'Painful. Muscles lock: hard to let go'];
  if (mA < 50) return ['no', 'Severe shock, breathing trouble'];
  return ['no', 'Breathing and heartbeat can stop. Can kill'];
}
const VIEWS = {
  mcb: { pos: [-1.3, 2.9, 6.4], target: [-2.0, 1.95, 0] },
  body: { pos: [5.6, 2.3, 6.2], target: [4.4, 1.35, 0] },
};

export default {
  id: 'safety',
  short: 'Too much current',
  title: 'When current turns dangerous',
  subtitle: 'An MCB protects the wires. An RCCB protects you. Both are counting amps.',
  view: VIEWS.mcb,
  learn: `<p>Every appliance you switch on adds current: <b>I = P ÷ V</b>. A 2 kW geyser draws 8.7 A, a room heater another 8.7 A. The wire in the wall has a little resistance, so its heat, <b>I² × R</b>, climbs fast. Too much and the insulation melts.</p>
    <p>That's the <b>MCB</b>'s job. Inside is a <b>bimetal strip</b> that the current warms. A small overload bends it slowly, over seconds or minutes; a big one trips it sooner. A short circuit (almost zero resistance, so hundreds of amps) fires a small <b>electromagnet</b> that trips it in a few thousandths of a second. The MCB protects the <b>wire</b>, not you.</p>
    <p><b>Your body</b> is a resistor too. Dry skin can be around <b>100,000 Ω</b>, so 230 V pushes about 2 mA: a tingle. Wet skin can fall to about <b>1,000 Ω</b>. Add about 500 Ω for the inside of your body and 230 V now drives about <b>150 mA</b>, enough to stop your breathing or your heart. That's why you never touch switches with wet hands.</p>
    <p>An <b>RCCB</b> (or RCD) compares the current going out on the live wire with the current coming back on the neutral. If more than <b>30 mA</b> goes missing, perhaps through a person to the ground, it cuts the power in a few hundredths of a second.</p>
    <p class="tip"><b>Try it:</b> switch on the geyser, the heater and the iron and watch the strip bend. Then look at the person, make the skin wet, and switch on the RCCB.</p>`,
  terms: [
    { t: 'MCB', d: 'Miniature circuit breaker. It switches off a circuit that carries too much current for its wire.' },
    { t: 'Bimetal strip', d: 'Two metals bonded together that expand differently, so the strip bends as it warms.' },
    { t: 'Short circuit', d: 'A path with almost no resistance, so the current becomes huge.' },
    { t: 'RCCB', d: 'Residual current circuit breaker. It trips when current leaks away to the ground, for example through a person.' },
    { t: 'Earthing', d: 'A wire that gives leaking current an easy path to the ground instead of through you.' },
  ],
  defaults: { focus: 'mcb', geyser: true, heater: false, kettle: false, iron: false, skin: 'dry', rccb: false },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'mcb', label: 'The MCB' }, { v: 'body', label: 'A person' }] },
    ...Object.entries(LOADS).map(([k, [label, w]]) => ({ key: k, type: 'toggle', label: `${label} (${(w / 1000).toLocaleString('en-IN')} kW)` })),
    { key: 'go', type: 'buttons', label: 'The MCB', items: [{ label: 'Short circuit!', act: (s, inst) => inst.short() }, { label: 'Reset the MCB', act: (s, inst) => inst.reset() }] },
    { key: 'skin', type: 'seg', label: 'Skin', options: [{ v: 'dry', label: 'Dry' }, { v: 'damp', label: 'Damp' }, { v: 'wet', label: 'Wet' }], fmt: (v) => SKIN[v].toLocaleString('en-US') + ' Ω' },
    { key: 'rccb', type: 'toggle', label: 'RCCB fitted (30 mA)' },
  ],
  quiz: [
    { q: 'Your 16 A MCB trips when the geyser, heater and iron are on together. Why?', options: ['The MCB is faulty', 'Together they draw about 22 A, more than the wire is rated for', 'The voltage went up', 'Heaters make sparks'], answer: 1, why: 'I = P ÷ V = 5,000 ÷ 230 ≈ 22 A, well over 16 A, so the bimetal strip bends and trips it.' },
    { q: 'Why are wet hands so much more dangerous?', options: ['Water carries extra voltage', 'Wet skin has far less resistance, so the same voltage drives far more current through you', 'Water makes you heavier', 'They aren’t'], answer: 1, why: 'I = V ÷ R. Skin can fall from about 100,000 Ω to about 1,000 Ω, so the current rises about 70 times.' },
    { q: 'What does an RCCB detect?', options: ['Too much total current', 'Current that leaks away instead of coming back on the neutral', 'High voltage', 'Heat in the wires'], answer: 1, why: 'If the outgoing and returning currents differ by 30 mA or more, some of it is going somewhere it shouldn’t, maybe through a person.' },
  ],
  reel: [
    { ms: 5400, caption: 'Switch on too much and the current climbs past 16 amps. The MCB’s strip bends and trips.', set: { focus: 'mcb', geyser: true, heater: true, iron: true, kettle: true }, act: (s, inst) => { inst.reset(); inst.warm(0.4); }, spin: 0.1 },
    { ms: 5600, caption: 'Wet skin can drop your resistance a hundredfold. Same 230 volts, a deadly current.', set: { focus: 'body', rccb: false }, anim: { skin: ['dry', 'wet'] }, spin: 0.1 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);

    // ---------------- the MCB, cut open, and the circuit it guards
    const MX = -3.4, MY = 1.7;
    const panel = box(1.6, 2.2, 0.12, M.matte(0x5a6070)); panel.position.set(MX, MY, -0.35); root.add(panel);
    const shell = box(0.9, 1.5, 0.6, M.clear(0xe8eef8, 0.25)); shell.position.set(MX, MY, 0); root.add(shell);
    const front = box(0.9, 0.3, 0.62, M.plastic(0xf2f2f2)); front.position.set(MX, MY + 0.1, 0); front.visible = false; root.add(front);
    // Trip lever on the top face
    const leverPivot = new THREE.Group(); leverPivot.position.set(MX, MY + 0.75, 0.1); root.add(leverPivot);
    const lever = box(0.22, 0.4, 0.14, M.plastic(0x1f232b)); lever.position.y = 0.2; leverPivot.add(lever);
    // Bimetal strip: hinged at its bottom; it bends right as it warms.
    const stripPivot = new THREE.Group(); stripPivot.position.set(MX - 0.2, MY - 0.55, 0); root.add(stripPivot);
    const brass = box(0.05, 0.8, 0.18, M.metal(0xd4a24a)); brass.position.set(-0.025, 0.4, 0); stripPivot.add(brass);
    const steel = box(0.05, 0.8, 0.18, M.metal(0x9aa3b2)); steel.position.set(0.025, 0.4, 0); stripPivot.add(steel);
    const latch = box(0.4, 0.05, 0.1, M.metal(0xd8dde6)); latch.position.set(MX + 0.05, MY + 0.3, 0); root.add(latch);
    const coilMat = M.metal(0xb87333, { emissive: new THREE.Color(0, 0, 0) });
    const coil = spring(-0.22, 0.22, 0.1, 0.02, 7, coilMat); coil.rotation.z = Math.PI / 2; coil.position.set(MX + 0.25, MY - 0.3, 0); root.add(coil);
    // The wire run to four appliances.
    const wireMat = M.plastic(0xd23b3b, { emissive: new THREE.Color(0, 0, 0) });
    root.add(tube([[MX, MY - 0.75, 0], [MX, 0.35, 0.3], [MX + 1.0, 0.25, 0.6], [MX + 3.8, 0.25, 0.6]], 0.05, wireMat, false, 80));
    const apps = {}, appX = { geyser: MX + 1.3, heater: MX + 2.1, kettle: MX + 2.9, iron: MX + 3.6 };
    const mk = (k) => {
      const g = new THREE.Group(); g.position.set(appX[k], 0, 0.6); root.add(g);
      const on = M.plastic(0xf2f2f2, { emissive: new THREE.Color(0, 0, 0) });
      if (k === 'geyser') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 24), on); c.position.y = 0.75; g.add(c); }
      if (k === 'heater') { const b = box(0.55, 0.7, 0.2, on); b.position.y = 0.6; g.add(b); }
      if (k === 'kettle') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.4, 24), on); c.position.y = 0.45; g.add(c); }
      if (k === 'iron') { const b = box(0.4, 0.14, 0.2, on); b.position.y = 0.32; g.add(b); const h = box(0.28, 0.08, 0.08, M.plastic(0x2a2e37)); h.position.y = 0.46; g.add(h); }
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), M.glow(0xff7a59)); led.position.set(0, k === 'geyser' ? 1.3 : k === 'heater' ? 1.05 : k === 'kettle' ? 0.75 : 0.6, 0); g.add(led);
      apps[k] = { g, mat: on, led };
    };
    Object.keys(LOADS).forEach(mk);

    // ---------------- a person touching a faulty washing machine
    const BX = 3.6;
    const skinMat = M.matte(0xa7adb8, { transparent: true, opacity: 0.55, depthWrite: false }), glowMat = M.ghost(0xffd24a, 0, { toneMapped: false, depthTest: false });
    const cap = (r, len, pos, rotZ = 0) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), skinMat); m.position.set(...pos); m.rotation.z = rotZ; m.castShadow = true; root.add(m); return m; };
    cap(0.24, 0.55, [BX, 1.3, 0]);                                  // torso
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), skinMat); head.position.set(BX, 1.95, 0); root.add(head);
    cap(0.09, 0.7, [BX - 0.12, 0.5, 0]); cap(0.09, 0.7, [BX + 0.12, 0.5, 0]);          // legs
    cap(0.07, 0.55, [BX - 0.33, 1.3, 0], -0.12);                     // left arm, hanging
    cap(0.07, 0.72, [BX + 0.57, 1.335, 0], -2.28);                   // right arm, reaching down to the machine
    const machine = box(1.0, 1.1, 0.9, M.metal(0xdfe3ea, { metalness: 0.5, roughness: 0.4 })); machine.position.set(BX + 1.45, 0.55, 0); root.add(machine);
    const door = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 32), M.clear(0x9fc4ff, 0.5)); door.rotation.x = Math.PI / 2; door.position.set(BX + 1.45, 0.55, 0.46); root.add(door);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), M.glow(0xfff2a8)); spark.position.set(BX + 0.94, 1.02, 0); root.add(spark);
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.7, 40), M.clear(0x4f9dff, 0.45)); puddle.rotation.x = -Math.PI / 2; puddle.position.set(BX, 0.012, 0); root.add(puddle);
    const pathPts = [[BX + 0.93, 1.03, 0], [BX + 0.57, 1.34, 0], [BX + 0.24, 1.6, 0], [BX + 0.06, 1.3, 0], [BX + 0.1, 0.95, 0], [BX + 0.12, 0.5, 0], [BX + 0.12, 0.05, 0]];
    const pathGlow = tube(pathPts, 0.05, glowMat, false, 60); pathGlow.renderOrder = 5; root.add(pathGlow);
    const rccbBox = box(0.36, 0.55, 0.3, M.plastic(0xf2f2f2)); rccbBox.position.set(BX + 2.3, 1.55, -0.3); root.add(rccbBox);
    const rccbLever = box(0.12, 0.2, 0.1, M.plastic(0x2e6bd6)); rccbLever.position.set(BX + 2.3, 1.9, -0.25); root.add(rccbLever);

    const lM = stage.label('', [MX, MY + 1.35, 0.3], root, 'hot');
    const lStrip = stage.label('Bimetal strip', [MX - 0.75, MY - 0.2, 0.3], root);
    const lW = stage.label('', [MX + 2.2, 1.35, 0.6], root);
    const lB = stage.label('', [BX, 2.45, 0], root, 'hot');
    const lR = stage.label('RCCB', [BX + 2.3, 2.1, -0.3], root);

    let heat = 0, tripped = false, shortT = 0, bend = 0, wHeat = 0, focus = '', flash = 0;
    const api = {
      short: () => { shortT = 0.6; tripped = true; flash = 1; },
      reset: () => { tripped = false; heat = 0; shortT = 0; },
      warm: (k) => { heat = k; },
    };
    const body = (s) => { const R = SKIN[s.skin] + INSIDE, mA = (MAINS / R) * 1000, cut = s.rccb && mA >= 30; return { R, mA, cut }; };
    const circuit = (s) => { const W = loadW(s), I = tripped ? 0 : W / MAINS; return { W, I, perM: I * I * WIRE_PER_M / 2 }; };
    return {
      ...api,
      update(dt, s, time) {
        dt = Math.max(0, dt);
        fitNarrow(stage, [lStrip, lW, lR]);
        if (s.focus !== focus) { focus = s.focus; const v = VIEWS[focus] || VIEWS.mcb; stage.setView(v.pos, v.target, 1.1); }
        const c = circuit(s), r = c.I / IN;
        heat = clamp(heat + ((r * r - 1.13 * 1.13) / TAU) * dt * LAPSE, 0, 1);
        if (heat >= 1 && !tripped) tripped = true;
        bend = approach(bend, heat * 0.28 + (tripped ? 0.05 : 0), 6, dt);
        stripPivot.rotation.z = -bend;
        leverPivot.rotation.x = approach(leverPivot.rotation.x, tripped ? 1.0 : -0.3, 10, dt);
        shortT = Math.max(0, shortT - dt); flash = Math.max(0, flash - dt * 2);
        coilMat.emissive.setRGB(flash * 1.2, flash * 0.9, flash * 0.3);
        wHeat = approach(wHeat, clamp((c.perM - 1.5) / 5, 0, 1), 1.5, dt);
        wireMat.emissive.setRGB(wHeat * 0.9 + flash, wHeat * 0.25 + flash * 0.6, flash * 0.2);
        for (const [k, a] of Object.entries(apps)) { const on = s[k] && !tripped; a.mat.emissive.setRGB(on ? 0.35 : 0, on ? 0.12 : 0, 0); a.led.visible = on; }
        lM.element.innerHTML = tripped ? '<b>MCB tripped</b>: power off' : `16 A MCB · <b>${c.I.toFixed(1)} A</b>`;
        lW.element.innerHTML = `2.5 mm² wire: <b>${c.perM.toFixed(1)} W</b> per metre`;

        const b = body(s);
        const live = !b.cut;
        const k = live ? clamp(Math.log10(b.mA) / 2.3, 0.05, 1) : 0;
        glowMat.opacity = k * (0.55 + 0.35 * Math.sin(time * 25));
        spark.visible = live && Math.sin(time * 31) > -0.2; spark.scale.setScalar(0.6 + k);
        puddle.visible = s.skin === 'wet';
        rccbBox.visible = rccbLever.visible = s.rccb; lR.visible = s.rccb;
        rccbLever.position.y = 1.55 + (b.cut ? 0.2 : 0.35);
        lB.element.innerHTML = b.cut ? 'RCCB tripped: <b>safe</b>' : `<b>${b.mA < 10 ? b.mA.toFixed(1) : Math.round(b.mA)} mA</b> through the body`;
      },
      readout: (s) => {
        if (s.focus === 'body') {
          const b = body(s), [cls, say] = b.cut ? ['ok', 'RCCB cut the power'] : effect(b.mA);
          return `<div class="big ${cls}">${say}</div>
            <div class="row"><span>Skin + inside of body</span><b>${SKIN[s.skin].toLocaleString('en-US')} + 500 Ω</b></div>
            <div class="row"><span>Current, I = 230 V ÷ R</span><b>${b.mA < 10 ? b.mA.toFixed(1) : Math.round(b.mA)} mA</b></div>
            <small>${b.cut ? 'It sensed more than 30 mA leaking and switched off within about 40 ms.' : s.rccb ? 'Under 30 mA, so the RCCB does not need to trip.' : 'No RCCB: the current keeps flowing until you let go, if you can.'}</small>`;
        }
        const c = circuit(s), W = loadW(s), r = W / MAINS / IN, tt = r * r > 1.28 ? TAU / (r * r - 1.28) : Infinity;
        const cls = tripped ? 'no' : r > 1.13 ? 'no' : 'ok';
        const I = W / MAINS;
        return `<div class="big ${cls}">${tripped ? (shortT > 0 || I <= IN * 1.13 ? 'Tripped: power off' : 'Tripped: overload') : r > 1.13 ? 'Overload! Strip is bending' : 'Within the MCB’s 16 A'}</div>
          <div class="row"><span>Switched on</span><b>${(W / 1000).toFixed(1)} kW</b></div>
          <div class="row"><span>Current, I = P ÷ V</span><b>${I.toFixed(1)} A</b></div>
          <div class="row"><span>Heat in the wire, I²R</span><b>${(I * I * WIRE_PER_M / 2).toFixed(1)} W/m</b></div>
          <small>${tripped ? 'Switch something off, then reset the MCB.' : isFinite(tt) ? `At ${r.toFixed(2)}× its rating this MCB trips in about ${Math.round(tt)} s (shown 10× faster).` : 'Below 1.13× its rating an MCB never trips.'}</small>`;
      },
    };
  },
};
