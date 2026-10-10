# 保存形式の移行と障害時の復旧

> 2026-10-10 現在のレビュー入口： [公開アプリ](https://tehutahu.github.io/my-note-app/) ／ [正式Hの端末別手順と回答欄](../human-review.md)。機能固定版28cd18aと同一製品ソース。画面の版を回答に記録する。自動条項の最終統合監査中、Hは未回答。現在の証拠と制限は[条項監査](../acceptance-audit.md)を参照。以下の当時のログ・制限は履歴として保持する。

> この票には作成当時の状態・制限も残っています。2026-10-10以降の現在状態は[進捗](../progress.md)と[受入監査](../resume-status.md)を参照してください。過去の「未実装」「Git障害」「実行中」を現在の判定へ流用しません。

受入ID: DATA-04。URL: http://localhost:4173 。旧版で作ったノートは起動時に更新され、同じページ順・筆跡で開く。別タブが更新を妨げている時は、別タブを閉じて再起動する案内を表示する。移行に失敗した場合は旧データを保持し、自動削除で復旧しない。

TDD: `DATA-migration-red.log`4失敗→移行/abort/blocked/未知新版拒否を実装。`DATA-migration-ui-red.log`2失敗→起動画面の日本語案内を接続。途中のcheckではbranches84.88%が閾値未達だったため、接続終了通知と同期例外を検査して補強。`DATA-migration-green-2.log`と`DATA-migration-check-2.log`成功。

移行ではページ検索用の索引を追加する。ノート・筆跡・PDF添付を別形式に書き換える処理ではない。端末内DBのversionは2、ファイル受け渡しのschemaVersionは1。旧版コードは新版DBを開けない場合に新しい版での起動を案内する。

再現: `docker compose run --rm app npm test`、`docker compose run --rm app pnpm run check`、`docker compose run --rm e2e`。ブラウザー証拠は`DATA-migration-ui-green.log`へ記録する。実機Hは未実施。実装commitは25d4211、CIのUID修正は491b277。PR #1でコンテナCIを確認中。

最終結果: unit47件成功、check終了0。全体E2E初回28成功/locator不一致1、修正後の移行関連3E2E成功（4.6秒、retry 0）。build版ID `b84e0af582b8ec35`。GitHub認証は2026-09-08の再確認で利用可能になっているため、公開CI未実施の理由を「認証無効」とは扱わない。

2026-10-10証拠監査：上記初回28成功/1失敗は `DATA-migration-ui-green.log`。修正後3成功の正しい参照は `DATA-migration-ui-green-2.log`。最終変更後npm test47成功は `DATA-migration-final-unit.log`、checkは `DATA-migration-final-check.log`。途中失敗をGREENとは判定しない。
