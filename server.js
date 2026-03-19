import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "qwen2.5:7b"; // 日本語が得意なモデル

// Ollamaへのリクエスト共通関数
async function callOllama(systemPrompt, messages) {
  const ollamaMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: ollamaMessages,
      stream: false,
      options: { temperature: 0.8 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama エラー (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.message?.content ?? "";
}

// ペルソナ一覧を返す
app.get("/api/personas", (req, res) => {
  try {
    const data = JSON.parse(readFileSync(join(__dirname, "personas.json"), "utf-8"));
    res.json(data.personas);
  } catch (e) {
    res.status(500).json({ error: "personas.json の読み込みに失敗しました" });
  }
});

// Ollamaが起動しているか確認
app.get("/api/health", async (req, res) => {
  try {
    const r = await fetch("http://localhost:11434/api/tags");
    const data = await r.json();
    const models = data.models?.map((m) => m.name) ?? [];
    const ready = models.some((m) => m.startsWith("qwen2.5"));
    res.json({ ollama: true, models, ready, target: MODEL });
  } catch {
    res.json({ ollama: false, models: [], ready: false });
  }
});

// チャット（ペルソナとして返答）
app.post("/api/chat", async (req, res) => {
  const { persona, messages } = req.body;
  if (!persona || !messages) {
    return res.status(400).json({ error: "persona と messages が必要です" });
  }

  try {
    const reply = await callOllama(buildSystemPrompt(persona), messages);
    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// セッション終了後のフィードバック
app.post("/api/feedback", async (req, res) => {
  const { persona, messages } = req.body;

  const feedbackPrompt = `あなたは営業トレーナーです。
以下は、営業担当者（user）と介護事業所の施設長（assistant）の会話です。
施設長のペルソナ: ${persona.name}（${persona.title}）、${persona.character}

会話を分析して、以下の形式でフィードバックしてください（日本語で）:

## 良かった点
- （具体的に）

## 改善点
- （具体的に）

## 次回試してほしいアプローチ
- （具体的に）

## 総評
（2-3文で）

厳しくかつ建設的に。表面的な褒め方はしない。`;

  try {
    const feedback = await callOllama(feedbackPrompt, messages);
    res.json({ feedback });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

function buildSystemPrompt(persona) {
  return `あなたは${persona.name}（${persona.title}）です。
${persona.facility}（${persona.facility_type}、${persona.size}、${persona.location}）を運営しています。

【あなたのキャラクター】
${persona.character}

【あなたの悩み・課題】
${persona.pain_points.map((p) => `・${p}`).join("\n")}

【懸念・不信感】
${persona.concerns.map((c) => `・${c}`).join("\n")}

【話し方の特徴】
${persona.speaking_style}

【本当の本音（表には出さない）】
${persona.hidden_need}

---
【ロールプレイのルール】
- あなたはGLS（介護事業所の加算最適化コンサル）の営業担当者と話しています
- 最初は警戒的・忙しそうな態度で接する。「うちは大丈夫です」「忙しいので」と言いがち
- 相手が誠実で具体的な話をしてきたら、少しずつ心を開いていく
- 抽象的な話や自社の売り込みばかりだと興味を失う
- 具体的な数字（「月いくら増えるか」など）を出されると反応する
- リアルな介護現場の言葉を使う
- 返答は3〜5文程度。長々と話さない
- 感情・警戒感・好奇心などを自然に表現する`;
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`GLS Sales Trainer サーバー起動: http://localhost:${PORT}`);
  console.log(`使用モデル: ${MODEL}`);
});
