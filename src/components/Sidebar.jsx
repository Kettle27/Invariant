import EquationList from "./EquationList";

export default function Sidebar({
  mode, setMode,
  equations, addEquation, removeEquation, updateEquation,
  equations3d, addEquation3d, removeEquation3d, updateEquation3d,
}) {
  return (
    <div style={{
      width: 220, background: "#0d0d10",
      borderRight: "0.5px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column", padding: 12, gap: 8, flexShrink: 0
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
          <Label>EQUATIONS</Label>
          <EquationList equations={equations3d} updateEquation={updateEquation3d} removeEquation={removeEquation3d} placeholder="f(x,y)" />
          <SidebarBtn onClick={addEquation3d}>+ add surface</SidebarBtn>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", lineHeight: 1.7, marginTop: "auto" }}>
            drag to orbit · scroll to zoom<br />x, y ∈ [−5, 5]
          </div>
        </>
      )}
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