export default function EquationList({ equations, updateEquation, removeEquation, placeholder = "f(x)" }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", flex: 1 }}>
        {equations.map(eq => (
          <div key={eq.id} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.04)", borderRadius: 8,
            padding: "6px 8px", border: `1px solid ${eq.on ? eq.color + "44" : "transparent"}`
          }}>
            <div
              onClick={() => updateEquation(eq.id, { on: !eq.on })}
              style={{
                width: 11, height: 11, borderRadius: "50%",
                background: eq.color, opacity: eq.on ? 1 : 0.3,
                cursor: "pointer", flexShrink: 0
              }}
            />
            <input
              value={eq.expr}
              onChange={e => updateEquation(eq.id, { expr: e.target.value })}
              placeholder={placeholder}
              style={{
                flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
                fontFamily: "monospace", fontSize: 13,
                color: eq.on ? eq.color : "rgba(255,255,255,0.3)"
              }}
            />
            <button
              onClick={() => removeEquation(eq.id)}
              style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.2)",
                cursor: "pointer", fontSize: 16, lineHeight: 1, 
                padding: 0, flexShrink: 0, width: 16, textAlign: "center"
              }}
            >×</button>
          </div>
        ))}
      </div>
    );
  }