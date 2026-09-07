# コンテナ環境（2026-09-06）

ホスト上でNode/npm/pnpm/ブラウザーは実行・導入していない。

- Docker Engine 29.0.1 / Compose 2.40.3-desktop.1。
- app/preview: Node 22.23.2 bookworm-slim、digest `sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5`。
- E2E: Playwright 1.63.0 noble、digest `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`。同梱Nodeは実測24.20.0。ライブラリとブラウザーのPlaywright版を一致させた。
- pnpm 12.3.4は両イメージ内のみへ導入。
- 実行UID/GIDは1000:1000。初回initサービスのみrootで専用volumeのルート所有者を設定。ホストツリーへのchownはしない。
- 依存は`my-note-app_dependencies`、storeは`my-note-app_store`。pnpm 12は既定storeをnode_modules内へ置いたため、どちらもホストから分離。設定の整理は次の環境確認時に行う。
- 初回取得のTypeScript 7.0.2はtypescript-eslintのpeer範囲外だった。コンテナで解決した6.0.3へ固定し、`pnpm peers check`は問題0件。
- 開発依存の厳密版はpackage.json、推移依存はpnpm-lock.yaml。PDF本番依存は承認済み・まだ未導入。

## 再現

```
docker compose build
docker compose run --rm app pnpm install --frozen-lockfile
docker compose run --rm app npm test
docker compose run --rm app pnpm run check
docker compose run --rm e2e
docker compose up -d preview
```

開発は`docker compose up app`でlocalhost:5173、production確認はlocalhost:4173。Android HTTPS公開はまだない。

CI定義は作成済みだがGitHub認証無効と読み取り専用.gitのため実行未確認。ENV-01の別project/空volume確認、ENV-02のmount実測、ライセンス一覧の記録はまだ未完了。

## 導入済み開発依存のライセンス（package.json実測）

| パッケージ | 固定版 | ライセンス |
| --- | --- | --- |
| @eslint/js | 10.0.1 | MIT |
| @playwright/test | 1.63.0 | Apache-2.0 |
| @types/node | 22.20.1 | MIT |
| @vitest/coverage-v8 | 5.0.0 | MIT |
| eslint | 10.10.0 | MIT |
| fake-indexeddb | 6.2.5 | Apache-2.0 |
| typescript | 6.0.3 | Apache-2.0 |
| typescript-eslint | 8.69.0 | MIT |
| vite | 8.2.2 | MIT |
| vitest | 5.0.0 | MIT |

appの`id`はuid=1000(node) gid=1000(node)と実測。

## PDF本番依存（2026-09-07）

ユーザーの2件承認を受けてコンテナ内pnpmで導入。pdfjs-dist 6.3.289、pdf-lib 1.17.1をlockfileに固定。ライセンスとworker/font配布はM4の完了検証に含める。
