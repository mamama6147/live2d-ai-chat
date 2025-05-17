# Live2Dアニメキャラクター×AIチャット アプリ

このプロジェクトは、Live2DアニメキャラクターとOpenAI(ChatGPT)APIを組み合わせたインタラクティブなWebアプリケーションです。ユーザーがテキストを入力すると、キャラクターが表情豊かに反応し、AIの返答を音声で読み上げます。

## 特徴

- Live2Dキャラクターの表示とアニメーション
- ChatGPT APIを使用したインテリジェントな会話
- テキスト読み上げによる音声応答
- リップシンク（音声に合わせた口の動き）機能
- 感情分析に基づくキャラクターの表情変化

## 技術スタック

### フロントエンド
- HTML5/CSS3/JavaScript
- [Live2D Cubism SDK for Web](https://www.live2d.com/en/download/cubism-sdk/download-web/)
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)（Pixi.js上でのLive2D表示用）
- Web Audio API（音声再生・リップシンク用）

### バックエンド
- Node.js + Express（サーバーサイド処理）
- OpenAI API（ChatGPT 3.5/4）
- 音声合成サービス
  - [VOICEVOX](https://voicevox.hiroshiba.jp/)（無料の音声合成エンジン）
  - Azure Cognitive Services（オプション）

## セットアップ

### 前提条件
- Node.js (バージョン14以上)
- npm または yarn
- OpenAI APIキー
- VOICEVOX（無料の音声合成エンジン）をローカルで起動するか、Azure Cognitive Servicesのキー

### インストール手順
1. リポジトリをクローン:
```
git clone https://github.com/mamama6147/live2d-ai-chat.git
cd live2d-ai-chat
```

2. 依存関係のインストール:
```
# クライアント側
cd client
npm install

# サーバー側
cd ../server
npm install
```

3. 環境変数の設定:
サーバーディレクトリに `.env` ファイルを作成し、以下のように設定:
```
OPENAI_API_KEY=your_openai_api_key
TTS_SERVICE=voicevox
VOICEVOX_ENDPOINT=http://localhost:50021
VOICEVOX_SPEAKER_ID=3  # ずんだもん（ノーマル）
```

4. Live2Dモデルの配置:
公式サンプルまたは自作モデルを `client/public/models` ディレクトリに配置します。

### VOICEVOXの設定

このプロジェクトはデフォルトでVOICEVOXを使用します。VOICEVOXは無料の日本語音声合成エンジンで、様々なキャラクターボイスが利用可能です。

1. [VOICEVOX公式サイト](https://voicevox.hiroshiba.jp/)からソフトウェアをダウンロード・インストール
2. VOICEVOXを起動し、バックグラウンドで実行したままにする
3. デフォルトでは `http://localhost:50021` でサービスが提供されます

#### サポートされているVOICEVOX話者

以下のIDで多数の話者とスタイルをサポートしています：
- 四国めたん: 2（ノーマル）、0（あまあま）、6（ツンツン）など
- ずんだもん: 3（ノーマル）、1（あまあま）、7（ツンツン）など
- その他多数の話者

詳細はクライアント設定UIから選択するか、VOICEVOXのソフトウェアで確認できます。

## 開発環境の起動

```
# サーバー起動 (server ディレクトリ内で)
npm run dev

# クライアント開発サーバー起動 (client ディレクトリ内で)
npm run dev
```

## 機能実装ステータス

- [x] プロジェクト構造のセットアップ
- [x] Live2Dモデル表示
- [x] ChatGPT API連携
- [x] 音声合成機能（VOICEVOX/Azure）
- [x] リップシンク実装
- [x] 表情変化の実装
- [x] チャットUI

## ライセンス

このプロジェクトは開発中です。Live2Dモデルを含む各コンポーネントのライセンスに従ってください。