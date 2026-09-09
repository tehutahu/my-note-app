# R1 入力の境界・倍率・履歴

- 対象：INK-01/03/04/05
- 状態：自動検証成功、統合前
- レビューURL：https://tehutahu.github.io/my-note-app/

描画領域の外へドラッグして離した途中の操作は破棄し、次の筆記を通常どおり開始します。ペンや消しゴムの既存の選択は保ちます。

INK-matrix-first.logで領域外releaseが1筆として保存される失敗を確認（期待0筆）。pointerupで描画領域を確認し、領域外なら未確定操作をcancelする最小修正を追加しました。別の失敗は試験の消しゴム座標がviewport外だったため、canvasを画面内へスクロールしてからクリックするよう修正しています。

INK-migration-matrix.log：Chromium7成功（25.9秒）、Firefox7成功（50.0秒）。このうち入力5試験は100本/10点/0.2と0.8の筆圧画素/100回UndoとRedo/10点消去/新規編集でRedo消滅、領域外解放後の再筆記、4倍率×DPR1/2/3×パン有無の保存座標と実画素を検証します。残る2試験は移行で全ストアとPDF原本を保持する検証です。

既存機能の数量・行列テストは回帰監査であり、未実装RED先行と偽りません。領域外解放のみ不一致を確認してから修正しています。実S Penの筆圧・パームリジェクションは合成イベントでは証明しません。従来R1の両Android肯定回答は進捗に別記しています。

ACCEPT-matrices-final-check.log：`docker compose run --rm app sh -c 'npm test && pnpm run check'` は終了0、57テスト成功、lint/型/カバレッジ/build成功。RED/GREENログはすべてartifacts/に保存（Git対象外）。
