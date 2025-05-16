import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createChatCompletion } from './services/openai.js';
import { textToSpeech } from './services/tts.js';

// 環境変数の読み込み
dotenv.config();

// ES Moduleでの__dirnameの設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// チャットAPIエンドポイント
app.post('/api/chat', async (req, res) => {
  try {
    console.log('APIリクエスト受信:', req.body);
    
    const { message } = req.body;
    
    // メッセージが空の場合
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'メッセージは必須です' });
    }
    
    console.log('ユーザーメッセージ:', message);
    
    // OpenAI APIを使用してチャット応答を取得
    const aiReply = await createChatCompletion(message);
    console.log('AI応答:', aiReply);
    
    // 簡易的な感情分析
    const emotion = analyzeEmotion(aiReply);
    
    // テキスト読み上げによる音声生成
    const audioFilename = await textToSpeech(aiReply);
    const audioUrl = `/audio/${audioFilename}`;
    
    // 応答データの作成
    const responseData = {
      reply: aiReply,
      audioUrl,
      emotion
    };
    
    console.log('APIレスポンス送信:', responseData);
    
    // 応答を返す
    res.json(responseData);
    
  } catch (error) {
    console.error('APIエラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました', details: error.message });
  }
});

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
});