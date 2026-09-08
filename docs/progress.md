# 進捗と再開地点

更新日：2026-09-07

## 現在の状態

**M0環境とM1筆記の基本、M2の保存・複数ページ・背景・図形・蛍光ペンまで接続。全体の実装完了・実機合格ではない。**

| 工程 | 実装 | 自動検証 | ユーザー確認 |
| --- | --- | --- | --- |
| M0 環境 | 固定Docker/Compose/lockfile/CI定義あり | 空volume再現成功。mount監査未完了、CI未実行 | 対象外 |
| M1 ペン | ペン、筆圧、消しゴム、100操作Undo/Redo、指移動/ピンチ、指書き、ズーム | 基本のunit/E2E成功、定量入力と性能は残る | 未実施 |
| M2 保存・整理 | 保存・複数ページ・背景・図形・蛍光ペンを実装、フォルダ/ゴミ箱は未着手 | NOTE-01 A、DATA-01 Aと機能別の部分検証成功 | 未実施 |
| M3 受け渡し | 未着手 | 未実施 | 未実施 |
| M4 PDF | 未着手、依存承認済み | 未実施 | 未実施 |
| M5 PWA・統合 | 未着手 | 未実施 | 未実施 |

## 授権と環境の障害

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
