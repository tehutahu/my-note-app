# 再開準備・受入監査（2026-10-10）

最新の結果・commit・公開状況はprogress.md先頭を正とする。本書は再開時の監査と、goal開始前に済ませる検証の記録。全A合格とH合格は区別する。

## 保全と統合

- 変更前のHEAD c81c336、マージ先5f273fb。docs/progress.mdの競合の各版、HEADのarchive、未コミット・未追跡ファイルを/tmp/my-note-app-resume-0itcx2ymへ保存した。ローカル退避はリポジトリへ登録しない。
- 両側の進捗を保持して競合を解消。cc8b717でorigin/mainのマージを完了した。
- GitHubでPR #10/#11の統合、main5f273fb、run34404001133のverify/deploy成功を確認。先のDocker I/O errorとgh接続障害は現在は解消している。
- Docker Engine29.0.1 / Compose2.40.3-desktop.1。サンドボックス内のsocket権限だけでは接続できないため、許可されたDocker実行経路を使用。ホスト設定・ランタイムを変更しない。
- frozen install終了0、lockfile差分0。サンプル変更を保持して28cd18aで固定。npm test60件/check成功、最終サブパス2E2E成功。

## 受入の条項監査

以下は既存テストが扱う振る舞いの棚卸し。実行証拠、全条項の合格、実機Hは同じ意味ではない。最終固定版の報告・環境監査・安定性は記録済み。次のgoalで条項ごとの判定とENV-03の内容監査を行う。

| ID | 既存の検証・確認対象 | H |
| --- | --- | --- |
| ENV-01 | 固定版28cd18aの別Compose project/空volumeでbuild・frozen install・npm test・check・e2e成功 | 対象外 |
| ENV-02 | app/e2eのuidとmount、専用依存volume、生成ソースの所有者 | 対象外 |
| ENV-03 | 各レビュー票のRED/GREEN・npm test・受入ID、後付け試験の正直な記録。報告変換の成功だけで代用しない | 対象外 |
| ENV-04 | 固定Node/pnpm/Playwright/image、lockfile不変、生成物/秘密/個人データ追跡0 | 対象外 |
| INK-01 | input-acceptance/pen：100筆、10点、圧力画素、終端 | 実S Penは正式未確認 |
| INK-02 | pen/gestures：指移動・ピンチ・指書きON/OFF・ペン中touch抑制 | 未確認 |
| INK-03 | coordinates/input-acceptance：4倍率×3DPR×パン、1000点の数値往復とブラウザー画素 | 対象外 |
| INK-04 | ink/input-acceptance/pen：消去、Undo/Redo100操作、新規編集後Redo破棄 | 未確認 |
| INK-05 | pen/input-acceptance：cancel/lostcapture/外リリース/ツール変更/2本指化 | 対象外 |
| INK-06 | Android各10分・パーム・縦横・5段階4以上。従来R1の肯定回答を数値へ補完しない | 未確認 |
| INK-07 | pen-switch：1押下1切替、維持、hover無筆跡、マウス対象外、途中破棄、消去とUndo | 両Android未確認 |
| NOTE-01 | pages：20ページ、順序・タイトル、削除Undo、最後の1ページ保護 | 未確認 |
| NOTE-02 | folders/domain：100フォルダ/20階層、移動、循環・21階層・不明親拒否と不変 | 対象外 |
| NOTE-03 | attributes/shapes/background：3形状×3幅×3色×3背景、保存・再表示 | 未確認 |
| NOTE-04 | trash/repository/backup-integrity：子孫削除・復元・親なしルート・共有添付保護 | 対象外 |
| NOTE-05 | highlighter：一筆/別筆交差、ズーム・再表示・PDFのRGB差 | 未確認 |
| DATA-01 | save：200筆の座標・筆圧・順序、20再読み込み | 3再表示は未確認 |
| DATA-02 | note-session/save：遅延・失敗・Quota、commit前表示、実IDB abort、再試行・変更の出力 | 対象外 |
| DATA-03 | repository/conflict：revision、保存順、2タブ編集停止、独立コピー。Web Locks事前排他ではなく明示競合方式 | 対象外 |
| DATA-04 | migration/migration-preservation：全store/PDF原本保持、途中abort、blocked、旧接続・未知版 | 対象外 |
| XFER-01 | backup-integrity：PDF＋3階層、別context往復・編集、元データ不変・原本SHA | 各AndroidとWindowsの往復未確認 |
| XFER-02 | backup/backup-integrity：全体・ゴミ箱・2回コピーと復元・原本・ID独立性、出力上限 | 対象外 |
| XFER-03 | backup-integrity/boundaries：不正11fixture、日本語、既存DB不変、各上限ちょうど/超過 | 対象外 |
| XFER-04 | backup-integrity/repository：途中abort・Quota・commit前cancel、全store一括追加 | 対象外 |
| PDF-01 | pdf/responsive：混在・回転・CropBox8ページ、表示・筆記・fit | 未確認 |
| PDF-02 | pdf：独立期待値の原本/注釈マーカー中心≤1pt、ページ数・寸法≤0.1pt | 対象外 |
| PDF-03 | pdf-boundaries/attributes/highlighter：元文字選択・背景・図形・透明度・全ページ | Windows外部viewer未確認 |
| PDF-04 | pdf-boundaries：20MiB/100ページ、超過・暗号化・空password・破損・処理器差、全store不変 | 対象外 |
| PDF-05 | pdf-cache：100ページ往復・Worker遅延、最終ページのみ、3枚/64MiB以下 | 対象外 |
| PWA-01 | pwa/live：準備完了→offline再起動、PDF筆記・保存・再表示・二形式出力 | 3端末未確認 |
| PWA-02 | manifest/icon、WindowsとAndroidの実起動・閲覧編集 | 3端末未確認 |
| PWA-03 | pwa-update/pwa-build：別タブ未保存の更新拒否、保存後明示更新、データと無関係cache保持 | 対象外 |
| PWA-04 | subpath：直リンク・worker/font/asset404なし、外部通信/データ送信なし、無関係cache保持、samples別配信 | 対象外 |
| UI-01 | responsive：320/412/800/1280、はみ出し≤1px・主要操作44px | 3端末未確認 |
| UI-02 | responsive/diagnostics：名前・focus・キーボード・dialogと復帰 | 3端末未確認 |
| UI-03 | responsiveと各障害fixture：長い日本語、エラー、保存状態・版・バックアップ | 3端末未確認 |
| PERF-01 | S、10秒/1000sample以上、handler p95≤32ms。物理ペン総遅延ではない | Android未確認 |
| PERF-02 | L、warm10、ノート表示≤1500ms、他ノート筆跡一括取得なし | 対象外 |
| PERF-03 | S、10保存、開始≤300ms/連続≤1秒、commit中央値≤1000ms・失敗表示。失敗時の待ち時間を隠さない | Android未確認 |
| PERF-04 | P、warm後10回、取込≤15秒・表示≤1500ms・出力≤30秒、進行状態 | Android未確認 |

## 完了した再開準備

| 準備 | 実結果・証拠（artifacts内） |
| --- | --- |
| 元変更保全・競合解消 | /tmpの退避、cc8b717、破棄なし |
| 固定版・必須チェック | 28cd18a、unit60件・check成功、RESUME-final-unit/check.log |
| 正式性能 | 単独4CPU/8GiB、3件成功、RESUME-fixed-performance.logとPERF-S/L/Pの生値 |
| 同一build安定性 | Chromium56件×3回、retry/skip/失敗0、worker SHA一致、RESUME-stability-summary.json |
| Firefox | 同一build単独56件成功、retry0、RESUME-firefox-isolated.log。先行54成功/2待ち失敗も保存 |
| 境界・subpath | 境界6件/subpath2件成功、RESUME-boundaries.log / RESUME-fixed-subpath.log、サンプル画像保存 |
| 別project/空volume | build→frozen install→npm test→check→E2E56件終了0、RESUME-clean-*.log/JSON |
| 環境・追跡監査 | uid1000、禁止mount/追跡/root所有ソース0、lock不変、RESUME-environment-audit.json |
| 報告集計 | 40 ID、6report、183実行、issues0、元report SHA付きacceptance-results.json |
| CI・機能公開 | PR #12統合、main9529f31、run38037616789 verify/deploy成功、RESUME-main-ci.json |
| 公開到達 | HTTPS/offline1件成功、samples4ファイルHTTP200/size/SHA一致、RESUME-https-live.log / RESUME-https-samples-results.json |

rootのPWA版は3a851f4e95820c39、subpathはdeaf7e5cfc6981fe。browser/performanceの報告はfull commit28cd18afa85af14d554c11b4785764632721be61を記録。公開機能版9529f31とのツリー差分は0。文書の後続commitは機能固定版と区別する。

集計コマンド：

```sh
docker compose run --rm app pnpm run acceptance artifacts/unit-results.json artifacts/boundary-results.json artifacts/e2e-results.json artifacts/firefox-results.json artifacts/subpath-results.json artifacts/performance-results.json
```

successfulは実行証拠の成功。条項監査やH合格の宣言ではない。ENV-01/02/04は環境監査を別証拠とし、H専用のINK-06に自動テストを割り当てない。/goalは今回開始していない。

## 確認できた事実と推測

- 主要機能のソース、関連unit/integration/E2Eが存在し、M0〜M5と側面スイッチ・診断UIを実装している。中断時に未コミットだったサンプル生成と受入報告も28cd18aで固定し、PR #12でmain9529f31へ統合した。28cd18aと9529f31のツリー差分は0。
- 実装の途中として残るのは、全受入条項とTDD証拠の最終判定、および実機の正式確認。主要機能で未着手と確認できた項目はないが、仕様の全条項を満たしたという判定はまだ出していない。
- 正式Hの20 IDは未確認。以前のR1の定性的返答は記録済みだが、数値やOS/browser/buildを補完しない。H待ちを独立した自動作業の停止理由にしない。
- Firefoxの並列実行ではUI-01/03の320/412pxの2件がoffline初期準備を5秒で待てず失敗した。レイアウトの数値検査より前で停止している。失敗reportとtraceを保存し、同じbuild・待ち時間・retry0の単独実行で全56件成功を確認した。
- 他の検証との資源競合がFirefoxの待ち時間に影響した可能性はあるが、原因は未確定。単独で成功しても元の失敗履歴を消さず、再現した場合は原因を調べる。これを製品の描画幅不具合や解消済みの不具合と断定しない。

## 次のgoalで行うこと

1. acceptance-results.jsonと本書の対応表から、39 IDのAの全条項を実装・テスト・実行証拠へ結び付ける。ENV-03はレビュー票の実RED/GREEN、変更後npm test、受入IDを内容まで確認する。23票の参照ログ157個が存在することだけではTDD達成の証明にしない。
2. 実際の不足・不具合だけをTDDで修正する。仕様が不明なら確認し、数値目標や受入条件を推測で変更しない。既存ノート・バックアップ・変更・専用volumeを保持する。
3. 正式HはAndroid2台の入力/側面スイッチ/10分筆記/性能、3端末のUI/保存/offline、各AndroidとWindowsの往復、Windowsの外部PDFビューアーを機能別に案内する。URL、画面の版、操作、期待結果、証拠、制限を示し、未回答は未確認のまま記録する。
4. 全A・CI・機能レビュー票が揃って初めて「実装済み・実機確認待ち」とする。日常利用版の完了には必要Hを別に確認する。毎回progress.mdに未完了ID、次のコマンド、障害を残す。

## goal文案

```text
/goal この手書きノートを、全自動受入条件を満たした「実装済み・実機確認待ち」まで完成させてください。START_HERE.mdと指定文書、docs/progress.md、docs/resume-status.mdを読み、2026-10-10の再開準備済み結果を引き継いでください。既存変更・個人ノート・バックアップ・専用volumeを保持し、完了済み検証を理由なく繰り返さないでください。
まず39 IDのAの全条項とENV-03のTDD証拠を実装・テスト・実測へ対応付け、実際の不足だけをTDDで修正してください。Firefoxの先行初期準備timeoutと単独56件成功の両方を残し、再発時は原因を調べてください。仕様が不明なら確認し、推測で実装したり受入条件を下げたりしないでください。Node/pnpm/npm/test/build/Playwrightはコンテナ内のみ、JS/TS変更後はnpm test必須。新しい本番依存は事前確認し、承認済みPDF.js/pdf-libは再確認不要です。
自動合格と正式H20 IDを別々に記録し、機能ごとに公開URL・版・操作・期待結果・証拠・制限を提示してください。実機回答待ちでも独立作業を進め、未回答を合格にせず、日常利用版の完了とは区別してください。全A・CI・レビュー票が揃った実装完了を達成し、各終了時にdocs/progress.mdへ未完了ID・次のコマンド・環境障害を残してください。
```
