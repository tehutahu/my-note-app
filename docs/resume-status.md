# 再開準備・受入監査（2026-10-10）

最新の結果・commit・公開状況はprogress.md先頭を正とする。本書は再開時の監査と、goal開始前に済ませる検証の記録。全A合格とH合格は区別する。

## 保全と統合

- 変更前のHEAD c81c336、マージ先5f273fb。docs/progress.mdの競合の各版、HEADのarchive、未コミット・未追跡ファイルを/tmp/my-note-app-resume-0itcx2ymへ保存した。ローカル退避はリポジトリへ登録しない。
- 両側の進捗を保持して競合を解消。cc8b717でorigin/mainのマージを完了した。
- GitHubでPR #10/#11の統合、main5f273fb、run34404001133のverify/deploy成功を確認。先のDocker I/O errorとgh接続障害は現在は解消している。
- Docker Engine29.0.1 / Compose2.40.3-desktop.1。サンドボックス内のsocket権限だけでは接続できないため、許可されたDocker実行経路を使用。ホスト設定・ランタイムを変更しない。
- frozen install終了0、lockfile差分0。現在のサンプル変更を保持し、npm test60件/check成功、サブパス2E2E成功。

## 受入の条項監査

以下は既存テストが扱う振る舞いの棚卸し。実行証拠、全条項の合格、実機Hは同じ意味ではない。最終固定版の報告・環境監査・安定性を記録するまで全A合格とはしない。

| ID | 既存の検証・確認対象 | H |
| --- | --- | --- |
| ENV-01 | 別Compose project/空volumeのbuild・frozen install・npm test・check・e2eを最終固定版で再現 | 対象外 |
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

## 残る完了判定と順序

1. サンプルを含む変更をcommitに固定し、同じbuildのChromium/Firefoxと境界/subpathの報告を生成する。
2. 4CPU/8GiBの性能を他の検証と分離して計測する。生値とbuild、資源、viewport/DPRを記録する。
3. 同じbuildで主要E2Eをretry=0で3回連続実行し、各reportを別名で保持する。
4. 別Compose project/空volumeで再現し、uid/mount/所有者/lockfile/追跡対象を確認する。既存volumeを削除しない。
5. 元reportのSHA付きacceptance-results.jsonを生成し、条項を監査する。successfulは全受入合格やH合格の宣言ではない。
6. CI成功・公開到達を確認し、レビューURLと版を記録する。Hは合成サンプルと具体操作で依頼し、未回答を合格としない。

/goalは今回開始しない。実行結果に応じてprogress.mdの次の一手を更新し、残件に絞った文案を提示する。
