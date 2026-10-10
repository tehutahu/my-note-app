# てのひらノート

Galaxy Tab S7+ / Galaxy S23 UltraのS PenとWindowsブラウザー向けの日本語手書きノートアプリを開発中です。

ペン・蛍光ペン・図形・背景・複数ページ・フォルダ・ゴミ箱、端末内保存、専用バックアップ、PDF取り込み/出力、オフライン起動、更新保護、S Pen側面ボタン、性能診断を実装しています。現在は最終版の受入検証と実機レビューを進めています。両Androidの基本筆記について肯定回答が記録されていますが、正式な実機受入は未完了です。

[HTTPSレビュー版を開く](https://tehutahu.github.io/my-note-app/)。画面の版表示でcommitを確認できます。localhostとは保存領域が異なるため、既存ノートを移す場合は専用バックアップを書き出してから読み込んでください。

[確認用サンプル](https://tehutahu.github.io/my-note-app/samples/)は、筆記計測用S、PDF計測用P、回転・用紙確認用R4の合成データと操作案内です。サンプル追加版の公開確認結果は[進捗](docs/progress.md)に記録します。サンプルの保存には通信が必要です。取り込みは既存ノートを残した独立コピーになります。

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
- [受入の監査と再開手順](docs/resume-status.md)
- [筆記のレビュー手順](docs/reviews/R1-pen.md)
- [保存のレビュー手順](docs/reviews/R2-saving.md)
- [バックアップのレビュー手順](docs/reviews/R3-transfer.md)
- [PDFのレビュー手順](docs/reviews/R4-pdf.md)

自動テスト合格と実機確認合格は別に記録します。PRでコンテナCIを検証し、mainの成功した成果物をHTTPS配信しています。実機確認と全受入項目の達成は未完了です。
