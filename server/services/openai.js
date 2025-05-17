import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// OpenAI設定
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// 会話履歴（簡易的なインメモリ保存 - 本番では適切なDB使用推奨）
const conversations = {};

/**
 * ChatGPT APIを使用して会話応答を生成する
 * @param {string} userMessage - ユーザーからのメッセージ
 * @param {string} sessionId - セッションID（オプション、セッション管理用）
 * @returns {Promise<string>} AI応答テキスト
 */
export async function createChatCompletion(userMessage, sessionId = 'default') {
  // APIキーが設定されていない場合
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI APIキーが設定されていません');
    return 'すみません、AI連携がまだ設定されていないようです。';
  }

  try {
    // 会話履歴を取得または初期化
    if (!conversations[sessionId]) {
      conversations[sessionId] = [
        {
          role: 'system',
          content: `あなたは優しく、親しみやすい女性アニメキャラクターです。
          ユーザーとの会話を楽しむように意識してください。
          普段は「〜です」「〜ます」といった丁寧語を使います。
          30文字から50文字程度の簡潔な返答を心がけてください。
          自分のことは「私」と呼びます。`
        }
      ];
    }
    
    // ユーザーのメッセージを履歴に追加
    conversations[sessionId].push({
      role: 'user',
      content: userMessage
    });
    
    // 履歴が長すぎる場合は古いメッセージを削除（トークン制限対策）
    if (conversations[sessionId].length > 10) {
      // システムメッセージは残して他を削る
      const systemMessage = conversations[sessionId][0];
      conversations[sessionId] = [
        systemMessage,
        ...conversations[sessionId].slice(-5) // 直近5件のみ保持
      ];
    }
    
    // OpenAI APIリクエスト
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o', // GPT-4.1の最新モデル（gpt-4o）を使用
      messages: conversations[sessionId],
      max_tokens: 150,
      temperature: 0.7,
    });
    
    // 応答を抽出
    const assistantMessage = completion.data.choices[0].message;
    
    // 応答を会話履歴に追加
    conversations[sessionId].push(assistantMessage);
    
    return assistantMessage.content;
    
  } catch (error) {
    console.error('OpenAI APIエラー:', error);
    
    // エラーメッセージをユーザーフレンドリーにして返す
    if (error.response) {
      console.error(error.response.status, error.response.data);
      return 'すみません、AI応答の取得中にエラーが発生しました。しばらくしてからもう一度お試しください。';
    } else {
      console.error(`エラー: ${error.message}`);
      return 'すみません、通信エラーが発生しました。インターネット接続を確認してください。';
    }
  }
}