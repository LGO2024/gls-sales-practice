import type { Persona } from "../types";

interface Props {
  personas: Persona[];
  onSelect: (p: Persona) => void;
}

const difficultyColor: Record<string, string> = {
  簡単: "#4caf50",
  普通: "#ff9800",
  難しい: "#f44336",
};

export default function PersonaSelect({ personas, onSelect }: Props) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      {/* ヘッダー */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 13, color: "#888", letterSpacing: 2, marginBottom: 8 }}>
          GLS SALES TRAINER
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          営業練習相手を選んでください
        </h1>
        <p style={{ color: "#666", fontSize: 14 }}>
          ペルソナを追加するには <code style={{ background: "#eee", padding: "2px 6px", borderRadius: 4 }}>personas.json</code> にデータを追記するだけです
        </p>
      </div>

      {/* ペルソナカード */}
      {personas.length === 0 ? (
        <div style={{ textAlign: "center", color: "#999", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p>ペルソナを読み込み中...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                background: "#fff",
                border: "2px solid #e8e8e8",
                borderRadius: 12,
                padding: 24,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a1a1a";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e8e8e8";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              }}
            >
              {/* アバター + 難易度 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 40 }}>{p.avatar}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#fff",
                  background: difficultyColor[p.difficulty] ?? "#999",
                  padding: "3px 10px",
                  borderRadius: 20,
                }}>
                  {p.difficulty}
                </span>
              </div>

              {/* 名前・役職 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "#666" }}>{p.title} / {p.age}歳</div>
              </div>

              {/* 施設情報 */}
              <div style={{
                fontSize: 12,
                color: "#888",
                background: "#f8f8f8",
                borderRadius: 6,
                padding: "6px 10px",
                marginBottom: 12,
              }}>
                {p.facility}（{p.facility_type}・{p.size}）
              </div>

              {/* 悩み */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#999", marginBottom: 4 }}>主な悩み</div>
                {p.pain_points.slice(0, 2).map((pt, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>
                    • {pt}
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 16,
                fontSize: 12,
                fontWeight: 600,
                color: "#1a1a1a",
                textAlign: "center",
                borderTop: "1px solid #eee",
                paddingTop: 12,
              }}>
                この相手で練習する →
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ペルソナ追加ガイド */}
      <div style={{
        marginTop: 48,
        background: "#1a1a1a",
        color: "#fff",
        borderRadius: 12,
        padding: 24,
        fontSize: 13,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>📝 新しいペルソナを追加するには</div>
        <div style={{ color: "#aaa", lineHeight: 1.7 }}>
          <code style={{ color: "#7dd3fc" }}>personas.json</code> を開いて、<code style={{ color: "#7dd3fc" }}>personas</code> 配列に新しいオブジェクトを追記。
          サーバーを再起動せずにリロードするだけで反映されます。
        </div>
      </div>
    </div>
  );
}
