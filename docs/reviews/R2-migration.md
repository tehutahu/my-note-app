# 保存形式の移行と障害時の復旧

受入ID: DATA-04。URL: http://localhost:4173 。旧版で作ったノートは起動時に更新され、同じページ順・筆跡で開く。別タブが更新を妨げている時は、別タブを閉じて再起動する案内を表示する。移行に失敗した場合は旧データを保持し、自動削除で復旧しない。

TDD: `DATA-migration-red.log`4失敗→移行/abort/blocked/未知新版拒否を実装。`DATA-migration-ui-red.log`2失敗→起動画面の日本語案内を接続。途中のcheckではbranches84.88%が閾値未達だったため、接続終了通知と同期例外を検査して補強。`DATA-migration-green-2.log`と`DATA-migration-check-2.log`成功。

移行ではページ検索用の索引を追加する。ノート・筆跡・PDF添付を別形式に書き換える処理ではない。端末内DBのversionは2、ファイル受け渡しのschemaVersionは1。旧版コードは新版DBを開けない場合に新しい版での起動を案内する。

再現: `docker compose run --rm app npm test`、`docker compose run --rm app pnpm run check`、`docker compose run --rm e2e`。ブラウザー証拠は`DATA-migration-ui-green.log`へ記録する。実機Hは未実施。実装commitは25d4211、CIのUID修正は491b277。PR #1でコンテナCIを確認中。

最終結果: unit47件成功、check終了0。全体E2E初回28成功/locator不一致1、修正後の移行関連3E2E成功（4.6秒、retry 0）。build版ID `b84e0af582b8ec35`。GitHub認証は2026-09-08の再確認で利用可能になっているため、公開CI未実施の理由を「認証無効」とは扱わない。
