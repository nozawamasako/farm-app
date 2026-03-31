# 🌾 小諸 畑管理アプリ

## ローカル起動

```bash
npm install
npm start
```

## Vercelで無料公開（URLを誰でも見られるようにする）

### ① GitHubにアップロード
1. [github.com](https://github.com) でアカウント作成（無料）
2. 「New repository」でリポジトリ作成（名前は何でもOK）
3. このフォルダの中身を全部アップロード

### ② Vercelでデプロイ
1. [vercel.com](https://vercel.com) でGitHubアカウントでログイン
2. 「Add New Project」→ 先ほどのリポジトリを選択
3. Framework: **Create React App** を選択
4. 「Deploy」ボタンを押す
5. 数分後に `https://your-app.vercel.app` のURLが発行される

### ③ 更新方法
GitHubのファイルを更新するだけで自動的に再デプロイされる。

## ログイン情報
| ロール | ID | パスワード |
|--------|-----|-----------|
| 管理者 | `admin` | `admin123` |
| 一般 | `farmer1` | `pass1` |

## 天気API（任意）
`src/App.jsx` の先頭の `WEATHER_API_KEY` に
[OpenWeatherMap](https://openweathermap.org/api) の無料APIキーを設定すると
リアルタイム天気が表示されます。
