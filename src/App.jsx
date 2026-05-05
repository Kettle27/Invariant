import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Canvas2D from "./components/Canvas2D";
import Canvas3D from "./components/Canvas3D";

const COLORS = ["#ff6b6b","#4ecdc4","#ffe066","#a78bfa","#34d399","#fb923c"];

export default function App() {
  const [mode, setMode] = useState("2d");

  const [equations, setEquations] = useState([
    { id: 1, expr: "", color: COLORS[0], on: true },
  ]);
  const [nextId, setNextId] = useState(3);

  const [equations3d, setEquations3d] = useState([
    { id: 1, expr: "", color: COLORS[0], on: true },
  ]);
  const [nextId3d, setNextId3d] = useState(2);

  function addEquation() {
    setEquations(prev => [...prev, { id: nextId, expr: "", color: COLORS[nextId % COLORS.length], on: true }]);
    setNextId(n => n + 1);
  }
  function removeEquation(id) {
    if (equations.length === 1) {
      setEquations(prev => prev.map(eq => eq.id === id ? { ...eq, expr: "" } : eq));
    } else {
      setEquations(prev => prev.filter(eq => eq.id !== id));
    }
  }
  function updateEquation(id, changes) {
    setEquations(prev => prev.map(eq => eq.id === id ? { ...eq, ...changes } : eq));
  }

  function addEquation3d() {
    setEquations3d(prev => [...prev, { id: nextId3d, expr: "", color: COLORS[nextId3d % COLORS.length], on: true }]);
    setNextId3d(n => n + 1);
  }
  function removeEquation3d(id) {
    if (equations3d.length === 1) {
      setEquations3d(prev => prev.map(eq => eq.id === id ? { ...eq, expr: "" } : eq));
    } else {
      setEquations3d(prev => prev.filter(eq => eq.id !== id));
    }
  }
  function updateEquation3d(id, changes) {
    setEquations3d(prev => prev.map(eq => eq.id === id ? { ...eq, ...changes } : eq));
  }

  return (
    <div style={{
      display: "flex",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
    }}>
      <Sidebar
        mode={mode} setMode={setMode}
        equations={equations}
        addEquation={addEquation}
        removeEquation={removeEquation}
        updateEquation={updateEquation}
        equations3d={equations3d}
        addEquation3d={addEquation3d}
        removeEquation3d={removeEquation3d}
        updateEquation3d={updateEquation3d}
      />
      <div style={{
        flex: 1,
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}>
        {mode === "2d"
          ? <Canvas2D equations={equations} />
          : <Canvas3D equations={equations3d} />
        }
      </div>
    </div>
  );
}