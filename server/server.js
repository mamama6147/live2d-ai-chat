import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createChatCompletion } from './services/openai.js';
import { textToSpeech } from './services/tts.js';
import fetch from 'node-fetch';

// 環境変数の読み込み
dotenv.config();

// ES Moduleでの__dirnameの設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// テストモードのフラグ（デフォルトはオフ）
let testMode = false;

// CORSの設定 - 開発環境では全てのオリジンを許可
app.use(cors({
  origin: '*', // 開発環境では全てのオリジンを許可
  methods: ['GET', 'POST'], // 許可するHTTPメソッド
  allowedHeaders: ['Content-Type', 'Authorization'] // 許可するヘッダー
}));

// JSONボディ解析
app.use(express.json());

// 静的ファイルの配信
app.use(express.static(path.join(__dirname, '../client')));

// 音声ファイル保存用の静的ディレクトリ
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// ルートへのアクセス - クライアントのindex.htmlを返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// APIのテスト用エンドポイント
app.get('/api/test', (req, res) => {
  res.json({ message: 'APIサーバーが正常に動作しています' });
});

// テストモード切り替えエンドポイント
app.post('/api/toggle-test-mode', (req, res) => {
  testMode = !testMode;
  console.log(`テストモードを${testMode ? '有効' : '無効'}にしました`);
  res.json({ 
    testMode, 
    message: `テストモードを${testMode ? '有効' : '無効'}にしました` 
  });
});

// テストモード状態取得エンドポイント
app.get('/api/test-mode-status', (req, res) => {
  res.json({ testMode });
});

// VOICEVOXの接続確認用エンドポイント
app.get('/api/voicevox-test', async (req, res) => {
  try {
    const voicevoxEndpoint = process.env.VOICEVOX_ENDPOINT || 'http://localhost:50021';
    
    // VOICEVOXのバージョン情報を取得してみる
    const response = await fetch(`${voicevoxEndpoint}/version`);
    
    if (response.ok) {
      const version = await response.json();
      res.json({ 
        status: 'success', 
        message: 'VOICEVOXエンジンに正常に接続できました',
        version,
        endpoint: voicevoxEndpoint
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'VOICEVOXエンジンに接続できましたが、応答に問題があります',
        statusCode: response.status,
        statusText: response.statusText 
      });
    }
  } catch (error) {
    console.error('VOICEVOXエンジン接続エラー:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'VOICEVOXエンジンに接続できませんでした。エンジンが起動しているか確認してください',
      details: error.message 
    });
  }
});

// VOICEVOXの話者一覧取得用エンドポイント
app.get('/api/voicevox-speakers', async (req, res) => {
  try {
    const voicevoxEndpoint = process.env.VOICEVOX_ENDPOINT || 'http://localhost:50021';
    
    // VOICEVOXの話者一覧を取得
    const response = await fetch(`${voicevoxEndpoint}/speakers`);
    
    if (response.ok) {
      const speakers = await response.json();
      res.json({ 
        status: 'success', 
        speakers
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'VOICEVOXの話者一覧の取得に失敗しました',
        statusCode: response.status,
        statusText: response.statusText 
      });
    }
  } catch (error) {
    console.error('VOICEVOXの話者一覧取得エラー:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'VOICEVOXエンジンに接続できませんでした',
      details: error.message 
    });
  }
});

// テスト用の応答文章を生成する関数
function generateTestResponse(message) {
  // 質問の内容に応じた応答のパターンを用意
  const responses = [
    'これはテストモードでの応答です。実際のAIは使用されていません。',
    'テストモード中なので、OpenAI APIには接続していません。',
    `「${message}」というメッセージを受け取りました。これはテスト応答です。`,
    '開発中のテスト応答です。このメッセージはランダムに選ばれています。',
    'テストモードでは、このようなサンプル応答が返されます。実際のAPIコストはかかりません。',
    '今日もいい天気ですね。これはテストモードのサンプル応答です。',
    'こんにちは！どんなことでもお聞きください。（テストモード応答）',
    'テストモードが有効なので、このメッセージは固定応答の一つです。'
  ];
  
  // 特定のキーワードに対する応答
  if (message.includes('こんにちは') || message.includes('hello')) {
    return 'こんにちは！テストモードでのお返事です。どうぞよろしくお願いします。';
  } else if (message.includes('天気')) {
    return '今日の天気は晴れ時々曇りです。これはテストモードの固定応答です。';
  } else if (message.includes('名前')) {
    return '私はLive2D AIチャットのテストアシスタントです。テストモードで動作しています。';
  } else if (message.includes('テスト')) {
    return 'はい、現在テストモードで動作しています。OpenAI APIは使用していません。';
  }
  
  // ランダムに応答を選択
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

// チャットAPIエンドポイント
app.post('/api/chat', async (req, res) => {
  try {
    console.log('APIリクエスト受信:', req.body);
    
    const { message, voiceType } = req.body;
    
    // メッセージが空の場合
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'メッセージは必須です' });
    }
    
    console.log('ユーザーメッセージ:', message);
    
    let aiReply;
    // テストモードの場合
    if (testMode) {
      console.log('テストモードが有効: OpenAI APIは使用しません');
      // テスト用の固定応答を生成
      aiReply = generateTestResponse(message);
    } else {
      // 通常モード: OpenAI APIを使用
      aiReply = await createChatCompletion(message);
    }
    
    console.log('AI応答:', aiReply);
    
    // 簡易的な感情分析
    const emotion = analyzeEmotion(aiReply);
    
    // ボイスタイプを解析
    const voiceOptions = parseVoiceType(voiceType);
    console.log('音声設定:', voiceOptions);
    
    // デフォルトでVOICEVOXを使用する設定
    if (!voiceOptions.service) {
      voiceOptions.service = process.env.TTS_SERVICE || 'voicevox';
    }
    
    // テキスト読み上げによる音声生成（ボイスタイプを指定）
    const audioFilename = await textToSpeech(aiReply, voiceOptions);
    const audioUrl = `/audio/${audioFilename}`;
    
    // 応答データの作成
    const responseData = {
      reply: aiReply,
      audioUrl,
      emotion,
      testMode, // テストモードフラグを含める
      voiceType: `${voiceOptions.service}:${voiceOptions.voice || 'default'}` // 使用したボイスタイプを含める
    };
    
    console.log('APIレスポンス送信:', responseData);
    
    // 応答を返す
    res.json(responseData);
    
  } catch (error) {
    console.error('APIエラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました', details: error.message });
  }
});

// リップシンクテスト用エンドポイント
app.get('/api/lip-sync-test', async (req, res) => {
  try {
    // テスト用の音声ファイルを生成
    const testText = 'これはリップシンクのテストです。口の動きがうまく同期しているかを確認してください。';
    
    // VOICEVOXで音声生成
    const audioFilename = await textToSpeech(testText, { service: 'voicevox', voice: '1' });
    const audioUrl = `/audio/${audioFilename}`;
    
    // 応答データの作成
    const responseData = {
      reply: testText,
      audioUrl,
      emotion: 'neutral',
      isTest: true
    };
    
    // 応答を返す
    res.json(responseData);
    
  } catch (error) {
    console.error('テストAPIエラー:', error);
    res.status(500).json({ error: 'テスト実行中にエラーが発生しました', details: error.message });
  }
});

// ボイスタイプを解析して設定オブジェクトに変換する関数
function parseVoiceType(voiceType) {
  if (!voiceType) {
    return {}; // デフォルト設定
  }
  
  // voiceType は "service:voice" 形式を想定
  const parts = voiceType.split(':');
  if (parts.length < 2) {
    return {}; // 形式が不正
  }
  
  const service = parts[0];
  const voice = parts[1];
  
  return { service, voice };
}

// 簡易的な感情分析
function analyzeEmotion(text) {
  const lowerText = text.toLowerCase();
  
  // 簡易的なキーワードベースの感情分析
  if (/(嬉しい|happy|楽しい|素晴らしい|良かった|ありがとう)/i.test(lowerText)) {
    return 'happy';
  } else if (/(sad|悲しい|残念|つらい)/i.test(lowerText)) {
    return 'sad';
  } else if (/(angry|怒り|腹立たしい|むかつく)/i.test(lowerText)) {
    return 'angry';
  } else if (/(surprised|驚き|えっ|まさか|本当に|信じられない)/i.test(lowerText)) {
    return 'surprised';
  }
  
  // デフォルトは通常表情
  return 'neutral';
}

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`VOICEVOXエンジン接続先: ${process.env.VOICEVOX_ENDPOINT || 'http://localhost:50021'}`);
  console.log(`テストモード: ${testMode ? '有効' : '無効'}`);
});