# wxo-js-sdk 配置・配布ガイド

## SDKファイルの配置場所について

### 質問: SDKってどこに置くんですか？

**答え**: いくつかの選択肢があります。プロジェクトの状況に応じて選べます。

---

## オプション1: 自分のWebサーバーに配置（推奨・最もシンプル）

### 配置方法
```
あなたのWebサイト/
├── index.html
├── about.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── wxo-sdk.min.js  ← ここに配置！
└── images/
    └── logo.png
```

### 使い方
```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome</h1>
  
  <!-- 相対パスで読み込み -->
  <script src="js/wxo-sdk.min.js"></script>
  <script>
    window.wxOConfiguration = {
      orchestrationID: "...",
      hostURL: "...",
      agents: [...]
    };
    wxoLoader.init();
  </script>
</body>
</html>
```

### メリット
- ✅ 簡単
- ✅ 追加コストなし
- ✅ 完全にコントロールできる

### デメリット
- ❌ 各サイトで個別にファイルを管理
- ❌ 更新時に各サイトで再配置が必要

---

## オプション2: CDN（Content Delivery Network）に配置

### 無料CDNサービスの例

#### A. GitHub Pages（無料・簡単）
```
1. GitHubにリポジトリを作成
   wxo-js-sdk/
   └── dist/
       └── wxo-sdk.min.js

2. GitHub Pagesを有効化

3. 以下のURLで利用可能に
   https://your-username.github.io/wxo-js-sdk/dist/wxo-sdk.min.js
```

#### B. jsDelivr（GitHubと連携）
```
GitHubにpushするだけで自動的にCDN化
https://cdn.jsdelivr.net/gh/your-username/wxo-js-sdk@latest/dist/wxo-sdk.min.js
```

#### C. unpkg（npmパッケージ公開後）
```
npmに公開すると自動的に利用可能
https://unpkg.com/wxo-js-sdk@latest/dist/wxo-sdk.min.js
```

### 使い方
```html
<!-- どのWebサイトからでも同じURLで読み込める -->
<script src="https://cdn.jsdelivr.net/gh/your-username/wxo-js-sdk@latest/dist/wxo-sdk.min.js"></script>
<script>
  window.wxOConfiguration = { ... };
  wxoLoader.init();
</script>
```

### メリット
- ✅ 1箇所に配置すれば、どのサイトからでも使える
- ✅ 高速（世界中のサーバーから配信）
- ✅ 更新が簡単（1箇所を更新すれば全サイトに反映）

### デメリット
- ❌ 外部サービスに依存
- ❌ セットアップが少し複雑

---

## オプション3: npmパッケージとして配布

### 配布方法
```bash
# npmに公開
npm publish
```

### 使い方（開発者向け）
```bash
# インストール
npm install wxo-js-sdk
```

```javascript
// React, Vue, Angularなどで使用
import WxOClient from 'wxo-js-sdk';

const client = new WxOClient({
  orchestrationID: "...",
  agents: [...]
});
```

### メリット
- ✅ モダンなフロントエンド開発に適している
- ✅ バージョン管理が簡単

### デメリット
- ❌ ビルドツールが必要
- ❌ 技術的な知識が必要

---

## 推奨される配置戦略

### フェーズ1: 開発・テスト段階（今）
```
ローカルファイルとして配置
- 自分のPCで開発
- ローカルサーバーでテスト
```

### フェーズ2: 社内利用段階
```
オプション1: 自社Webサーバーに配置
- 社内の各Webサイトから読み込み
- 例: https://your-company.com/libs/wxo-sdk.min.js
```

### フェーズ3: 広く配布する場合
```
オプション2: CDN（GitHub Pages + jsDelivr）
- 誰でも使えるように公開
- 例: https://cdn.jsdelivr.net/gh/your-org/wxo-js-sdk@1.0.0/dist/wxo-sdk.min.js
```

---

## 具体的な配置例

### 例1: 社内の複数サイトで使う場合

#### 配置
```
社内Webサーバー (https://intranet.company.com)
└── shared/
    └── libs/
        └── wxo-sdk.min.js  ← ここに1つだけ配置
```

#### 各サイトでの使用
```html
<!-- サイトA (https://site-a.company.com) -->
<script src="https://intranet.company.com/shared/libs/wxo-sdk.min.js"></script>

<!-- サイトB (https://site-b.company.com) -->
<script src="https://intranet.company.com/shared/libs/wxo-sdk.min.js"></script>

<!-- サイトC (https://site-c.company.com) -->
<script src="https://intranet.company.com/shared/libs/wxo-sdk.min.js"></script>
```

### 例2: 外部の顧客サイトで使う場合

#### 配置（GitHub Pages）
```
1. GitHubリポジトリ作成
   https://github.com/your-company/wxo-js-sdk

2. dist/wxo-sdk.min.js をpush

3. GitHub Pagesを有効化

4. 以下のURLで利用可能
   https://your-company.github.io/wxo-js-sdk/dist/wxo-sdk.min.js
```

#### 顧客サイトでの使用
```html
<!-- 顧客A -->
<script src="https://your-company.github.io/wxo-js-sdk/dist/wxo-sdk.min.js"></script>

<!-- 顧客B -->
<script src="https://your-company.github.io/wxo-js-sdk/dist/wxo-sdk.min.js"></script>
```

---

## 開発中のファイル構成

### 現在のプロジェクト
```
wxo-js-sdk/                    ← このプロジェクト
├── src/                       ← 開発中のソースコード
│   ├── index.js
│   ├── core/
│   ├── agents/
│   └── ...
├── dist/                      ← ビルド後の配布ファイル
│   ├── wxo-sdk.js            ← 開発用（非圧縮）
│   └── wxo-sdk.min.js        ← 本番用（圧縮）
└── examples/                  ← 使用例
    └── basic.html
```

### ビルドプロセス
```bash
# 開発中
npm run dev        # src/ のコードを編集

# ビルド
npm run build      # dist/wxo-sdk.min.js を生成

# 配布
# dist/wxo-sdk.min.js を配置場所にコピー
```

---

## 実際の配置手順（ステップバイステップ）

### ステップ1: 開発完了後
```bash
# プロジェクトディレクトリで
npm run build

# dist/wxo-sdk.min.js が生成される
```

### ステップ2: 配置先を決定
```
選択肢A: 自社Webサーバー
選択肢B: GitHub Pages
選択肢C: その他のCDN
```

### ステップ3: ファイルをコピー
```bash
# 例: 自社Webサーバーの場合
scp dist/wxo-sdk.min.js user@server:/var/www/html/libs/

# 例: GitHub Pagesの場合
git add dist/wxo-sdk.min.js
git commit -m "Release v1.0.0"
git push origin main
```

### ステップ4: 各サイトで使用
```html
<script src="配置したURL/wxo-sdk.min.js"></script>
<script>
  window.wxOConfiguration = { ... };
  wxoLoader.init();
</script>
```

---

## よくある質問

### Q1: 開発中はどこに置けばいい？
**A**: プロジェクトの`dist/`フォルダに生成されます。ローカルサーバーで`examples/basic.html`を開いてテストできます。

### Q2: 本番環境ではどこに置くべき？
**A**: 
- **社内のみ**: 自社Webサーバーの共有ディレクトリ
- **外部にも公開**: GitHub Pages + jsDelivr（無料）

### Q3: 複数のサイトで使う場合は？
**A**: 1箇所に配置して、各サイトから同じURLで読み込むのが効率的です。

### Q4: 更新したらどうなる？
**A**: 
- **自社サーバー**: ファイルを上書きすれば、次回アクセス時に新バージョンが読み込まれる
- **CDN**: キャッシュがあるので、バージョン番号を変更（v1.0.0 → v1.0.1）

---

## 推奨: 最初はシンプルに

### 開発・テスト段階（今）
```
wxo-js-sdk/
└── examples/
    ├── basic.html
    └── js/
        └── wxo-sdk.min.js  ← ここに配置してテスト
```

```html
<!-- examples/basic.html -->
<script src="js/wxo-sdk.min.js"></script>
```

### 本番環境（後で決める）
```
実際に使う段階で、配置場所を決定
- 社内サーバー
- GitHub Pages
- その他
```

---

## まとめ

**SDKの配置場所**:
1. 📁 **開発中**: プロジェクトの`dist/`フォルダ
2. 🌐 **本番環境**: 
   - シンプル → 自社Webサーバー
   - 広く配布 → GitHub Pages + CDN
3. 📦 **npm**: モダンな開発環境向け

**最初のステップ**:
まずは開発を完了させて、`dist/wxo-sdk.min.js`を生成。
配置場所は後で決めればOKです！

**この説明で理解できましたか？他に質問はありますか？**