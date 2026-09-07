# R2 ノートの保存・再表示（第一段階）

- 状態：基本保存の自動検証合格・ユーザー確認待ち。M2全体は実装中。
- 対象受入ID：DATA-01、DATA-02/03部分、NOTE-01部分
- レビューURL：http://localhost:4173
- バージョン：0.1.0、commitなし（.git読み取り専用）、HTTPS公開なし
- 対象端末：まずWindowsのローカルブラウザー。AndroidはHTTPS配信後。

## できるようになったこと

ノートを作り、名前を変え、書いた線をこのブラウザー内に保存できる。保存済み後の再読み込みやノート一覧からの再表示で復元する。消しゴムとUndo/Redoも保存する。

## 試す手順

| 手順 | 操作 | 期待結果 |
| --- | --- | --- |
| 1 | URLを開き「ノートを作る」 | 白い用紙と保存状態が出る |
| 2 | ノート名を変えて線を書く | 保存中→保存済みになる |
| 3 | 保存済みを確認し再読み込み | 名前と線が残る |
| 4 | 「ノート一覧」で戻り、作成したノートを開く | 同じ内容が表示される |
| 5 | 線を消して「元に戻す」、保存済み後に再読み込み | 元に戻した線が残る |

実機結果はまだ未回答。自動試験に使ったノートは各テスト専用ブラウザー内の合成データ。

## 検証証拠

- repository RED：`artifacts/DATA-repository-red.log`。`docker compose run --rm app npm test -- tests/integration/repository.test.ts`相当のコンテナ内実行、保存未実装による5件失敗、終了1。
- repository GREEN：`DATA-repository-green.log`全16件成功。ノートとページの一括保存、接続再開、メタデータ一覧、重複IDのabort、revision競合、不正ページ参照。
- session RED：`DATA-session-red.log`、3件失敗、終了1。未実装で保存中にならない／書き込みが発生しない。
- session GREEN：`DATA-session-green.log`全19件成功。commit前の保存中、直列化、最新編集保持、QuotaExceededError後の明示的再試行。
- UI RED：`DATA-ui-red.log`、保存UI未実装で2件失敗・既存5件成功、終了1。
- UI GREEN：`DATA-ui-green.log`、全7件成功、終了0。実ブラウザーで再読み込み復元とIndexedDB transactionの意図的abort、DBの既存commit不変、メモリー保持、再試行後の復元を確認。
- `DATA-ui-unit.log`/`DATA-ui-check.log`：19件成功、lint/型/coverage/build成功。storageはlines100%、statements95.08%、functions96%、branches92%。
- 機能をdomain型、repository、保存セッション、UIに分離。UIからDBへ直接書かず保存セッションで直列化し、transaction完了まで保存済みにしない。
- 200筆×20回の受入試験は基本保存実装後に追加した定量的な回帰検証。追加分をRED先行とは扱わない。結果は進捗文書と`DATA-acceptance`のログ参照。
- 画像：`artifacts/pen-desktop.png`。保存表示が見える。

## 制限と未検証

バックアップ書き出し、複数ページ、フォルダ、図形、PDF、PWAは未実装。保存失敗時は画面に変更を保持するが、ファイルへの救出はまだない。失敗状態で再読み込みしないこと。複数タブの古いrevisionはデータ層で拒否するが、UIの専用競合案内・コピー救出と2タブE2Eは未完了。DATA-02/03全条件合格ではない。

保存はこのoriginのこのブラウザー内だけ。ブラウザーデータ削除や別端末への自動同期を保証しない。Android/Windows実機レビューと性能測定は未実施。

## ユーザー確認

端末/OS/ブラウザー、結果、確認日はすべて未回答。

## 次

M2の複数ページ・背景・図形・フォルダ・ゴミ箱、失敗時のコピー救出とバックアップを実装する。
