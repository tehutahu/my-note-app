# R4 PDFの文字保持・境界・暗号化

- 状態：自動検証合格範囲を追加、実機未回答
- 対象：PDF-03/04
- レビューURL：https://tehutahu.github.io/my-note-app/ 。画面のcommitを記録してください。
- branch：test/pdf-boundaries-and-firefox。製品変更を伴わない回帰監査。

## 操作と期待結果

PDFに筆記して「PDFを書き出す」で保存します。WindowsのPDFビューアーで開いて元の文字を選択でき、注釈も表示されることを確認します。暗号化/パスワード付きPDFは対応外として拒否します。20MiBまたは100ページを超える場合も理由を表示し、既存ノートを保持します。

## 自動検証

`PDF-boundaries-browser.log`2成功（16.5秒）。0/90/180/270度の元文字が出力後もPDF.jsの独立した読み取りで抽出されることを確認。20MiB・100ページ同時境界を許容し、1byte超過、101ページ、破損、暗号化2種類を拒否。DBの各レコードとPDF原本の実hashを比較して保持を確認。

固定の暗号化fixtureはPDF.jsがパスワードあり/なしで既知の文字を復号できる本物の暗号化PDF。空パスワード版はPDF.jsでは開け、pdf-libでは拒否されるため、両処理器の可否が異なる場合の拒否も検証する。新しい依存は追加していない。

`PDF-boundaries-check.log`npm test50/check成功、`PDF-final-unit.log`50成功。既存機能への試験追加なので製品コードのRED先行とはしない。再現：`docker compose run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test tests/e2e/pdf-boundaries.spec.ts'`。

## 未検証

Windowsの外部PDFビューアーでの実機確認、すべてのPDF処理器差、性能と全受入の達成は未完了。ユーザー確認は未回答。
