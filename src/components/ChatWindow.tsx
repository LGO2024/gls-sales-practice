import { useState, useRef, useEffect, useCallback } from "react";
import type { Persona, Message } from "../types";
import { useVoice } from "../hooks/useVoice";
import SalesMemo from "./SalesMemo";

interface Props {
  persona: Persona;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onEnd: () => void;
  onBack: () => void;
}

export default function ChatWindow({ persona, messages, setMessages, onEnd, onBack }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [interimText, setInterimText] = useState(""); // 認識中の仮テキスト
  const bottomRef = useRef<HTMLDivElement>(null);
  const { supported, listening, speaking, startListening, stopListening, speak, stopSpeaking } = useVoice();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  // ──────────────────────────────────────────
  // テキスト送信
  // ──────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setInterimText("");
    setLoading(true);

    // ストリーミング受信
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, messages: newMessages }),
      });

      if (!res.body) throw new Error("ストリーム非対応");

      // 空のassistantメッセージを先に追加して、トークンを追記していく
      setMessages([...newMessages, { role: "assistant", content: "" }]);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;
          try {
            const { token, error } = JSON.parse(raw);
            if (error) { alert("エラー: " + error); break; }
            if (token) {
              reply += token;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: reply };
                return updated;
              });
            }
          } catch {}
        }
      }

      // 音声モードなら完成したテキストを読み上げ
      if (voiceMode && reply) speak(reply);

    } catch {
      alert("サーバーに接続できませんでした。");
      setLoading(false);
    }
  }, [loading, messages, persona, setMessages, voiceMode, speak]);

  // ──────────────────────────────────────────
  // 音声入力
  // ──────────────────────────────────────────
  const handleMicPress = () => {
    if (listening) {
      // もう一度押したら停止して送信
      const finalText = stopListening();
      setInterimText("");
      if (finalText.trim()) sendMessage(finalText);
      return;
    }

    stopSpeaking();
    setInterimText("");

    startListening(
      (text) => setInterimText(text), // リアルタイム表示
      (finalText) => {
        // continuous:true の場合ここは手動stop後のみ呼ばれる
        setInterimText("");
        if (finalText.trim()) sendMessage(finalText);
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enterキーは送信しない（IME変換でも誤送信しないよう）
    void e;
  };

  // マイクボタンの色
  const micBg = listening ? "#ef4444" : speaking ? "#f97316" : "#1a1a1a";
  const micLabel = listening ? "もう一度押すと送信" : speaking ? "読み上げ中" : "押して話す";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* ──── ヘッダー ──── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e8e8e8",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#666" }}
        >
          ←
        </button>
        <span style={{ fontSize: 32 }}>{persona.avatar}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{persona.name}</div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {persona.title} / {persona.facility}（{persona.facility_type}）
          </div>
        </div>

        {/* 音声モード切替 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!supported && (
            <span style={{ fontSize: 11, color: "#f97316" }}>音声はChrome推奨</span>
          )}
          <button
            onClick={() => {
              stopSpeaking();
              stopListening();
              setVoiceMode((v) => !v);
            }}
            title={voiceMode ? "テキストモードに切替" : "音声モードに切替"}
            style={{
              background: voiceMode ? "#1a1a1a" : "#f0f0f0",
              color: voiceMode ? "#fff" : "#555",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {voiceMode ? "🎤 音声ON" : "🎤 音声OFF"}
          </button>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>{messages.length} ターン</div>
          <button
            onClick={onEnd}
            disabled={messages.length < 2}
            style={{
              background: messages.length >= 2 ? "#1a1a1a" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              cursor: messages.length >= 2 ? "pointer" : "not-allowed",
              fontWeight: 600,
            }}
          >
            終了・フィードバック
          </button>
        </div>
      </div>

      {/* ──── 施設情報バー ──── */}
      <div style={{
        background: "#fafafa",
        borderBottom: "1px solid #eee",
        padding: "8px 20px",
        fontSize: 12,
        color: "#666",
        display: "flex",
        gap: 16,
      }}>
        <span>📍 {persona.location}</span>
        <span>👥 {persona.size}</span>
        <span>🎯 難易度: {persona.difficulty}</span>
        {voiceMode && (
          <span style={{ color: "#1a1a1a", fontWeight: 600 }}>
            🎤 音声モード — マイクボタンを押して話す
          </span>
        )}
      </div>

      {/* ──── メッセージ一覧 ──── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#aaa", marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{persona.avatar}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              {persona.name}に話しかけてみましょう
            </div>
            <div style={{ fontSize: 13 }}>
              {voiceMode
                ? "🎤 マイクボタンを押して話してください"
                : "あなたはGLSの営業担当です。最初のアプローチを入力してください。"}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            {msg.role === "assistant" && (
              <span style={{ fontSize: 28, flexShrink: 0 }}>{persona.avatar}</span>
            )}
            <div style={{
              maxWidth: "70%",
              background: msg.role === "user" ? "#1a1a1a" : "#fff",
              color: msg.role === "user" ? "#fff" : "#1a1a1a",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "12px 16px",
              fontSize: 14,
              lineHeight: 1.6,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
              {/* 読み上げ中インジケーター */}
              {msg.role === "assistant" && i === messages.length - 1 && speaking && (
                <span style={{ marginLeft: 8, fontSize: 12, color: "#f97316" }}>🔊</span>
              )}
            </div>
            {msg.role === "user" && (
              <span style={{ fontSize: 14, color: "#999", flexShrink: 0 }}>あなた</span>
            )}
          </div>
        ))}

        {/* 音声認識中の仮テキスト */}
        {listening && interimText && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "flex-end" }}>
            <div style={{
              maxWidth: "70%",
              background: "#374151",
              color: "#9ca3af",
              borderRadius: "16px 16px 4px 16px",
              padding: "12px 16px",
              fontSize: 14,
              lineHeight: 1.6,
              border: "2px dashed #6b7280",
              fontStyle: "italic",
            }}>
              {interimText}
            </div>
            <span style={{ fontSize: 14, color: "#999", flexShrink: 0 }}>認識中</span>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <span style={{ fontSize: 28 }}>{persona.avatar}</span>
            <div style={{
              background: "#fff",
              borderRadius: "16px 16px 16px 4px",
              padding: "12px 16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}>
              <span style={{ color: "#aaa", fontSize: 20, letterSpacing: 4 }}>・・・</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ──── 営業メモ ──── */}
      <SalesMemo persona={persona} />

      {/* ──── 入力エリア ──── */}
      <div style={{
        background: "#fff",
        borderTop: "1px solid #e8e8e8",
        padding: "16px 20px",
      }}>
        {voiceMode ? (
          /* 音声モード UI */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {/* マイクボタン */}
            <button
              onClick={handleMicPress}
              disabled={loading}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: loading ? "#ccc" : micBg,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: listening
                  ? "0 0 0 8px rgba(239,68,68,0.2), 0 0 0 16px rgba(239,68,68,0.1)"
                  : "0 4px 12px rgba(0,0,0,0.2)",
                transition: "all 0.2s",
              }}
            >
              {listening ? "⏹" : speaking ? "🔊" : "🎤"}
            </button>
            <div style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>
              {loading ? "返答生成中..." : micLabel}
            </div>
            {speaking && (
              <button
                onClick={stopSpeaking}
                style={{
                  background: "none",
                  border: "1px solid #e8e8e8",
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 12,
                  color: "#888",
                  cursor: "pointer",
                }}
              >
                読み上げを止める
              </button>
            )}
            {/* テキスト補助入力 */}
            <div style={{ width: "100%", maxWidth: 500, display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={() => {}}
                placeholder="テキストで補足入力も可"
                disabled={loading || listening}
                style={{
                  flex: 1,
                  border: "1px solid #e8e8e8",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading ? "#1a1a1a" : "#ccc",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: 13,
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                }}
              >
                送信
              </button>
            </div>
          </div>
        ) : (
          /* テキストモード UI */
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="営業トークを入力… (送信ボタンで送信)"
              disabled={loading}
              rows={3}
              style={{
                flex: 1,
                border: "2px solid #e8e8e8",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1a1a1a")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? "#1a1a1a" : "#ccc",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "14px 20px",
                fontSize: 16,
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                flexShrink: 0,
              }}
            >
              送信
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
