# R3 バックアップの上限と取り込み失敗

- 状態：自動検証中、実機未回答
- 対象：XFER-01/03/04、UI-03の取り込み失敗案内
- レビューURL：https://tehutahu.github.io/my-note-app/ （本修正の公開前。現在4f6c3fd）
- branch：fix/backup-size-boundaries。対象：Android2台/Windows。

## 操作と期待結果

「全体バックアップを書き出す」で保存した専用ファイルを別端末へ渡し、「バックアップを読み込む」でコピーとして取り込みます。PDF原本、フォルダ階層、筆跡を保持します。元の端末へ戻す場合もコピーとして追加されます。

許容上限内の大きなPDFで検証が途中停止する問題を修正しました。取り込み失敗時は「取り込みに失敗しました」に変わり、容量不足などの理由を日本語で表示します。検証中は「取り込みをキャンセル」が使えます。保存開始後はキャンセルできません。

## 証拠

- `XFER-boundary-red.log`：20MiB PDFで正規表現のスタック上限、終了1。`XFER-boundaries-all.log`5成功、11.36秒。1PDF20MiB、添付64MiB、1000ページ、200万点、UTF-8 100MiBの許容境界と超過を実測。
- `XFER-integrity-red.log`：失敗後も検証中の表示、終了1。`XFER-integrity-green.log`3成功、15.3秒。20MiB PDFのブラウザー復元と原本のhash/base64一致、PDF＋3階層の別context往復・編集・既存データ保持。
- `XFER-matrix-red.log`：11種類の不正fixtureを拒否して既存データ保持。実transaction中断時は二重abortの英語エラーになり失敗。`XFER-abort-cause-red.log`で元AbortErrorが消える失敗を別途再現。
- `XFER-abort-check.log`変更後npm test50成功、lint/型/coverage/build終了0。
- 再現：`docker compose run --rm app npm test`、`docker compose run --rm app pnpm run check`、`docker compose run --rm app pnpm exec vitest run --config vitest.boundaries.config.ts`、`docker compose run --rm e2e`。
- 全体E2EをXFER-all-e2e.logへ実行中。CI/commit/公開確認は終了後追記。

## 制限・未検証

境界試験は合成PDFを使用。すべてのPDFや実機メモリー容量を保証するものではありません。PDF処理器の互換性fixture、ゴミ箱を含む往復の追加監査、実機H、性能測定は別項目として継続しています。ユーザー確認は未回答。

### 全体回帰

`XFER-all-e2e.log`41成功（2.5分、retry0）。`XFER-verified-check.log`npm test50成功/check終了0。XFER-04は3階層を含む一括取込のpages段階/attachments段階のabortと容量不足を試験し、全4storeの追加が残らないことを比較する。最後の補強後の関連5件はXFER-verified-e2e.log。
