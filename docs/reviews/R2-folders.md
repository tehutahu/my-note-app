# R2 フォルダ階層

- 状態：実装済み・ブラウザー検証中・ユーザー未確認
- 対象受入ID：NOTE-02、DATA-03の移動時競合拒否（部分）
- URL：http://localhost:4173
- commit/PR：なし（.git読み取り専用・GitHub認証の障害）

## 試す操作

1. 一覧の「新しいフォルダ名」へ名前を入力し「フォルダを作る」。
2. 作成した「フォルダ: 名前」を開き、その中に子フォルダやノートを作る。
3. ノート一覧の「ノートの移動先」を選び「ノートを移動」。移動先フォルダでノートが見つかる。
4. フォルダ内の「このフォルダの名前」で改名できる。「フォルダの移動先」で親を変更できる。
5. 再読み込みして階層、名前、ノートの配置が残ることを確認する。

自分や子孫への移動、20階層を超える移動は日本語で理由を表示して拒否する。同名フォルダは許可するので、移動先には祖先を含むパスを表示する。

## 検証

- domain RED：`NOTE-folders-red.log`、4件失敗、終了1。追加しても配列が増えず、不正移動や名前が拒否されない未実装を確認。
- domain GREEN：`NOTE-folders-green.log`、全27件成功。100件/20階層、子孫を含む制限、循環、同名、trim、1〜120文字。
- storage RED：`NOTE-folder-storage-red.log`、2件失敗、終了1。保存したはずのフォルダがなく、ノートの移動先も変わらない。
- storage GREEN：`NOTE-folder-storage-green.log`全29件成功。transaction内の最新ツリーを検証し保存、不正移動でDB保持。ノート移動はrevisionを増やし古い編集を拒否。
- UI RED：`NOTE-folder-ui-red.log`、新しいフォルダ名の入力欄不存在、1件失敗、終了1。
- UI結果：`NOTE-folder-ui-green.log`、最新要約はprogress.md。
- 必須npm test/check：`NOTE-folder-ui-unit.log`（29件成功）、`NOTE-folder-ui-check.log`（lint/型/coverage/build成功）。
- 本番依存追加なし。domainはDB・DOMから分離し、保存直前のtransaction内で検証する。

## 未検証と制限

実機端末・OS・結果・日時は未回答。ゴミ箱と復元は未実装。複数タブの専用競合UIは未完了。同名が同じ親の下にある場合、移動先パスも同じ表示になるため、選択しやすさの改善は残る。
