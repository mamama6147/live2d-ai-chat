// Live2D表示とチャットの基本機能実装
// 注: pixi-live2d-displayはimportではなくグローバル変数として使用します
// PIXI もグローバル変数として使用します

// グローバル変数
let app; // PIXIアプリケーション
let model; // Live2Dモデル
let audioContext; // Web Audio Context
let audioSource; // 現在の音声ソース

// APIのベースURL - 開発環境と本番環境を考慮
const API_BASE_URL = 'http://localhost:3000';

// デバッグモード設定
const DEBUG_MODE = true;

// ログ出力関数
function log(message) {
  if (DEBUG_MODE) {
    console.log(`[Live2D] ${message}`);
  }
}

// ウィンドウの読み込みを待ってから初期化
window.addEventListener('DOMContentLoaded', () => {
  // スクリプトの読み込みを確実に待つために遅延させる
  setTimeout(async () => {
    try {
      log('初期化開始');
      
      // Live2Dライブラリが読み込まれているか確認
      if (!window.PIXI) {
        throw new Error('PIXI.jsが読み込まれていません');
      }
      
      if (!window.LIVE2DCUBISMFRAMEWORK) {
        throw new Error('Live2D Cubism Frameworkが読み込まれていません');
      }
      
      if (!window.Live2DCubismCore) {
        throw new Error('Live2D Cubism Coreが読み込まれていません');
      }
      
      // グローバルな名前空間のPIXIを使用
      const PIXI = window.PIXI;
      
      // Live2Dの初期化
      await initLive2D();
      
      // チャットUIの設定
      setupChatUI();
      
      // 初期メッセージをUIに追加
      const chatLog = document.getElementById('chat-log');
      if (chatLog) {
        const initialMessage = document.createElement('div');
        initialMessage.classList.add('chat-message', 'ai-message');
        initialMessage.textContent = 'こんにちは！どうぞお話ししましょう。';
        chatLog.appendChild(initialMessage);
      }
      
      log('初期化が完了しました');
    } catch (e) {
      console.error('初期化エラー:', e);
      alert(`初期化エラー: ${e.message}\nページを再読み込みしてみてください。`);
    }
  }, 1000); // 1秒遅延
});

// Live2D初期化
async function initLive2D() {
  log('Live2D初期化を開始します...');
  
  // PIXIアプリケーションの設定
  const canvas = document.getElementById('live2d-canvas');
  if (!canvas) {
    throw new Error('canvas要素が見つかりません');
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
  try {
    // ティッカーを登録
    PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);
    
    // グローバル設定
    PIXI.live2d.Live2DModel.setConfig({
      cubism4: true,
      motionPreload: 'auto',
      useCustomTicker: true
    });
    
    log('Live2Dフレームワーク初期化完了');
  } catch (e) {
    console.error('Live2Dフレームワーク初期化エラー:', e);
    throw new Error(`Live2Dフレームワーク初期化エラー: ${e.message}`);
  }

  // Live2DモデルのPATHを設定
  const modelPath = './models/nijiroumao/mao_pro.model3.json'; // 虹色まおモデルのパス
  log(`モデルパス: ${modelPath}`);

  try {
    // モデルの読み込み
    log('Live2Dモデルの読み込みを開始します...');
    
    model = await PIXI.live2d.Live2DModel.from(modelPath, {
      autoInteract: false,
      motionPreload: 'auto'
    });
    
    log('Live2Dモデルの読み込みに成功しました');
    
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
    
    // モーション再生機能の検証
    if (model.motion) {
      try {
        // デフォルトモーション再生
        model.motion('idle');
        log('モーション再生開始');
      } catch (motionError) {
        console.warn('モーション再生できませんでした:', motionError);
      }
    }
    
    log('Live2Dモデルの表示に成功しました');
    
  } catch (e) {
    console.error('Live2Dモデルの読み込みに失敗しました:', e);
    throw new Error(`Live2Dモデルの読み込みに失敗: ${e.message}`);
  }
}

// 音声再生とリップシンク
async function playVoice(audioUrl) {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error('AudioContextの作成に失敗しました:', e);
      return;
    }
  }

  try {
    // 前の音声が再生中なら停止
    if (audioSource) {
      audioSource.stop();
    }

    // 完全なURLの構築
    const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${API_BASE_URL}${audioUrl}`;
    log(`音声再生URL: ${fullAudioUrl}`);

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
      try {
        if (model.internalModel && model.internalModel.coreModel) {
          model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', mouthOpenValue);
        }
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
      if (model && model.internalModel && model.internalModel.coreModel) {
        try {
          model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', 0);
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
  
  // 要素が見つからない場合はエラー
  if (!userInput || !sendButton || !chatLog) {
    console.error('チャットUI要素が見つかりません');
    return;
  }
  
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
      log(`APIリクエスト送信: ${message}`);
      
      // APIが実装されていない場合は簡易的な応答を返す
      // 実際のAPIが実装されたらこの部分を削除
      const dummyResponse = {
        reply: 'こんにちは！現在APIは実装中です。',
        emotion: 'happy'
      };
      
      // 本番では以下のようにAPIを呼び出す
      /*
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
      */
      
      // 開発中はダミーレスポンスを使用
      const data = dummyResponse;
      log(`応答受信: ${data.reply}`);
      
      // AIの応答をUIに追加
      addMessageToUI('ai', data.reply);
      
      // 音声再生（本番ではAPIからの応答を使用）
      // if (data.audioUrl) {
      //   playVoice(data.audioUrl);
      // }
      
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
    log(`表情変更: ${emotion}`);
    
    // 感情に基づいて表情を変更
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