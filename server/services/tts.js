import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// ES Moduleでの__dirnameの設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 音声ファイル保存ディレクトリ
const AUDIO_DIR = path.join(__dirname, '../audio');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * テキストを音声に変換する関数
 * @param {string} text - 読み上げるテキスト
 * @returns {Promise<string>} 生成された音声ファイル名
 */
export async function textToSpeech(text) {
  // どのTTSサービスを使用するか設定から判断
  const ttsService = process.env.TTS_SERVICE || 'dummy'; // 'azure', 'google', 'voicevox', 'dummy'など
  
  try {
    switch (ttsService.toLowerCase()) {
      case 'azure':
        return await azureTTS(text);
      case 'voicevox':
        return await voicevoxTTS(text);
      case 'dummy':
        // デモ用のダミーモード
        return await dummyTTS(text);
      default:
        // 未知のサービスの場合もダミーモードを使用
        console.log('TTSサービスが設定されていません。ダミー音声を使用します。');
        return await dummyTTS(text);
    }
  } catch (error) {
    console.error('音声合成エラー:', error);
    return 'error.mp3'; // エラー時のダミー音声ファイル
  }
}

/**
 * デモ用のダミー音声生成
 * @param {string} text - 読み上げるテキスト（実際には使用しません）
 * @returns {Promise<string>} 生成された音声ファイル名
 */
async function dummyTTS(text) {
  // ダミー音声ファイル名を生成
  const filename = `dummy_${Date.now()}.mp3`;
  const outputPath = path.join(AUDIO_DIR, filename);
  
  try {
    // ダミー音声ファイルを作成（実際には空ファイル）
    fs.writeFileSync(outputPath, '');
    
    console.log(`ダミー音声ファイルを作成しました: ${filename}`);
    return filename;
  } catch (error) {
    console.error('ダミー音声ファイル作成エラー:', error);
    throw error;
  }
}

/**
 * Azure Cognitive ServicesのTTSを使用する関数
 * @param {string} text - 読み上げるテキスト
 * @returns {Promise<string>} 生成された音声ファイル名
 */
async function azureTTS(text) {
  // APIキーが設定されていない場合はエラー
  if (!process.env.AZURE_TTS_KEY || !process.env.AZURE_TTS_REGION) {
    throw new Error('Azure TTS APIキーまたはリージョンが設定されていません');
  }
  
  // ファイル名の生成
  const filename = `azure_${Date.now()}.mp3`;
  const outputPath = path.join(AUDIO_DIR, filename);
  
  // Azure TTSへのリクエストを構築
  const url = `https://${process.env.AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
  
  // SSMLの構築
  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP">
      <voice name="${process.env.AZURE_TTS_VOICE || 'ja-JP-NanamiNeural'}">
        ${text}
      </voice>
    </speak>
  `;
  
  try {
    // Azure TTSにリクエスト送信
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_TTS_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'live2d-ai-chat'
      },
      body: ssml
    });
    
    if (!response.ok) {
      throw new Error(`Azure TTS API error: ${response.status} ${response.statusText}`);
    }
    
    // 音声データを取得してファイルに保存
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    
    console.log(`音声ファイルを保存しました: ${filename}`);
    return filename;
    
  } catch (error) {
    console.error('Azure TTS エラー:', error);
    throw error;
  }
}

/**
 * VOICEVOXを使用した音声合成関数
 * @param {string} text - 読み上げるテキスト
 * @returns {Promise<string>} 生成された音声ファイル名
 */
async function voicevoxTTS(text) {
  // VOICEVOXのエンドポイント
  const voicevoxEndpoint = process.env.VOICEVOX_ENDPOINT || 'http://localhost:50021';
  const speakerId = process.env.VOICEVOX_SPEAKER_ID || '1'; // デフォルトのスピーカーID
  
  try {
    // 1. テキストからクエリを作成
    const queryResponse = await fetch(
      `${voicevoxEndpoint}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
      { method: 'POST' }
    );
    
    if (!queryResponse.ok) {
      throw new Error(`VOICEVOX audio_query error: ${queryResponse.status}`);
    }
    
    const query = await queryResponse.json();
    
    // 2. 音声合成リクエスト
    const synthesisResponse = await fetch(
      `${voicevoxEndpoint}/synthesis?speaker=${speakerId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      }
    );
    
    if (!synthesisResponse.ok) {
      throw new Error(`VOICEVOX synthesis error: ${synthesisResponse.status}`);
    }
    
    // 3. 音声ファイルの保存
    const filename = `voicevox_${Date.now()}.wav`;
    const outputPath = path.join(AUDIO_DIR, filename);
    
    const arrayBuffer = await synthesisResponse.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    
    console.log(`音声ファイルを保存しました: ${filename}`);
    return filename;
    
  } catch (error) {
    console.error('VOICEVOX TTS エラー:', error);
    throw error;
  }
}