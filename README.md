# Stockly UI

Appleライクなモバイル在庫管理UIの実行可能プロトタイプです。

## 主な機能

- ホームダッシュボード
- 商品検索・在庫状態フィルター
- 商品詳細
- 入庫・出庫と在庫不足バリデーション
- 操作履歴
- JANコード入力による商品検索
- localStorageへの永続化
- PWA / オフラインキャッシュ
- スマートフォンとデスクトップのレスポンシブ表示

## 起動

Service Workerを正しく動かすため、ローカルHTTPサーバーで起動してください。

```bash
python3 -m http.server 8080
```

ブラウザーで `http://localhost:8080` を開きます。

## ファイル

- `index.html`: 画面骨格、ボトムナビ、入出庫シート
- `styles.css`: AppleライクなレスポンシブUI
- `app.js`: 状態管理、検索、画面遷移、入出庫、履歴
- `manifest.webmanifest`: PWA設定
- `sw.js`: オフラインキャッシュ
- `icon.svg`: アプリアイコン

## 本番接続時

現在のデータ層は `localStorage` です。本番では `store.products` と `store.history` の読み書きを Cloudflare Pages Functions / D1 APIへ置き換えてください。Firebase AuthenticationのIDトークンはAPIリクエストの `Authorization: Bearer <token>` に付与し、サーバー側で検証してください。
