# ENV-03 機能別TDD証拠の内容監査

監査日：2026-10-10。各票の参照先を開き、runnerの失敗内容、対応する成功、変更後の `npm test` を確認した。ログの存在数や受入報告生成器の成功だけで判定していない。パスの起点は `artifacts/`。全ログのSHA-256・runner要約は `AUDIT-tdd-evidence.json` に保存する。

初期機能は当時gitが使えず、個々のRED/GREEN時点のcommitは存在しない。架空のcommitや再現REDを作らず、当時のログ・進捗・レビュー票を実行順序の記録として採用する。初期実装の保存commitは07d75cf。後続の製品変更は下表のcommit/PRで追跡できる。失敗→最小修正→成功と分離・整理の内容は各票に残し、今回の後付け回帰試験を初期実装のTDD実績へ足さない。

| レビュー票／受入 | REDの内容（runnerの実際の不一致） | 対応GREEN | 変更後npm test・check | 保存された実装 |
| --- | --- | --- | --- | --- |
| R1-pen／INK-01〜05 | INK-03-red：座標150/290≠50/100。INK-01-04-red：幅4≠1.6、hit/history未実装。INK-02-05-red：移動0≠10等。R1-e2e-red：canvasなし。R1-gestures-e2e-red：指書きボタンなし。R1-endpoints-red：終端画素とcapture解除後倍率の不一致 | INK-03-green 2、INK-01-04-green 7、INK-02-05-green 11、R1-e2e-green 1、R1-gestures-e2e-green 3、R1-endpoints-green 5 | R1-endpoints-unit 11／check成功 | 07d75cf |
| R1-input-boundaries／INK-01/03/04/05 | INK-matrix-first：外で離した線が1筆、期待0。別の消去失敗は試験座標の問題と区別 | INK-migration-matrix：Chromium/Firefox各7 | ACCEPT-matrices-final-check：npm test57＋check成功 | c79d234／#10 |
| R1-pen-switch／INK-07 | INK-switch-red：消しゴム選択trueに対してfalse | INK-switch-green：Chromium7＋Firefox3 | INK-switch-final-check：npm test52＋check成功 | 3da5c49／#6 |
| R2-saving／DATA-01/02/03 | DATA-repository-red 5：undefined/空一覧/競合非拒否。DATA-session-red 3：saved≠saving、writer0回、失敗非表示。DATA-ui-red 2：保存UIなし | DATA-repository-green 16、DATA-session-green 19、DATA-ui-green 7 | DATA-ui-unit 19／check成功 | 07d75cf |
| R2-pages／NOTE-01/03/05 | NOTE-pages-red 2：20ページにならず最終ページ削除を許可。NOTE-pages-ui-red：追加なし。NOTE-background-red：背景なし。NOTE-shapes-red 2：輪郭hit false。NOTE-shapes-ui-red：ツールなし。NOTE-highlighter-red：ツールなし | NOTE-pages-green 21、NOTE-pages-ui-green 9、NOTE-background-green 11、NOTE-shapes-unit-green 23、NOTE-shapes-ui-green 12、NOTE-highlighter-green 13 | 各機能のNOTE-*-unit/check、最後NOTE-highlighter-unit 23／check成功 | 07d75cf |
| R2-folders／NOTE-02 | NOTE-folders-red 4：100件追加して0等。NOTE-folder-storage-red 2：保存したフォルダなし、移動null。NOTE-folder-ui-red：入力なし | NOTE-folders-green 27、NOTE-folder-storage-green 29、NOTE-folder-ui-green 14 | NOTE-folder-ui-unit 29／check成功 | 07d75cf |
| R2-trash／NOTE-04 | NOTE-trash-red 3：子孫削除・復元不一致。NOTE-trash-storage-red 3：保存／保護なし。NOTE-trash-ui-red 2：操作UIなし | NOTE-trash-green 32、NOTE-trash-storage-green 35、NOTE-trash-ui-green 16 | NOTE-trash-ui-unit 35／check成功 | 07d75cf |
| R2-conflict／DATA-02/03 | DATA-conflict-red：一般保存エラーのみで競合案内なし | DATA-conflict-green 5 | DATA-conflict-final-unit 41／check成功 | 07d75cf |
| R2-migration／DATA-04 | DATA-migration-red 4：version1≠2、abort/blocked非拒否、未知版の英語。DATA-migration-ui-red 2：専用案内なし | DATA-migration-green-2 47、DATA-migration-ui-green-2 3 | DATA-migration-final-unit 47／check成功 | 25d4211／#1 |
| R2-navigation／NOTE-02/PWA-03 | NOTE-navigation-red：読込保留中に旧入力がenabled | NOTE-navigation-green 4 | NOTE-navigation-final-unit 47／check成功 | b7d227d／#1 |
| R3-transfer／XFER-01〜04/DATA-02 | XFER-backup-red 2：空snapshot・不正非拒否。XFER-storage-red：追加0。XFER-ui-red 2：入出力なし | XFER-backup-green 37、XFER-storage-green 38、XFER-ui-green 18 | XFER-ui-unit 38／check成功 | 07d75cf |
| R3-boundaries／XFER-01/03/04 | XFER-boundary-red：許容20MiBで正規表現stack overflow。XFER-integrity-red：失敗後も検証中。XFER-matrix-red／XFER-abort-cause-red：二重abortで元AbortErrorを隠す | XFER-boundaries-all 5、XFER-integrity-green 3、XFER-all-e2e 41、XFER-verified-e2e 5 | XFER-verified-check：npm test50＋check成功 | 288767a／#4 |
| R3-export-limits／XFER-02/03 | XFER-export-red／XFER-export-all-red：1001ページ・200万超points・20MiB超PDF・64MiB超合計をaccepted | XFER-export-green：unit56/境界6 | XFER-export-check：npm test56＋check＋境界6 | e3b4ff7／#8 |
| R4-pdf／PDF-01〜05 | PDF-ui-red 2：取り込み・出力UIなし。PDF-cache-red 3：LRU/解放未実装、表示canvas49,152,000>33,554,432bytes | PDF-ui-green 20、PDF-cache-green 41、PDF-cache-e2e 23 | PDF-ui-unit 38／check成功、PDF-cache-greenはnpm test41／check成功 | 07d75cf |
| R4-pdf-boundaries／PDF-03/04 | 製品変更なしの回帰監査。元実装REDはR4-pdfを参照 | PDF-boundaries-browser 2 | PDF-boundaries-check：npm test50＋check、PDF-final-unit50 | 3c69519／#5 |
| R4-shape-roundtrip／NOTE-03/05/PDF-03 | PDF-shape-edge-red：長方形角の赤255、期待<80 | PDF-shape-green：Chromium/Firefox各3 | ACCEPT-matrices-final-check：npm test57＋check成功 | a1398c2／#11 |
| R5-pwa／PWA-01〜03 | PWA-offline-red 2：準備完了/manifestなし。PWA-update-red：更新UIなし。PWA-update-green初回の1失敗も保持 | PWA-offline-green 22、PWA-update-green-2 23 | PWA-update-unit38／check成功 | 07d75cf |
| R5-distribution／PWA-03/04/UI-03 | PWA-build-red：worker変更後version同一。PWA-commit-red：worker応答にcommitなし | PWA-build-green48、PWA-final-e2e：PWA3/subpath1 | PWA-final-verified：npm test48＋check成功 | cac81fc／#2 |
| R5-responsive／UI-01/02/03/PDF-01 | UI-responsive-red：fit100%≠63%。UI-responsive-green：modal外focus（7成功/1失敗） | UI-final-e2e-2 8 | UI-verified-check：npm test48＋check成功 | 6b1c679／#3 |
| R5-performance／PERF-01〜04 | PERF-measurements-red 2：計測なし。PERF-failures-red：失敗総数なし。PERF-ui-red：診断ボタンなし。PERF-targets-first：保存開始693.1>300ms、取消20回を失敗計上 | PERF-measurements-green52、PERF-failures-green53、PERF-ui-green6、PERF-targets-optimized3 | PERF-optimized-check-2：npm test56＋check成功 | d5261cb／#7 |
| R5-save-copy／PERF-03/DATA-02/03 | PERF-fixed-labeled：保存開始322.4>300ms | PERF-copy-targets 3、PERF-copy-browser Chromium5/Firefox4 | PERF-copy-check：npm test57＋check成功 | 809bc5e／#9 |
| R5-acceptance-report／ENV-03/共通 | ACCEPT-report-red：有効な報告でfalse≠true | ACCEPT-report-green59 | 同ログnpm test59＋check成功 | c81c336／#12 |
| R5-review-samples／H補助/PWA-04 | REVIEW-samples-red：必要な5ファイルに対して空配列 | REVIEW-samples-green60、RESUME-fixed-subpath2 | RESUME-final-unit60／check成功 | 28cd18a／#12 |

すべての製品変更票で振る舞いに起因するREDと対応GREEN、変更後npm testを確認した。後付け数量・境界・移行保持・属性行列・Firefox検証は回帰監査として別記しており、ENV-03を偽のREDで補っていない。追加受入試験にも変更後npm test/checkとブラウザー結果を残す。

監査で訂正した参照：R2-migrationの `DATA-migration-ui-green.log` は28成功/1失敗である。最終成功は `DATA-migration-ui-green-2.log`（3成功）と最終統合56件の証拠。R3-transferの曖昧な「対応unit/check」は `XFER-ui-unit.log` / `XFER-ui-check.log` と明記した。

初回失敗を製品REDとしない例：PWA-subpathのサーバー二重起動、PWA-commit fixtureの文字数、NOTE-pagesのlocator、INK-matrixの画面外消去座標、PERF-Lの準備timeout、今回のPDF試験のfloat期待値。これらも元ログを保持する。Firefox並列時の初期offline準備timeoutは原因未確定の履歴であり、修正済みとしない。

追加監査票R5-clause-auditを含め24票を整備した。新規製品修正はなく、追加4 E2Eと連続入力性能の回帰監査、最後のTS変更後npm test60/check、最終Chromium60×3/Firefox60、CI成功を同票に記録。ENV-03は合格。H未実施の記載はHの未完了を意味し、現在のA状態は各票先頭と条項監査を正とする。
