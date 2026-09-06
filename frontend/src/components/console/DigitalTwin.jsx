import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useHeartbeat } from "@/context/PlantHeartbeatContext";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// FASE 2 — Gemello Digitale 3D del laboratorio. Reso con three.js VANILLA (imperativo):
// niente @react-three/fiber → compatibile con React 19 e con il Node del container.
// Ogni macchinario REAGISCE alla PROPRIA telemetria IoT (colore + pulsazione).
const STRESS_COL = { calmo: 0x7dd3fc, medio: 0xffb800, alto: 0xf43f5e };
const STRESS_HEX = { calmo: "#7DD3FC", medio: "#FFB800", alto: "#f43f5e" };
const MACHINES = [
  { id: "forno1", label: "Forno 1", pos: [-3, 0.7, -2], size: [1.6, 1.4, 1.6] },
  { id: "forno2", label: "Forno 2", pos: [-1, 0.7, -2], size: [1.6, 1.4, 1.6] },
  { id: "impasto", label: "Impastatrice", pos: [2, 0.55, -2], size: [1.2, 1.1, 1.2] },
  { id: "cella", label: "Cella lievitazione", pos: [-2.5, 0.9, 1], size: [1.4, 1.8, 1.4] },
  { id: "banco1", label: "Banco lavoro", pos: [1, 0.3, 1], size: [2.2, 0.6, 1] },
  { id: "banco2", label: "Banco pasticceria", pos: [3.2, 0.3, 1], size: [1.4, 0.6, 1] },
];
const STATION_POS = Object.fromEntries(MACHINES.map((m) => [m.id, m.pos]));

export default function DigitalTwin() {
  const { lang } = useLang();
  const hb = useHeartbeat();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const mountRef = useRef(null);
  const meshesRef = useRef({});
  const teleRef = useRef({});
  const agvMeshesRef = useRef([]);
  const agvDataRef = useRef([]);
  const selRef = useRef(null);
  const [tele, setTele] = useState({});
  const [globalLevel, setGlobalLevel] = useState("calmo");
  const [sel, setSel] = useState(null);

  // --- Scena three.js (creata una sola volta) ---
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 600;
    const height = 340;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(7, 6, 8);
    camera.lookAt(0, 0.5, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      return; // WebGL non disponibile
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(5, 8, 5);
    scene.add(dir);
    const pt = new THREE.PointLight(0x7dd3fc, 0.7);
    pt.position.set(-5, 4, -5);
    scene.add(pt);

    const group = new THREE.Group();
    scene.add(group);
    group.add(new THREE.GridHelper(16, 16, 0x1e3a4a, 0x132330));

    const meshes = {};
    MACHINES.forEach((m) => {
      const geo = new THREE.BoxGeometry(m.size[0], m.size[1], m.size[2]);
      const mat = new THREE.MeshStandardMaterial({ color: STRESS_COL.calmo, emissive: STRESS_COL.calmo, emissiveIntensity: 0.35, metalness: 0.45, roughness: 0.35 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(m.pos[0], m.pos[1], m.pos[2]);
      mesh.userData = { id: m.id, baseY: m.pos[1], baseHeight: m.size[1] };
      group.add(mesh);
      meshes[m.id] = mesh;
    });
    meshesRef.current = meshes;

    // Carrelli AGV: sfere che si muovono lungo le rotte (pool di 4, alone rosso se guasto).
    const agvMeshes = [];
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.SphereGeometry(0.26, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00f0ff, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 });
      const s = new THREE.Mesh(geo, mat);
      s.visible = false;
      group.add(s);
      agvMeshes.push(s);
    }
    agvMeshesRef.current = agvMeshes;

    // Raycaster per selezionare un macchinario
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onClick = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(Object.values(meshes));
      if (hits.length) {
        const id = hits[0].object.userData.id;
        const machine = MACHINES.find((mm) => mm.id === id);
        selRef.current = id;
        setSel({ ...machine });
      }
    };
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.style.cursor = "pointer";

    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      const dt = clock.getDelta();
      const t = clock.elapsedTime;
      group.rotation.y += dt * 0.12;
      Object.entries(meshes).forEach(([id, mesh], i) => {
        const info = teleRef.current[id];
        const stress = info?.stress ?? 0.2;
        const scaleY = 1 + Math.sin(t * (1.2 + stress * 3) + i * 1.7) * stress * 0.06;
        mesh.scale.y = scaleY;
      });
      // AGV lungo le rotte
      const carts = agvDataRef.current;
      agvMeshesRef.current.forEach((s, i) => {
        const c = carts[i];
        if (!c) { s.visible = false; return; }
        s.visible = true;
        const from = STATION_POS[c.from] || [0, 0.4, 0];
        const to = STATION_POS[c.to] || from;
        const prog = (t * 0.18 + i * 0.35) % 1;
        s.position.set(from[0] + (to[0] - from[0]) * prog, 0.45, from[2] + (to[2] - from[2]) * prog);
        const alert = c.health === "manutenzione";
        const col = alert ? 0xf43f5e : (c.health === "attenzione" ? 0xffb800 : 0x00f0ff);
        s.material.color.setHex(alert ? 0xf43f5e : 0xffffff);
        s.material.emissive.setHex(col);
        s.material.emissiveIntensity = alert ? 0.6 + Math.sin(t * 6) * 0.4 : 0.6;
        s.scale.setScalar(alert ? 1.3 : 1);
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth || width;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);
      try { mount.removeChild(renderer.domElement); } catch (e) { /* */ }
      Object.values(meshes).forEach((mesh) => { mesh.geometry.dispose(); mesh.material.dispose(); });
      agvMeshes.forEach((s) => { s.geometry.dispose(); s.material.dispose(); });
      renderer.dispose();
    };
  }, []);

  // --- Battito unico: telemetria + AGV da un solo polling ---
  useEffect(() => {
    if (!hb) return;
    setTele(hb.machines || {});
    setGlobalLevel(hb.global_level || "calmo");
    agvDataRef.current = hb.agv?.carts || [];
  }, [hb]);

  // --- Applica la telemetria ai materiali dei macchinari ---
  useEffect(() => {
    teleRef.current = tele;
    const meshes = meshesRef.current;
    Object.entries(meshes).forEach(([id, mesh]) => {
      const info = tele[id];
      const col = STRESS_COL[info?.level] ?? STRESS_COL.calmo;
      const stress = info?.stress ?? 0.2;
      mesh.material.color.setHex(col);
      mesh.material.emissive.setHex(col);
      mesh.material.emissiveIntensity = (selRef.current === id ? 1.0 : 0.35 + stress * 0.5);
    });
  }, [tele]);

  const col = STRESS_HEX[globalLevel] || "#7DD3FC";
  const selTele = sel ? tele[sel.id] : null;

  return (
    <div data-testid="digital-twin">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#5E8CA8]">{tri("Gemello Digitale · Supervisione", "Digitaler Zwilling", "Digital Twin · Supervision", "Gemelo Digital", "Jumeau Numérique", "دوقلوی دیجیتال")}</p>
        <span data-testid="twin-global-level" className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: col, border: `1px solid ${col}66` }}>{tri("Stato", "Status", "Status", "Estado", "État", "وضعیت")}: {globalLevel}</span>
      </div>
      <div ref={mountRef} data-testid="twin-canvas" className="rounded-xl overflow-hidden border" style={{ height: 340, background: "linear-gradient(180deg,#070A10,#0C1420)", borderColor: `${col}40`, boxShadow: globalLevel === "alto" ? `0 0 22px ${col}55 inset` : "none" }} />
      {selTele ? (
        <div data-testid="twin-selected" className="mt-2 rounded-lg border p-2.5 flex items-center gap-3" style={{ borderColor: `${STRESS_HEX[selTele.level]}55`, background: `${STRESS_HEX[selTele.level]}0d` }}>
          <span className="relative flex w-3 h-3"><span className="absolute inline-flex w-full h-full rounded-full animate-ping" style={{ background: STRESS_HEX[selTele.level], opacity: 0.5 }} /><span className="relative w-3 h-3 rounded-full" style={{ background: STRESS_HEX[selTele.level] }} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{sel.label}</p>
            <p className="text-[11px] text-[#8aa0b4]">{tri("Stress", "Stress", "Stress", "Estrés", "Stress", "استرس")}: {selTele.level} · {selTele.temp_c}°C · {tri("carico", "Last", "load", "carga", "charge", "بار")} {selTele.load_pct}%{selTele.sos ? " · SOS" : ""}</p>
            {selTele.torque_protection && <p data-testid="twin-torque" className="text-[11px] text-[#FFB800] font-bold mt-0.5">⚙ {tri(`Smart Torque: coppia ridotta al ${selTele.torque_pct}% (anti-stallo)`, `Smart Torque: Drehmoment auf ${selTele.torque_pct}%`, `Smart Torque: torque cut to ${selTele.torque_pct}% (anti-stall)`, `Smart Torque: par al ${selTele.torque_pct}%`, `Smart Torque: couple à ${selTele.torque_pct}%`, `گشتاور هوشمند: ${selTele.torque_pct}%`)}</p>}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-[#8aa0b4]" data-testid="twin-hint">
          {tri("Il laboratorio ruota in 3D · tocca un macchinario per la sua telemetria.", "Das Labor rotiert in 3D · Maschine antippen.", "The lab rotates in 3D · tap a machine for its telemetry.", "El taller gira en 3D · toca una máquina.", "L'atelier tourne en 3D · touche une machine.", "کارگاه در سه‌بعدی می‌چرخد.")}
        </p>
      )}
    </div>
  );
}
