import { useState } from "react";
import type { Persona } from "../types";

interface Props {
  persona: Persona;
}

export default function SalesMemo({ persona }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: "1px solid #eee" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "#fafafa",
          border: "none",
          padding: "8px 20px",
          fontSize: 12,
          color: "#666",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>📋 営業メモ（GLSの説明・SPIN質問例）</span>
        <span>{open ? "▲ 閉じる" : "▼ 開く"}</span>
      </button>

      {open && (
        <div style={{
          background: "#fffbeb",
          borderTop: "1px solid #fde68a",
          padding: "16px 20px",
          fontSize: 12,
          lineHeight: 1.8,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}>
          {/* GLS概要 */}
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "#92400e" }}>GLSとは</div>
            <div style={{ color: "#555" }}>
              介護事業所が取れていない加算を見つけ、申請まで支援して増収させるコンサル。
              代表のたくきは<strong>元・介護保険監査員（行政の検査側）</strong>だった人物。
              初期費用なし、月1万円＋成果報酬20%という業界最安水準の料金設計。
            </div>

            <div style={{ fontWeight: 700, marginBottom: 6, marginTop: 12, color: "#92400e" }}>よくある加算取りこぼし</div>
            <div style={{ color: "#555" }}>
              ・処遇改善加算（書類不備で未取得が多い）<br />
              ・個別機能訓練加算（記録方法を変えるだけで取れる）<br />
              ・栄養スクリーニング加算<br />
              ・口腔機能向上加算
            </div>
          </div>

          {/* SPIN質問例 */}
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "#92400e" }}>SPIN質問の流れ</div>
            <div style={{ color: "#555" }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: "#d97706" }}>S（現状把握）</span><br />
                「現在、加算はどのくらい取得されていますか？」<br />
                「書類周りは誰が担当されていますか？」
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: "#d97706" }}>P（問題）</span><br />
                「申請したいけど時間が取れないことはありますか？」<br />
                「実地指導で何か指摘を受けたことは？」
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: "#d97706" }}>I（示唆）</span><br />
                「取れていない加算が月20〜30万ある事業所も多いんですが、1年続くと…」
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "#d97706" }}>N（解決提案）</span><br />
                「もし書類だけ整えれば来月から取れるとしたら、試してみたいと思いますか？」
              </div>
            </div>

            <div style={{ fontWeight: 700, marginBottom: 6, marginTop: 12, color: "#92400e" }}>
              {persona.name}の地雷ワード
            </div>
            <div style={{ color: "#b91c1c" }}>
              {persona.concerns.map((c, i) => <div key={i}>・{c}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
