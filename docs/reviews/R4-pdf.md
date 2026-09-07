# PDF取り込み・表示・出力（自動検証は一部完了）

URL: http://localhost:4173 。一覧の「PDFを取り込む」からPDFを選ぶ。ページ選択で移動し、ペンで注釈を書き、「PDFを書き出す」で全ページを保存する。出力PDFを再度取り込んでも注釈は個別の筆跡に戻らない。

受入ID: PDF-01〜05。PDF.js/pdf-libの2件はユーザー承認済み。原本を端末内へ保存し、表示用worker/font/CMap/WASMは同一サイトから供給する。出力時は元ページをベクターとして埋め込み、共通の筆跡輪郭を重ねる。

TDD: `PDF-ui-red.log` はボタン/取り込みUI未実装による2失敗、終了1。実装後`PDF-ui-unit.log`、`PDF-ui-check.log`成功（lint/型/coverage/build終了0）、`PDF-ui-green.log`全20E2E成功、retry 0、終了0。再現: `docker compose run --rm app npm test`、`docker compose run --rm app pnpm run check`、`docker compose run --rm e2e`。

確認済み: 回転4種×CropBox有無の8ページを表示して全ページ出力、ページ数と寸法。新規ノートの複数ページ出力、既存の筆記/蛍光ペン/保存等の回帰テスト。

未確認: 注釈マーカーの独立画素計測、元の文字選択、全上限/非互換PDF、100ページ切替と厳密なcanvas予算、実機の別PDFビューアー。現在のテスト名にPDF-02/03が含まれても、その受入ID全条件を証明したものではない。H未実施。git制限のためcommit/PRなし。

追加検証: `PDF-marker-verification.log`で8条件の原本マーカー・青い注釈点を出力後に再描画し、fixture由来の独立期待値に対して中心誤差1pt以内を確認。既存実装への検証補強として記録する。

描画予算は`PDF-cache-red.log`3失敗→`PDF-cache-green.log`41テスト成功、`PDF-cache-check.log`終了0。LRU3枚、縮小した予算の再評価、canvas解放、DPR1/2/3と大画面で表示3枚32MiB以内を確認。描画中のcanvasも残る予算に収め、旧処理を解放してから次を開始する。`PDF-cache-e2e.log`既存23E2E成功、終了0。100ページの実ブラウザー計測は`PDF-cache-browser.log`で別途実行中。

100ページ試験: `PDF-cache-browser.log`成功。DPR3/1280×800、3,581観測でcanvas最大39,265,968 bytes、画面外の画像最大3枚。往復後の連続切替で最後のページを画素確認。生値は`PDF-cache-metrics.json`。意図的なWorker遅延、JS heap、実機Hの証拠にはしていない。
