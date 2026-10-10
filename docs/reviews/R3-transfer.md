# 専用形式による受け渡し（自動検証は一部完了）

> 2026-10-10 現在のレビュー入口： [公開アプリ](https://tehutahu.github.io/my-note-app/) ／ [正式Hの端末別手順と回答欄](../human-review.md)。機能固定版28cd18aと同一製品ソース。画面の版を回答に記録する。39 Aの条項監査・自動検証合格、正式H20項目は全件未回答。現在の証拠と制限は[条項監査](../acceptance-audit.md)を参照。以下の当時のログ・制限は履歴として保持する。

> この票には作成当時の状態・制限も残っています。2026-10-10以降の現在状態は[進捗](../progress.md)と[受入監査](../resume-status.md)を参照してください。過去の「未実装」「Git障害」「実行中」を現在の判定へ流用しません。

URL: http://localhost:4173 。ノートを作成し、一覧の「全体バックアップを書き出す」で `.snote` を保存。「バックアップを読み込む」で同じファイルを2回読み込むと、元を保持した独立コピーが2件追加される。編集中は「このノートを書き出す」でメモリー上の変更を出力できる。

受入ID: XFER-01〜04、DATA-02。IDと参照の再マッピング、JSON/版/階層/数値/添付ハッシュの検証、全レコードの一括transactionを実装。

TDD: `artifacts/XFER-backup-red.log` 2失敗、`XFER-storage-red.log` 1失敗、`XFER-ui-red.log` 2失敗（未実装の振る舞い、終了1）。実装後`XFER-backup-green.log`、`XFER-storage-green.log`、`XFER-ui-green.log`（E2E18件成功、終了0）。変更後npm test/checkは対応するunit/checkログに記録。再現は `docker compose run --rm app npm test` と `docker compose run --rm e2e`。

制限: 全上限の許容境界/超過、PDF原本付き端末間往復、ブラウザーのimport途中abort/キャンセルは追加検証中。Hは未実施。git利用制限のためcommit/PRなし。全受入合格という判定ではない。

2026-10-10証拠監査：変更後npm testの具体的なログは `artifacts/XFER-ui-unit.log`（38成功）、checkは `artifacts/XFER-ui-check.log`（終了0）。初期機能の保存commitは07d75cf。全条項の現在判定は[条項監査](../acceptance-audit.md)を参照。
