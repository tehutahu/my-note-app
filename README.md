# てのひらノート

Galaxy Tab S7+ / Galaxy S23 UltraのS PenとWindowsブラウザー向けの日本語手書きノートアプリを開発中です。

ペン・蛍光ペン・図形・背景・複数ページ・フォルダ・ゴミ箱、端末内保存、専用バックアップ、PDF取り込み/出力、オフライン起動を実装しています。現在は更新保護と定量的な受入検証を進めています。実機での書き心地は未確認です。

## ローカルで動かす

Node、依存、テスト、ブラウザーはDocker内のみで実行します。

```sh
docker compose build
docker compose run --rm app pnpm install --frozen-lockfile
docker compose run --rm app npm test
docker compose run --rm app pnpm run check
docker compose run --rm e2e
docker compose up -d preview
```

[ローカル試作](http://localhost:4173)で「ノートを作る」から筆記できます。保存済みを確認してから再読み込みしてください。保存失敗時も「このノートを書き出す」で画面に残る変更を専用形式へ出力できます。重要なノートの唯一の保存先として使える段階ではありません。

一覧の「PDFを取り込む」で原本に注釈を書けます。「PDFを書き出す」は全ページを出力します。編集可能な筆跡を別端末へ渡す場合は `.snote` を使ってください。PDFの再取り込みでは個別の筆跡へ戻りません。

オフライン利用はproductionプレビューで「オフライン準備完了」を確認してから通信を切ってください。ノートはブラウザーごとの端末内データです。別の端末・URL・ポートへは自動で同期しません。

## 開発の再開

[START_HERE.md](START_HERE.md)と[進捗](docs/progress.md)を読んで未完了工程から進めます。

- [詳細技術設計](docs/architecture.md)
- [受入基準](docs/acceptance.md)
- [環境・固定版](docs/environment.md)
- [筆記のレビュー手順](docs/reviews/R1-pen.md)
- [保存のレビュー手順](docs/reviews/R2-saving.md)
- [バックアップのレビュー手順](docs/reviews/R3-transfer.md)
- [PDFのレビュー手順](docs/reviews/R4-pdf.md)

自動テスト合格と実機確認合格は別に記録します。Git/GitHubは利用可能になり、PRでコンテナCIを検証しています。HTTPS公開と実機確認はこれからです。
