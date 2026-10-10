# R5 受入検証の対応表

> この票には作成当時の状態・制限も残っています。2026-10-10以降の現在状態は[進捗](../progress.md)と[受入監査](../resume-status.md)を参照してください。過去の「未実装」「Git障害」「実行中」を現在の判定へ流用しません。

- 対象：共通測定ルール、ENV-03、PWA-03/04
- 状態：報告生成の自動検証成功、全体回帰を実行中
- 操作URL：https://tehutahu.github.io/my-note-app/

`pnpm run acceptance`はVitest/境界試験/Chromium/Firefox/subpathのJSONから受入IDとテスト名、結果、元reportのSHA-256、ブラウザーbuild情報をartifacts/acceptance-results.jsonへ出力します。テスト名中のINK-01/04の省略記法にも対応し、INK-07はpen-switch試験に対応します。

成功したテストが1件あるだけで受入ID全体を合格とはしません。全条項の監査とH結果は別で、Hは未確認として出力します。空/不明report、未実行、skip、失敗、retryを成功に数えません。異なるbuildの結果はbuild一覧で区別できます。引数にreportファイルを指定すれば限定した検証結果もまとめられます（全受入合格とはしない）。

- RED：`docker compose run --rm app pnpm exec vitest run tests/integration/acceptance-report.test.ts`、ACCEPT-report-red.log、終了1。正常な実行証拠から対応表を生成できず期待trueに対しfalse。
- GREEN：`docker compose run --rm app sh -c 'npm test && pnpm run check'`、ACCEPT-report-green.log、終了0。59件、lint/型/カバレッジ/build成功。
- ビルドに完全commitを記録するbuild-info.jsonを追加。Service Workerが同じbuildとして配信し、Playwright JSONが対象commitとPWA版を記録します。既存worker再現性の回帰試験も成功。
- ブラウザー全体：ACCEPT-report-browsers.logで実行中。最終結果を進捗へ追記。

これは開発側の検証報告であり、ユーザーへ手作業の再試験を追加する機能ではありません。
