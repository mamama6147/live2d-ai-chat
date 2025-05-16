# Live2Dアニメキャラクター×AIチャット アプリ

このプロジェクトは、Live2DアニメキャラクターとOpenAI(ChatGPT)APIを組み合わせたインタラクティブなWebアプリケーションです。ユーザーがテキストを入力すると、キャラクターが表情豊かに反応し、AIの返答を音声で読み上げます。

## 特徴

- Live2Dキャラクターの表示とアニメーション
- ChatGPT APIを使用したインテリジェントな会話
- テキスト読み上げによる音声応答
- リップシンク（音声に合わせた口の動き）機能
- 感情分析に基づくキャラクターの表情変化
- VOICEVOX音声合成エンジン対応

## 技術スタック

### フロントエンド
- HTML5/CSS3/JavaScript
- [Live2D Cubism SDK for Web](https://www.live2d.com/en/download/cubism-sdk/download-web/)
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)（Pixi.js上でのLive2D表示用）
- Web Audio API（音声再生・リップシンク用）

### バックエンド
- Node.js + Express（サーバーサイド処理）
- OpenAI API（ChatGPT 3.5/4）
- 音声合成サービス：
  - [VOICEVOX](https://voicevox.hiroshiba.jp/)（無料日本語音声合成エンジン）
  - Azure Cognitive Services Speech（オプション）

## セットアップ

### 前提条件
- Node.js (バージョン14以上)
- npm または yarn
- OpenAI APIキー
- VOICEVOX（ローカルで実行する場合）またはAzure Speech APIキー（Azureを使用する場合）

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
# OpenAI API設定
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo  # または gpt-4

# 音声合成(TTS)設定
TTS_SERVICE=voicevox  # 'azure', 'voicevox', 'dummy'のいずれか

# VOICEVOX設定
VOICEVOX_ENDPOINT=http://localhost:50021  # VOICEVOXエンジンのエンドポイント
VOICEVOX_SPEAKER_ID=1  # 話者ID (1=四国めたん, 2=ずんだもん, etc)

# Azure TTS設定 (TTS_SERVICE=azureの場合に使用)
AZURE_TTS_KEY=your_azure_tts_key
AZURE_TTS_REGION=japaneast
AZURE_TTS_VOICE=ja-JP-NanamiNeural
```

4. Live2Dモデルの配置:
公式サンプルまたは自作モデルを `client/public/models` ディレクトリに配置します。

### VOICEVOXのセットアップ

1. [VOICEVOX公式サイト](https://voicevox.hiroshiba.jp/)からVOICEVOXエンジンをダウンロードしてインストール
2. VOICEVOXエンジンを起動（バックグラウンドで動作するアプリケーション）
3. `.env`ファイルで`TTS_SERVICE=voicevox`を設定
4. サーバー側で`VOICEVOX_ENDPOINT`が正しく設定されていることを確認（デフォルトは`http://localhost:50021`）

## 開発環境の起動

```
# サーバー起動 (server ディレクトリ内で)
npm run dev

# クライアント開発サーバー起動 (client ディレクトリ内で)
npm run dev
```

ブラウザで http://localhost:3000 にアクセスすると、アプリケーションが表示されます。

## 機能実装ステータス

- [x] プロジェクト構造のセットアップ
- [x] Live2Dモデル表示
- [x] ChatGPT API連携
- [x] 音声合成機能
- [x] VOICEVOX連携
- [x] リップシンク実装
- [x] 表情変化の実装
- [x] チャットUI

## トラブルシューティング

1. **VOICEVOXの音声が生成されない場合**
   - VOICEVOXエンジンが起動していることを確認
   - `.env`ファイルの`VOICEVOX_ENDPOINT`が正しいことを確認（デフォルト: `http://localhost:50021`）
   - ブラウザでVOICEVOXテストボタンをクリックして、テスト音声が生成されるか確認

2. **リップシンク（口パク）が機能しない場合**
   - リップシンクモードがオフになっていないか確認
   - モデルがサポートされている口のパラメータを持っているか確認

## ライセンス

このプロジェクトは開発中です。Live2Dモデルを含む各コンポーネントのライセンスに従ってください。
