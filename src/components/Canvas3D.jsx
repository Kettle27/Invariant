import { useEffect, useRef } from "react";
import * as THREE from "three";

const HELPERS = `
  function gamma(n) {
    if (n < 0.5) return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
    n -= 1;
    const g = 7;
    const c = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (n + i);
    const t = n + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
  }

  function factorial(n) {
    if (Number.isInteger(n) && n < 0) return Infinity;
    if (n > 170) return Infinity;
    return gamma(n + 1);
  }
`;

function transform(expr) {
  return expr
    .replace(/\^/g, "**")
    .replace(/\bsin\b/g, "Math.sin").replace(/\bcos\b/g, "Math.cos")
    .replace(/\btan\b/g, "Math.tan").replace(/\bsqrt\b/g, "Math.sqrt")
    .replace(/\babs\b/g, "Math.abs").replace(/\bln\b/g, "Math.log")
    .replace(/\bexp\b/g, "Math.exp").replace(/\bfloor\b/g, "Math.ceil")
    .replace(/\bpi\b/g, "Math.PI")
    .replace(/\be(?![a-zA-Z0-9_])/g, "Math.E")
    .replace(/(\w+)!/g, "factorial($1)")
    .replace(/(\d)([a-zA-Z])/g, "$1*$2");
}

function makeFn(expr) {
  const cleaned = expr.replace(/^\s*z\s*=\s*/i, "");
  try { return new Function("x", "y", `"use strict"; ${HELPERS} return (${transform(cleaned)});`); }
  catch { return null; }
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

function buildSurface(expr, color) {
  const N = 70, R = 5;
  const fn = makeFn(expr);
  const positions = [], colors = [], indices = [];
  const zArr = new Float32Array((N + 1) * (N + 1));
  let zMin = Infinity, zMax = -Infinity;

  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
    const x = (i / N) * R * 2 - R, y = (j / N) * R * 2 - R;
    let z = 0;
    if (fn) try { z = fn(x, y); if (!isFinite(z)) z = 0; } catch {}
    zArr[i * (N + 1) + j] = z;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }

  const { r: cr, g: cg, b: cb } = hexToRgb(color);

  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
    const x = (i / N) * R * 2 - R, y = (j / N) * R * 2 - R;
    const z = zArr[i * (N + 1) + j];
    positions.push(x, z, y);
    // Tint: dark at low z, full color at mid, bright at high z
    const t = zMax === zMin ? 0.5 : (z - zMin) / (zMax - zMin);
    const brightness = 0.4 + t * 0.8;
    colors.push(cr * brightness, cg * brightness, cb * brightness);
  }

  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const a = i * (N + 1) + j, b = a + 1, c = a + (N + 1), d = c + 1;
    indices.push(a, b, d, a, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshPhongMaterial({
    vertexColors: true, side: THREE.DoubleSide, shininess: 50
  });

  return { mesh: new THREE.Mesh(geo, mat), geo, mat };
}

export default function Canvas3D({ equations }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth, H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0c);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);

    // Build a surface per equation
    const surfaces = [];
    for (const eq of equations) {
      if (!eq.on || !eq.expr.trim()) continue;
      const { mesh, geo, mat } = buildSurface(eq.expr, eq.color);
      scene.add(mesh);
      surfaces.push({ geo, mat });
    }

    scene.add(new THREE.GridHelper(12, 12, 0x1e1e22, 0x161618));
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(5, 10, 5); scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dl2.position.set(-5, -8, -5); scene.add(dl2);

    let theta = 0.8, phi = 1.05, r = 15;
    const setCamera = () => {
      camera.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      camera.lookAt(0, 0, 0);
    };
    setCamera();

    let isDown = false, lx = 0, ly = 0;
    const onDown = e => { isDown = true; lx = e.clientX; ly = e.clientY; };
    const onMove = e => {
      if (!isDown) return;
      theta -= (e.clientX - lx) * 0.008;
      phi = Math.max(0.12, Math.min(Math.PI - 0.12, phi - (e.clientY - ly) * 0.008));
      lx = e.clientX; ly = e.clientY;
      setCamera();
    };
    const onUp = () => { isDown = false; };
    const onWheel = e => {
      e.preventDefault();
      r = Math.max(5, Math.min(28, r + e.deltaY * 0.04));
      setCamera();
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      const W2 = mount.clientWidth, H2 = mount.clientHeight;
      renderer.setSize(W2, H2);
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    let animId;
    const animate = () => { animId = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      surfaces.forEach(({ geo, mat }) => { geo.dispose(); mat.dispose(); });
    };
  }, [equations]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        overflow: "hidden",
      }}
    />
  );
}