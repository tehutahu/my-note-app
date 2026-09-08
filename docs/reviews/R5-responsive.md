# R5 画面幅・キーボード・横長PDF

- 状態：自動検証中、実機未回答
- 対象：UI-01/02/03、PDF-01
- URL：http://localhost:4173/ （production build後 docker compose up preview）。公開後の版は別途記録。
- branch：fix/pdf-fit-and-ui-verification。対象端末：Android2台/Windows。

## 操作と期待結果

横長PDFを取り込むと現在の用紙幅で倍率を計算します。ページを切り替え「用紙を合わせる」を押すと、そのページの幅に合わせます（仕様の25〜100%の範囲）。非常に幅広い用紙は最小倍率25%を維持するため指で移動して閲覧します。

Windowsではキーボードでノート作成・ツール選択を試せます。ゴミ箱の「完全削除」確認はTab/Shift+Tabがダイアログ内を循環し、Escapeで閉じて元のボタンへ戻ります。

## 証拠

- RED `UI-responsive-red.log`：横長PDFで期待倍率63%に対し100%、終了1。
- GREEN初回 `UI-responsive-green.log`：横長PDFと既存8回転/CropBox出力を含む7成功。追加UI-02でダイアログ外へフォーカスが移動し1失敗。Tab循環処理を追加。
- `UI-final-check.log`：変更後npm test48成功、lint/型/coverage/build終了0。関連E2EはUI-final-e2e.log。
- 画面幅4条件と名前/フォーカス確認は既存機能の回帰監査であり、すべてが未実装REDから始まったとは扱わない。
- 再現：`docker compose run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test tests/e2e/responsive.spec.ts tests/e2e/pdf.spec.ts'`。

## 制限と未検証

S Pen/Androidの実機は未確認。4画面幅での主要操作を確認しても、全失敗メッセージ・全設定・実機の表示まで合格とはしない。UI-03の障害fixture監査と性能診断は継続。ユーザー確認は未回答。

### GREEN

`UI-final-e2e-2.log`関連8成功（43.9秒、retry0）、`UI-verified-check.log`npm test48成功/check終了0。初回の旧画面disabledボタンへのキーボード入力はtoBeEnabledで同期し、固定sleepは追加していない。公開版はまだ72148fbのため、この修正の公開確認はCI統合後に行う。
