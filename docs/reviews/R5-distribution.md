# R5 サブパス配布と更新版の識別

- 状態：実装中（ローカル自動検証後、CI/公開到達確認を継続）
- 対象：PWA-03/04、UI-03の版表示
- レビューURL：公開確認前。ローカルは http://localhost:4173/ （production build後 `docker compose up preview`）
- commit：feat/pwa-distribution、コミット後に記録。対象端末はAndroid2台とWindows。

## できること・試す操作

画面上の版表示で公開commitを確認できます。「オフライン準備完了」後に既存PDFを開き、通信を切って再起動し、一筆書いて「保存済み」を確認します。再起動後も同じ筆跡が残ることが期待結果です。新しい版の適用時は、開いているすべてのタブで保存を終えてください。

## 検証

- `PWA-build-red.log`：worker変更だけではversionが同一、期待不一致で終了1。生成スクリプトもhashへ含め、`PWA-build-green.log`48成功。変更なしの再buildの一致も確認。
- `PWA-commit-red.log`：workerの応答にcommitがなく終了1。BUILD_COMMITから短縮値を含める実装を追加。
- `PWA-subpath.log`：試験サーバー設定の重複による起動失敗。設定修正後`PWA-subpath-2.log`1成功（21.1秒）。既存機能への回帰試験で、製品コードのRED先行とはしない。
- 再現：`docker compose run --rm app npm test`、`docker compose run --rm app pnpm run check`、`docker compose run --rm e2e sh -c 'BASE_PATH=/my-note-app/ pnpm run build && pnpm exec playwright test --config playwright.subpath.config.ts'`。
- 自動検証と公開HTTPS、実機Hの確認を別々に扱う。性能測定・実機画像はこの修正では未実施。

## 制限・次の対応

公開先とlocalhostでは保存領域が別になります。ノートを移す場合は専用バックアップを書き出してから読み込みます。全体の実装完了判定、PDF/XFER境界、診断性能、最終Firefox/安定性は未完了です。実機の回答は未回答。CIと公開到達確認後にレビューURLと版を追記します。

### 最終ローカル結果

`PWA-final-verified.log` npm test48成功、check終了0。初回commit fixtureの文字数誤りを修正した履歴はprogressに記録。`PWA-final-e2e.log` PWA3件（9.7秒）/subpath1件（6.2秒）成功、retry0。変更なしでのworker再生成一致、worker変更による別cache、未保存更新拒否、offlineの保存・出力を確認。
