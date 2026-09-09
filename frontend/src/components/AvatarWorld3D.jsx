import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";

// Mondo 3D immersivo (Vanilla three.js) che si assembla dietro l'avatar del trio.
// theme: "miki" (Ufficio Tecnico/Ricette) | "mikemix" (Produzione Calda) | "bigmix" (Assistente vocale)
// speaking: per Mike Mix -> onde sonore/particelle piu intense quando parla.
export default function AvatarWorld3D({ theme = "miki", accent = "#FF6B00", speaking = false }) {
  const mountRef = useRef(null);
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = () => mount.clientWidth || 400;
    const H = () => mount.clientHeight || 240;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060910, 0.055);
    const camera = new THREE.PerspectiveCamera(46, W() / H(), 0.1, 100);
    camera.position.set(0, 1.4, 9);
    camera.lookAt(0, 1.1, 0);

    // Renderer WebGPU con fallback automatico a WebGL2 (forceWebGL) — 120fps dove supportato.
    const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true, forceWebGL: !(typeof navigator !== "undefined" && navigator.gpu) });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(W(), H());

    const acc = new THREE.Color(accent);
    scene.add(new THREE.AmbientLight(0x8899aa, 0.5));
    const key = new THREE.PointLight(acc, 1.1, 40); key.position.set(3, 6, 6); scene.add(key);
    const rim = new THREE.PointLight(0xFF6B00, 0.7, 40); rim.position.set(-6, 3, -3); scene.add(rim);

    // Griglia olografica a pavimento
    const grid = new THREE.GridHelper(30, 30, acc, 0x123);
    grid.material.transparent = true; grid.material.opacity = 0.18; grid.position.y = -0.02; scene.add(grid);

    const world = new THREE.Group(); scene.add(world);
    const assembling = []; // {mesh, delay, dur, fromY}

    const reg = (mesh, delay = 0, dur = 0.7, fromY = -2) => {
      mesh.userData.baseY = mesh.position.y;
      mesh.userData.baseScale = mesh.scale.x || 1;
      assembling.push({ mesh, delay, dur, fromY });
      return mesh;
    };
    const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, metalness: opts.m ?? 0.5, roughness: opts.r ?? 0.45, emissive: opts.e ?? 0x000000, emissiveIntensity: opts.ei ?? 0, transparent: opts.t ?? false, opacity: opts.o ?? 1 });
    const holoMat = (color, o = 0.32) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o, side: THREE.DoubleSide });

    let animatedExtras = [];

    if (theme === "panificio" || theme === "mikemix") {
      // PANIFICIO: forni a deck con calore + silos farina + impastatrice a spirale + scaffale pane
      for (let i = 0; i < 2; i++) {
        const oven = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 1.7), mat(0x2b3440, { m: 0.85, r: 0.35 }));
        oven.add(body);
        const doorMat = mat(0xff7a1a, { e: 0xff5a00, ei: 1.4, m: 0.3, r: 0.2 });
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.12), doorMat);
        door.position.set(0, 0.2, 0.88); oven.add(door);
        const door2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.12), doorMat.clone());
        door2.position.set(0, -0.85, 0.88); oven.add(door2);
        oven.position.set(i === 0 ? -3.4 : 3.4, 1.3, -1.6);
        world.add(oven); reg(oven, i * 0.12, 0.7);
        animatedExtras.push({ type: "heat", door, door2 });
      }
      // Silos farina
      for (let i = 0; i < 2; i++) {
        const silo = new THREE.Group();
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.1, 20), mat(0x9aa7b4, { m: 0.9, r: 0.25 })); silo.add(tube);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 20), mat(0x8792a0, { m: 0.9 })); cone.position.y = -1.4; cone.rotation.x = Math.PI; silo.add(cone);
        silo.position.set(i === 0 ? -1.3 : 1.3, 1.35, -3.2); world.add(silo); reg(silo, 0.2 + i * 0.1, 0.7);
      }
      // Impastatrice a spirale
      const mixer = new THREE.Group();
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.65, 1.0, 24, 1, true), mat(0x9aa7b4, { m: 0.9, r: 0.25 })); bowl.material.side = THREE.DoubleSide;
      mixer.add(bowl);
      const spiral = new THREE.Mesh(new THREE.TorusKnotGeometry(0.3, 0.08, 60, 8), mat(0xd0d8e0, { m: 0.95, r: 0.2 }));
      spiral.position.y = 0.1; mixer.add(spiral);
      mixer.position.set(0, 0.9, 1.3); world.add(mixer); reg(mixer, 0.3, 0.7);
      animatedExtras.push({ type: "spin", obj: spiral });
      // Scaffale pane
      const rack = new THREE.Group();
      for (let s = 0; s < 3; s++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.7), mat(0x8792a0, { m: 0.9, r: 0.3 }));
        shelf.position.y = s * 0.5; rack.add(shelf);
        for (let b = 0; b < 3; b++) {
          const bread = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat(0xC98A3C, { r: 0.8, m: 0.1 }));
          bread.scale.set(1.5, 0.8, 1); bread.position.set(-0.7 + b * 0.7, s * 0.5 + 0.16, 0); rack.add(bread);
        }
      }
      rack.position.set(0, 0.5, -2.4); world.add(rack); reg(rack, 0.42, 0.8);
    } else if (theme === "pasticceria") {
      // PASTICCERIA: planetaria (frusta rotante) + carrello teglie di dolci + piano di marmo
      const plan = new THREE.Group();
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), mat(0xcfd8e0, { m: 0.9, r: 0.2 })); col.position.y = 0.4; plan.add(col);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.6), mat(0xdfe6ee, { m: 0.9 })); head.position.set(0.35, 1.35, 0); plan.add(head);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.7, 24, 1, true), mat(0xb7c2cd, { m: 0.95, r: 0.2 })); bowl.material.side = THREE.DoubleSide; bowl.position.set(0.5, 0.55, 0); plan.add(bowl);
      const whisk = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.6), new THREE.MeshStandardMaterial({ color: 0xeef3f8, metalness: 0.95, roughness: 0.15, wireframe: true })); whisk.position.set(0.5, 0.75, 0); plan.add(whisk);
      plan.position.set(-2.7, 0, 0.5); world.add(plan); reg(plan, 0.1, 0.7); animatedExtras.push({ type: "spin", obj: whisk, sp: 1.5 });
      // Carrello teglie con dolci (ambra / corallo / menta — no viola)
      const rack = new THREE.Group();
      const cols = [0xF0C24A, 0xE86A5C, 0x7FD8C0];
      for (let s = 0; s < 4; s++) {
        const tray = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.9), mat(0xaeb8c2, { m: 0.9 })); tray.position.y = s * 0.5; rack.add(tray);
        for (let c = 0; c < 3; c++) { const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.15, 16), mat(cols[c], { r: 0.5, m: 0.1, e: cols[c], ei: 0.2 })); cake.position.set(-0.55 + c * 0.55, s * 0.5 + 0.11, 0); rack.add(cake); }
      }
      rack.position.set(1.9, 0.4, -1.8); world.add(rack); reg(rack, 0.3, 0.8);
      const marble = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.2), mat(0xe8ecf0, { m: 0.2, r: 0.1 })); marble.position.set(-0.4, 0.95, 1.5); world.add(marble); reg(marble, 0.45, 0.7);
    } else if (theme === "pizzeria") {
      // PIZZERIA: forno a cupola con fiamma + banco pizzaiolo con palline + pala rotante
      const dome = new THREE.Group();
      const cupola = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x2b3440, { m: 0.6, r: 0.5 })); dome.add(cupola);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.5, 24), mat(0x3a4652, { m: 0.7 })); base.position.y = -0.25; dome.add(base);
      const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color: 0xff6a1a })); mouth.position.set(0, 0.3, 1.45); dome.add(mouth);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), mat(0xff8a2a, { e: 0xff5a00, ei: 1.6, m: 0.1, r: 0.3, t: true, o: 0.85 })); flame.position.set(0, 0.3, 1.25); dome.add(flame);
      dome.position.set(-2.4, 1.1, -1.2); world.add(dome); reg(dome, 0.1, 0.8); animatedExtras.push({ type: "flame", obj: flame });
      const bench = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(3, 0.14, 1.2), mat(0xb7c2cd, { m: 0.85, r: 0.25 })); top.position.y = 1; bench.add(top);
      for (let i = 0; i < 5; i++) { const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0xEfe6d2, { r: 0.9, m: 0.02 })); ball.scale.y = 0.7; ball.position.set(-1 + i * 0.5, 1.16, (i % 2 ? 0.25 : -0.15)); bench.add(ball); }
      bench.position.set(1.7, 0, 0.6); world.add(bench); reg(bench, 0.3, 0.7);
      const peel = new THREE.Group();
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2), mat(0x8792a0, { m: 0.8 })); handle.rotation.z = Math.PI / 2; peel.add(handle);
      const plate = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), mat(0xd0d8e0, { m: 0.9, r: 0.2 })); plate.position.x = 1.15; plate.rotation.y = Math.PI / 2; peel.add(plate);
      peel.position.set(1.4, 1.7, -0.6); world.add(peel); reg(peel, 0.5, 0.7); animatedExtras.push({ type: "spin", obj: peel, sp: 0.3 });
    } else if (theme === "laugen") {
      // LAUGEN: vasca soda/lisciva (liquido) + griglie di essiccazione + brezel
      const tank = new THREE.Group();
      const walls = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 1.6), mat(0x9aa7b4, { m: 0.95, r: 0.15 })); tank.add(walls);
      const liquid = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshBasicMaterial({ color: 0xFF6B00, transparent: true, opacity: 0.35 })); liquid.rotation.x = -Math.PI / 2; liquid.position.y = 0.36; tank.add(liquid);
      tank.position.set(-2.4, 0.6, 0.4); world.add(tank); reg(tank, 0.1, 0.7); animatedExtras.push({ type: "shimmer", obj: liquid });
      const grid = new THREE.Group();
      for (let s = 0; s < 3; s++) {
        const g = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 1), new THREE.MeshStandardMaterial({ color: 0x8792a0, metalness: 0.9, roughness: 0.3, wireframe: true })); g.position.y = s * 0.55; grid.add(g);
        for (let b = 0; b < 3; b++) { const pretzel = new THREE.Mesh(new THREE.TorusKnotGeometry(0.15, 0.055, 48, 6, 2, 3), mat(0xC98A3C, { r: 0.7, m: 0.1 })); pretzel.position.set(-0.7 + b * 0.7, s * 0.55 + 0.12, 0); pretzel.rotation.x = Math.PI / 2; grid.add(pretzel); }
      }
      grid.position.set(1.7, 0.4, -1.6); world.add(grid); reg(grid, 0.3, 0.8);
    } else if (theme === "banco") {
      // BANCO E PREZZI: bilancia prezzatrice + vetrina refrigerata + etichettatrice
      const scale = new THREE.Group();
      const platf = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.8), mat(0xcfd8e0, { m: 0.9, r: 0.2 })); platf.position.y = 0.6; scale.add(platf);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5), mat(0x8792a0)); post.position.set(0, 0.85, -0.3); scale.add(post);
      const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ color: 0xFF6B00, transparent: true, opacity: 0.6 })); disp.position.set(0, 1.05, -0.25); scale.add(disp);
      scale.position.set(-2.7, 0, 0.6); world.add(scale); reg(scale, 0.1, 0.7); animatedExtras.push({ type: "shimmer", obj: disp });
      const caseG = new THREE.Group();
      const geoBox = new THREE.BoxGeometry(3, 1.4, 1.2);
      const frame = new THREE.Mesh(geoBox, holoMat(0xFF6B00, 0.1)); caseG.add(frame);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geoBox), new THREE.LineBasicMaterial({ color: 0xFF6B00, transparent: true, opacity: 0.6 })); caseG.add(edges);
      const pc = [0xC98A3C, 0xEfe6d2, 0xE0A106, 0xC98A3C];
      for (let i = 0; i < 4; i++) { const prod = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.7), mat(pc[i], { r: 0.7 })); prod.position.set(-1 + i * 0.65, -0.4, 0); caseG.add(prod); }
      caseG.position.set(1.1, 0.9, -1); world.add(caseG); reg(caseG, 0.3, 0.8);
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 20), mat(0xdfe6ee, { m: 0.5, r: 0.4 })); roll.rotation.z = Math.PI / 2; roll.position.set(-2.7, 1.4, 0.6); world.add(roll); reg(roll, 0.45, 0.7); animatedExtras.push({ type: "spin", obj: roll, sp: 0.6 });
    } else if (theme === "bigmix") {
      // ASSISTENTE: onde sonore + particelle + moduli input vocale trasparenti
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), new THREE.MeshBasicMaterial({ color: 0x6EA8FE, wireframe: true, transparent: true, opacity: 0.5 }));
      core.position.set(0, 1.4, -0.5); world.add(core); reg(core, 0, 0.6, 0); animatedExtras.push({ type: "spin", obj: core, sp: 0.4 });
      const rings = [];
      for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2 + i * 0.5, 0.02, 8, 60), holoMat(0x6EA8FE, 0.5 - i * 0.08));
        ring.position.set(0, 1.4, -0.5); ring.rotation.x = Math.PI / 2.2; world.add(ring); reg(ring, 0.1 + i * 0.08, 0.6, 0);
        rings.push({ ring, base: 1.2 + i * 0.5, i });
      }
      animatedExtras.push({ type: "waves", rings });
      // Moduli input vocale trasparenti (pannelli futuristici)
      for (let i = 0; i < 3; i++) {
        const a = (i - 1) * 1.1;
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), holoMat(0xFF6B00, 0.16));
        panel.position.set(a * 2.2, 1.1 + (i === 1 ? 0.5 : 0), -2); panel.rotation.y = -a * 0.3;
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(panel.geometry), new THREE.LineBasicMaterial({ color: 0xFF6B00, transparent: true, opacity: 0.6 }));
        panel.add(edge); world.add(panel); reg(panel, 0.3 + i * 0.1, 0.7);
        animatedExtras.push({ type: "float", obj: panel, ph: i });
      }
      // Particelle luminose
      const pts = new THREE.BufferGeometry();
      const N = 140, arr = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { arr[i * 3] = (Math.random() - 0.5) * 12; arr[i * 3 + 1] = Math.random() * 5; arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1; }
      pts.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      const particles = new THREE.Points(pts, new THREE.PointsMaterial({ color: 0x9fd8ff, size: 0.06, transparent: true, opacity: 0.8 }));
      world.add(particles); animatedExtras.push({ type: "particles", obj: particles, arr, N });
    } else {
      // MIKI: UFFICIO TECNICO / LAB RICETTE — sacchi di farina, tavolo da disegno, spighe, schermi olografici
      for (let i = 0; i < 4; i++) {
        const sack = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.7, 4, 12), mat(0xEfe6d2, { r: 0.9, m: 0.02 }));
        sack.position.set(-4 + (i % 2) * 0.9, 0.7 + Math.floor(i / 2) * 1.0, -2.6 + (i % 2) * 0.3);
        sack.rotation.z = (Math.random() - 0.5) * 0.3; world.add(sack); reg(sack, i * 0.08, 0.6);
      }
      // Tavolo da disegno inclinato
      const table = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.6), mat(0x33404e, { m: 0.6, r: 0.4 }));
      top.rotation.x = -0.35; top.position.y = 1.1; table.add(top);
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshBasicMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.9 }));
      sheet.rotation.x = -Math.PI / 2 + 0.35; sheet.position.set(0, 1.2, 0.05); table.add(sheet);
      for (let l = 0; l < 4; l++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1), mat(0x2a3340, { m: 0.7 })); leg.position.set(l < 2 ? -1.1 : 1.1, 0.55, l % 2 ? -0.6 : 0.6); table.add(leg); }
      table.position.set(0, 0, 0.8); world.add(table); reg(table, 0.3, 0.7);
      // Spighe di grano stilizzate
      for (let i = 0; i < 3; i++) {
        const wheat = new THREE.Group();
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4), mat(0xE0A106, { r: 0.7, m: 0.1 })); stem.position.y = 0.7; wheat.add(stem);
        for (let g = 0; g < 6; g++) { const grain = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0xF0C24A, { r: 0.6, m: 0.15 })); grain.scale.set(1, 1.8, 1); grain.position.set((g % 2 ? 0.09 : -0.09), 0.9 + g * 0.09, 0); wheat.add(grain); }
        wheat.position.set(3 + i * 0.5, 0, -2 + i * 0.4); wheat.rotation.z = (i - 1) * 0.12; world.add(wheat); reg(wheat, 0.2 + i * 0.1, 0.7);
        animatedExtras.push({ type: "sway", obj: wheat, ph: i });
      }
      // Schermi olografici dati
      for (let i = 0; i < 2; i++) {
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), holoMat(0xFF6B00, 0.18));
        scr.position.set(i === 0 ? -2.6 : 2.6, 2.4, -2.4); scr.rotation.y = i === 0 ? 0.4 : -0.4;
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(scr.geometry), new THREE.LineBasicMaterial({ color: 0xFF6B00, transparent: true, opacity: 0.7 }));
        scr.add(edge);
        for (let b = 0; b < 4; b++) { const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.3 + Math.random() * 0.5), holoMat(0xFF6B00, 0.5)); bar.position.set(-0.5 + b * 0.3, -0.1, 0.01); scr.add(bar); }
        world.add(scr); reg(scr, 0.4 + i * 0.12, 0.7); animatedExtras.push({ type: "float", obj: scr, ph: i });
      }
    }

    const clock = new THREE.Clock();
    let raf = 0; let mounted = true;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = () => {
      if (!mounted) return;
      const el = clock.getElapsedTime();      // Assemblaggio olografico
      for (const a of assembling) {
        const p = Math.max(0, Math.min(1, (el - a.delay) / a.dur));
        const e = easeOut(p);
        a.mesh.scale.setScalar(Math.max(0.0001, e * a.mesh.userData.baseScale));
        a.mesh.position.y = a.mesh.userData.baseY + (1 - e) * a.fromY;
        if (a.mesh.material && a.mesh.material.transparent) a.mesh.material.opacity = (a.mesh.material.userData?.o0 ?? a.mesh.material.opacity);
      }
      world.rotation.y = Math.sin(el * 0.12) * 0.18;
      // Animazioni tematiche
      for (const x of animatedExtras) {
        if (x.type === "spin") x.obj.rotation.y += (x.sp || 0.9) * 0.016, x.obj.rotation.x += 0.004;
        else if (x.type === "heat") { const pulse = 1 + Math.sin(el * 4) * 0.25; x.door.material.emissiveIntensity = 1.1 * pulse; x.door2.material.emissiveIntensity = 1.1 * pulse; }
        else if (x.type === "sway") x.obj.rotation.z = (x.ph - 1) * 0.12 + Math.sin(el * 1.5 + x.ph) * 0.06;
        else if (x.type === "float") x.obj.position.y = (x.obj.userData.baseY || x.obj.position.y) + Math.sin(el * 1.2 + x.ph) * 0.08;
        else if (x.type === "particles") { for (let i = 0; i < x.N; i++) { x.arr[i * 3 + 1] += 0.008 * (speakingRef.current ? 2.4 : 1); if (x.arr[i * 3 + 1] > 5) x.arr[i * 3 + 1] = 0; } x.obj.geometry.attributes.position.needsUpdate = true; x.obj.material.opacity = speakingRef.current ? 1 : 0.7; }
        else if (x.type === "waves") { const amp = speakingRef.current ? 0.5 : 0.15; x.rings.forEach((r) => { const s = 1 + Math.sin(el * 3 - r.i * 0.8) * amp; r.ring.scale.set(s, s, s); r.ring.material.opacity = (speakingRef.current ? 0.7 : 0.4) - r.i * 0.07; }); }
        else if (x.type === "flame") { const p = 1 + Math.sin(el * 6) * 0.28; x.obj.scale.set(p, p * 1.15, p); x.obj.material.emissiveIntensity = 1.4 + Math.sin(el * 8) * 0.5; }
        else if (x.type === "shimmer") { x.obj.material.opacity = 0.32 + Math.sin(el * 2.2) * 0.14; }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    // WebGPU richiede init() async prima del primo render; poi si aggancia il canvas e parte il loop.
    renderer.init().catch(() => { /* forceWebGL fallback gestito internamente */ }).finally(() => {
      if (!mounted) { try { renderer.dispose(); } catch { /* */ } return; }
      mount.appendChild(renderer.domElement);
      raf = requestAnimationFrame(animate);
    });

    const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize); ro.observe(mount);

    return () => {
      mounted = false; cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize); ro.disconnect();
      try { renderer.dispose(); } catch { /* */ }
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose?.()); } });
      if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [theme, accent]);

  return <div ref={mountRef} data-testid={`avatar-world-${theme}`} className="absolute inset-0" style={{ zIndex: 0 }} />;
}
