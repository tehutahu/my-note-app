# フォルダ移動中の誤操作防止

> 2026-10-10 現在のレビュー入口： [公開アプリ](https://tehutahu.github.io/my-note-app/) ／ [正式Hの端末別手順と回答欄](../human-review.md)。機能固定版28cd18aと同一製品ソース。画面の版を回答に記録する。39 Aの条項監査・自動検証合格、正式H20項目は全件未回答。現在の証拠と制限は[条項監査](../acceptance-audit.md)を参照。以下の当時のログ・制限は履歴として保持する。

> この票には作成当時の状態・制限も残っています。2026-10-10以降の現在状態は[進捗](../progress.md)と[受入監査](../resume-status.md)を参照してください。過去の「未実装」「Git障害」「実行中」を現在の判定へ流用しません。

受入ID: NOTE-02、PWA-03。フォルダを開くための読み込み中は、移動前の入力欄・ボタン・キャンバスを操作できない。表示が切り替わった後、新しいフォルダ名を変更できる。処理中のPWA更新も拒否する。

CIのNOTE-02失敗を調べ、旧画面で入力した名前が移動先の描画により失われる競合を確認。`NOTE-navigation-red.log`ではIndexedDB transactionで読み込みを意図的に保留し、旧入力欄がenabledである期待不一致（終了1）を再現した。画面遷移と整理操作をwithViewLockで保護し、失敗時も操作状態を戻す。

`NOTE-navigation-green.log`関連4E2E成功（9.6秒、retry 0）。フォルダ作成・移動・改名・再起動、保留中の旧画面停止、競合コピー、更新保護を確認。変更後npm test/checkは`NOTE-navigation-final-unit.log`/`NOTE-navigation-final-check.log`。再現: `docker compose run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test tests/e2e/folders.spec.ts tests/e2e/conflict.spec.ts tests/e2e/pwa-update.spec.ts'`。

確認URL: http://localhost:4173 。フォルダ移動後、見出しが移動先の名前になってから改名し、変更後の見出しを確認して再起動する。Hは未実施。ファイル取り込み中の操作整理はXFER受入で別途確認する。
