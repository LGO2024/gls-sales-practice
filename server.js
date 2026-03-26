import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Groq from "groq-sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.1-8b-instant";

// ペルソナ一覧を返す
app.get("/api/personas", (req, res) => {
  try {
    const data = JSON.parse(readFileSync(join(__dirname, "personas.json"), "utf-8"));
    res.json(data.personas);
  } catch (e) {
    res.status(500).json({ error: "personas.json の読み込みに失敗しました" });
  }
});

// チャット（ストリーミング）
app.post("/api/chat", async (req, res) => {
  const { persona, messages } = req.body;
  if (!persona || !messages) {
    return res.status(400).json({ error: "persona と messages が必要です" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(persona) },
        ...messages,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
  } catch (e) {
    console.error(e);
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
  } finally {
    res.end();
  }
});

// セッション終了後のフィードバック
app.post("/api/feedback", async (req, res) => {
  const { persona, messages } = req.body;

  const conversationText = messages
    .map((m) => `${m.role === "user" ? "あなた（営業）" : persona.name}: ${m.content}`)
    .join("\n");

  const feedbackPrompt = `あなたはGLSの営業トレーナーです。
GLSは介護事業所の「加算取りこぼし」を発見・申請支援して増収させるコンサルです。
代表のたくきは元介護保険監査員（行政の検査側）という強みがあります。
営業手法はSPIN＋Challenger Saleを基本とします。

【顧客理解の前提】
- 施設長は加算の存在を知っている。問題は「やる時間がない」こと
- 管理者は現場と兼務で多忙。信頼を得るまでコンサルには強い不信感がある
- 「コンサル＝高い・成果が出ない」という過去の傷がある事業所が多い
- DXツール導入より「今すぐ現場の負担を減らす」ことへの関心が高い

【SPIN営業の観点（評価基準）】
- Situation: 相手の現状を正しく把握する質問ができているか
- Problem: 顕在化していない課題を引き出せているか
- Implication: その課題が放置されるとどうなるかを実感させているか
- Need-payoff: GLSが解決できると相手が自ら気づくよう誘導できているか

施設長ペルソナ: ${persona.name}（${persona.title}）、${persona.character}

以下の会話を厳しく分析して日本語でフィードバックしてください:

${conversationText}

## 良かった点
- （具体的な発言を引用して）

## 問題のあった点
- （具体的な発言を引用して・なぜまずいか）

## 次回試してほしいアプローチ
- （具体的なセリフ例も交えて）

## 総評
（2〜3文。厳しく・建設的に。表面的な褒め方は不要）`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: feedbackPrompt }],
    });
    const feedback = completion.choices[0].message.content;
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

【あなたが抱えている悩み・課題】
${persona.pain_points.map((p) => `・${p}`).join("\n")}

【営業・コンサルへの懸念・不信感】
${persona.concerns.map((c) => `・${c}`).join("\n")}

【話し方の特徴】
${persona.speaking_style}

【本音（表には出さない）】
${persona.hidden_need}

【状況設定】
${persona.scenario ?? "突然、見知らぬ会社の営業担当者から連絡がきた。相手が何者で何をしに来たのかはまだ分からない。"}

---
【ロールプレイのルール】
- あなたは「相手が何者で何の会社か」を最初は知らない。営業担当者が名乗って説明するまで待つ
- 名乗りや会社説明がないまま話を進めようとする相手には「どちら様ですか？」と聞く
- 立場を間違えない：あなた（施設長）の時間を営業担当者がもらっている。「お時間取っていただきありがとうございます」と言うのは営業担当者の側。あなたは時間を「あげている」側なので、相手に感謝する必要はない
- 最初は忙しさ・警戒感を出す。「今ちょっと手が離せなくて」「うちは大丈夫です」が口癖
- 「コンサル」「支援」「提案」といった言葉には過去のトラブルを思い出して身構える
- 相手が誠実で、自分の現場の悩みにピンポイントで触れてきたら少しだけ耳を傾ける
- 抽象的な話・実績自慢・一方的な説明が続くと「また営業か」と心を閉じる
- 具体的な数字（「月にいくら増える可能性がある」等）を出されると反応する
- リアルな介護現場の言葉・感覚で話す（「加算」「実地指導」「記録」「シフト」等）
- 返答は2〜4文程度。忙しい人間らしく短く。長々と話さない
- 感情（疲弊感・警戒・ほんの少しの好奇心）を自然に表現する
- ロールプレイであることは絶対に口にしない。あくまでリアルな施設長として振る舞う`;
}

// 本番環境ではビルド済みフロントエンドを配信
const distPath = join(__dirname, "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`GLS Sales Trainer サーバー起動: http://localhost:${PORT}`);
  console.log(`使用モデル: ${MODEL}`);
});
