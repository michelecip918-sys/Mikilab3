import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";

// Avatar 3D VIVENTE (Vanilla three.js/WebGPU con fallback WebGL2).
// Trasforma una foto piatta in un ritratto con profondità che:
//  - respira e ondeggia da solo (idle),
//  - si ruota trascinando col dito o col mouse, con ritorno elastico al centro,
//  - ha un alone/rim luminoso (accent) — più intenso per Sitor (nexus).
// Il tap (senza trascinare) resta un click normale sul contenitore genitore.
export default function LivingAvatar3D({ src, accent = "#FF6B00", nexus = false, className = "", rounded = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = () => mount.clientWidth || 132;
    const H = () => mount.clientHeight || 132;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true, forceWebGL: !(typeof navigator !== "undefined" && navigator.gpu) });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());

    const acc = new THREE.Color(accent);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.PointLight(0xffffff, 1.3, 40); key.position.set(3, 4, 6); scene.add(key);
    const rimL = new THREE.PointLight(acc, nexus ? 2.4 : 1.4, 40); rimL.position.set(-4, 2, 3); scene.add(rimL);

    const group = new THREE.Group(); scene.add(group);

    // Geometria a cupola: piano suddiviso spinto in avanti verso il centro → dà volume al volto.
    const geo = new THREE.PlaneGeometry(3.1, 3.1, 48, 48);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      pos.setZ(i, Math.max(0, 0.62 - r * 0.34) * Math.cos(Math.min(r, 1.6)));
    }
    geo.computeVertexNormals();

    // Maschera circolare morbida (alpha) per un ritratto tondo elegante.
    const maskCanvas = document.createElement("canvas"); maskCanvas.width = maskCanvas.height = 8;
    const tex = new THREE.TextureLoader().load(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0.05, transparent: true });
    if (rounded) {
      // alpha radiale per bordo sfumato (tondo)
      const ac = document.createElement("canvas"); ac.width = ac.height = 256;
      const ag = ac.getContext("2d");
      const rg = ag.createRadialGradient(128, 128, 40, 128, 128, 128);
      rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.82, "rgba(255,255,255,1)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      ag.fillStyle = rg; ag.fillRect(0, 0, 256, 256);
      mat.alphaMap = new THREE.CanvasTexture(ac);
    }
    const portrait = new THREE.Mesh(geo, mat);
    group.add(portrait);

    // Alone luminoso dietro (additivo) — l'aura del dio dell'arte bianca.
    const glowC = document.createElement("canvas"); glowC.width = glowC.height = 128;
    const gg = glowC.getContext("2d");
    const grd = gg.createRadialGradient(64, 64, 8, 64, 64, 64);
    const hex = accent.replace("#", "");
    const rC = parseInt(hex.substring(0, 2) || "ff", 16), gC = parseInt(hex.substring(2, 4) || "6b", 16), bC = parseInt(hex.substring(4, 6) || "00", 16);
    grd.addColorStop(0, `rgba(${rC},${gC},${bC},${nexus ? 0.95 : 0.6})`);
    grd.addColorStop(0.45, `rgba(${rC},${gC},${bC},0.35)`);
    grd.addColorStop(1, `rgba(${rC},${gC},${bC},0)`);
    gg.fillStyle = grd; gg.fillRect(0, 0, 128, 128);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 5.4),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowC), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: nexus ? 0.9 : 0.6 })
    );
    glow.position.z = -0.6; group.add(glow);

    // --- Interazione: trascina per ruotare, rilascia → ritorno elastico ---
    let dragging = false, lastX = 0, lastY = 0, moved = 0;
    const targetRot = { x: 0, y: 0 };   // dove vuole andare (drag)
    const rot = { x: 0, y: 0 };         // attuale (smussato)
    const dom = renderer.domElement;
    const onDown = (e) => { dragging = true; moved = 0; const p = e.touches ? e.touches[0] : e; lastX = p.clientX; lastY = p.clientY; };
    const onMove = (e) => {
      if (!dragging) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - lastX, dy = p.clientY - lastY;
      lastX = p.clientX; lastY = p.clientY; moved += Math.abs(dx) + Math.abs(dy);
      targetRot.y = Math.max(-0.9, Math.min(0.9, targetRot.y + dx * 0.01));
      targetRot.x = Math.max(-0.6, Math.min(0.6, targetRot.x + dy * 0.01));
      if (moved > 6 && e.cancelable) e.preventDefault();
    };
    const onUp = () => { dragging = false; targetRot.x = 0; targetRot.y = 0; };
    // Hover desktop: il volto segue leggermente il mouse anche senza trascinare.
    const onHover = (e) => {
      if (dragging) return;
      const r = dom.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      targetRot.y = nx * 0.5; targetRot.x = ny * 0.5;
    };
    const onLeave = () => { if (!dragging) { targetRot.x = 0; targetRot.y = 0; } };
    dom.style.touchAction = "pan-y";
    dom.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    dom.addEventListener("mousemove", onHover);
    dom.addEventListener("mouseleave", onLeave);

    let raf = 0, mounted = true, t = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const dt = clock.getDelta(); t += dt;
      // Idle: respiro (scala) + ondeggio autonomo se non si interagisce.
      const breathe = 1 + Math.sin(t * 1.5) * 0.02;
      group.scale.setScalar(breathe);
      group.position.y = Math.sin(t * 1.1) * 0.05;
      const idleY = Math.sin(t * 0.6) * 0.12;
      const idleX = Math.sin(t * 0.9) * 0.05;
      // Smussatura verso il target (drag/hover) + idle di base.
      rot.y += ((targetRot.y + idleY) - rot.y) * 0.08;
      rot.x += ((targetRot.x + idleX) - rot.x) * 0.08;
      group.rotation.y = rot.y;
      group.rotation.x = rot.x;
      glow.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05);
      glow.material.opacity = (nexus ? 0.75 : 0.5) + Math.sin(t * 2) * 0.12;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    renderer.init().catch(() => { /* fallback WebGL2 */ }).finally(() => {
      if (!mounted) { try { renderer.dispose(); } catch { /* */ } return; }
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.cursor = "grab";
      raf = requestAnimationFrame(animate);
    });

    const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); };
    const ro = new ResizeObserver(onResize); ro.observe(mount);

    return () => {
      mounted = false; cancelAnimationFrame(raf); ro.disconnect();
      dom.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      dom.removeEventListener("mousemove", onHover);
      dom.removeEventListener("mouseleave", onLeave);
      try { geo.dispose(); mat.dispose(); tex.dispose(); } catch { /* */ }
      try { renderer.dispose(); } catch { /* */ }
      if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [src, accent, nexus, rounded]);

  return <div ref={mountRef} data-testid="living-avatar-3d" className={className} style={{ width: "100%", height: "100%" }} />;
}
