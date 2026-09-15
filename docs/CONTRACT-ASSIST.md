# 条項アシスト機能

契約書の条項テキストをチャット画面に表示し、エージェントとの対話を補助する機能。エージェントの設定で `clauseAssistData` を指定したときのみ有効になる。

## 設定方法

```js
// garoon-embed-xxx.js
agents: [
  {
    id: 'agent1',
    name: '法務AIアシスタント',
    agentId: '...',
    agentEnvironmentId: '...',
    clauseAssistData: window.wxoContractDataCustomer,  // データを参照
    clauseAssistAutoOpen: true  // 起動時に自動展開（デフォルト: true）
  }
]
```

`clauseAssistData` は JavaScript オブジェクトを直接受け取る。`window.wxoContractDataCustomer` はGaroonに別途登録したデータファイルがページロード時にセットするグローバル変数。

## Garoon への登録構成

Garoon の「カスタマイズ → JavaScript」に以下の順で登録する：

1. **データファイル**（例: `garoon-contract-data-customer.js`）— 契約書データをグローバル変数に定義
2. **埋め込みJS**（例: `garoon-embed-xxx.js`）— SDKの設定・初期化

データファイルが先に実行されることで、埋め込みJSが `window.wxoContractDataCustomer` を参照できる。

## データファイルの構造

`data/contracts/` 以下に格納。ファイルはGaroonに登録する前のマスターとして管理する。

```js
window.wxoContractDataCustomer = {
  "契約書名": {
    "前文": {
      "title": "前文",
      "content": "前文テキスト（clauses がない場合はここに本文）",
      "clauses": {}
    },
    "第1条": {
      "title": "条のタイトル",
      "content": "",
      "clauses": {
        "1": "第1項のテキスト",
        "2": "第2項のテキスト"
      }
    }
  }
};
```

### フィールド説明

| フィールド | 説明 |
|---|---|
| グローバル変数名 | `window.wxoContractDataCustomer`（お客様向け）/ `window.wxoContractDataSupplier`（仕入先向け） |
| 契約書名（第1階層） | 契約書のタイトル（文字列キー） |
| 条名（第2階層） | `"前文"`、`"第1条"` など |
| `title` | 条のタイトル |
| `content` | 条の本文。`clauses` がある条では空文字 |
| `clauses` | 項のオブジェクト。キーは `"1"`, `"2"` ... の文字列 |

## データファイルの更新

ファイルのデータ量が多く手作業での編集が困難なため、Claude Code（別チャット）に依頼して更新する。更新時は `scripts/audit-contract-data.py` で元の docx との差分チェックを行う（`pip install python-docx` 必要）。

## 現在の契約書

| ファイル | グローバル変数 | 内容 |
|---|---|---|
| `garoon-contract-data-customer.js` | `window.wxoContractDataCustomer` | お客様向け契約書 |
| `garoon-contract-data-supplier.js` | `window.wxoContractDataSupplier` | 仕入先向け契約書 |
