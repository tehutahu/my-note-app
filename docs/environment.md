# コンテナ環境（2026-09-06）

## 現在の再開環境（2026-10-10）

以下の初期環境・障害は履歴。現在はDocker Engine29.0.1 / Compose2.40.3-desktop.1とgit/ghが利用可能。許可されたDocker実行経路を使い、ホスト設定を変更しない。RESUME-runtime.logでapp uid1000、Node22.23.2、pnpm12.3.4を実測。frozen install終了0、lockfile差分0。固定imageはcompose.yaml/Dockerfileを参照。

PDF本番依存は承認・導入済み。コンテナ内package.json実測でpdfjs-dist6.3.289はApache-2.0、pdf-lib1.17.1はMIT。worker/cMaps/fonts/wasmは同一配信元に同梱しsubpathで検証する。

機能統合版main9529f31（PR #12）、run38037616789のverify/deploy成功を確認済み。公開HTTPSのoffline筆記・保存・再表示・二形式出力と、samplesの4ファイルのサイズ/SHA-256一致も確認した。後続の文書commitと区別し、固定測定版は28cd18aを使用する。両commitのツリー差分は0。最新の空volume・mount/uid・公開確認は[進捗](progress.md)と[受入監査](resume-status.md)を参照。

## 初期状態と作業履歴

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

## CIの実行ユーザー（2026-09-08）

Composeのapp/e2e/previewはAPP_UID/APP_GID（既定1000:1000）で実行する。GitHub Actionsではcheckout所有者のid -u/id -gを渡す。rootのinitは専用依存volumeの最上位のみ所有者を設定し、ホストのソースやホームの権限を変更しない。CI run 34167157743では固定1000のままrunner所有ディレクトリへartifactsを作れずEACCESになったため、この差を修正した。
