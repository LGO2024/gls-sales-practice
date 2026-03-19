import type { Persona, Message } from "../types";

interface Props {
  persona: Persona;
  messages: Message[];
  feedback: string;
  loading: boolean;
  onRetry: () => void;
  onBack: () => void;
}

export default function FeedbackView({ persona, messages, feedback, loading, onRetry, onBack }: Props) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
      {/* ヘッダー */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: 48 }}>{persona.avatar}</span>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>
          {persona.name} との練習結果
        </h2>
        <div style={{ color: "#888", fontSize: 13 }}>{messages.length} ターン / {persona.difficulty}レベル</div>
      </div>

      {/* 会話サマリー */}
      <div style={{
        background: "#f8f8f8",
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
        fontSize: 13,
        color: "#666",
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: "#333" }}>会話ログ</div>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 8, display: "flex", gap: 8 }}>
            <span style={{ fontWeight: 600, color: msg.role === "user" ? "#1a1a1a" : "#888", flexShrink: 0 }}>
              {msg.role === "user" ? "あなた" : persona.name}:
            </span>
            <span style={{ lineHeight: 1.5 }}>{msg.content}</span>
          </div>
        ))}
      </div>

      {/* フィードバック */}
      <div style={{
        background: "#fff",
        border: "2px solid #1a1a1a",
        borderRadius: 12,
        padding: 28,
        marginBottom: 32,
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span>📊</span> トレーナーからのフィードバック
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
            <div>フィードバックを生成中...</div>
          </div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {feedback}
          </div>
        )}
      </div>

      {/* アクション */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onRetry}
          style={{
            flex: 1,
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "14px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          もう一度 {persona.name} と練習する
        </button>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            background: "#fff",
            color: "#1a1a1a",
            border: "2px solid #1a1a1a",
            borderRadius: 10,
            padding: "14px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          別のペルソナを選ぶ
        </button>
      </div>
    </div>
  );
}
