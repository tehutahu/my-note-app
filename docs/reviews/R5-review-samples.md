# R5 実機レビュー用の合成サンプル

> 2026-10-10 現在のレビュー入口： [公開アプリ](https://tehutahu.github.io/my-note-app/) ／ [正式Hの端末別手順と回答欄](../human-review.md)。機能固定版28cd18aと同一製品ソース。画面の版を回答に記録する。39 Aの条項監査・自動検証合格、正式H20項目は全件未回答。現在の証拠と制限は[条項監査](../acceptance-audit.md)を参照。以下の当時のログ・制限は履歴として保持する。

- 対象受入ID：PERF-01/03/04、PDF-01/03、XFER-01、PWA-01/02/04、DATA-01のH確認を補助。
- 状態：生成、固定版28cd18aのサブパスブラウザー検証、公開版9529f31のファイル照合成功。Hは未回答。
- 操作URL：https://tehutahu.github.io/my-note-app/samples/ 。公開版のcommitをアプリ画面で記録する。
- 対象端末：Tab S7+、S23 Ultra、Windows ChromeまたはEdge。

個人情報のないノートS、20ページPDFのP、回転と用紙確認用の8ページPDFのR4を保存できます。案内ページからアプリへ戻り、通常の読み込み操作で追加します。

| 操作 | 期待結果 |
| --- | --- |
| Sを保存し「バックアップを読み込む」 | 既存ノートを残し「筆記計測サンプル S」を独立コピーとして追加。2000筆と100図形。 |
| Sで「動作の計測」を開始し10秒以上筆記、1筆→保存済みを10回 | 停止後に本文を含まないJSONを出力できる。温度・省電力・OS・ブラウザー・アプリの版を併記。1000イベント未満は追加計測。 |
| Pを取り込み、ページ切替・全ページPDF出力をwarm-up後10回 | 20ページの表示と出力が成功し、診断JSONを出力できる。 |
| R4の8ページに赤いマーカーを囲む注釈を追加しPDF出力 | Windowsの外部ビューアーで全ページ・位置・向き・選択可能な文字を確認できる。 |
| 合成ノートをAndroid→Windows→Androidで受け渡す | Windowsで追加した印を保持。各Androidで往復を確認。 |
| 準備完了後に通信を切り、既存PDFで筆記・保存・再表示・二形式出力 | 成功。保存後の再表示を3回確認。Androidはホーム画面追加で独立起動も確認。 |

- 過去RED：`artifacts/REVIEW-samples-red.log`。生成先が空で、必要な5ファイルとの期待不一致。生成機能未実装による失敗。
- 過去GREEN：`artifacts/REVIEW-samples-green.log`、npm test60件成功。
- 再開時：`RESUME-unit.log`、`RESUME-check.log`、`RESUME-samples-unit.log`、`RESUME-samples-check.log`は終了0。60件、lint/型/coverage/build成功。
- ブラウザー：`RESUME-samples-subpath.log`、2件成功、終了0。制御中のPWAからサンプルへ遷移、3ファイルのダウンロードと実SHA-256、事前cache対象外、既存ノートの筆跡保持、Sのコピー取り込みを確認。
- 追加ブラウザー試験は既存変更の回帰監査であり、未実装RED先行とは表記しない。現在の再現コマンドは`docker compose run --rm e2e sh -c 'BASE_PATH=/my-note-app/ pnpm run build && pnpm exec playwright test --config playwright.subpath.config.ts'`。
- 最終固定版：`RESUME-fixed-subpath.log`は2件成功（15.2秒、retry0、終了0）。`RESUME-fixed-subpath-results.json`にfull commit28cd18aとPWA版deaf7e5cfc6981feを記録。追加したスクリーンショットもこの実行で保存した。
- 公開確認：main9529f31のCI verify/deployはrun38037616789で成功。`RESUME-https-live.log`はHTTPS/offlineの1件成功、`RESUME-https-samples-results.json`はS/P/R4/案内HTMLのHTTP200、サイズ、SHA-256が固定版と一致。公開確認が個人ノートを変更しないよう、独立したブラウザーcontextと合成データだけを用いた。
- 画像：`artifacts/review-samples.png`。

サンプルの保存には通信が必要です。計測JSONはイベント処理時間であり、物理ペンから画面までの総遅延ではありません。サンプルの自動試験成功をH合格にしません。端末・OS・ブラウザー・版・実機結果・確認日は未回答です。
