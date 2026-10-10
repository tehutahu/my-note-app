# 複数タブの編集競合

> 2026-10-10 現在のレビュー入口： [公開アプリ](https://tehutahu.github.io/my-note-app/) ／ [正式Hの端末別手順と回答欄](../human-review.md)。機能固定版28cd18aと同一製品ソース。画面の版を回答に記録する。自動条項の最終統合監査中、Hは未回答。現在の証拠と制限は[条項監査](../acceptance-audit.md)を参照。以下の当時のログ・制限は履歴として保持する。

> この票には作成当時の状態・制限も残っています。2026-10-10以降の現在状態は[進捗](../progress.md)と[受入監査](../resume-status.md)を参照してください。過去の「未実装」「Git障害」「実行中」を現在の判定へ流用しません。

受入ID: DATA-03、DATA-02。URL: http://localhost:4173 。同じノートを2タブで開き、一方に書いて保存後、もう一方に書く。後のタブは「未保存・編集競合」と表示し、編集を停止する。「このノートを書き出す」でファイルへ救出、または「変更をコピーとして保存」でルートへ独立したノートを作れる。先のタブの保存内容は上書きしない。

TDD: `DATA-conflict-red.log`で競合表示が無い期待不一致を確認（終了1）。型付き競合エラー、入力停止、コピー保存を追加。`DATA-conflict-green.log`では別タブの点x=80と競合側の点x=150が独立ノートに残ることを実IndexedDBから確認し、競合後の追加筆記が入らないことも確認。保存/更新の周辺E2Eを含む。再現: `docker compose run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test tests/e2e/conflict.spec.ts tests/e2e/save.spec.ts tests/e2e/pwa-update.spec.ts'`。

変更後npm test/checkは`DATA-conflict-final-unit.log`/`DATA-conflict-final-check.log`。git制限のためcommitなし。Hは未実施。

制限: 同時書き込みはrevision照合で拒否する方式。Web Locksで最初から片方を読み取り専用にする方式は未実装。競合コピーのPDF原本が他操作で完全削除されている場合はコピーを拒否し、欠けた参照のまま保存しない。PDF付き競合コピーのブラウザー検証はまだ追加が必要。

結果: 関連5E2E成功（16.3秒、retry 0、終了0）、npm test 41成功、check終了0。build版ID `387b8c65b07dcd7d`。
