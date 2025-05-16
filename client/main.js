// Live2D チャットアプリケーションメインスクリプト

// グローバル変数
let app; // PIXIアプリケーション
let model; // Live2Dモデル
let audioContext; // Web Audio Context
let audioSource; // 現在の音声ソース

// APIのベースURL
const API_BASE_URL = 'http://localhost:3000';

// デバッグモード設定
const DEBUG_MODE = true;

// ローディング要素
const loadingElement = document.getElementById('loading');

// デバッグ情報表示関数
function showDebugInfo(message) {
  if (!DEBUG_MODE) return;
  
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.style.display = 'block';
    debugInfo.innerHTML += `<div>${message}</div>`;
    
    // 最大行数を超えたら古い行を削除
    const maxLines = 20;
    const lines = debugInfo.children;
    if (lines.length > maxLines) {
      for (let i = 0; i < lines.length - maxLines; i++) {
        debugInfo.removeChild(lines[0]);
      }
    }
    
    // 自動スクロール
    debugInfo.scrollTop = debugInfo.scrollHeight;
  }
  
  // コンソールにも出力
  console.log(`[Live2D] ${message}`);
}

// グローバルオブジェクトを確認する関数
function checkGlobalObjects() {
  // 各ライブラリの読み込み状況を確認
  showDebugInfo('グローバルオブジェクト確認:');
  showDebugInfo(`window.Live2DCubismCore: ${window.Live2DCubismCore ? '存在します' : '存在しません'}`);
  showDebugInfo(`window.PIXI: ${window.PIXI ? '存在します' : '存在しません'}`);
  showDebugInfo(`window.PIXI.live2d: ${window.PIXI?.live2d ? '存在します' : '存在しません'}`);
  showDebugInfo(`window.live2d: ${window.live2d ? '存在します' : '存在しません'}`);
  showDebugInfo(`window.LIVE2DCUBISMFRAMEWORK: ${window.LIVE2DCUBISMFRAMEWORK ? '存在します' : '存在しません'}`);
}

// 初期化処理
window.addEventListener('DOMContentLoaded', () => {
  showDebugInfo('DOM読み込み完了');
  
  // グローバルオブジェクトを確認
  setTimeout(() => {
    checkGlobalObjects();
  }, 1000);
  
  // Cubism 2ランタイムのロードを検証
  if (window.live2d) {
    showDebugInfo('Cubism 2ランタイムの読み込みを確認しました');
  } else {
    showDebugInfo('エラー: Cubism 2ランタイムが見つかりません');
  }
  
  // Live2D Cubism Coreの読み込みを検証
  if (window.Live2DCubismCore) {
    showDebugInfo('Live2D Cubism Coreの読み込みを確認しました');
  } else {
    showDebugInfo('エラー: Live2D Cubism Coreが見つかりません');
  }
  
  // Live2D Cubism Frameworkの読み込みを検証
  if (window.LIVE2DCUBISMFRAMEWORK) {
    showDebugInfo('Live2D Cubism Frameworkの読み込みを確認しました');
  } else {
    showDebugInfo('エラー: Live2D Cubism Frameworkが見つかりません');
  }
  
  // PIXI.jsの読み込みを検証
  if (window.PIXI) {
    showDebugInfo('PIXI.jsの読み込みを確認しました');
  } else {
    showDebugInfo('エラー: PIXI.jsが見つかりません');
  }
  
  // pixi-live2d-displayの読み込みを検証
  if (window.PIXI && window.PIXI.live2d) {
    showDebugInfo('pixi-live2d-displayの読み込みを確認しました');
  } else {
    showDebugInfo('エラー: pixi-live2d-displayが見つかりません');
  }
  
  // 初期化処理を開始
  setTimeout(async () => {
    try {
      showDebugInfo('初期化処理を開始します...');
      
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
      
      showDebugInfo('初期化が完了しました');
      
      // ローディング表示を非表示
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
    } catch (e) {
      showDebugInfo(`初期化エラー: ${e.message}`);
      console.error('初期化エラー:', e);
      
      // エラーメッセージを表示
      if (loadingElement) {
        loadingElement.innerHTML = `<p>エラーが発生しました: ${e.message}</p><p>ページを再読み込みしてください。</p>`;
      }
    }
  }, 2000); // 2秒待機して確実にスクリプトをロード
});

// Live2D初期化
async function initLive2D() {
  showDebugInfo('Live2D初期化を開始します...');
  
  // キャンバスの取得
  const canvas = document.getElementById('live2d-canvas');
  if (!canvas) {
    throw new Error('canvas要素が見つかりません');
  }

  try {
    showDebugInfo('PIXIアプリケーションの初期化を開始します');
    
    // PIXI Applicationの初期化
    app = new PIXI.Application({
      view: canvas,
      autoStart: true,
      backgroundAlpha: 0,
      backgroundColor: 0xffffff,
      resizeTo: canvas.parentElement
    });
    
    showDebugInfo('PIXIアプリケーションの初期化が完了しました');
    
    // Live2D SDKの初期化
    if (PIXI.live2d) {
      try {
        // ticker設定 - 直接連携は行わないように変更
        // PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker.shared);
        
        // configの設定
        const cfg = PIXI.live2d.config;
        cfg.cubism4 = true;              // Cubism 4 を使用
        cfg.motionFadingDuration = 500;  // モーションのフェード
        cfg.idleMotionFadingDuration = 2000;
        cfg.supportCubism2 = true;       // Cubism2 も使うなら
        
        showDebugInfo('Live2Dフレームワーク初期化完了');
      } catch (e) {
        showDebugInfo(`Live2Dフレームワーク初期化エラー: ${e.message}`);
        throw e;
      }
    } else {
      throw new Error('PIXI.live2dがロードされていません');
    }
    
    // Live2DモデルのPATHを設定
    const modelPath = './models/nijiroumao/mao_pro.model3.json'; // モデルのパス
    showDebugInfo(`モデルパス: ${modelPath}`);
    
    try {
      // モデルの読み込み
      showDebugInfo('Live2Dモデルの読み込みを開始します...');
      
      // モデル読み込みを非同期で実行
      PIXI.live2d.Live2DModel.from(modelPath)
        .then(loadedModel => {
          model = loadedModel;
          showDebugInfo('Live2Dモデルの読み込みに成功しました');
          
          // モデルのサイズとポジションを調整
          const parentWidth = canvas.parentElement.clientWidth;
          const parentHeight = canvas.parentElement.clientHeight;
          
          // モデルを画面に合わせて調整
          model.scale.set(0.25); // スケールの調整
          model.position.set(parentWidth / 2, parentHeight / 1); // 中央に配置
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
              showDebugInfo('モーション再生開始');
            } catch (motionError) {
              showDebugInfo(`モーション再生エラー: ${motionError.message}`);
            }
          }
          
          showDebugInfo('Live2Dモデルの表示に成功しました');
        })
        .catch(e => {
          showDebugInfo(`Live2Dモデルの読み込みに失敗: ${e.message}`);
          throw e;
        });
      
    } catch (e) {
      showDebugInfo(`Live2Dモデルの読み込みに失敗: ${e.message}`);
      throw e;
    }
  } catch (e) {
    showDebugInfo(`Live2D初期化に失敗: ${e.message}`);
    throw e;
  }
}

// 音声再生とリップシンク
async function playVoice(audioUrl) {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      showDebugInfo(`AudioContextの作成に失敗: ${e.message}`);
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
    showDebugInfo(`音声再生URL: ${fullAudioUrl}`);

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
    showDebugInfo(`音声再生に失敗: ${e.message}`);
    console.error('音声再生に失敗しました:', e);
  }
}

// メッセージをUIに追加する関数
function addMessageToUI(role, text) {
  const chatLog = document.getElementById('chat-log');
  if (!chatLog) return;

  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message', `${role}-message`);
  messageElement.textContent = text;
  
  chatLog.appendChild(messageElement);
  
  // スクロールを一番下に移動
  chatLog.scrollTop = chatLog.scrollHeight;
}

// キャラクターの表情を変更する関数
function changeExpression(emotion) {
  if (!model) return;
  
  showDebugInfo(`表情変更: ${emotion}`);
  
  try {
    // 感情に基づいて表情パラメータを設定
    switch (emotion) {
      case 'happy':
        // 喜びの表情 - モデルのパラメータに依存
        if (model.internalModel && model.internalModel.coreModel) {
          model.internalModel.coreModel.setParameterValueById('ParamEyeLSmile', 1);
          model.internalModel.coreModel.setParameterValueById('ParamEyeRSmile', 1);
          model.internalModel.coreModel.setParameterValueById('ParamMouthForm', 1); // 口角上げ
        }
        break;
      case 'sad':
        // 悲しみの表情
        if (model.internalModel && model.internalModel.coreModel) {
          model.internalModel.coreModel.setParameterValueById('ParamBrowLY', -1);
          model.internalModel.coreModel.setParameterValueById('ParamBrowRY', -1);
          model.internalModel.coreModel.setParameterValueById('ParamMouthForm', -1);
        }
        break;
      case 'angry':
        // 怒りの表情
        if (model.internalModel && model.internalModel.coreModel) {
          model.internalModel.coreModel.setParameterValueById('ParamBrowLAngle', -1);
          model.internalModel.coreModel.setParameterValueById('ParamBrowRAngle', -1);
          model.internalModel.coreModel.setParameterValueById('ParamEyeLOpen', 0.8);
          model.internalModel.coreModel.setParameterValueById('ParamEyeROpen', 0.8);
        }
        break;
      case 'surprised':
        // 驚きの表情
        if (model.internalModel && model.internalModel.coreModel) {
          model.internalModel.coreModel.setParameterValueById('ParamBrowLY', 1);
          model.internalModel.coreModel.setParameterValueById('ParamBrowRY', 1);
          model.internalModel.coreModel.setParameterValueById('ParamEyeLOpen', 1.2);
          model.internalModel.coreModel.setParameterValueById('ParamEyeROpen', 1.2);
        }
        break;
      default:
        // 通常表情 (neutral)
        if (model.internalModel && model.internalModel.coreModel) {
          model.internalModel.coreModel.setParameterValueById('ParamEyeLSmile', 0);
          model.internalModel.coreModel.setParameterValueById('ParamEyeRSmile', 0);
          model.internalModel.coreModel.setParameterValueById('ParamBrowLY', 0);
          model.internalModel.coreModel.setParameterValueById('ParamBrowRY', 0);
          model.internalModel.coreModel.setParameterValueById('ParamBrowLAngle', 0);
          model.internalModel.coreModel.setParameterValueById('ParamBrowRAngle', 0);
          model.internalModel.coreModel.setParameterValueById('ParamMouthForm', 0);
        }
    }
  } catch (e) {
    showDebugInfo(`表情変更エラー: ${e.message}`);
  }
}

// チャットUIのセットアップ
function setupChatUI() {
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const chatLog = document.getElementById('chat-log');
  
  // 要素が見つからない場合はエラー
  if (!userInput || !sendButton || !chatLog) {
    showDebugInfo('チャットUI要素が見つかりません');
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
      showDebugInfo(`メッセージ送信: ${message}`);
      
      // 実際のAPIを呼び出す
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
      showDebugInfo(`応答受信: ${data.reply}`);

      // AIの応答をUIに追加
      addMessageToUI('ai', data.reply);
      
      // 音声再生
      if (data.audioUrl) {
        playVoice(data.audioUrl);
      }
      
      // 表情変更などの追加処理
      if (model && data.emotion) {
        changeExpression(data.emotion);
      }

    } catch (error) {
      showDebugInfo(`エラー: ${error.message}`);
      console.error('メッセージ送信エラー:', error);
      addMessageToUI('ai', 'すみません、エラーが発生しました。もう一度お試しください。');
    }
  }
}