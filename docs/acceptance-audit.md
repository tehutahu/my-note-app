# 自動受入の条項別監査

2026-10-10。判定対象は製品固定版 `28cd18afa85af14d554c11b4785764632721be61` と同一の製品ソース。main `51f6e8d` は文書の追加であり、src/scripts/public/依存/コンテナ設定に差分がないことを確認した。今回追加するのは不足した受入検査と監査・レビュー案内。正式Hは[実機確認票](human-review.md)の全20 IDが未回答。

`artifacts/acceptance-results.json` はテスト名とIDの索引。この文書は各assertion・実装・実測ログを読んだ条項判定であり、reportの `successful` だけから合格を推定しない。以下のファイル名は `tests/` または `artifacts/` を起点とする。

## 共通条件と版の対応

| 条件 | 確認した証拠 |
| --- | --- |
| コンテナ限定、固定ランナー、合成fixture | Dockerfile/Dockerfile.e2e/compose.yaml、docs/environment.md。ホストNode実行・依存導入なし。PDF/ノートは合成のみ。S/L/Pのseed20260909 |
| 全unit・カバレッジ | AUDIT-unit-check.log：npm test60、lint/型/coverage/build成功。domain全対象：lines/statements/functions100%、branches98.87%。storage：lines99.12%、statements97.10%、functions95.31%、branches87.20%。vitest.config.tsは未importも含むinclude＋perFile閾値 |
| 独立E2E25本以上・Firefox・skip/retry0 | 固定版のRESUME-stability各56成功、RESUME-firefox-isolated56成功。今回の4本追加後の60件全体結果はAUDIT-final-stabilityとAUDIT-firefoxのログ・JSONで確認する |
| 同じbuildで3回連続 | RESUME-stability-summary.jsonは56×3成功、worker/build-info SHA不変。途中58×3も全成功。最終60×3の結果をAUDIT-final-stability-{1,2,3}-results.jsonへ保存 |
| 基準性能条件・生値 | RESUME-fixed-performance.log/results.json、RESUME-fixed-PERF-S/L/P.json：4CPU/8GiB cgroup、Chromium1280×800/DPR1、単独、warm後10回。連続入力補強はAUDIT-continuous-performance.log、PERF-S-continuous.json（同じ製品build） |
| CI必須化 | .github/workflows/ci.yml：build/frozen/npm test/check/境界/Chromium/Firefox/subpath/報告を必須実行。retry=0。性能は専用条件のローカルsuiteで正式判定。既存main run38039275369は再照会でもverify/deploy成功。今回の試験変更のCI結果はprogress先頭に記録 |
| 過去の失敗を保持 | RESUME-firefox-concurrent-failure-results.json（offline準備timeout2件）と単独56成功を両方保持。AUDIT-pdf-review-first.log（期待値のfloat精度誤り）は製品REDとして数えない |

## 39 A IDの条項と根拠

各行は記載した全条項を対象とする。INK-06はH専用のためA合格数へ含めない。追加検査を含む最終統合判定は共通条件の実行完了後に確定する。

| ID | 条項別に確認した観測と実装 | テスト・実行証拠 |
| --- | --- | --- |
| ENV-01 | 別project/空volumeでbuild→frozen→npm test→check→E2Eが終了0。既存volume保持 | RESUME-clean-build/install/check/e2e.log、RESUME-clean-e2e-results.json（56成功）。機能・依存・Docker設定差分0 |
| ENV-02 | app/e2e uid1000、ホーム/ルート/socket mountなし、依存専用volume、root所有の追跡ソース0 | compose.yaml、RESUME-environment-audit.json、RESUME-runtime.log |
| ENV-03 | 23票の実際の失敗理由→修正→成功・変更後npm testを照合。初期git障害と後付け回帰を明記。移行成功ログ参照を是正 | [内容監査](tdd-evidence-audit.md)、AUDIT-tdd-evidence.json、各票。今回の試験追加はAUDIT-unit-check.log |
| ENV-04 | Node/pnpm/Playwright/image tag/digest厳密固定、frozen installでlock差分0、生成物/秘密/個人データ追跡0 | Dockerfile/Dockerfile.e2e/package.json/pnpm-lock.yaml/.gitignore、docs/environment.md、RESUME-environment-audit.json |
| INK-01 | 100筆＋10可視点、圧力0.2/0.8の太さ差、pointerup終端画素を確認。低速イベントは性能試験、高速連続入力はinput-acceptance。S Pen実機はH | e2e/input-acceptance、pen、unit/ink。RESUME-e2e結果とAUDIT全体結果 |
| INK-02 | 既定touchで0筆、pan＋50、pinch200%。指書きONでのみ1筆、2本目で未確定線破棄。pen所有中touchでcamera全値不変 | e2e/pen、unit/gestures（zoom/yも比較） |
| INK-03 | 25/100/200/400%×DPR1/2/3×pan有無、各1000点往復≤0.1pt。ブラウザーでも保存座標とカーソル位置の黒画素を検査 | unit/coordinates、e2e/input-acceptanceのDPR3試験 |
| INK-04 | 10点のみ消去、110→100→110筆。100Undo/Redoの各状態はunitで順序比較、ブラウザーで数確認。新規編集でRedo無効、背景保持、保存再表示 | unit/ink、e2e/input-acceptance/pen/background/save。履歴の再起動保持は設計対象外 |
| INK-05 | cancel/lostcapture/外release/ツール変更/2本指化で未確定操作破棄、次の1入力開始。新規検査はDB不変も比較。既存名だけの「ツール変更」を訂正 | e2e/pen/input-acceptance/input-cancellation、AUDIT-clause-browser.log（2成功）。既存実装で成功、製品変更なし |
| INK-07 | pen secondaryは押下端のみ交互切替、release後維持、hover無筆跡/無消去、途中線破棄、mouse無反応。消去・Undo・再筆記・再読込 | e2e/pen-switch（2試験）、固定版両ブラウザー結果 |
| NOTE-01 | 20ページのpageIds順とタイトル完全一致、追加/移動/削除/Undo、最終1ページの削除拒否 | e2e/pages、unit/pages、repository.create/saveの0ページ拒否 |
| NOTE-02 | 100件/20階層、正常移動/改名保持。循環/21階層/不明親を拒否して元ツリー・DB不変。画面遷移中は旧操作を停止 | unit/folders、integration/repository、e2e/folders |
| NOTE-03 | 3形状×0.5/3/12pt×3色×3背景の全属性を保存後比較、各ページの形状輪郭/内部画素で区別。背景の罫線・方眼も画素確認 | e2e/attributes/shapes/background、unit/shapes |
| NOTE-04 | 子孫を同一transactionで削除/復元、元の異なる削除操作を混ぜない、親なし/削除親はroot。共有添付は最後の参照まで保持 | unit/trash、integration/repository、e2e/trash/backup-integrity |
| NOTE-05 | 同一筆の交差同色、別筆交差濃化、reload完全一致、200%ズームとPDF再描画RGB差各≤2 | e2e/highlighter |
| DATA-01 | 200筆の座標/筆圧/順序を含むJSONを20回再読込で一致。名称と一覧からの復元も確認 | e2e/save、integration/repository |
| DATA-02 | writer保留中saving、commit後saved、Quota失敗後変更保持/再試行。実IDB abortでDBの旧状態維持。未保存内容の専用形式救出 | unit/note-session、e2e/save/save-protection/conflict（出力内容も比較）。保存失敗後は再読込を促さない |
| DATA-03 | 遅い保存の追加編集を直列化、古いrevision拒否。2タブで明示競合/入力停止、コピーに各タブの点80/150を分離、reload後最新内容保持 | unit/note-session、integration/repository、e2e/conflict。Web Locks方式の代わりに受入で許された明示競合方式 |
| DATA-04 | schema1→2成功と途中abortで5store全record/PDF全byte不変、旧version保持。blocked/未知新版の日本語案内、旧接続終了callback、再試行。DB自動削除なし | integration/migration、e2e/migration/migration-preservation、src/storage/repository |
| XFER-01 | PDF＋3階層＋筆跡を別context往復、編集後再輸入。ID正規化後の全論理データ一致、原本hash/base64一致、元record保持 | e2e/backup-integrityのroundtrip |
| XFER-02 | ゴミ箱含む全体を2回独立コピー、全ID非衝突、階層/削除日/原本保持、復元後表示。超過出力は日本語のノート単位案内、元DB保持 | e2e/backup-integrity/backup-export、boundaries/backup |
| XFER-03 | JSON/未知版/循環/欠損参照/非有限数値/hash/base64等11fixtureを理由付き拒否、全store不変。100MiB UTF-8・64MiB合計・20MiB単体・200万点・1000ページの境界と超過 | e2e/backup/backup-integrity、boundaries/backup6試験、RESUME-boundaries.log |
| XFER-04 | pages/attachments途中abort、Quota、hash処理中cancelで全4store追加0/変更0。正常取り込みは一括transactionで全レコード可視化 | e2e/backup-integrity、integration/repository、src/storage/repository.importSnapshot |
| PDF-01 | 8ページの0/90/180/270＋非0 CropBoxを表示・全ページ筆記。既存400×300に加え公開R4のA4/横長/混在寸法・順序・マーカーを直接検査 | e2e/pdf/responsive/pdf-review-fixture、AUDIT-clause-browser.log |
| PDF-02 | fixture由来の独立期待座標で原本/注釈中心誤差≤1pt。出力後PDF.js画素とpdf-lib用紙寸法≤0.1pt、8ページ・上下反転なし | e2e/pdf。A4寸法はpdf-review-fixtureでも検査。同じ製品変換関数で期待値を作らない |
| PDF-03 | 3背景/3形状/蛍光ペン全ページ再描画、白紙化なし、元文字を4回転とも独立text抽出で保持 | e2e/attributes/highlighter/pdf-boundaries。外部Windows viewerはH |
| PDF-04 | 同時20MiB/100ページは成功、1byte超/101ページ/破損/暗号化/空password暗号化を理由付き拒否。PDF.jsで開けpdf-libで拒否する差も検査、全DB不変 | e2e/pdf-boundaries、tests/fixtures/pdf（合成暗号化fixture） |
| PDF-05 | 100ページ往復、連続切替で最終画像のみ。Worker要求保留→次ページ→旧要求解放でも画像不変。DPR3の全canvas最大64MiB、画面外3枚以内 | e2e/pdf-cache、unit/pdf-cache。JS heap全体を64MiBとは表記しない |
| PWA-01 | 初回準備完了→offline再起動→既存PDFへ筆記→commit→再表示→PDF/専用形式download成功 | e2e/pwa、live/smoke、RESUME-final-https-live-results.json |
| PWA-02 | standalone manifest/name/icon正常HTTP、Windows相当マウス編集経路成功。実際のAndroidインストール/独立ウィンドウはH | e2e/pwa/pen、subpath/pwa |
| PWA-03 | 旧buildの別タブ未保存時に更新拒否、保存後明示適用で全タブデータ保持。cacheはアプリprefixのみ削除。worker変更でversion更新、同じ入力なら再現 | e2e/pwa-update、integration/pwa-build、src/pwa/register、scripts/build-pwa |
| PWA-04 | /my-note-app/直リンク/restart、全precache asset HTTP200、scope一致、外部通信/書込要求0、無関係cache保持。samplesはcache外の別配信 | subpath/pwa/review-samples、RESUME-fixed-subpath.log（2成功） |
| UI-01 | 320×740/412×915/800×1280/1280×800のlibrary/editor/長いタイトルで横差≤1px、全表示button/input/select≥44×44と画面内x。主要操作到達は個別E2E | e2e/responsive＋各操作suite |
| UI-02 | キーボード作成/ツール、全表示操作に名前、focus outline、削除dialogのTab/ShiftTab循環/Escape/元ボタン復帰。診断dialogも同様 | e2e/responsive/diagnostics |
| UI-03 | 長い日本語タイトルの4幅検査、保存状態・版・バックアップ表示。移行/競合/容量/JSON/不正PDF/上限/更新失敗の日本語理由 | e2e/responsive/save/conflict/migration/backup-integrity/backup-export/pdf-boundaries/pwa-update、live/smoke |
| PERF-01 | S=2000筆×100点＋100図形、10秒以上、1020sample、handler開始→Canvas終了p95=0.20ms≤32ms。イベント処理時間であり物理総遅延ではない | performance/targets、RESUME-fixed-PERF-S.json。診断の生値/端末/版/失敗数記録もunitとe2e/diagnostics |
| PERF-02 | L=100ノート×10ページ×100筆×50点、warm後10表示中央値75.95ms≤1500ms。listはnotebooks storeのみ、loadはpages.byNotebook indexで該当分のみ | performance/targets、RESUME-fixed-PERF-L.json、integration/repository、src/storage/repository.list/load |
| PERF-03 | S10保存の開始最大24.30ms≤300、commit中央値202.05ms≤1000、失敗0。連続完了筆記30本は追加の単独4CPU/8GiB試験で最大開始≤1秒、全筆再表示。失敗はメモリー保持/明示表示し計測から隠さない | RESUME-fixed-PERF-S.json、AUDIT-continuous-performance.log、PERF-S-continuous.json、unit/note-session、e2e/save/diagnostics |
| PERF-04 | P=文字＋画像20ページ≤5MiB、warm後取込/切替/出力10回。中央値183.80/243.75/32.30ms、各≤15000/1500/30000ms、失敗0、処理中UIあり | performance/targets、RESUME-fixed-PERF-P.json、src/main/pdf-status/export button、e2e/pdf-cache |

## 追加検査の扱い

INK-05のテスト名だけにあったツール変更、PDF-01のA4を含む実表示、PERF-03の連続入力を補強した。いずれも既存製品で成功し、本番依存・製品実装の変更はない。`AUDIT-pdf-review-first.log` の失敗はPointerEventのfloat32筆圧0.800000011920929をJavaScriptの0.8と厳密比較した試験の誤り。期待値を `Math.fround(.8)` に修正し、製品のREDとは扱わない。

今後の再現：通常unit/check/E2EはSTART_HERE.mdのコンテナコマンド。性能は `docker compose -f compose.yaml -f compose.performance.yaml run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test --config playwright.performance.config.ts'`。固定commitのラベルはそのcommitと製品ソースが同一のときだけ用いる。最終状態・CI・残件は[進捗](progress.md)を正とする。
