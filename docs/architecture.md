# 詳細技術設計 v1

本書は初期設計を実装可能な仕様に具体化する。2026-09-06作成。ここに記載した構成と数値は実装方針であり、実測結果ではない。

## 1. 技術構成

| 領域 | 採用方針 |
| --- | --- |
| UI | TypeScript strict＋標準DOM/CSS。UIフレームワークは初期版に追加しない |
| 開発・ビルド | Vite。Node 22系の互換性を満たすパッチ版をM0で固定 |
| 描画 | Canvas 2D。表示用と入力中のレイヤーを分離 |
| データ | IndexedDB標準API。アクセスをrepositoryに集約 |
| PDF | 承認後にpdfjs-dist＋pdf-libを導入、worker・cMaps・standard fonts等も同一配信元へ同梱 |
| テスト | Vitest、coverage-v8、Playwright。必要ならfake-indexeddbをテスト専用に使用 |
| コード品質 | TypeScript、ESLint。lockfileはpnpm-lock.yamlだけを管理 |
| オフライン | 小さなService Workerを自作。production asset一覧からprecache manifestをビルド時生成 |
| 配信 | 静的ファイル。GitHub Pagesを第一候補、ハッシュルーティングで直リンクの404を避ける |

開発依存もコンテナ内で導入する。本番依存を開発依存に分類して確認を回避しない。バージョン・イメージdigest・ライセンスは導入時に `docs/environment.md` へ記録する。

## 2. コンテナによる環境分離

「ルートの環境を汚さない」は、ホストOSとユーザーの共通開発環境にランタイム・依存・設定変更を加えない意味として適用する。ソースとプロジェクト設定はこのリポジトリ内に作る。

- Compose project名は `my-note-app`。app、e2e、previewを分ける。
- appはNode公式イメージの厳密なバージョンとdigestを固定。pnpmも厳密に固定し、イメージ内だけに導入する。
- e2eはPlaywright公式イメージの厳密なタグ/digestを使い、npm側のPlaywrightバージョンを一致させる。Nodeの互換性も確認する。
- ソースはこのプロジェクトだけを `/workspace` にbind mount。node_modulesとpnpm storeはプロジェクト専用named volumeに置く。
- テスト結果は `/workspace/artifacts`、buildは `/workspace/dist`。いずれもgitignore対象。previewはビルド済みdistを読み取り専用で配信する。
- app/e2eはホストのUID/GIDに対応した非rootユーザーで動かす。初回volumeの所有者設定が必要なら、そのvolumeだけを初期化する短命サービスで行う。ホストツリーへの再帰chownはしない。
- ホストの `/`、ホーム全体、Docker socket、SSH鍵をコンテナへマウントしない。privilegedとhost networkは使わない。
- 通常のポート公開は `127.0.0.1:5173` と `127.0.0.1:4173`。LANのHTTP公開をAndroidのPWA試験の代わりにしない。
- ホストでnpm/pnpm/npx、Playwrightのブラウザーダウンロード、apt/pip等を実行しない。ホストのPATH・shell設定を変更しない。
- Docker volume/cacheの使用は環境分離の範囲内。削除するときは本プロジェクトに限定し、`docker system prune` 等は使わない。
- CIも同じCompose契約で動かす。GitHub Actionsホスト上で直接npm installしない。レジストリ取得はイメージビルド/依存導入時に限定し、オフライン試験中は不要にする。

ソース編集のたびにイメージを作り直す必要はない。lockfile変更後は専用volumeにfrozen installし、変更前のnode_modulesで検証しない。クリーン環境の再現試験は別Compose project名/volumeで実施して既存環境を保持する。

## 3. モジュールの境界

```text
src/
  domain/       型、座標変換、筆跡、図形、フォルダ制約、履歴
  application/  操作コマンド、保存キュー、取り込み手順
  storage/      IndexedDB、migration、バックアップ形式
  input/        Pointer Eventsとジェスチャー状態機械
  rendering/    背景、確定描画、入力プレビュー、画面変換
  pdf/          PDF.jsアダプター、PDF出力、回転変換
  ui/           ライブラリー、エディター、ダイアログ
  pwa/          更新通知、ストレージ状態
tests/
  unit/ integration/ e2e/ fixtures/
docs/reviews/   機能レビュー票
artifacts/      RED/GREENログ、E2E trace、性能JSON、画像
```

domainはDOM・IndexedDB・PDFライブラリをimportしない。UIはDBを直接触らずapplication経由で操作する。画面用の状態と保存データを分け、ポインター移動ごとに画面全体を再構築しない。

## 4. データモデルと保存

- IDはUUID。日時はUTCのISO 8601。データ形式 `schemaVersion: 1`。
- folders: `{id, parentId: null|UUID, name, createdAt, updatedAt, deletedAt}`。
- notebooks: `{id, folderId: null|UUID, title, pageIds, revision, createdAt, updatedAt, deletedAt}`。
- pages: `{id, notebookId, widthPt, heightPt, background, pdfSource?, elements, revision}`。
- pdfSource: `{attachmentId, pageIndex, rotation, viewBox}`。pageIndexは0起点。
- attachments: `{id, mimeType, size, sha256, blob}`。PDF原本を保存する。
- elementsは作成順の配列。StrokeとShapeの判別union。
- Stroke: `{id, type:'stroke', tool:'pen'|'highlighter', color, widthPt, points:[{x,y,p}]}`。pは0〜1、全数値は有限。
- Shape: `{id, type:'shape', kind:'line'|'rectangle'|'ellipse', x1,y1,x2,y2,color,widthPt}`。
- settings/metaはDB形式version、選択ツール、バックアップ最終日時、現在の取込世代などを格納。

A4縦は幅595.28×高さ841.89pt。左上原点で保存する。PDFページはPDF.jsのscale=1 viewportに対応する幅・高さと原点を使う。ズーム25〜400%、回転はPDF原本の回転を取り込み時に反映し、初期版にユーザーによるページ回転操作は設けない。

DBアクセスはトランザクション完了時にresolveする。ノートrevisionと変更ページを同一transactionで更新し、操作ごとに単調増加させる。保存キューはノート単位に直列化し、過去の書き込みが新しい状態を上書きしない。ポインター終了後300ms以内に保存を開始し、連続入力中も1秒以内に確定操作の保存を開始する。

「保存中→保存済み」はtransaction完了後のみ。失敗時は「未保存・再試行」としメモリー上の変更を保持、バックアップ書き出しを提供する。未保存状態の再読み込みを促さない。保存済み表示はブラウザーのcommit完了を意味し、停電や物理ストレージ故障まで保証しない。

同一originの複数タブではWeb Locks等により書き込みを単一タブに限定する。他のタブは読み取り専用。利用APIが無い場合もrevisionの楽観的照合で無条件上書きを防ぎ、競合時は編集を止めてコピー保存を案内する。migrationはversionchange transactionで行い、古いタブへ接続終了を依頼し、失敗時にDBを削除して復旧しない。

フォルダ名/タイトルは前後空白を除去し1〜120文字。子孫への移動、存在しない親を拒否。同名は許容。UIは20階層までを初期サポート範囲とし、超える移動/作成は理由を表示して拒否する。

ノートは最低1ページ。最後のページの削除は拒否する。フォルダのゴミ箱移動は子孫も同一操作で処理。復元先の親が無い場合はルートへ復元する。完全削除は確認付き。参照が残るPDF原本は消さない。

## 5. 入力・描画・履歴

入力状態を `idle / drawing / shaping / erasing / panning / pinching` として管理する。pointer captureを使い、pointercancel/lostpointercaptureは未確定操作を破棄してidleへ戻す。モード変更時も途中の操作を勝手に確定しない。

ペン入力を優先し、描画中のtouchはキャンバス操作へ反映しない。既定ではtouchは移動/ズームだけ。指書きON時は1本指で描画し、2本目が来たら未確定の線を破棄してピンチに切り替える。マウスは左ボタンで描画、Space＋ドラッグで移動、Ctrl＋ホイールでキャンバス拡大を行う。画面ボタンでも全操作を可能にする。

座標変換はCSS領域・パン・ズームからページ座標へ変換し、devicePixelRatioは描画バッファにだけ適用する。getCoalescedEventsが無い場合も動く。ペンの有効な筆圧pに対し幅は `widthPt × (0.25 + 0.75p)`、マウス/未対応入力ではwidthPtとする。pointerupの筆圧0を末尾に自動追加して線端を不自然に細くしない。

太さは0.5〜12pt。ペンは不透明、蛍光ペンは固定透明度0.25とする。蛍光ペンは一筆を中間レイヤーに不透明で描いてから1回だけ合成し、同じ一筆の重なりで濃くならないようにする。別の筆跡どうしの重なりは濃くなる。

直線・長方形・楕円は始点と現在位置でプレビューし、pointerupで確定。消しゴムは筆跡/図形全体を削除し、背景は保持する。消しゴムの1ドラッグを1つのUndo操作とする。Undo/Redoは現在開いているノートで最大100操作、再読み込み後の履歴復元は初期版対象外。新しい編集でRedoを消す。Undo/Redoも保存対象。

背景は無地・横罫線・方眼、初期罫線間隔24pt。PDFページは原本を背景とし、追加罫線の初期値はOFF。確定レイヤーと入力中レイヤーを分け、入力中に全ストロークを再描画しない。PDFラスターキャッシュは現在ページと前後の最大3ページ、合計64MiB以下のLRU。各canvasの総画素数もこの予算に算入し、必要に応じて解像度を落とす。これはJS heap全体の上限ではない。

## 6. 専用バックアップ形式

初期版はZIP依存を追加せず、UTF-8 JSONの `.snote` とする。MIMEは `application/json`。メタデータ、フォルダ/ノート/ページ配列、添付PDFをbase64で格納する。バイナリーよりサイズが増えるが、形式を単純にして復元を優先する。

ルートは `{format:'my-note-app', schemaVersion:1, scope:'notebook'|'library', exportedAt, folders, notebooks, pages, attachments}`。添付は `{id,mimeType,size,sha256,dataBase64}`。UTF-8ファイルサイズ上限100MiB、復号した添付合計64MiB、1PDF20MiB、1PDF100ページ、全ページ1000、全points合計200万を初期の読み込み上限とする。上限超過時は対象を分けて書き出す案内をする。画面の通常保存にこのファイルサイズ上限を流用しない。

書き出しは一貫した読み取りsnapshotを使う。単一ノート書き出しは必要な祖先フォルダと添付だけを含める。全体はゴミ箱も含めて復元可能にする。ID参照、循環、有限数値、配列数、size、SHA-256、base64の妥当性を書き込み前に検証する。未来のschemaVersion、壊れた参照、無効なPDFは理由を示して全体を拒否する。ファイル名をHTMLとして挿入しない。

取り込みの既定は「コピー」。フォルダ/ノート/ページ/要素/添付のIDを一括再マッピングする。「同じIDを置換」は初期版から除き、誤上書きを防ぐ。初期設計の置換案は将来機能へ延期する。

取り込みは検証・ハッシュ計算をDB transactionの外で完了させ、検証済みレコードを1つのreadwrite transactionで追加する。容量不足や中断時は全体をabortし、半分だけ見える状態を作らない。キャンセルはcommit開始前まで可能と表示する。ライブラリー全体の上限超過を避けるにはノート単位の書き出しが使える。

## 7. PDF入出力

ファイルサイズ20MiB以下、100ページ以下を初期サポートとする。パスワード付き/暗号化PDFは初期版では拒否。PDF.jsで表示できてもpdf-libが読めないファイルは取り込み段階で拒否する。両方の確認後にDBへcommitする。PDFのスクリプト・添付実行・外部リンク自動読み込みは行わない。

ページ表示は要求ごとにキャンセル可能にし、表示先が変わったら古いrender taskを破棄する。1〜100ページのサムネイルを一度に高解像度生成しない。

出力は新規PDFへ元ページの表示領域を埋め込み、回転・CropBox・原点移動を明示的に合成する。元PDFをページ全体の画像へ置き換える方式を既定にしない。手書きは共通のストローク輪郭生成を用いてベクターpathとして重ねる。Canvas/PDFで同じ圧力補間と形状データを使う。PDFの下原点とアプリの上原点を変換し、0/90/180/270度と原点が0でないCropBoxをテストする。

複雑なPDFでベクター背景保持ができない場合は黙って画像化せず、非対応理由を表示する。PDF出力には全ページを順番に含め、無地/罫線/方眼と透明度を保持する。出力PDFを再度読み込んでも元の個別筆跡へ戻らないことをUIで説明する。

## 8. PWA・UI・更新

UIは日本語。タップ領域は44×44 CSS px以上。320px幅でも主要操作を隠さず、ツールバーの明示的な折りたたみは許可。キャンバス以外のページ全体に横スクロールを発生させない。キーボードフォーカス、accessible name、ダイアログの閉じる操作を備える。

GitHub Pagesの `/repository-name/` サブパスでworker・font・manifest・アイコン・ルーティングが動くようにする。Service Workerはそのbase pathだけをscopeにする。全アセットのキャッシュ成功後に「オフライン準備完了」と表示する。ノート/PDFデータはCache StorageではなくIndexedDBへ置く。

更新は「新しい版があります」と通知し、未保存変更がある間は適用しない。無条件のskipWaitingや強制reloadを避ける。旧版から新版の移行テストを作る。cache削除は自アプリのversion prefixに限定し、DB削除を伴わせない。

画面内にバージョン/commit短縮値とバックアップ操作を用意する。静的配信元にはノートを送信しない。テレメトリー・外部フォント・外部CDNは初期版では使わない。originが変わるとローカルデータも別になるため、開発版/レビュー版/正式版を混同させず移行時はバックアップを案内する。

## 9. 参照した一次資料

API対応とバージョンは実装開始時にも確認する。下記は技術判断の根拠であり、機能の実測結果ではない。

- [Docker bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)：ホストへの書き込み範囲。
- [Playwright Docker](https://playwright.dev/docs/docker)：イメージとライブラリのバージョン一致。
- [Vite Getting Started](https://vite.dev/guide/)：Node互換性。
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)：transactionとversionchange。
- [PDF.js examples](https://github.com/mozilla/pdf.js/blob/master/docs/contents/examples/index.md)：viewportと座標変換。
- [MDN skipWaiting](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting)：更新の制御。
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages)：公開リポジトリでの配布候補。

## 実装補足（2026-09-07）

蛍光ペンの一筆内重なり防止は、追加の中間canvasの代わりに、同じ向きの円と四辺形を1つのPath2Dへまとめnonzero fillで和の輪郭を作り、1回のfillで透明度0.25を適用する方式を採用した。別の筆跡は別のfillなので重なる部分が濃くなる。NOTE-05の一筆交差/別筆交差/保存再表示は画素比較で確認済み。受入閾値は変更していない。入力中は現在の一筆を再描画するため、長い一筆の性能はPERF-01で別途計測して最適化する。

PDFのラスター予算実装では、表示canvas3枚に最大32MiBを割り当て、合計64MiBから実画素サイズを差し引いた残りをPDFのキャッシュと描画中canvasへ配分する。DPRによって超過する場合はbuffer解像度だけを下げ、入力と保存のページ座標は変えない。旧renderのキャンセルと破棄を待ってから次のcanvasを確保し、完成画像だけでなく作成中も予算へ算入する。単体と回帰テストを通過しているが、全PDFや実機のメモリー使用量（JS heapを含む）の保証ではない。
