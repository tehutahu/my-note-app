# R5 動作の計測と大きなノートの保存

- 状態：実装・性能改善中。公開前。
- 対象：PERF-01〜04、DATA-02/03、NOTE-05
- レビューURL：https://tehutahu.github.io/my-note-app/ （この追加機能はまだ未反映）

「動作の計測」→「計測を開始」→「閉じる」で普段どおり使い、再び画面を開いて「計測を停止」「計測結果を書き出す」を選びます。ノート本文を含まないJSONを保存します。端末温度・省電力モードは書き出し前に選択できます。

## 検証と改善

- PERF-measurements-red.log：計測器の2件失敗から記録/中央値/p95を実装。PERF-measurements-green.log：52成功。
- PERF-failures-red.log：古い生値を破棄すると失敗総数が出ない失敗。総数を独立保持してPERF-failures-green.log：53成功。
- PERF-ui-red.log：診断ボタンなしで1失敗、UIと実処理を接続。PERF-ui-green.log：診断/筆記/保存6成功。
- PERF-targets-first.log：Sの保存開始最大693.1ms、commit中央値2904.05msで性能目標未達。重複コピー削減、確定Canvasの末尾追加、保存所有者確認の索引利用へ変更。Lは準備の大量データ転送で時間を使い、warm-up操作中に試験全体timeout（性能判定は未実施）。Pでは古い描画のキャンセル20回を失敗に集計していたため、現在ページのCanvas反映だけ計測するよう修正。
- 最適化後のnpm test55成功。初回checkはstorage branches84.88%で85%に届かず終了1。新規ページと別ノートのページの所有検査・途中更新rollbackの回帰を追加して再検証する。閾値は変更していない。

## 測定条件

合成seed20260909。S=2000筆跡×100点＋100図形、L=100ノート×10ページ×100筆跡×50点、P=文字/256×256合成画像の20ページPDF。`tests/fixtures/performance.ts`から生成。専用suiteは`docker compose -f compose.yaml -f compose.performance.yaml run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test --config playwright.performance.config.ts'`。cgroup4 CPU/8GiB、Chromium1280×800/DPR1。初回測定の一部はHTTPS試験と重なったため正式値にはせず、改善後は単独実行する。

性能のHは未実施。入力処理時間を物理ペン→画面遅延とは扱わない。各metricの生値は最新10,000件、総件数/失敗数は全件。再開始で前回の記録を消す。ノート/バックアップは変更しない。

## 改善後のA測定

`PERF-targets-optimized.log`3成功（1.1分）。Sの入力p95 0.30ms、保存開始最大215.60ms、commit中央値465.55ms。Lのwarm表示中央値96.35ms。Pの取り込み216.55ms、ページ表示285.80ms、出力41.70ms（各中央値）。失敗0。`PERF-S.json`、`PERF-L.json`、`PERF-P.json`に生値。PWA hash0ea1a479dd0b4f0d、未コミット版のため固定commitでの再現も行う。`PERF-optimized-check-2.log`56 tests/check成功。全体Chromium/Firefox回帰は実行中。
