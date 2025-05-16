// Live2D表示とチャットの基本機能実装
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';

// グローバル変数
let app; // PIXIアプリケーション
let model; // Live2Dモデル
let audioContext; // Web Audio Context
let audioSource; // 現在の音声ソース

// APIのベースURL - 開発環境と本番環境を考慮
const API_BASE_URL = 'http://localhost:3000';

// Live2D初期化
async function initLive2D() {
  console.log('Live2D初期化を開始します...');
  
  // PIXIアプリケーションの設定
  const canvas = document.getElementById('live2d-canvas');
  if (!canvas) {
    console.error('canvas要素が見つかりません');
    return;
  }
  
  // PIXI Applicationの初期化
  app = new PIXI.Application({
    view: canvas,
    autoStart: true,
    backgroundAlpha: 0,
    backgroundColor: 0xffffff,
    resizeTo: canvas.parentElement
  });

  // Live2D SDKの初期化
  // PIXI.Tickerの登録（物理演算などのアニメーション用）
  if (!Live2DModel.isModelSettingLoaded) {
    PIXI.utils.skipHello();
    Live2DModel.registerTicker(PIXI.Ticker);
  }

  // Live2DモデルのPATHを設定
  const modelPath = './models/nijiroumao/mao_pro.model3.json'; // 虹色まおモデルのパス
  console.log('モデルパス:', modelPath);

  try {
    // モデルの読み込み
    console.log('Live2Dモデルの読み込みを開始します...');
    model = await Live2DModel.from(modelPath, { autoInteract: false });
    console.log('Live2Dモデルの読み込みに成功しました');
    
    // モデルのサイズとポジションを調整
    const parentWidth = canvas.parentElement.clientWidth;
    const parentHeight = canvas.parentElement.clientHeight;
    
    // モデルを画面に合わせて調整
    model.scale.set(0.4); // スケールの調整
    model.position.set(parentWidth / 2, parentHeight / 2); // 中央に配置
    model.anchor.set(0.5, 0.5);
    
    // PIXIステージに追加
    app.stage.addChild(model);
    
    // ウインドウリサイズ対応
    window.addEventListener('resize', () => {
      const parentWidth = canvas.parentElement.clientWidth;
      const parentHeight = canvas.parentElement.clientHeight;
      model.position.set(parentWidth / 2, parentHeight / 2);
    });
    
    // 開始時のモーション再生
    if (model.internalModel.motionManager.definitions.idle) {
      model.motion('idle');
    }
    
    console.log('Live2Dモデルの表示に成功しました');
    
    // グローバル変数に保存（デバッグ用）
    window.live2dModel = model;
    window.pixiApp = app;
    
  } catch (e) {
    console.error('Live2Dモデルの読み込みに失敗しました:', e);
  }
}

// 音声再生とリップシンク
async function playVoice(audioUrl) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  try {
    // 前の音声が再生中なら停止
    if (audioSource) {
      audioSource.stop();
    }

    // 完全なURLの構築
    const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${API_BASE_URL}${audioUrl}`;
    console.log('音声再生URL:', fullAudioUrl);

    // 音声データ取得
    const response = await fetch(fullAudioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // 音声再生
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    
    // リップシンク用のAnalyserNodeを作成
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // 再生開始
    audioSource.start(0);
    
    // リップシンク処理
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // リップシンク用のアニメーションフレーム
    function animateMouth() {
      if (!model) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // 音量の平均値を計算
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // 音量に応じて口の開閉度を調整（0～1の範囲に正規化）
      const mouthOpenValue = Math.min(average / 128, 1);
      
      // Live2Dモデルのパラメータに適用
      // LipSyncグループが定義されているので適切なパラメータを使用
      try {
        // 複数の可能性を試す
        model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', mouthOpenValue);
        // ParamAはLipSyncグループに含まれている可能性がある
        model.internalModel.coreModel.setParameterValueById('ParamA', mouthOpenValue);
      } catch (e) {
        // エラーが発生しても無視（存在しないパラメータの場合）
      }
      
      if (audioSource.buffer) {
        requestAnimationFrame(animateMouth);
      }
    }
    
    animateMouth();
    
    // 音声終了時の処理
    audioSource.onended = () => {
      audioSource = null;
      // モデルの口を閉じる
      if (model) {
        try {
          model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', 0);
          model.internalModel.coreModel.setParameterValueById('ParamA', 0);
        } catch (e) {
          // エラーが発生しても無視
        }
      }
    };
    
  } catch (e) {
    console.error('音声再生に失敗しました:', e);
  }
}

// チャットUIのセットアップ
function setupChatUI() {
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const chatLog = document.getElementById('chat-log');
  
  // 送信ボタンのクリックイベント
  sendButton.addEventListener('click', () => sendMessage());
  
  // Enterキーでの送信
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // メッセージ送信処理
  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // UIにユーザーメッセージを追加
    addMessageToUI('user', message);
    userInput.value = '';
    
    try {
      console.log('APIリクエスト送信:', message);
      
      // AIからの応答を取得（バックエンドAPI呼び出し）
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API応答受信:', data);
      
      // AIの応答をUIに追加
      addMessageToUI('ai', data.reply);
      
      // 音声を再生
      if (data.audioUrl) {
        playVoice(data.audioUrl);
      }
      
      // 表情変更などの追加処理
      if (model && data.emotion) {
        changeExpression(data.emotion);
      }
      
    } catch (error) {
      console.error('APIリクエストエラー:', error);
      addMessageToUI('ai', 'すみません、エラーが発生しました。もう一度お試しください。');
    }
  }
  
  // メッセージをUIに追加
  function addMessageToUI(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    messageElement.textContent = text;
    
    chatLog.appendChild(messageElement);
    
    // 自動スクロール
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

// 表情変更
function changeExpression(emotion) {
  if (!model) return;
  
  try {
    console.log('表情変更:', emotion);
    
    // 感情に基づいて表情を変更
    // このモデルでは exp_01 ~ exp_08 の表情名が定義されている
    switch (emotion) {
      case 'happy':
        model.expression('exp_01'); // 笑顔
        break;
      case 'sad':
        model.expression('exp_03'); // 悲しい
        break;
      case 'angry':
        model.expression('exp_02'); // 怒り
        break;
      case 'surprised':
        model.expression('exp_04'); // 驚き
        break;
      default:
        model.expression('exp_01'); // デフォルト（笑顔）
        break;
    }
  } catch (e) {
    console.error('表情変更エラー:', e);
  }
}

// 初期化
window.addEventListener('DOMContentLoaded', async () => {
  console.log('ページ読み込み完了、初期化を開始します...');
  
  try {
    // Live2Dの初期化
    await initLive2D();
    
    // チャットUIの設定
    setupChatUI();
    
    // 初期メッセージをUIに追加
    const chatLog = document.getElementById('chat-log');
    const initialMessage = document.createElement('div');
    initialMessage.classList.add('chat-message', 'ai-message');
    initialMessage.textContent = 'こんにちは！どうぞお話ししましょう。';
    chatLog.appendChild(initialMessage);
    
    console.log('初期化が完了しました');
  } catch (e) {
    console.error('初期化エラー:', e);
  }
});