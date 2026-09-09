# R4 図形と蛍光ペンのPDF出力・保持

- 対象：NOTE-03/05、PDF-03、DATA-04、XFER-02
- 状態：自動検証成功、統合前
- レビューURL：https://tehutahu.github.io/my-note-app/

図形をPDFに書き出した際の線端と角を、画面と同じ丸い形に揃えます。太い長方形の描画開始位置の角が欠ける差と、直線の角張った線端を修正します。

PDF-shape-edge-red.log：ページ0の長方形開始角で赤成分255（背景）が返り、期待80未満（青い線）に対して失敗。画像attributes-pdf-0.pngで確認。pdf-libのborderLineCapとgraphics stateのLineJoinStyleをRoundにし、その図形だけへ適用しました。

PDF-shape-green.log：Chromium3成功（17.1秒）、Firefox3成功（32.2秒）。3種類の図形×太さ0.5/3/12×赤緑青を3種類の背景で保存し、全属性一致・形状の実画素・全3ページPDF再描画を確認。蛍光ペンの一筆内/別筆交差、再表示、200%拡大、PDF再描画のRGB差±2以内を確認。ゴミ箱の2階層/PDF/筆跡を含むバックアップを2回独立コピーし、全ID非衝突・元DB不変・削除状態/原本hash保持と復元後の再表示も成功。

INK-migration-matrix.logの移行2試験（両ブラウザー）では、成功/transaction abortそれぞれで5ストアの全レコードとPDF Blob全byteが不変。初回の属性・移行・ゴミ箱監査自体は製品実装後の回帰補強です。

Windowsの外部PDFビューアーによるH確認は未実施です。

ACCEPT-matrices-final-check.log：`docker compose run --rm app sh -c 'npm test && pnpm run check'` は終了0、57テスト成功、lint/型/カバレッジ/build成功。RED/GREENログはすべてartifacts/に保存（Git対象外）。
