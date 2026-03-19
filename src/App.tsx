import { useState, useEffect } from "react";
import type { Persona, Message, AppScreen } from "./types";
import PersonaSelect from "./components/PersonaSelect";
import ChatWindow from "./components/ChatWindow";
import FeedbackView from "./components/FeedbackView";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("select");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    fetch("/api/personas")
      .then((r) => r.json())
      .then(setPersonas)
      .catch(() => alert("ペルソナの読み込みに失敗しました。サーバーが起動しているか確認してください。"));
  }, []);

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setMessages([]);
    setFeedback("");
    setScreen("chat");
  };

  const handleEndSession = async () => {
    if (!selectedPersona || messages.length === 0) return;
    setLoadingFeedback(true);
    setScreen("feedback");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: selectedPersona, messages }),
      });
      const data = await res.json();
      setFeedback(data.feedback ?? "フィードバックの生成に失敗しました。");
    } catch {
      setFeedback("エラーが発生しました。");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleRestart = () => {
    setScreen("select");
    setSelectedPersona(null);
    setMessages([]);
    setFeedback("");
  };

  const handleRetry = () => {
    if (!selectedPersona) return;
    setMessages([]);
    setFeedback("");
    setScreen("chat");
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {screen === "select" && (
        <PersonaSelect personas={personas} onSelect={handleSelectPersona} />
      )}
      {screen === "chat" && selectedPersona && (
        <ChatWindow
          persona={selectedPersona}
          messages={messages}
          setMessages={setMessages}
          onEnd={handleEndSession}
          onBack={() => setScreen("select")}
        />
      )}
      {screen === "feedback" && selectedPersona && (
        <FeedbackView
          persona={selectedPersona}
          messages={messages}
          feedback={feedback}
          loading={loadingFeedback}
          onRetry={handleRetry}
          onBack={handleRestart}
        />
      )}
    </div>
  );
}
