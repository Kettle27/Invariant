import { useState } from "react";
import EquationList from "./EquationList";

const PRESETS_3D = [
  "sin(sqrt(x^2+y^2))",
  "sin(x)*cos(y)",
  "x*y/5",
  "abs(x)+abs(y)",
  "cos(x^2+y^2)/2",
  "(x^2-y^2)/6",
];

export default function Sidebar({
  mode, setMode,
  equations, addEquation, removeEquation, updateEquation,
  equations3d, addEquation3d, removeEquation3d, updateEquation3d,
}) {
  const [minimised, setMinimised] = useState(false);

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      flexShrink: 0,
      height: "100%",
    }}>
      {/* Main sidebar panel */}
      <div style={{
        width: minimised ? 0 : 220,
        overflow: "hidden",
        transition: "width 0.25s ease",
        background: "#0d0d10",
        borderRight: minimised ? "none" : "0.5px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        padding: minimised ? 0 : 12,
        gap: 8,
      }}>
        {/* Mode toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, gap: 3 }}>
          {["2d","3d"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "5px 0", fontSize: 12, fontFamily: "monospace",
              border: "none", borderRadius: 6, cursor: "pointer",
              textTransform: "uppercase", letterSpacing: "0.08em",
              background: mode === m ? "rgba(255,255,255,0.12)" : "transparent",
              color: mode === m ? "#fff" : "rgba(255,255,255,0.4)",
            }}>{m}</button>
          ))}
        </div>

        {mode === "2d" ? (
          <>
            <Label>equations</Label>
            <EquationList equations={equations} updateEquation={updateEquation} removeEquation={removeEquation} />
            <SidebarBtn onClick={addEquation}>+ add equation</SidebarBtn>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", lineHeight: 1.7 }}>
              scroll to zoom · drag to pan<br />
            </div>
          </>
        ) : (
          <>
            <Label>equations</Label>
            <EquationList equations={equations3d} updateEquation={updateEquation3d} removeEquation={removeEquation3d} placeholder="f(x,y)" />
            <SidebarBtn onClick={addEquation3d}>+ add surface</SidebarBtn>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", lineHeight: 1.7, marginTop: "auto" }}>
              drag to orbit · scroll to zoom<br />x, y ∈ [−5, 5]
            </div>
          </>
        )}
      </div>

      {/* Toggle tab */}
      <div
        onClick={() => setMinimised(m => !m)}
        title={minimised ? "Show sidebar" : "Hide sidebar"}
        style={{
          width: 18,
          background: "#0d0d10",
          borderRight: "0.5px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.15s",
          userSelect: "none",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#1a1a1f"}
        onMouseLeave={e => e.currentTarget.style.background = "#0d0d10"}
      >
        <span style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 10,
          transform: minimised ? "rotate(0deg)" : "rotate(180deg)",
          transition: "transform 0.25s ease",
          lineHeight: 1,
        }}>‹</span>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

function SidebarBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)",
      borderRadius: 8, color: "rgba(255,255,255,0.45)", fontFamily: "monospace",
      fontSize: 12, cursor: "pointer", padding: 7
    }}>{children}</button>
  );
}