# オフラインと更新（統合検証を継続中）

URL: http://localhost:4173 。productionプレビューを開いて「オフライン準備完了」を待つ。通信を切って再読み込みし、既存のPDFノートへ筆記・保存し、「PDFを書き出す」「このノートを書き出す」を実行できる。

新版を配信すると「新しい版を適用」が出る。自分または別タブに未保存の変更があれば適用を拒否する。保存してから明示的に適用すると、各タブを再読み込みしてデータを保持する。初回インストールを新版と誤表示しない。Cache Storageの削除はこのアプリのscopeとversion prefixに限定する。

受入ID: PWA-01〜03。TDD: `PWA-offline-red.log`2失敗（未実装の準備完了/manifest）、`PWA-update-red.log`1失敗（更新UIなし）、いずれも終了1。`PWA-offline-green.log`22E2E成功、終了0。更新の初回GREEN試行は1失敗を記録し、初回install/更新待ちの区別を修正。再現: `docker compose run --rm app npm test`、`docker compose run --rm app pnpm run check`、`docker compose run --rm e2e`。変更後unit/check結果は`PWA-update-unit.log`と`PWA-update-check.log`。

確認済み範囲: PDF関連資産を含む205ローカルファイルのprecache、オフライン再起動からPDFへの筆記/保存/二形式出力、インストールmanifestとアイコン、未保存の2タブ更新拒否と保存後適用、無関係cache保持。

制限: subpath、準備中断/容量不足、複雑な同時操作、最終版3回連続/Firefox、Androidホーム画面追加と機内モードのHは未完了。初回キャッシュ失敗時は通信確認後の再起動を案内する。公開HTTPS/CI/PRはGit・認証の環境障害で未実施。commitなし。PWAの全受入合格や日常利用版完了とは判定しない。

更新修正後の結果: `PWA-update-green-2.log`全23E2E成功（39.4秒、retry 0、終了0）。`PWA-update-unit.log`38テスト成功、`PWA-update-check.log`終了0。ビルド版ID `60ab9d971ce35566`。
