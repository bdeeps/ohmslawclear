// Chapter 2: resistance turns electricity into heat, P = V²/R = I²R.
// Heater: an element rated P at 230 V has R = 230² / P (1,500 W → 35 Ω). On a low-voltage day
// the same R gives P = V²/R, so 200 V gives only 76% of the heat.
// Cord: 2 × 1.5 m of 0.75 mm² copper (a common appliance flex size) = 0.069 Ω.
// Fan regulator: an ordinary 75 W ceiling fan is treated here as a fixed 705 Ω load (230²/75),
// a simplification that ignores the motor's inductance. An old resistive regulator puts a
// resistor in series and burns I²R in it; a capacitor ("electronic") regulator drops the
// voltage with reactance and wastes only about a watt.
import { THREE, M, box, rod, spring, tube, clamp, approach } from '../kit.js';
import { MAINS, copperR, heatHaze, glowRGB, fmtR, fitNarrow } from '../ohm.js';

const APPS = {
  toaster: { label: 'Toaster', P: 800 },
  iron: { label: 'Iron', P: 1000 },
  fryer: { label: 'Air fryer', P: 1500 },
  geyser: { label: 'Geyser', P: 2000 },
};
const CORD = copperR(3, 0.75);                  // both conductors of a 1.5 m flex
const FAN_Z = (MAINS * MAINS) / 75;             // ≈ 705 Ω
const STEP_V = [0, 110, 140, 170, 200, 230];    // fan voltage at each regulator step (at 230 V mains)
const T_RATED = 1100;                           // an exposed element glows orange at about 1,100 K

function heater(s) {
  const a = APPS[s.app] || APPS.fryer, R = (MAINS * MAINS) / a.P, I = s.mains / (R + CORD);
  return { a, R, I, P: I * I * R, cordP: I * I * CORD };
}
function fanReg(s) {
  const Vf = STEP_V[s.step] * (s.mains / MAINS), I = Vf / FAN_Z, Pfan = Vf * I;
  const Rs = s.step === 5 ? 0 : FAN_Z * (MAINS / STEP_V[s.step] - 1);
  const waste = s.reg === 'resistor' ? I * I * Rs : s.step === 5 ? 0 : 1;
  return { Vf, I, Pfan, Rs, waste, total: Pfan + waste };
}
const VIEWS = {
  heater: { pos: [-1.7, 3.5, 5.6], target: [-2.6, 1.45, 0] },
  fan: { pos: [5.9, 2.4, 7.0], target: [5.6, 2.55, -0.3] },
};

export default {
  id: 'heat',
  short: 'Heat on purpose',
  title: 'Resistance makes heat',
  subtitle: 'Heaters are resistors on purpose. Old fan regulators were resistors by accident.',
  view: VIEWS.heater,
  learn: `<p>Push current through a resistance and it gets warm: <b>P = I² × R</b>. Put V = I × R into it and you get another handy form, <b>P = V² ÷ R</b>. A toaster, an iron, a geyser and the element in an <b>air fryer</b> are all just carefully chosen resistances.</p>
    <p>Work it backwards. A 1,500 W air fryer on 230 V needs R = 230² ÷ 1,500, about <b>35 Ω</b>. A 2,000 W geyser needs about 26 Ω. Less resistance means <b>more</b> heat here, because the voltage is fixed and more current flows.</p>
    <p>Why does the element glow while the cord stays cool? The <b>same current</b> flows through both, so the heat splits in proportion to resistance. The copper cord has about 0.07 Ω; the element has 500 times more, so it gets 500 times the heat.</p>
    <p>Old <b>fan regulators</b> slowed a fan by adding a resistor in series. The fan got less voltage, but the resistor burned the difference as heat, which is why those regulators ran hot. Modern capacitor or electronic regulators drop the voltage almost without waste. See FanClear.</p>
    <p class="tip"><b>Try it:</b> slide the mains down to 190 V, as on a bad-voltage evening, and watch the heat fall. Then look at the fan on step 1 with each kind of regulator.</p>`,
  terms: [
    { t: 'Heating element', d: 'A resistance wire, often nichrome, chosen so the right current flows to make the heat you want.' },
    { t: 'Nichrome', d: 'A nickel–chromium alloy with about 60 times copper’s resistivity that does not rust when red hot.' },
    { t: 'P = V² ÷ R', d: 'Power from voltage and resistance. At a fixed voltage, smaller R means more heat.' },
    { t: 'Series', d: 'Parts joined one after another, so the same current flows through each.' },
    { t: 'Regulator', d: 'The wall control that sets a fan’s speed by lowering the voltage the motor gets.' },
  ],
  defaults: { focus: 'heater', app: 'fryer', mains: 230, step: 1, reg: 'resistor' },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'heater', label: 'Heater' }, { v: 'fan', label: 'Fan regulator' }] },
    { key: 'app', type: 'seg', label: 'Appliance', options: Object.entries(APPS).map(([v, a]) => ({ v, label: a.label })), fmt: (v) => APPS[v].P.toLocaleString('en-IN') + ' W at 230 V' },
    { key: 'mains', type: 'range', label: 'Mains voltage', min: 180, max: 250, step: 1, ends: ['180 V', '250 V'], fmt: (v) => Math.round(v) + ' V', hint: 'Indian mains is 230 V, but it sags on busy evenings.' },
    { key: 'step', type: 'seg', label: 'Fan regulator step', options: [1, 2, 3, 4, 5].map((v) => ({ v, label: String(v) })) },
    { key: 'reg', type: 'seg', label: 'Regulator type', options: [{ v: 'resistor', label: 'Old resistor' }, { v: 'electronic', label: 'Electronic' }] },
  ],
  quiz: [
    { q: 'A 2,000 W geyser runs on 230 V. Roughly what is its element’s resistance?', options: ['2.6 Ω', '26 Ω', '260 Ω', '2,600 Ω'], answer: 1, why: 'R = V² ÷ P = 230 × 230 ÷ 2,000 ≈ 26 Ω.' },
    { q: 'Why does a heater’s element glow while its cord stays cool?', options: ['The cord carries less current', 'The same current flows in both, but the element has hundreds of times more resistance, so it gets that much more heat', 'Copper cannot get hot', 'The plug absorbs the heat'], answer: 1, why: 'In series the current is shared, and heat = I²R, so the bigger R takes almost all of it.' },
    { q: 'An old resistive fan regulator on step 1 feels warm. Why?', options: ['It is broken', 'Its resistor drops part of the voltage and turns that energy into heat', 'The fan sends heat back', 'Regulators contain heaters'], answer: 1, why: 'The current through the resistor times the voltage across it is wasted as heat, sometimes as much as the fan itself uses.' },
  ],
  reel: [
    { ms: 5200, caption: 'A heater is just a resistance: a 1,500 W air fryer element is about 35 ohms.', set: { focus: 'heater', app: 'fryer' }, anim: { mains: [180, 240] }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);

    // ---------------- the heater: an exposed coiled element on a ceramic frame
    const HX = -2.4, HY = 1.15;
    const stand = box(3.0, 0.9, 1.7, M.matte(0x2a2e37)); stand.position.set(HX, 0.45, 0); root.add(stand);
    const plate = box(2.9, 0.06, 1.6, M.matte(0xe9e1cf, { roughness: 0.8 })); plate.position.set(HX, 0.93, 0); root.add(plate);
    const elMat = new THREE.MeshStandardMaterial({ color: 0x3a3634, roughness: 0.5, metalness: 0.3, emissive: new THREE.Color(0, 0, 0) });
    const rows = [-0.5, -0.17, 0.17, 0.5];
    rows.forEach((z, i) => { const c = spring(HX - 1.2, HX + 1.2, 0.07, 0.018, 30, elMat); c.position.set(0, HY, z); root.add(c); });
    for (let i = 0; i < 3; i++) { const x = i % 2 ? HX - 1.2 : HX + 1.2; const l = rod(-0.165, 0.165, 0.018, 0.018, elMat); l.rotation.y = Math.PI / 2; l.position.set(x, HY, (rows[i] + rows[i + 1]) / 2); root.add(l); }
    for (const x of [HX - 1.3, HX, HX + 1.3]) { const p = box(0.08, 0.26, 1.3, M.matte(0xf2ecdf)); p.position.set(x, HY - 0.1, 0); root.add(p); }
    const haze = heatHaze(7, 2.4, 1.1); haze.position.set(HX, HY + 0.2, 0); root.add(haze);
    // Socket and cord (brown live, blue neutral).
    const socket = box(0.7, 0.7, 0.14, M.plastic(0xf2f2f2)); socket.position.set(HX - 2.4, 1.0, -0.6); root.add(socket);
    const plug = box(0.34, 0.4, 0.3, M.plastic(0x1f232b)); plug.position.set(HX - 2.4, 1.0, -0.38); root.add(plug);
    const cordMat = [M.plastic(0x7a4a2a), M.plastic(0x2e6bd6)];
    [0.07, -0.07].forEach((dz, i) => root.add(tube([[HX - 2.4, 1.0 + dz, -0.25], [HX - 2.2, 0.5, 0.2], [HX - 1.8, 0.95, 0.6 + dz], [HX - 1.25, HY, rows[i ? 0 : 3] * 0.9]], 0.035, cordMat[i], false, 60)));

    // ---------------- the fan and its regulator
    const FX = 6.9, CEIL = 3.9;
    const ceil = box(5.6, 0.06, 3.2, M.clear(0xcfe0ff, 0.07)); ceil.position.set(FX - 1.1, CEIL + 0.03, -0.1); ceil.castShadow = false; root.add(ceil);
    const wall = box(1.6, 2.4, 0.06, M.matte(0x5a6070)); wall.position.set(FX - 2.7, 1.8, -1.74); root.add(wall);
    const fan = new THREE.Group(); fan.position.set(FX, CEIL, 0); root.add(fan);
    const down = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 12), M.metal(0xc9ced8)); down.position.y = -0.3; fan.add(down);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.24, 32), M.plastic(0x8a6a4a)); motor.position.y = -0.7; fan.add(motor);
    const rotor = new THREE.Group(); rotor.position.y = -0.76; fan.add(rotor);
    for (let i = 0; i < 3; i++) { const h = new THREE.Group(); h.rotation.y = (i / 3) * Math.PI * 2; const b = box(1.25, 0.02, 0.24, M.plastic(0xe8d7b8)); b.position.x = 0.9; b.rotation.x = 0.2; h.add(b); rotor.add(h); }
    // Regulator on the wall: a box with a clear face, holding either a resistor coil or capacitors.
    const RX = FX - 2.7, RY = 1.8, RZ = -1.55;
    const regBox = box(0.9, 1.2, 0.3, M.plastic(0xf4f4f4, { transparent: true, opacity: 0.35 })); regBox.position.set(RX, RY, RZ); root.add(regBox);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 24), M.plastic(0x2a2e37)); knob.rotation.x = Math.PI / 2; knob.position.set(RX, RY + 0.36, RZ + 0.2); root.add(knob);
    const pointer = box(0.03, 0.12, 0.02, M.plastic(0xffb547)); pointer.position.set(0, 0.06, 0.07); knob.add(pointer); pointer.rotation.x = -Math.PI / 2; pointer.position.set(0, 0.07, 0.07);
    const rMat = M.metal(0xb87333, { roughness: 0.35, emissive: new THREE.Color(0, 0, 0) });
    const resGroup = new THREE.Group(); root.add(resGroup);
    const former = rod(-0.3, 0.3, 0.1, 0.1, M.matte(0xe9e1cf)); resGroup.add(former);
    const rcoil = spring(-0.27, 0.27, 0.115, 0.012, 16, rMat); resGroup.add(rcoil);
    resGroup.position.set(RX, RY - 0.22, RZ + 0.05);
    const capGroup = new THREE.Group(); root.add(capGroup);
    for (const dx of [-0.18, 0.18]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.42, 24), M.plastic(0x2e6bd6)); c.position.set(dx, 0, 0); capGroup.add(c); }
    const pcb = box(0.7, 0.04, 0.24, M.matte(0x1f7a4a)); pcb.position.y = -0.23; capGroup.add(pcb);
    capGroup.position.set(RX, RY - 0.18, RZ + 0.05);
    const regHaze = heatHaze(3, 0.6, 0.9); regHaze.position.set(RX, RY + 0.62, RZ + 0.2); root.add(regHaze);
    root.add(tube([[RX, RY + 0.6, RZ + 0.02], [RX, CEIL - 0.05, RZ + 0.02], [FX + 0.1, CEIL - 0.05, -0.2], [FX, CEIL - 0.1, 0]], 0.025, M.plastic(0xf2f2f2), false, 40));

    const lEl = stage.label('', [HX, HY + 0.9, 0.4], root, 'hot');
    const lCord = stage.label('', [HX - 1.9, 0.35, 0.7], root);
    const lFan = stage.label('', [FX, CEIL - 1.25, 0.6], root);
    const lReg = stage.label('', [RX, RY - 0.95, RZ + 0.3], root, 'hot');

    let T = T_RATED, spin = 0, rpm = 0, regGlow = 0, focus = '';
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        fitNarrow(stage, [lCord]);
        if (s.focus !== focus) { focus = s.focus; const v = VIEWS[focus] || VIEWS.heater; stage.setView(v.pos, v.target, 1.1); }
        const h = heater(s);
        const Tt = T_RATED * Math.pow(h.P / h.a.P, 0.25);          // radiated power ∝ T⁴
        T = approach(T, Tt, 2.5, dt);
        const [r, g, b] = glowRGB(T); elMat.emissive.setRGB(r, g, b);
        haze.update(time, clamp((T - 700) / 400, 0, 1));
        lEl.element.innerHTML = `${h.a.label} element <b>${fmtR(h.R)}</b> · ${Math.round(h.P).toLocaleString('en-IN')} W`;
        lCord.element.innerHTML = `Cord <b>${fmtR(CORD)}</b> · ${h.cordP.toFixed(1)} W`;

        const f = fanReg(s);
        rpm = approach(rpm, 350 * Math.pow(f.Vf / MAINS, 1.6), 2, dt);   // visual only: speed rises steeply with voltage
        spin -= (rpm / 60) * Math.PI * 2 * 0.25 * dt; rotor.rotation.y = spin;
        const res = s.reg === 'resistor';
        resGroup.visible = res; capGroup.visible = !res;
        regGlow = approach(regGlow, res ? clamp(f.waste / 25, 0, 1) : 0, 2, dt);
        rMat.emissive.setRGB(regGlow * 0.9, regGlow * 0.22, 0);
        regHaze.update(time, regGlow);
        knob.rotation.z = -((s.step - 1) / 4) * 2.4 + 1.2;
        lFan.element.innerHTML = `Fan gets <b>${Math.round(f.Vf)} V</b> · ${f.Pfan.toFixed(0)} W`;
        lReg.element.innerHTML = res ? `Resistor <b>${Math.round(f.Rs)} Ω</b> wastes ${f.waste.toFixed(0)} W` : `Capacitor regulator wastes <b>about 1 W</b>`;
        if (s.step === 5) lReg.element.innerHTML = 'Step 5: straight through, nothing wasted';
      },
      readout: (s) => {
        if (s.focus === 'fan') {
          const f = fanReg(s), share = f.total ? (f.waste / f.total) * 100 : 0;
          return `<div class="big">Step ${s.step}: ${Math.round(f.total)} W from the wall</div>
            <div class="row"><span>Fan motor gets</span><b>${Math.round(f.Vf)} V · ${f.Pfan.toFixed(0)} W</b></div>
            <div class="row"><span>Current, I = V ÷ R</span><b>${f.I.toFixed(2)} A</b></div>
            <div class="row"><span>Wasted in the regulator, I²R</span><b class="${share > 20 ? 'no' : 'ok'}">${f.waste.toFixed(f.waste < 10 ? 1 : 0)} W (${share.toFixed(0)}%)</b></div>
            <small>Fan treated as a simple 705 Ω load (230² ÷ 75 W) to keep the sums honest but short.</small>`;
        }
        const h = heater(s);
        return `<div class="big">${Math.round(h.P).toLocaleString('en-IN')} W of heat</div>
          <div class="row"><span>Element, R = 230² ÷ ${h.a.P.toLocaleString('en-IN')}</span><b>${fmtR(h.R)}</b></div>
          <div class="row"><span>Current, I = V ÷ R</span><b>${h.I.toFixed(2)} A</b></div>
          <div class="row"><span>Heat, P = V² ÷ R</span><b>${Math.round((h.P / h.a.P) * 100)}% of rated</b></div>
          <div class="row"><span>Cord (1.5 m, 0.75 mm²)</span><b>${h.cordP.toFixed(1)} W</b></div>
          <small>Same current in both, so the element takes ${Math.round(h.R / CORD)} times the cord’s heat.</small>`;
      },
    };
  },
};
