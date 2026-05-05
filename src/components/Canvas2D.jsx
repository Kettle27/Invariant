import { useRef, useEffect, useCallback, useState } from "react";

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
    .replace(/\bexp\b/g, "Math.exp").replace(/\bfloor\b/g, "Math.floor")
    .replace(/\bceil\b/g, "Math.ceil").replace(/\bpi\b/g, "Math.PI")
    .replace(/\be(?![a-zA-Z0-9_])/g, "Math.E")
    .replace(/(\w+)!/g, "factorial($1)")
    .replace(/(\d)([a-zA-Z])/g, "$1*$2");
}

function makeFn1(expr) {
  try { return new Function("x", `"use strict"; ${HELPERS} return (${transform(expr)});`); }
  catch { return null; }
}

function makeFn2(expr) {
  try { return new Function("x", "y", `"use strict"; ${HELPERS} return (${transform(expr)});`); }
  catch { return null; }
}

function niceStep(zoom) {
  const raw = 60 / zoom;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  if (norm < 1.5) return pow;
  if (norm < 3.5) return 2 * pow;
  if (norm < 7.5) return 5 * pow;
  return 10 * pow;
}

function formatLabel(v) {
  return parseFloat(v.toPrecision(6)).toString();
}

function formatCoord(v) {
  return parseFloat(v.toPrecision(5)).toString();
}

function drawExplicit(ctx, expr, color, cx, cy, zoom, w, h) {
  const fn = makeFn1(expr);
  if (!fn) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  let pen = false, prevPy = null;
  for (let px = 0; px <= w; px++) {
    const x = (px - cx) / zoom;
    let y;
    try { y = fn(x); } catch { pen = false; continue; }
    if (!isFinite(y) || Math.abs(y) > 1e6) { pen = false; continue; }
    const py = cy - y * zoom;
    if (prevPy !== null && Math.abs(py - prevPy) > h * 2) { pen = false; }
    prevPy = py;
    if (!pen) { ctx.moveTo(px, py); pen = true; } else { ctx.lineTo(px, py); }
  }
  ctx.stroke();
}

function drawImplicit(ctx, expr, color, cx, cy, zoom, w, h) {
  const parts = expr.split("=");
  if (parts.length !== 2) return;
  const fn = makeFn2(`(${parts[0]}) - (${parts[1]})`);
  if (!fn) return;
  const res = 3;
  const cols = Math.ceil(w / res);
  const rows = Math.ceil(h / res);
  const vals = new Float32Array((cols + 1) * (rows + 1));
  for (let i = 0; i <= cols; i++) for (let j = 0; j <= rows; j++) {
    const x = (i * res - cx) / zoom;
    const y = -(j * res - cy) / zoom;
    let v = NaN;
    try { v = fn(x, y); if (!isFinite(v)) v = NaN; } catch {}
    vals[i * (rows + 1) + j] = v;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const v00 = vals[i * (rows + 1) + j];
    const v10 = vals[(i + 1) * (rows + 1) + j];
    const v01 = vals[i * (rows + 1) + j + 1];
    const v11 = vals[(i + 1) * (rows + 1) + j + 1];
    if (isNaN(v00) || isNaN(v10) || isNaN(v01) || isNaN(v11)) continue;
    const pts = [];
    if (v00 * v10 < 0) { const t = v00 / (v00 - v10); pts.push([i * res + t * res, j * res]); }
    if (v10 * v11 < 0) { const t = v10 / (v10 - v11); pts.push([(i + 1) * res, j * res + t * res]); }
    if (v01 * v11 < 0) { const t = v01 / (v01 - v11); pts.push([i * res + t * res, (j + 1) * res]); }
    if (v00 * v01 < 0) { const t = v00 / (v00 - v01); pts.push([i * res, j * res + t * res]); }
    if (pts.length >= 2) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); }
  }
  ctx.stroke();
}

// Find nearest point on an explicit curve to the mouse
function snapToExplicit(expr, mouseX, mouseY, cx, cy, zoom, w) {
  const fn = makeFn1(expr);
  if (!fn) return null;
  let bestDist = Infinity, bestX = null, bestY = null;
  const searchRadius = 30;
  for (let px = Math.max(0, mouseX - searchRadius); px <= Math.min(w, mouseX + searchRadius); px++) {
    const x = (px - cx) / zoom;
    let y;
    try { y = fn(x); } catch { continue; }
    if (!isFinite(y) || Math.abs(y) > 1e6) continue;
    const py = cy - y * zoom;
    const dist = Math.hypot(px - mouseX, py - mouseY);
    if (dist < bestDist) { bestDist = dist; bestX = x; bestY = y; }
  }
  if (bestDist < 20) return { x: bestX, y: bestY, dist: bestDist };
  return null;
}

function drawTooltip(ctx, snap, cx, cy, zoom, color) {
  const px = cx + snap.x * zoom;
  const py = cy - snap.y * zoom;
  const label = `(${formatCoord(snap.x)}, ${formatCoord(snap.y)})`;

  // Dot on curve
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#0a0a0c";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Tooltip box
  ctx.font = "bold 12px monospace";
  const textW = ctx.measureText(label).width;
  const pad = 8;
  const boxW = textW + pad * 2;
  const boxH = 26;
  let bx = px + 14;
  let by = py - boxH / 2;

  // Keep box in canvas
  const canvas = ctx.canvas;
  if (bx + boxW > canvas.width - 8) bx = px - boxW - 14;
  if (by < 8) by = 8;
  if (by + boxH > canvas.height - 8) by = canvas.height - boxH - 8;

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 8;

  // Background
  ctx.fillStyle = "#1a1a1f";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  roundRect(ctx, bx, by, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Text
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx + pad, by + boxH / 2);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default function Canvas2D({ equations }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ panX: 0, panY: 0, zoom: 60 });
  const dragRef = useRef(null);
  const snapRef = useRef(null); // { x, y, color }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { panX, panY, zoom } = stateRef.current;
    const w = canvas.width, h = canvas.height;
    const cx = w / 2 + panX, cy = h / 2 + panY;
    const step = niceStep(zoom);
    const pixStep = step * zoom;

    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    const xStart = Math.floor(-cx / pixStep) * pixStep + cx;
    for (let x = xStart; x < w; x += pixStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    const yStart = Math.floor(-cy / pixStep) * pixStep + cy;
    for (let y = yStart; y < h; y += pixStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // Labels
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let x = xStart; x < w; x += pixStep) {
      const val = (x - cx) / zoom;
      if (Math.abs(val) < step * 0.01) continue;
      if (x < 15 || x > w - 10) continue;
      ctx.fillText(formatLabel(val), x, cy + 14);
    }
    ctx.textAlign = "right";
    for (let y = yStart; y < h; y += pixStep) {
      const val = -(y - cy) / zoom;
      if (Math.abs(val) < step * 0.01) continue;
      if (y < 10 || y > h - 5) continue;
      ctx.fillText(formatLabel(val), cx - 5, y + 4);
    }

    // Curves
    for (const eq of equations) {
      if (!eq.on || !eq.expr.trim()) continue;
      if (eq.expr.includes("=")) {
        drawImplicit(ctx, eq.expr, eq.color, cx, cy, zoom, w, h);
      } else {
        drawExplicit(ctx, eq.expr, eq.color, cx, cy, zoom, w, h);
      }
    }

    // Snap tooltip
    if (snapRef.current) {
      drawTooltip(ctx, snapRef.current, cx, cy, zoom, snapRef.current.color);
    }
  }, [equations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  function onMouseDown(e) {
    const { panX, panY } = stateRef.current;
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: panX, py: panY };
  }

  function onMouseMove(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Pan
    if (dragRef.current) {
      stateRef.current.panX = dragRef.current.px + e.clientX - dragRef.current.sx;
      stateRef.current.panY = dragRef.current.py + e.clientY - dragRef.current.sy;
      snapRef.current = null;
      draw();
      return;
    }

    // Snap to nearest explicit curve
    const { panX, panY, zoom } = stateRef.current;
    const w = canvas.width, h = canvas.height;
    const cx = w / 2 + panX, cy = h / 2 + panY;

    let best = null;
    for (const eq of equations) {
      if (!eq.on || !eq.expr.trim() || eq.expr.includes("=")) continue;
      const snap = snapToExplicit(eq.expr, mouseX, mouseY, cx, cy, zoom, w);
      if (snap && (!best || snap.dist < best.dist)) {
        best = { ...snap, color: eq.color };
      }
    }

    snapRef.current = best;
    draw();
  }

  function onMouseUp() { dragRef.current = null; }

  function onMouseLeave() {
    snapRef.current = null;
    draw();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const oldZoom = stateRef.current.zoom;
      const newZoom = Math.max(5, Math.min(800, oldZoom * factor));
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      stateRef.current.panX = mouseX - cx - (mouseX - cx - stateRef.current.panX) * newZoom / oldZoom;
      stateRef.current.panY = mouseY - cy - (mouseY - cy - stateRef.current.panY) * newZoom / oldZoom;
      stateRef.current.zoom = newZoom;
      draw();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      style={{ display: "block", width: "100%", height: "100%", cursor: "crosshair" }}
    />
  );
}