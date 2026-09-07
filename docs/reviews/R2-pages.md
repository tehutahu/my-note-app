# R2 複数ページ

- 状態：実装済み・自動検証中・実機確認未回答
- 対象：NOTE-01 A/H、INK-04のノート全体Undo
- URL：http://localhost:4173
- バージョン：0.1.0、commit/PRなし（Gitの障害はprogress.md）

## 試す操作

1. ノートを開き、線を書いて「ページを追加」。新しい白紙が出る。
2. 新しいページに別の線を書き「ページ選択」で戻る。ページごとの線が保たれる。
3. 「ページを前へ」「ページを後へ」で並べ替え、保存済み後に再読み込み。変更した順序で開く。
4. 「ページを削除」で現在ページを削除。「元に戻す」で復元できる。
5. 最後の1ページでは削除ボタンが無効。データ層も0ページを拒否する。

Undo/Redoは開いているノート全体で最新100操作。ページ操作も同じ履歴に入る。再読み込みするとUndo履歴自体は消える。

## 自動検証

- RED：`artifacts/NOTE-pages-red.log`、コンテナ内`npm test -- tests/unit/pages.test.ts`、2件失敗、終了1。20件追加でも1件のまま、最後のページ削除が拒否されない未実装を確認。
- GREEN：`NOTE-pages-green.log`、全21件成功。20ページの追加/順序/削除、不正ID/重複/位置と最後の1ページ保護。
- UI RED：`NOTE-pages-ui-red.log`、`docker compose run --rm e2e`のbuild＋Playwright経路で追加ボタン不存在、1件失敗、終了1。
- 初回UI接続後：ラベルがoption内容を含みexact取得できなかった。`NOTE-pages-ui-label-failure.log`に保存し、明示的label forへ修正。
- UI GREEN：`NOTE-pages-ui-green.log`、全9件成功、retry 0、終了0。ページごとの筆跡・移動・再読み込み・削除・Undoを確認。
- `NOTE-pages-ui-unit.log`と`NOTE-pages-ui-check.log`：21件、lint/型/coverage/build成功。
- リファクタリング：Undo履歴を単一ページの筆跡配列からノートのページ配列へ変更。保存時に同じ配列からpageIdsを作り、順序不一致を避ける。ページ操作はDOMに依存しないdomain関数へ分離。
- 20ページのブラウザー受入は機能実装後の追加回帰検証。`NOTE-pages-acceptance-*`ログを参照し、RED先行とは扱わない。

## 制限・実機確認

実機端末/OS/結果/日は未回答。フォルダ・図形・背景切替・PDF・バックアップ・PWAは未実装。保存失敗時のファイル救出はまだないため、失敗状態では再読み込みしない。

次は背景・図形・蛍光ペンと整理機能を実装する。

## 2026-09-07 背景の追加

- 「用紙の背景」で無地・横罫線・方眼を選び、「背景色」で色を変更できる。ページ単位で保存しUndo対象。
- `NOTE-background-red.log`：背景選択UIがないため1件失敗、終了1。
- `NOTE-background-green.log`：全11件成功。罫線の画素位置、方眼の縦線、背景色、再読み込み、消しゴムで背景が残ることを確認。
- `NOTE-background-unit.log`：21件成功、`NOTE-background-check.log`：lint/型/coverage/build成功。
- `NOTE-pages-acceptance-e2e.log`で20ページの順序と名前の再読み込み一致も確認済み、全10件成功。NOTE-01 A合格、Hは未回答。

## 2026-09-07 図形の追加

「直線」「長方形」「楕円」を選んでドラッグするとプレビューし、離して確定する。ペンと同じ色・太さが適用される。図形の輪郭を消しゴムで消せて、ノートのUndo/Redo対象となる。

- 単体RED：`NOTE-shapes-red.log`、輪郭に触れても消去判定false、2件失敗、終了1。
- GREEN：`NOTE-shapes-unit-green.log`、全23件成功。中心は消さず輪郭のみ判定し、逆向きと幅0/点の楕円にも対応。
- UI RED：`NOTE-shapes-ui-red.log`、図形ツール不存在、1件失敗、終了1。
- 実装後のunit/check：`NOTE-shapes-ui-unit.log`、`NOTE-shapes-ui-check.log`、23件とlint/型/coverage/build成功。
- UI結果：`NOTE-shapes-ui-green.log`。最新の結果要約はprogress.mdを参照。
- 図形をStroke/Shapeの判別unionで保存し、共通輪郭を描画と消しゴム判定で使用。ページの背景は要素配列と別なので消しゴムの対象外。

NOTE-03の全太さ/色の組み合わせ、実機確認とPDF描画はまだ未検証。蛍光ペンも未実装。

## 2026-09-07 蛍光ペン

- 「蛍光ペン」を選んで書く。色・太さはペンと共通。透明度は固定0.25。
- `NOTE-highlighter-red.log`：ツール不存在で1件失敗、終了1。
- `NOTE-highlighter-unit.log`全23件、`NOTE-highlighter-check.log`lint/型/coverage/build成功。
- `NOTE-highlighter-green.log`全13件成功、終了0。画素比較で同じ一筆内の交差は同色、別筆との交差は濃く、保存再表示で同色を確認。
- 実装上は同じ向きの閉じた輪郭を1つのPath2Dへまとめ、nonzero規則で不透明な形状の和を作り、1回だけ透明度を適用する。入力プレビューは描き直すが、確定した全筆跡を入力ごとに再描画しない。
- NOTE-05のズーム後画素、各実機の見え方とPERF-01はまだ未検証。
