# 進捗と再開地点

更新日：2026-09-09

## 現在の状態（先頭は最新、以下の追記は作業履歴）

**M0〜M5の主要機能を実装しHTTPS公開済み。全A/全Hの達成は未完了。**

- 公開URL：https://tehutahu.github.io/my-note-app/ 。公開確認済みcommit735fe93。PR #1〜#6統合済み、main run34319761380のverify/deploy成功。側面スイッチ・offline筆記保存/出力も公開サイトで確認（HTTPS-switch-live.log）。
- ペン/消しゴム/Undo/Redo/指移動・ズーム/図形/蛍光ペン、ノート/ページ/フォルダ/ゴミ箱、保存失敗・競合救出、専用形式、PDF、PWA更新/subpathを実装。PDF.js/pdf-libは承認済み・導入済み。
- Tab S7+／S23 Ultraの従来R1は「問題ない、書き心地もよい」と返答。数値/OS/browser/buildは未回答。追加した側面スイッチの実機確認を依頼中。他のHの代用にはしない。
- 現在feat/performance-diagnostics。診断UI/計測/合成S/L/Pと保存・再描画最適化は作業中・未公開。PERF-03の初回未達（保存開始中央値568.55ms、commit2904.05ms）から改善し再測定中。PERF-optimized-check-2.logは56 tests/check成功。
- 残り：PERF正式値、全受入対応表と不足境界、最終同一build3回、最終空volume再現、Windows/端末間共有/PDF外部viewer/オフライン等のH。未実施を合格にしない。
- git/gh/Dockerは利用可能。Node/npm/pnpm/ブラウザー実行は全てコンテナ内。ブランチ作成/取り込み/マージはユーザーが包括承認済み。新規本番依存はこの追加機能では導入していない。

## 初期の授権・障害記録（以下は履歴、現在は上記を参照）

- **PDF.js (`pdfjs-dist`) と `pdf-lib` の本番依存追加はユーザーが2件とも承認済み。再確認不要。** まだ未導入。バージョンはコンテナ内で導入時に固定する。
- TDD・コンテナ利用はユーザー指定。ホストのNode/npm/pnpm/ブラウザーは使用していない。
- Docker Engine 29.0.1、Compose 2.40.3-desktop.1。サンドボックス外の承認されたDocker操作でbuild/run成功。
- `.git` は読み取り専用の空ディレクトリ。git statusはnot a git repository。削除・権限変更で回避しない。branch/commit/PRなし。
- `gh auth status` は既存トークン無効。公開/PR/CI実行未確認。公開リポジトリ/gh利用は許可済み。CIの定義だけで合格にしない。
- HTTPS公開URLなし。ローカルproductionはビルド後 `docker compose up -d preview` で `http://localhost:4173`。Androidからの実機確認にはHTTPS配信が必要。
- 有料サービス契約は未承認・不要。

## 証拠

- `artifacts/INK-03-red.log`：座標変換2件失敗（期待50/100に対し150/290）、終了1。`INK-03-green.log`：2件成功。
- `artifacts/INK-01-04-red.log`：筆圧・消しゴム・履歴5件失敗、終了1。`INK-01-04-green.log`：全7件成功。
- `artifacts/INK-02-05-red.log`：ジェスチャー4件失敗、終了1。`INK-02-05-green.log`：全11件成功。
- `artifacts/R1-e2e-red.log`：ノートボタン後のキャンバス不存在で失敗、終了1。`R1-e2e-green.log`：マウス筆記→消しゴム→Undo/Redo 1件成功。
- `artifacts/R1-gestures-e2e-red.log`：指書きボタン未実装で1件失敗、2件成功、終了1。キャンセル試験は追加時に既に成功であり、この部分をREDとは扱わない。
- 最新の `docker compose run --rm app npm test` と `pnpm run check`：終了0、11件成功、domainのlines/statements/functions/branches各100%。ログ：`artifacts/R1-gestures-unit.log` / `R1-gestures-check.log`。
- 最初のM0チェック実行中に次機能stubを追加したため未importファイルのcoverageで失敗した。`M0-check.log`に保存。以降は検証中の対象ソース変更を止め、`M0-check-green.log`で全体成功を確認した。
- バージョン等は `docs/environment.md`。スクリーンショットは `artifacts/pen-desktop.png`（初期E2E時点）。

## 未完了の受入条件と次の操作

- 全受入IDの全条件達成は未確定。INK-03の数値変換とINK-04の履歴は単体成功だが、DPR別実ブラウザー描画等を追加する。INK-01の100本/10点/筆圧画素、INK-05の画面外解放/ツール変更、INK-06、PERF-01は未完了。
- ENV-01〜04：別Compose projectの空volume再現、mount/uid実測、ライセンス、レビュー票の整備が残る。
- NOTE/DATA/XFER/PDF/PWA/UI/PERFの残りは未達。基本保存は実装済み、失敗時のファイル救出・複数タブUI・migrationは未完了。
- 次：M2のフォルダ・ゴミ箱、失敗時コピー救出を進める。NOTE-03の全色/太さの保存比較、NOTE-05のズーム画素も追加する。
- M1の残る定量Aと性能も実施する。実機返答待ちは独立実装の停止理由にしない。

## 最新追記：ジェスチャー接続と終端修正

- `R1-gestures-e2e-green.log`：3件成功。`R1-endpoints-red.log`：終端位置欠落とpinch capture消失の2件失敗を確認して修正。
- 最新 `R1-endpoints-unit.log` / `R1-endpoints-check.log`：11件成功、lint/型/coverage/build終了0。`R1-endpoints-green.log`：ブラウザー5件成功、retry 0。
- **ENV-01 A：現在の試作の空volume再現は合格。** `docker compose -p my-note-app-clean-20260906 build` → `run --rm app pnpm install --frozen-lockfile` → `npm test` → `pnpm run check` → `run --rm e2e`すべて終了0。証拠 `artifacts/ENV-01-clean.log`。既存projectのvolumeは保持。最終リリース時にはその版で再実行する。
- 開発依存のライセンスを `docs/environment.md` に記録。`docs/reviews/R1-pen.md` にレビュー手順・RED/GREEN・未検証点を整理。
- E2E実行中ではない。次の作業はM1の不足するA検証（100本/10点/筆圧画素、DPR別描画、画面外/ツール切替、PERF-01）とM2保存実装。全体の目標は引き続き未完了。

## M2データ層の実装開始

- `src/storage/repository.ts`：IndexedDB schema 1。ノート＋ページの同一transaction保存、commit後resolve、一覧はノートメタデータのみ、revision競合拒否。
- `src/application/note-session.ts`：ノート単位の直列保存。保存中の追加編集は最新snapshotを次に保存し、失敗時はメモリー内容保持・明示的再試行。
- `DATA-repository-red.log`：5件失敗から実装。`DATA-repository-green.log`：全16件成功。`DATA-repository-check.log`成功（storage lines100/statements95.08/functions96/branches92）。
- `DATA-session-red.log`：保存中表示・直列化・再試行3件失敗から実装。`DATA-session-green.log`：全19件成功。`DATA-session-check.log`成功。
- 保存画面はE2EのRED確認から実装中。実ブラウザーの保存・abortが成功するまではDATA項目を合格にしない。

## 最新結果：保存UIとDATA-01

- 保存・名前変更・ノート一覧・再表示を画面へ接続。Undo/Redo/消しゴムも保存する。既存試作の「再読み込みで消える」表示は廃止。
- `artifacts/DATA-ui-red.log`：保存UI未実装の2件失敗、終了1。実装後`DATA-ui-green.log`で全7件成功。
- **DATA-01 A合格**：`artifacts/DATA-acceptance-e2e.log`で200筆の座標・筆圧・順序が20回の再読み込みでJSON完全一致。Hは未実施。
- DATA-02部分：実IndexedDB transactionのabortをブラウザーで注入し、DBに追加なし、画面上の線は保持、再試行後の復元を確認。ファイル書き出し救出が残るので全体合格ではない。
- 最新npm testは19件成功、checkは終了0（`DATA-acceptance-unit.log` / `DATA-acceptance-check.log`）。全E2E8件成功、retry 0。コード変更後の必須チェックは完了。
- ローカルpreviewは起動済み、最新buildを参照。`http://localhost:4173`。build asset `index-DxzBI7b7.js`。公開URL・commit・PR・CIなし。
- `docs/reviews/R2-saving.md`にユーザー手順とRED/GREENを記録。READMEも実装状況へ更新。
- 現在実行中の検証なし。次の1手はM2のページ操作（追加/順序/最後の1ページ保護）を失敗テストから実装。続けて背景/図形/フォルダ/ゴミ箱、保存失敗時救出と競合専用UI。全体目標は未完了のまま継続。

## 2026-09-07 ページと背景

- NOTE-01 A：20ページの追加/並べ替え/名前/順序が再読み込みで一致。削除/Undo、最後の1ページ保護も確認。`NOTE-pages-acceptance-e2e.log`全10件成功。Hは未回答。
- domainページ操作は`NOTE-pages-red.log`2件失敗→実装→`NOTE-pages-green.log`全21件成功。UIは`NOTE-pages-ui-red.log`追加ボタン不存在の失敗→実装。ラベルの不一致を修正して`NOTE-pages-ui-green.log`全9件成功。
- 背景の無地・横罫線・方眼と色をページ別に保存。`NOTE-background-red.log`背景UI不存在の失敗→実装。`NOTE-background-green.log`全11件成功。画素比較で罫線と方眼、再表示、消しゴムで背景が残ることを確認。
- `NOTE-background-unit.log`（21件）、`NOTE-background-check.log`（lint/型/coverage/build）終了0。図形が未実装のためNOTE-03全条件合格ではない。
- 次は図形・蛍光ペン、フォルダ/ゴミ箱と失敗時の救出。全体目標は継続中。

## 図形3種の接続

- `src/domain/shapes.ts`で直線/長方形/楕円の輪郭・消しゴム判定を実装。`NOTE-shapes-red.log`2件失敗→`NOTE-shapes-unit-green.log`全23件成功。
- Page.elementsをStroke/Shapeの判別unionへ拡張し、入力中の図形プレビュー、確定、ページ別保存、消しゴムとUndoを接続。
- `NOTE-shapes-ui-red.log`図形ボタン不存在で失敗、終了1。`NOTE-shapes-ui-unit.log`全23件、`NOTE-shapes-ui-check.log`lint/型/coverage/build成功。
- 図形E2Eの結果は`NOTE-shapes-ui-green.log`。NOTE-03の太さ/色全組み合わせは未検証であり全項目合格とはしない。

## 最新検証と次の一手

- 図形UI：`NOTE-shapes-ui-green.log`12件成功。蛍光ペン追加後：`NOTE-highlighter-green.log`13件成功、retry 0。
- 最新必須npm testは`NOTE-highlighter-unit.log`23件成功。`NOTE-highlighter-check.log`lint/型/coverage/build終了0。storageカバレッジlines100/statements95.08/functions96/branches92。
- 確認URLは起動済みpreviewの `http://localhost:4173`。buildは最新dist。公開/commit/PR/CIの障害は変わらず。実機は未確認。
- 現在実行中の検証なし。次の実装はフォルダ階層の作成/移動/20階層制約/循環防止をTDDで進める。ゴミ箱、バックアップ、PDF、PWA、残る性能・入力定量・実機確認はすべて残る。

## 2026-09-07 フォルダ実装

- `src/domain/folders.ts`：名前1〜120文字・trim、同名許可、100フォルダ/20階層、循環/不明親/子孫を含む深さ超過の拒否。
- `NOTE-folders-red.log`4件失敗→実装→`NOTE-folders-green.log`全27件成功。domain/foldersのカバレッジ全100%。
- repositoryにフォルダの一括検証とtransaction内保存、ノート移動時のrevision更新を追加。`NOTE-folder-storage-red.log`2件失敗→`NOTE-folder-storage-green.log`全29件成功、check終了0。
- フォルダの作成/一覧/階層移動/名前変更/親変更とノート移動を画面へ接続。`NOTE-folder-ui-red.log`作成欄不存在で失敗、終了1。
- `NOTE-folder-ui-unit.log`全29件、`NOTE-folder-ui-check.log`lint/型/coverage/build成功。UI実ブラウザー結果は`NOTE-folder-ui-green.log`。
- ゴミ箱/復元/完全削除、失敗時救出、PDF、PWA等は未実装。全体目標は継続。

### フォルダUIの結果

`NOTE-folder-ui-green.log`全14件成功、retry 0、終了0。階層内の作成、ノート移動、改名、再読み込み後の配置を実ブラウザーで確認。最新build `index-DMZJdMTn.js`。実行中の検証なし。

次はNOTE-04のゴミ箱：フォルダと子孫の一括削除状態、復元（親なしはルート）、共有添付を守る完全削除をTDDで実装する。NOTE-02の不正移動をUIから操作するE2Eと全定量保存確認も残る。H未確認。

## 2026-09-07 ゴミ箱データ層

- `NOTE-trash-red.log`3件失敗→domainの一括ゴミ箱・復元を実装→`NOTE-trash-green.log`全32件成功、check終了0。
- 親なし/削除済み親はルートに復元。先に別操作で捨てた子は親の復元で戻さない。
- `NOTE-trash-storage-red.log`3件失敗→repositoryで一括transaction、ノート単独復元、完全削除と共有添付保護を実装。
- `NOTE-trash-storage-green.log`全35件成功、`NOTE-trash-storage-check.log`lint/型/coverage/build終了0。storage branches85.71/lines100/statements96.37/functions96%。
- 共有添付は残存ページが参照する間は保持し、最後の参照を完全削除した時に削除する。試験の添付は合成Blobで、PDFの描画試験ではない。
- ゴミ箱UIはREDから接続中。全体目標は継続。ユーザーから「目標を再開」の指示を受領し、同じ目標の続きとして作業中。

## 最新：ゴミ箱UI合格

- `NOTE-trash-ui-green.log`全16件成功、retry 0、終了0。親フォルダとノートの復元、完全削除確認のキャンセル/確定、再読み込み後の削除結果を確認。
- 最新npm testは`NOTE-trash-ui-unit.log`35件成功。`NOTE-trash-ui-check.log`lint/型/coverage/build終了0。レビュー票は`docs/reviews/R2-trash.md`。
- 起動中previewは最新dist `index-QN7Ed7Ck.js` を配信。http://localhost:4173。実機未確認。公開/CI/PRは既知の環境障害で未実施。
- 現在実行中の検証なし。次はM3の専用形式 `.snote`：バージョン/参照/有限数値/上限/添付SHA検証、コピーID再マッピング、原子的import、単一ノート/全体バックアップと未保存救出。
- M4 PDFの本番依存2件は承認済み。M5 PWA、性能、各受入の残る定量検証・実機確認は未完了。目標は継続。

## 2026-09-07 M3開始

- ユーザーから全体目標まで到達する指示を受領。目標範囲は維持し、バックアップ→PDF→PWA→定量/実機の残件へ継続する。
- 承認済みPDF依存をコンテナ内で導入：`pdfjs-dist` 6.3.289、`pdf-lib` 1.17.1。package.jsonとpnpm-lock.yamlに固定。
- `.snote`形式の検証・往復・UUID再マップを`src/transfer/backup.ts`へ追加。`XFER-backup-red.log`2件失敗→`XFER-backup-green.log`全37件成功、check終了0。
- 検証はJSON/版/ID/参照/循環/日時/色/有限値/配列/ページ数/点数/base64/size/SHA/PDF原本を対象。添付はPDF-libで検査、PDF.jsでの事前互換性検査はM4で追加する。
- repositoryのライブラリーsnapshot/全レコード一括追加は`XFER-storage-red.log`1件失敗から実装中。境界値/中断/画面統合はこれから。

## 2026-09-07 M3画面・M4基本経路・M5着手

- XFER UIは`XFER-ui-green.log`全18E2E成功。全体バックアップの2回コピー取り込みと不正JSON拒否をブラウザーで確認。レビュー票`R3-transfer.md`に残る検証を明記。
- PDFの取り込み・ページ表示・全ページPDF出力を実装。`PDF-ui-red.log`2件失敗から開始し、`PDF-ui-unit.log`と`PDF-ui-check.log`成功、`PDF-ui-green.log`全20E2E成功、retry 0。PDF.js 6.3の破棄APIはloading taskに適用。配信サーバーに.mjs/.wasm MIMEを追加。
- `R4-pdf.md`に実施範囲と未達を記録。回転/CropBoxの8ページ表示・出力寸法は確認済みだが、PDF-02のマーカー画素検証などは未実施。受入ID全体の合格にしていない。
- M5のオフライン/manifestは`PWA-offline-red.log`2件失敗を確認して実装中。全ローカルPDF資産をprecacheし、成功時のみ準備完了表示。更新適用の保護は未実装。`PWA-offline-unit.log`/`PWA-offline-check.log`を実行中。次は完了確認後、`docker compose run --rm e2e`でGREEN確認。
- 全体目標は継続。Aの未完了項目（境界/競合/migration/PDF精密検証/PWA更新/subpath/UI/性能/最終3回・Firefox/clean/CI）、H全端末、HTTPS/PRの障害は引き続き残る。閾値変更なし。

### M5オフライン基本経路の結果

`PWA-offline-unit.log`、`PWA-offline-check.log`終了0。`PWA-offline-green.log`全22E2E成功、retry 0。通信OFFで既存PDFを再表示、筆記・保存・PDF/.snote書き出し、再読み込みで筆跡保持を確認。manifestと192/512pxアイコンを同一サイトから提供。Androidホーム画面追加のHは未実施。現在PWA-03の別タブ未保存を含む更新テストをRED実行中（`PWA-update-red.log`）。

### PWA-03更新保護の実装中

- `PWA-update-red.log`は更新ボタン未実装で終了1。別タブの実IndexedDB保存をabortして未保存にし、更新拒否→保存再試行→明示更新→双方のデータ保持と無関係cache保持を検査するテストを追加。
- 各タブに保存状態を問い合わせ、すべて準備できた時だけskipWaitingする方式を実装。準備応答から適用まで入力を一時停止し、新規の未保存変更を防ぐ。
- 初回GREEN試行`PWA-update-green.log`は22成功/1失敗。初回installで更新ボタンを表示し、本当の新版がwaitingになる前にクリック可能になる問題を診断ログで確認。controllerとwaitingの両方を条件に修正。修正後のnpm test/checkを実行中。全体目標の完了扱いにはしていない。

## 最新：PWA更新基本経路のGREEN（全体目標は継続）

- `PWA-update-unit.log`全38テスト成功、`PWA-update-check.log`lint/型/coverage/build終了0。
- `PWA-update-green-2.log`全23E2E成功（39.4秒）、retry 0、終了0。未保存の別タブによる更新拒否、保存後の明示適用、両タブで筆跡保持、無関係cache保持を実ブラウザーで確認。
- build版ID `60ab9d971ce35566`。レビュー票 `R5-pwa.md`。現在実行中の検証はない。
- `.git`は再確認しても読み取り専用かつ有効なrepositoryではない。権限変更や回避は実施していない。HTTPS/CI/PR未実施、H全端末未確認。
- 次の実装: PDF-02の独立マーカー画素検査（4回転×CropBox有無、注釈点を全ページへ入力→出力→再描画）。あわせてPDF-05のキャッシュbudget再評価/遅延render競合をTDDで修正する。続いてXFER境界/互換性、DATA競合/migration、PWA subpath/UI/診断性能、最終全A監査。
- 次の実行コマンド: テスト追加後 `docker compose run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test tests/e2e/pdf.spec.ts'`（既存buildの検証補強として実測を記録し、後付けテストをRED先行とは表記しない）。JS/TS変更後は必ずコンテナ内npm testとcheckを行う。

## 2026-09-07 PDF座標精度と描画予算

- PDF-02検証を補強。回転4種×CropBox有無の8ページそれぞれへ青い注釈点を入力し、出力PDFをPDF.jsで再描画。fixtureから独立に算出した赤い原本マーカー中心と青い注釈中心を画素で検査し、両者とも誤差1pt以内。`PDF-marker-verification.log`2E2E成功。既存実装への検証補強であり、RED先行とは扱わない。
- PDF-05のキャッシュ上限とDPR予算は`PDF-cache-red.log`3件失敗から実装。LRU最大3枚、予算縮小時のヒット再評価、破棄時の画素解放、表示canvas3枚32MiB以内を追加。
- PDF描画を直列化し、旧処理をcancelして解放後に次を開始。作成途中のcanvasも予算へ算入し、同時ラスターによる上限超過を避ける。表示側はCSS座標を維持したまま必要時のみraster解像度を下げる。
- `PDF-cache-green.log`全41テスト成功、`PDF-cache-check.log`lint/型/coverage/build終了0。全E2Eの`PDF-cache-e2e.log`を実行中。PDF-05の100ページ往復/遅延render実ブラウザー検証は次に追加するため、受入全体は未完了。

### PDF-05ブラウザー計測の結果

- `PDF-cache-e2e.log`既存23E2E成功、終了0。`PDF-cache-browser.log`100ページ往復＋連続切替の追加E2E成功（約1分）、終了0。
- DPR3/1280×800、合成100ページPDFでcanvas合計最大39,265,968 bytes（約37.4MiB）、画面外の画像最大3枚、3,581フレーム観測。`artifacts/PDF-cache-metrics.json`へ保存。JS heapの測定ではない。
- 最終99ページのマーカー中心誤差1pt以内。連続切替は同一イベント内の連続変更であり、「旧renderを意図的に遅延させたケース」までは証明していない。PDF-05の残りとしてWorkerメッセージ遅延を注入した試験を追加する。
- 追加TSテスト後`PDF-cache-browser-unit.log`全41成功。`PDF-cache-final-check.log`を実行中。次はcheckの完了確認、その後PDF処理遅延/上限/文字保持、XFER全境界・互換性、DATA競合/migration、PWA subpath/UI/性能、最終全A監査。全体目標は継続。

`PDF-cache-final-check.log`はlint/型/coverage/buildすべて終了0。現在実行中の検証なし。次の具体的作業は`tests/e2e/pdf-cache.spec.ts`へWorkerのRenderPageRequest遅延を注入し、遅延中に次ページへ移動して古い画像が後から上書きしないことを確認する。再現コマンド: `docker compose run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test tests/e2e/pdf-cache.spec.ts'`。その後コンテナ内npm test/check。

## 2026-09-07 PDF遅延と編集競合

- `PDF-delayed-worker.log`はWorkerのGetOperatorList要求を保留し、次のページを表示した後に解放しても旧マーカーが戻らないことを確認、1E2E成功。最初の試行はテストのWorker.postMessageオーバーロード型でbuild失敗し修正。未実装REDの証拠にはしていない。
- DATA-03の競合UIをTDDで追加。`DATA-conflict-red.log`は汎用の保存失敗文言しか出ず「競合」が見えない期待不一致、終了1。
- ConflictErrorで競合を区別し、筆記・ツール・タイトル変更を停止。途中の未確定操作も破棄する。「変更をコピーとして保存」で未保存snapshotをルートの独立ノートへ一括保存し、元の他タブのcommitを保持する。PDF添付が必要なら原本を含めてUUID再マップする。
- `DATA-conflict-green.log`で2タブの明示競合・編集停止・ファイル救出・独立コピーの両座標保持、保存回帰、PWA更新を検証。変更後の最終npm test/checkを`DATA-conflict-final-unit.log`/`DATA-conflict-final-check.log`へ実行中。
- 次はDATA-04のschema移行/途中abort/旧接続ブロックと日本語案内。PDFの上限/文字保持、XFER境界・互換性、PWA subpath/UI/診断性能、最終全A・H監査も未完了。全体目標は維持して継続する。

### 最新：競合処理の検証完了範囲

`DATA-conflict-green.log`関連5E2E成功（16.3秒、retry 0、終了0）。`DATA-conflict-final-unit.log`41テスト成功、`DATA-conflict-final-check.log`lint/型/coverage/build終了0。build版ID `387b8c65b07dcd7d`。実行中の検証なし。レビュー票は`R2-conflict.md`。全体受入は未完了。

次の具体的作業: DATA-04で現在のIndexedDB schema1からの非破壊移行をテスト先行で整備する。旧接続を意図的に開いたブラウザーでblockedを再現し、日本語案内と旧データ保持を確認する。現状Repository.openはonblocked対応がなく、mainもopen失敗理由を捨てている。再現コマンドは追加後 `docker compose run --rm app npm test`、`docker compose run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test tests/e2e/migration.spec.ts'`。新規本番依存は不要。

## 2026-09-08 GitHubリモート登録

- `.git` が空で有効なリポジトリではなかったため、既存ファイルを `.gitignore` に従って登録し、`main` の初回コミット `07d75cf`（`chore: initialize note app project`）を作成。
- GitHub CLIのネットワーク接続可能な実行経路で `gh auth status` と `gh api user --jq '.login'` を確認。アカウント `tehutahu`、API応答ともに成功。
- GitHub公開リポジトリ `https://github.com/tehutahu/my-note-app` を作成し、`origin` に登録。`main` をpush済み。ローカルは `main...origin/main` で差分なし。
- `dist/`、`artifacts/`、PDF、`.snote`、`.env*` は `.gitignore` により初回pushへ含めていない。
- GitHub Actions/CIはpush直後で、成功結果は未確認。次回開始時は `gh auth status`、`git status --short --branch`、`gh run list --limit 5` を確認する。

## 2026-09-08 DATA-04保存形式の移行

- `DATA-migration-red.log`4失敗（schema2への移行、abort、blocked案内、未知schema拒否の未実装）から開始。
- IndexedDBをschema2へ移行。pages.byNotebook索引を非破壊で追加し、ノート読み込みで索引を使って取得後に保存済みpageIds順へ並べる。バックアップのschemaVersionは1のまま。ノート/ページ内容の変換や削除は行わない。
- onblockedでは日本語で別タブを閉じる案内を出し、そのopen要求を放棄。後から接続が空いても勝手に移行せずabortする。versionchangeでは接続を閉じて画面へ案内。未知の新版は拒否し、DBを自動削除しない。
- `DATA-migration-ui-red.log`2E2Eでgeneric起動エラーしか出ない期待不一致を確認し、mainへ具体的な日本語理由を接続。
- 最初のcheckはstorage branches84.88%で閾値85%未達。versionchange通知と同期例外の取り消し試験を追加し、`DATA-migration-green-2.log`/`DATA-migration-check-2.log`成功。閾値は変更していない。
- 実ブラウザーの旧接続blocked、versionchange途中abort、接続終了案内/未知新版拒否を含めた全E2Eを`DATA-migration-ui-green.log`へ実行中。未実行項目を合格にはしていない。

### DATA-04全体E2Eの初回結果

`DATA-migration-ui-green.log`は28成功/1失敗（約2分）。移行案内のテストでrole=alertが通知と空のlibrary-errorの2件に一致したためstrict locator失敗。画面には意図した案内が出ていた。対象を保存接続の通知に限定してテストを修正。アプリの移行/保存コードはこの修正では変更していない。`DATA-migration-final-unit.log`成功、final-check実行中。その後、移行関連3E2Eを再確認する。

### DATA-04の検証結果と環境再確認

`DATA-migration-ui-green-2.log`移行関連3E2E成功（4.6秒、retry 0、終了0）。`DATA-migration-final-unit.log`47テスト成功、`DATA-migration-final-check.log`lint/型/coverage/build終了0（storage branches86.04%）。全体E2Eの初回は28成功/locator失敗1であり、全体29件の単一GREEN実行とは区別する。build版ID `b84e0af582b8ec35`。現在実行中の検証なし。

`gh auth status`を再確認し、現在はtehutahuアカウントで認証成功。以前の「GitHub認証が無効」という障害記録は現在状態ではない。Gitディレクトリが実環境で利用可能かを読み取り再確認中。アクセス制限の変更や削除による回避は行わない。全体目標、残るPDF/XFER境界・PWA subpath/UI/性能・最終監査/Hは継続。

### Git/GitHubの現在状態（以前の障害記録を更新）

実環境への読み取りで有効なGitリポジトリを確認。mainはorigin/mainを追跡し、remoteはhttps://github.com/tehutahu/my-note-app.git。直近commitは5a8bf18（remote設定記録）。サンドボックス内の.gitの見え方を変更せず、許可されたgit/gh操作を実環境で行う。GitHub認証・ネットワークも利用可能。既存CI run 34166518019の失敗は、移行のREDテスト4件に対して実装前のmainだったため。今回の移行差分を機能ブランチ/PRにまとめてCIへ渡す。

### PR #1 CIの権限修正

PR https://github.com/tehutahu/my-note-app/pull/1 を作成。commit25d4211。CI run34167157743はcheckで `/workspace/artifacts` 作成EACCES（`CI-migration-failure.log`）。固定UID1000とrunnerのcheckout所有UIDが異なるため。ComposeにAPP_UID/APP_GID（既定1000）を追加し、CIでrunnerのIDを渡す修正を行う。非root要件は維持し、ソースのchmod/chownは行わない。現在のPRはCI未合格のため未統合。

### CIでのNOTE-02テスト同期修正

UID修正後のCI run34167346309はcheckまで成功し、E2E28成功/1失敗。NOTE-02が名前変更クリック直後にreloadし、非同期transactionのcommit前にページを破棄していた（`CI-migration-e2e-failure.log`）。保存後のlibrary再描画で更新される見出し「会議 / 確定」を待ってからreloadするように修正する。固定sleepやretry追加、受入基準緩和は行わない。CI権限問題は解消済み。

## 2026-09-08 再開・フォルダ移動競合の根本修正

- 前回は自動承認レビュー側の利用上限でDocker実行が拒否された。ユーザーの再開指示後、通常のDocker実行が可能になったことを確認し、同じテストから再開。
- CI run34167658687は見出し待ちを加えてもNOTE-02が失敗。単なるcommit待ちだけでなく、移動中も旧フォルダの入力欄が操作できる競合があった。先の「reload前の待ちだけが原因」という記録は不十分だった。
- `NOTE-navigation-red.log`でDB読み込みを保持し、移動中の旧入力欄がenabledのままである失敗を確認。
- 画面遷移と整理操作をwithViewLockで囲み、旧controlsをdisabled、mainをinert/aria-busyにする。完了/失敗時に解除し、処理中のPWA更新も拒否する。旧ノートcanvasへの入力も停止する。
- `NOTE-navigation-green.log`関連4E2E成功（9.6秒）：元のフォルダ操作、遅延中の旧画面停止、競合コピー、PWA更新。固定sleep/retry追加なし。
- 変更後npm test/checkを`NOTE-navigation-final-unit.log`/`NOTE-navigation-final-check.log`へ実行中。PR #1へ反映しCIを再確認する。目標全体は継続。

## CI成功・統合承認待ち（下記の再開で解消）

- PR #1のhead b7d227df195d21ca166a07d3267ed249b50651c3でCI成功。push run34192175731（2m13s）、PR run34192178411（2m14s）ともsuccess。
- GitHubの新規環境でimage build→frozen install→npm test47成功→check成功→E2E30成功（1.4分、retry 0）。証拠`artifacts/CI-migration-success.log`。ローカルの`NOTE-navigation-final-unit.log`/`NOTE-navigation-final-check.log`も成功。
- `gh pr merge 1 --squash --delete-branch --match-head-commit b7d227df195d21ca166a07d3267ed249b50651c3`は自動承認レビューに拒否された。理由は「PRをsquash mergeしてmainへ統合しブランチを削除する外部状態変更で、CI成功だけではユーザーの明示的な統合承認になりません」。操作は未実行。回避は行わず、検証済みPRの統合とブランチ削除をユーザーへ確認する。
- 実行中の検証なし。goalは未完了で継続。承認後はPR head/CI状態を再確認して統合する。独立した残件はPWA subpath/Pages準備、PDF/XFER境界・互換性、UI/診断性能、最終3回・Firefox・全受入/H監査。
- 公開HTTPSは未設定。先のGit/GitHub不可という障害は解消しており、現在の統合待ちは自動承認レビューによる明示承認要件。

## 2026-09-08 統合承認・PWA配布

- ユーザーが「ブランチの作成やマージ取り込み操作は全て承認を待たずやってよい」と明示承認。以後このGit操作の再確認は不要。PR #1を検証済みhead指定でsquash mergeし、mainのb946599を取り込み済み。ローカルの未コミット進捗は一時stashから復元して保持した。
- 新ブランチfeat/pwa-distribution。PWAのworkerだけを変えた時に版/cache名が変わらない問題を修正。生成スクリプト自身もhashへ含め、旧版cacheと更新版cacheを分ける。`PWA-build-red.log`同一versionの期待不一致（終了1）→`PWA-build-green.log`48テスト成功。
- 配布commit短縮値をworkerのSTATUSに含め画面に表示。未指定のローカルbuildは「ローカル」。`PWA-commit-red.log`commit欠落の期待不一致（終了1）。最終npm test/checkは`PWA-final-unit.log`/`PWA-final-check.log`へ実行。
- PWA-04専用Playwright設定・回帰試験を追加。最初の設定はdefineConfigのwebServer結合で2サーバーが起動しEADDRINUSE、設定修正後`PWA-subpath-2.log`1成功（21.1秒、retry0）。既存サブパス機能の回帰確認であり、製品の未実装REDとはしていない。205アセット/manifest/icon/scope、PDF直リンク、offline再起動・筆記保存、外部通信/書込み要求/404なし、無関係cache保持を確認。
- CIにsubpath build/testとmain成功後のPages配信を追加中。配布対象はテスト済みdistのみ。HTTPS到達はまだ未確認。全A、PDF/XFER境界、UI/性能、Firefox/3回安定性、Hは引き続き未完了。

### PWA配布の最終ローカル検証

`PWA-final-unit.log`/`PWA-final-check.log`の初回は試験用commitが39文字のため「ローカル」と判定され1失敗。fixtureを40文字へ修正し、`PWA-final-verified.log`でnpm test48成功、check全成功（終了0）。入力値検査は緩めていない。現在`PWA-final-e2e.log`で既存PWA3件とsubpath1件を再検証中。

`PWA-final-e2e.log`は既存PWA3件成功（9.7秒）＋subpath1件成功（6.2秒）、いずれもretry0/終了0。公開前の関連検証完了。CIへ反映し、全体E2Eを新規runnerで確認する。

## PWAのCI統合と画面検証の継続

- PR #2（cac81fc）push run34195409178/PR run34195438989ともCI成功。mainへsquash mergeし72148fbを取得済み。
- GitHub Pagesをworkflow配信として設定済み（HTTPS強制）。予定URL https://tehutahu.github.io/my-note-app/ 。main run34195652006で全チェック・配布を実行中。まだ公開到達成功とはしていない。
- fix/pdf-fit-and-ui-verificationへ移動。`UI-responsive-red.log`：4画面幅320/412/800/1280で横はみ出し≤1px、主要操作44px以上、長い日本語タイトルの表示を確認。横長PDF初期倍率は期待63%に対して100%で失敗（終了1）。現在ページのwidthPtを使うfitZoomへ修正。
- `UI-responsive-green.log`はPDF関連と4画面幅で7成功、UI-02がTab巡回時のダイアログ外フォーカスで1失敗。確認画面のTab/Shift+Tabをボタン間で循環する処理を追加。`UI-final-check.log` npm test48成功/check終了0。`UI-final-e2e.log`関連8件を再検証中。
- 公開サイト用の独立設定playwright.live.config.ts/tests/live/smoke.spec.tsを追加。EXPECTED_COMMITの一致、合成PDFのオフライン再起動/筆記保存/二形式出力、外部通信と404なし、画像記録を確認する。公開成功後にDocker内で実行する。

### HTTPS初回公開とUI関連検証

main run34195652006はverify/deployともsuccess、2026-09-08 06:42:28 UTC完了。https://tehutahu.github.io/my-note-app/ の版72148fb（PWA hash0e8cad383bd7238a）へ実ブラウザーで到達した。`HTTPS-live.log`1成功（22.5秒）：合成PDF、通信OFF再起動、筆記/保存/二形式出力、404/外部通信/POST等0。写真はartifacts/https-library.png、https-editor.png。初回editor画像は再描画途中だったためPDF表示完了待ちを加えて`HTTPS-live-2.log`へ再実行中。ユーザーの実機Hは未回答。

`UI-final-e2e.log`はダイアログ試験前にdisabledな旧画面ボタンへfocus/Enterを送る試験同期不足で7成功/1timeout。toBeEnabled待ちを加え`UI-final-e2e-2.log`8成功（43.9秒、retry0）。Tab/Shift+Tab循環、Escape閉鎖、起点ボタンへのfocus復帰が成功。`UI-verified-check.log`npm test48成功/check終了0。PR化してCI/公開へ反映する。

`HTTPS-live-2.log`も1成功（19.8秒）。最終再起動後のPDF表示完了を待って画像を保存済み。`UI-final-unit.log`48成功。実行中の検証なし。

### PR #3 CIの一覧測定の同期

run34232383303は35成功/1失敗。320px試験の「一覧へ戻る」直後、旧エディターのcontrols.all()の添字を非同期に追い、一覧再描画後にnth(11)が消えてtimeout。`CI-ui-failure.log`を記録。戻り先見出しを待ち、サイズ計測はevaluateAllの同じ瞬間のsnapshotに変更。`UI-ci-sync-green.log`6成功、`UI-ci-sync-unit.log`49成功（並行して作業中のbackup追加1件含む）。試験の同期修正のみをPR #3へ反映する。

独立したXFER作業はまだ未コミット。`XFER-boundary-red.log`で20MiB PDFのbase64正規表現がMaximum call stack size exceeded。正規形と長さ/atob/btoaによる検査へ修正し、`XFER-boundaries-all.log`20MiB・添付64MiB・1000ページ・200万点・UTF-8 100MiBの許容境界と超過の5試験成功（11.36秒）。`XFER-boundary-check.log`49テスト/check成功。PR #3のCI合格後に別ブランチへ持ち越し、実ブラウザー復元/不正fixture/取り込み原子性の残件を継続する。

## 2026-09-08 バックアップ境界・取り込み保護

- PR #3は8ee53abで両CI成功、mainへ統合（4f6c3fd）。main run34233375283もverify/deploy成功。`HTTPS-ui-live.log`実サイト1成功（20.5秒）：commit4f6c3fd、合成PDFのoffline再表示・筆記保存・二形式出力。実機Hは未回答。
- 現在fix/backup-size-boundaries。作業中の差分は範囲限定stashで保持して復元済み。新規本番依存なし。
- `XFER-boundary-red.log`20MiB PDFのbase64正規表現でRangeError。長さを先に検査し、atobの例外とbtoaの正規形照合へ変更。Uint8Arrayはサイズ確保後にbyteを埋め、巨大な中間配列を作らない。`XFER-boundaries-all.log`5成功（11.36秒）：20MiB PDF、64MiB添付合計、1000ページ、200万点、UTF-8 100MiBそれぞれ許容境界/超過。専用vitest.boundaries.config.tsをCIへ追加、通常npm testからは分離。
- `XFER-integrity-red.log`：20MiB PDFは実ブラウザーで復元/表示成功。破損JSONの失敗後に検証中の表示が残り1失敗。失敗状態表示を修正。`XFER-integrity-green.log`3成功（15.3秒）：20MiB原本hash/base64一致、失敗状態、PDF＋3階層を独立browser contextへ往復して編集・復元・元データ保持。
- 不正format/version/reference/cycle/finite/hash/base64/size/PDF page/duplicate ID/corrupt PDFの11fixtureとDB前後比較、commit途中abort/QuotaExceededError/検証中キャンセルをE2Eへ追加。
- `XFER-matrix-red.log`4成功/1失敗：途中abort時、二重abortのInvalidStateErrorで元の原因が隠れて英語表示。`XFER-abort-cause-red.log`でも元AbortErrorがInvalidStateErrorへ置換される失敗を確認。Repository.transactionで再abortが失敗しても元の例外を保持。取込のDOMExceptionには日本語の容量不足/中断案内を表示する。
- `XFER-abort-check.log`npm test50成功/check終了0。現在`XFER-all-e2e.log`全41件を実行中。未完了のまま成功とはしていない。全体目標にはPDF-04の全拒否fixture/文字保持、XFERゴミ箱往復の追加監査、UI失敗状態、診断性能、最終Firefox/3回/全受入対応表、各実機Hが残る。

### バックアップ全体回帰の結果

`XFER-all-e2e.log`41成功（2.5分、retry0、終了0）。不正fixture11種類、3階層/PDF往復、途中abort/容量不足/キャンセルも成功。最後のattachments store追加時にabortするケースと3階層追加をXFER-04へ補強し、`XFER-verified-check.log`npm test50成功/check終了0。`XFER-verified-e2e.log`で関連5件を再検証中。追加後にCIへ反映する。

`XFER-verified-e2e.log`関連5成功（15.8秒、retry0、終了0）。実行中のローカル検証なし。

## 2026-09-09 CIとFirefoxの再開

PR #4（288767a）のCI run34234388906/34234375038は40成功/1失敗。11種類の不正fixture試験が連続exportの11回目でdownloadイベント待ちtimeout。データ保持の検証を、全4storeの同一transaction snapshotとPDF blobのbyte列の直接比較へ変更した。ブラウザーの連続ダウンロード制限が疑われるが断定はしない。書き出し自体は往復/20MiB試験で別途検証する。`CI-backup-failure.log`とダウンロードartifactを保存。`CI-backup-sync-check.log`npm test50成功/check成功、`CI-backup-sync-green.log`関連5成功（50.1秒）。既存fixtureもPDF付きにして原本保持まで比較している。

Firefox初回`Firefox-first.log`は38成功/3失敗（5.0分）。3件とも移行fixture用manifestへのnavigateがDownload is startingで止まり、製品の移行処理には未到達。same-originのroute専用HTML準備ページへ変更し、`Firefox-migration-green.log`へ3件を実行中。firefox設定とmigrationテスト変更は未コミットで、PR #4修正とは別に扱う。PDF.jsのlegacy entryは既存コンテナのNode22/24でimport可能と確認、新規依存は導入していない。

## 2026-09-09 PDF境界とFirefoxの統合試験

- PR #4は851b944で両CI成功（34291061246/34291065204）。squash mergeしてmain dc26e7bを取得、test/pdf-boundaries-and-firefoxへ移動。ユーザーへ公開版でAndroid2台のR1実機確認をasyncで依頼済み、未回答。実装の待ち条件にはしない。
- `Firefox-migration-green.log`3成功（1.1分）、同じHTML fixtureで`Chromium-migration-html.log`3成功（4.8秒）。この変更は製品の修正ではなく、manifestがFirefoxでdownloadになる試験準備の修正。
- Node22/24の既存コンテナでpdfjs-dist/legacy/build/pdf.mjsを読み込み可能と確認。tests/fixtures/pdf.tsに個人情報のない固定PDF 1.4/Standard revision2の暗号化fixtureを作成。空パスワード/指定パスワードをPDF.jsが実際に復号して既知文字列を抽出でき、pdf-libは暗号化として拒否することを検証。
- `PDF-boundaries-browser.log`2成功（16.5秒）。4回転の注釈PDF出力で元の文字抽出が一致。20MiBかつ100ページのPDFを許容、1byte超過/101ページ/破損/暗号化/空パスワード暗号化を拒否し、既存DBの4storeとPDF blob実SHA-256が不変。空パスワード暗号化はPDF.jsで開けてもpdf-libが拒否する処理器差のfixtureとしても検証した。未知のすべての非互換PDFに対する保証ではない。
- 製品変更なしの回帰監査として追加したため、PDF試験を未実装REDから始めたとはしていない。`PDF-boundaries-check.log`npm test50/check成功、`PDF-final-unit.log`50成功。
- CIへChromiumの後、同一distでFirefox全体試験を追加。現在`Firefox-full-green.log`で43件を実行中。全体結果が出るまで合格としない。次の実装はPERF診断UI/計測とS/L/P fixture、残る受入監査と最終3回。必要Hは未回答。

## 2026-09-09 Android実機の返答と側面スイッチ追加

ユーザーからTab S7+／S23 Ultraそれぞれ「問題ない、書き心地もよい」とR1への返答を受領。筆記・消しゴム・Undo・指2本拡大の依頼に対する定性的な肯定結果として記録する。OS、ブラウザー、画面の版番号、1〜5の数値は未回答であり補完しない。全H項目の合格とはしない。

追加要望：S Penの側面スイッチでペンと消しゴムを切り替える。押すたびに選択を切り替え、離しても維持する。penのsecondary buttonのみ対象にし、マウス右ボタンは対象外。押し続けて繰り返し切り替えない。筆記途中の切り替えは未確定線を破棄する（INK-05）。追加機能の実機確認はこれから。

Firefox全体は42成功/1失敗（Firefox-full-green.log、5.4分）。唯一の失敗は更新試験の初期オフライン準備が既定5秒を超えたことで、更新処理には未到達。既存PWA試験と同じ20秒の初期準備待ちに揃えて再実行する。PERF recorderの独立した未接続実装は保持（unit RED2件→GREEN52件）、性能達成とはしていない。

## 2026-09-09 側面スイッチ統合と診断UI

- PR #5は3c69519、PR #6は3da5c49でpush/PRのCI全成功。#5をmainへ統合し#6のbaseをmainへ変更、CLEAN/全check成功を確認して統合。mainは735fe93。公開run34319761380を監視中。側面スイッチはINK-switch-green.logでChromium7成功/Firefox3成功、INK-switch-final-check.logはnpm test52/check成功。実機スイッチは未確認。
- feat/performance-diagnosticsへ移動、以前からの未コミット計測コードを保持。PERF-failures-red.logで生値の上限後に失敗総数が出ないことを確認し、総件数/総失敗数を分離。PERF-failures-green.log全53成功。
- PERF-ui-red.logは動作の計測ボタンが存在せず1失敗。診断dialog、開始/停止/JSON、温度/省電力選択、メモリー上の上限付き記録、筆記/表示/保存/PDFへの計測接続を追加。PERF-ui-check.log53成功/check成功。PERF-ui-green.logは診断＋スイッチ＋保存6成功（30.9秒）。遅い保存のqueueを含める回帰試験を追加中。
- 合成S/L/P fixture、4 CPU/8GiB Compose override、専用性能suiteを作成中。現時点でPERF数値合格とはしていない。実装/テスト/fixtureとも未コミット。次：npm test/check→playwright.performance.config.tsで実測→不足修正→通常/Firefox回帰→機能PR。全体目標の受入監査・最終3回・未回答Hは継続。

### 公開確認と最初の性能測定

main run34319761380はverify/deploy成功（5分55秒）。HTTPS-switch-live.logは735fe93の公開サイトで側面スイッチ・offline PDF再表示・筆記保存・二形式出力を確認、1成功（21.5秒）。ユーザーに両Androidの側面スイッチ確認を依頼済み。

PERF-targets-first.logはcgroup cpu.max=400000 100000、memory.max=8589934592を確認。Sは1000move/1020イベント、保存10回。入力p95=0.30ms、保存開始中央値568.55ms、commit中央値2904.05msでPERF-03未達。生値をPERF-S-before-optimization.jsonへ保存。初回はHTTPS検証と一部時間帯が重なったため、改善後の正式測定は他の検証と分離して再実行する。重複snapshotコピーと全筆跡再描画を削減中。線の間引きや保存完了表示の前倒しは行わない。

### 性能改善後の結果

PERF-targets-optimized.logは4CPU/8GiBで単独実行、S/L/Pの3試験成功（1.1分、retry0）。build PWA hash0ea1a479dd0b4f0d、未コミット版。Sは1020イベント/10保存：入力p95 0.30ms、保存開始中央値200.55ms・最大215.60ms、commit中央値465.55ms、失敗0。Lはwarm10回のノート表示中央値96.35ms。Pは10回の取り込み中央値216.55ms、ページ表示中央値285.80ms、全ページ出力中央値41.70ms、失敗0。生値PERF-S/L/P.json。これはA条件での測定でありAndroid Hの性能を証明しない。コミット後の固定版でも計測を再現する。

Lの初回はtraceから約2〜3秒×100回のfixture転送が準備時間を占有し、warm-up click中に全体timeoutしたと確認。ブラウザー内生成に変更して全体11.7秒で成功。Pの初回は20件の旧renderキャンセルを失敗に数えていた。現在ページのCanvas反映まで測り、obsolete renderを集計しない修正後に成功。

PERF-optimized-check-2.logは56 tests/check成功。新規ページ/他ノート所有ページの途中rollbackを追加した。現在PERF-full-regression.logでChromium→Firefoxの全体を実行中。最適化の外観・消去・Undo・PDF・オフラインまで確認してPR化する。

## 性能PR統合と書き出し上限の修正

PERF-full-regression.logはChromium46成功（3.1分）/Firefox46成功（5.4分）、retry0。PR #7 head d5261cbのpush run34357156167/PR run34357210417はsuccess。セルフレビュー後にsquash merge済み。新しい公開runはこれから確認する。

fix/backup-export-limitsでXFER-02の残件を修正。XFER-export-all-red.logは1001ページ/200万点+1/20MiB+1/64MiB+1がacceptedになり4期待不一致。読み込み可能上限を出力にも適用し、日本語の書き出し失敗・分割案内へ統一。Blob実サイズを使う。XFER-export-check.logはnpm test56/check成功、上限ちょうどの出力と超過拒否を含む境界6成功（20.39秒）。XFER-export-browser.logで画面の案内・既存データ保持・従来の往復を検証中。

XFER-export-browser.logは上限超過の日本語案内/1001ページ保持＋既存バックアップの6試験成功（16.7秒、retry0）。PR #7統合後のmainは436f410。性能の再現用にgit archiveで/tmp/my-note-app-perf-436f410へ固定ソースを展開し、独立したdistで測定中。メイン作業のソース/ビルドとは分離した。次は書き出し修正のPRとCI、残る受入境界・対応表・最終3回。

## 固定版再測定での未達と追加修正

PERF-fixed-436f410.log（固定ソース、版表示ローカル）は3成功。BUILD_COMMITを40桁に修正したPERF-fixed-labeled.log（PWA7fa3088a2c0f24ae /436f410）はSの保存開始最大322.40msで300msを超え、1失敗/2成功。保存commit中央値549.30msは基準内。生値をPERF-fixed-436f410-S/L/P.jsonへ保存。成功した前回だけを採用せずPERF-03は再修正扱い。

fix/save-copy-latencyで、保存コピーをschema上の各可変フィールドの明示コピーへ変更。筆跡pointsを汎用serialization経由でコピーしない。背景/筆跡点/図形/PDF viewBox/ページID配列の独立性を回帰テストへ追加。PERF-copy-check.logは57 tests/check成功。現在PERF-copy-targets.logで4CPU/8GiBの性能を再測定中。

独立して追加した未コミットtests/e2e/input-acceptance.spec.tsはINK-matrix-first.logで2失敗。100本/10点/100履歴までは成功、消しゴムのクリックがviewport外だった試験準備を修正予定。もう1件はcanvas外でreleaseした途中線が保存されるINK-05不一致で、性能修正と分けて対応する。現時点で未解決。

PERF-copy-targets.logはS/L/P3成功（1.1分）。Sの保存開始中央値17.55ms/最大36.80ms、commit中央値293.60ms、入力p95 0.30ms、失敗0。独立した深いコピーを保ちながら汎用serializationを省いた。PERF-copy-browser.logで保存・競合・診断をChromium/Firefoxで検証中。PR #8のpush/PR CIも合格し統合した。残るINK-05領域外解放の修正と入力/属性/移行/ゴミ箱の受入補強は別ブランチで続ける。

## 2026-09-10 入力/PDF受入の補強

前日のcommit/pushは自動承認レビューが利用上限を理由に拒否。9/10に利用上限解除を確認し、同じ承認済み操作を再開した。保存高速コピーを809bc5eでPR #9へ送り、push/PR CI成功後に統合（main9ed1e57、run34401649883 verify/deploy成功）。

INK-matrix-first.logでcanvas外releaseが1筆保存される不一致を確認し、領域外は未確定操作を破棄する修正。100本/10点/筆圧画素/100回Undo/Redoの試験は消去用クリックのviewport外座標を修正。INK-migration-matrix.logは入力5＋全store/Blob移行2の7件がChromium/Firefoxとも成功。

PDF-shape-edge-red.logは長方形開始角の画素が背景になる不一致。PDFのline cap/joinをCanvasと同じRoundへ修正。PDF-shape-green.logは属性3形状×3幅×3色×3背景、PDF画素、蛍光ペンの再表示/200%/PDF色差、ゴミ箱2コピー/原本/復元を含む3件が両ブラウザー成功。ACCEPT-matrices-final-check.logとHTTPS-copy-live.logを実行中。

ACCEPT-matrices-final-check.logは57テスト/check成功（終了0）。HTTPS-copy-live.logは公開9ed1e57で1成功（20.3秒、終了0）。入力とPDFの変更はこれから別PRで統合する。
