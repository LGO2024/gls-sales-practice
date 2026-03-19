# GLS 営業練習アプリ

介護事業所の施設長・管理者ペルソナ相手に、営業トークを練習するアプリ。
**完全無料・APIキー不要。** AIはMac上で動くので通信費もかからない。

---

## セットアップ（初回だけ）

### 1. Ollamaをインストール
https://ollama.com にアクセスして「Download for Mac」

### 2. AIモデルをダウンロード（約4GB・10〜30分）
```bash
ollama pull qwen2.5:7b
```

### 3. Node.jsをインストール（入ってない場合）
https://nodejs.org から LTS版をダウンロード

### 4. このアプリを取得
```bash
git clone https://github.com/LGO2024/gls-sales-practice.git
cd gls-sales-practice
npm install
```

---

## 起動方法

```bash
npm run dev
```

→ ブラウザで `http://localhost:5173` を開く

終了するときは `Ctrl + C`

---

## ペルソナを追加するには（翔平担当）

`personas.json` を開いて `personas` 配列に追記するだけ。

追加したら：
```bash
git add personas.json
git commit -m "ペルソナ追加: [名前]"
git push
```

だいき・たくきは：
```bash
git pull
```

---

## 音声モードの使い方

右上の「🎤 音声OFF」ボタンをクリックでONに。
マイクボタンを押して話す → 自動送信 → 返答が読み上げられる。
**Chrome推奨。**
