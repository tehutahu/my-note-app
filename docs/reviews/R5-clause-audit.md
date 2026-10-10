# R5 自動受入の最終条項監査

- 対象：ENV-03、INK-05、DATA-02、PDF-01/02、UI-02、PERF-03、および全Aの証拠対応。
- 状態：監査中。H20 IDは全件未回答。
- URL：[公開アプリ](https://tehutahu.github.io/my-note-app/)、[合成サンプル](https://tehutahu.github.io/my-note-app/samples/)。固定機能版28cd18aと同一の製品ソース。
- 操作・期待結果：[正式H確認票](../human-review.md)。今回の監査でユーザーへ新しいAの手動試験は要求しない。

## 検証を補った内容

既存テスト名だけでは裏付けられなかったツール変更時の未確定線破棄、A4を含む公開R4.pdfの全8ページ表示と筆記、連続入力中の保存開始1秒以内を直接検査した。保存失敗時のダウンロードはファイル名だけでなく内容を検査し、診断dialogのキーボード操作も確認した。

製品ソース・本番依存の変更はない。これらは既存機能の回帰検査であり、RED先行の製品修正として記録しない。初期機能とその後の修正の実RED→GREENは[ENV-03監査](../tdd-evidence-audit.md)に23票分を対応付けた。

- INK-05初回：`AUDIT-input-cancellation-first.log`、1成功。tool/cancel/lostcapture/2本指化でDB不変、次の筆記と再表示を確認。
- PDF初回：`AUDIT-pdf-review-first.log`、1失敗。0.8を厳密比較した期待値の誤りで、実値はfloat32の0.800000011920929。traceは `AUDIT-pdf-fixture-initial-failure/` に保持。
- 期待値是正後：`AUDIT-clause-browser.log`、2成功。`Math.fround(.8)`に合わせ、独立期待座標や寸法の閾値は変更していない。
- 連続保存：`AUDIT-continuous-performance.log`、1成功、4CPU/8GiB、同じrootビルド。30筆を前の保存完了を待たず入力、29保存開始の最大86ms≤1000、commit失敗0、2031筆を再表示。`AUDIT-PERF-S-continuous.json`に生値。
- 保存/診断補強：`AUDIT-save-dialog-first.log`は関連3成功。保存遅延中saving、Quota時旧DB不変、出力内に未保存筆跡、再試行後の復元、診断dialogの名前/Tab循環/Escape/focus復帰を確認。
- 変更後：`AUDIT-unit-check.log`はnpm test60＋lint/型/coverage/build成功。後続の試験追加後のログもprogress先頭に記録する。
- 再現：`docker compose run --rm app npm test`、`docker compose run --rm app pnpm run check`、`docker compose run --rm e2e`。性能はcompose.performance.yaml＋playwright.performance.config.ts。

## 制限・未確認

過去Firefox並列実行のoffline初期準備timeoutは原因未確定として元ログとtraceを保持。同一製品buildで単独成功した事実と分ける。実S Pen・Windows外部PDFビューアー・機内モード・実機性能はユーザー未回答。全Aの判定は[条項監査](../acceptance-audit.md)、最終CIと公開版は[進捗](../progress.md)を参照。
