# 複数タブの編集競合

受入ID: DATA-03、DATA-02。URL: http://localhost:4173 。同じノートを2タブで開き、一方に書いて保存後、もう一方に書く。後のタブは「未保存・編集競合」と表示し、編集を停止する。「このノートを書き出す」でファイルへ救出、または「変更をコピーとして保存」でルートへ独立したノートを作れる。先のタブの保存内容は上書きしない。

TDD: `DATA-conflict-red.log`で競合表示が無い期待不一致を確認（終了1）。型付き競合エラー、入力停止、コピー保存を追加。`DATA-conflict-green.log`では別タブの点x=80と競合側の点x=150が独立ノートに残ることを実IndexedDBから確認し、競合後の追加筆記が入らないことも確認。保存/更新の周辺E2Eを含む。再現: `docker compose run --rm e2e sh -c 'pnpm run build && pnpm exec playwright test tests/e2e/conflict.spec.ts tests/e2e/save.spec.ts tests/e2e/pwa-update.spec.ts'`。

変更後npm test/checkは`DATA-conflict-final-unit.log`/`DATA-conflict-final-check.log`。git制限のためcommitなし。Hは未実施。

制限: 同時書き込みはrevision照合で拒否する方式。Web Locksで最初から片方を読み取り専用にする方式は未実装。競合コピーのPDF原本が他操作で完全削除されている場合はコピーを拒否し、欠けた参照のまま保存しない。PDF付き競合コピーのブラウザー検証はまだ追加が必要。

結果: 関連5E2E成功（16.3秒、retry 0、終了0）、npm test 41成功、check終了0。build版ID `387b8c65b07dcd7d`。
