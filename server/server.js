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

// ミドルウェアの設定
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// 音声ファイル保存用の静的ディレクトリ
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// チャットAPIエンドポイント
app.post('/api/chat', async (req, res) => {
  try {
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
    
    // 応答を返す
    res.json({
      reply: aiReply,
      audioUrl,
      emotion
    });
    
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