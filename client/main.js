// Live2D チャットアプリケーションメインスクリプト

// グローバル変数
let app; // PIXIアプリケーション
let model; // Live2Dモデル
let audioContext; // Web Audio Context
let audioSource; // 現在の音声ソース
let analyser; // 音声解析用のアナライザーノード
let animationFrameId = null; // アニメーションフレームID
let lipSyncInterval = null; // リップシンクタイマー
let testMode = false; // テストモードフラグ
let preAnalyzedMouthData = null; // 事前解析した口の動きデータ
let audioPlaybackStartTime = 0; // 音声再生開始時間
let usingPreAnalyzedData = false; // 事前解析データを使用しているかのフラグ
let aiResponse = null; // AI応答文を保持

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
      
      // AudioContextの初期化
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        showDebugInfo('AudioContextを初期化しました');
      } catch (audioError) {
        showDebugInfo(`AudioContext初期化エラー: ${audioError.message}`);
      }
      
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
      
      // テストボタンの設定
      setupTestControls();
      
      // サーバーからテストモードの状態を取得
      await checkTestModeStatus();
      
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

// サーバーからテストモードの状態を取得
async function checkTestModeStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/test-mode-status`);
    if (response.ok) {
      const data = await response.json();
      updateTestModeUI(data.testMode);
    }
  } catch (error) {
    showDebugInfo(`テストモード状態取得エラー: ${error.message}`);
  }
}

// テストモード表示を更新
function updateTestModeUI(isTestMode) {
  testMode = isTestMode;
  
  // テストモードステータス表示を更新
  const testModeStatus = document.getElementById('test-mode-status');
  if (testModeStatus) {
    testModeStatus.textContent = testMode ? 'ON' : 'OFF';
    testModeStatus.className = testMode ? 'test-mode-status enabled' : 'test-mode-status';
  }
  
  // テストモードボタンの表示を更新
  const testModeButton = document.getElementById('toggle-test-mode');
  if (testModeButton) {
    testModeButton.classList.toggle('active', testMode);
    testModeButton.textContent = testMode ? 'テストモード解除' : 'テストモード有効化';
  }
  
  // テストモードバナーの表示を更新
  const testModeBanner = document.getElementById('test-mode-banner');
  if (testModeBanner) {
    testModeBanner.style.display = testMode ? 'block' : 'none';
  }
  
  showDebugInfo(`テストモードを${testMode ? '有効' : '無効'}にしました`);
}

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
          
          // モデルのパラメータをログに出力（デバッグ用）
          if (model.internalModel && model.internalModel.coreModel) {
            try {
              // 利用可能なパラメータの数を取得
              const parameterCount = model.internalModel.coreModel.getParameterCount();
              showDebugInfo(`モデルの利用可能なパラメータ数: ${parameterCount}`);
              
              // サンプルパラメータ名の表示
              for (let i = 0; i < Math.min(parameterCount, 10); i++) {
                const paramId = model.internalModel.coreModel.getParameterId(i);
                const paramValue = model.internalModel.coreModel.getParameterValue(i);
                showDebugInfo(`パラメータ[${i}]: ${paramId} = ${paramValue}`);
              }
            } catch (e) {
              showDebugInfo(`パラメータ取得エラー: ${e.message}`);
            }
          }
          
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
          
          // 口パクテスト
          testMouthMovement();
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

// 口の動きをテストする関数
function testMouthMovement() {
  if (!model) {
    showDebugInfo('モデルが読み込まれていないため、口パクテストができません');
    return;
  }
  
  showDebugInfo('口パクテストを開始します');
  
  // 口パク用のパラメータ候補
  const mouthParams = [
    'ParamA',               // 虹色まおの口パクパラメータ
    'ParamMouthOpenY',      // 一般的な口開きパラメータ
    'PARAM_MOUTH_OPEN_Y',   // 別の形式
    'ParamMouthOpen',       // 別の命名規則
    'PARAM_MOUTH_OPEN',
    'Param_mouth_open_y',
    'ParamMouthForm',       // 口の形状
    'PARAM_MOUTH_FORM'
  ];
  
  // 各パラメータが存在するか確認
  mouthParams.forEach(param => {
    try {
      if (model.internalModel && model.internalModel.coreModel) {
        // パラメータIDからインデックスを探す
        const paramExists = model.internalModel.coreModel.getParameterValueById(param);
        showDebugInfo(`口パクパラメータチェック: ${param} - ${paramExists !== undefined ? '存在します' : '存在しません'}`);
      }
    } catch (e) {
      showDebugInfo(`パラメータ ${param} の確認でエラー: ${e.message}`);
    }
  });
  
  // 口パクテスト動作を開始
  let mouthOpenValue = 0;
  let direction = 0.1;
  
  // 既存のタイマーがあれば停止
  if (lipSyncInterval) {
    clearInterval(lipSyncInterval);
  }
  
  // 口の開閉をアニメーションするタイマー
  lipSyncInterval = setInterval(() => {
    mouthOpenValue += direction;
    
    // 方向転換
    if (mouthOpenValue >= 1) {
      mouthOpenValue = 1;
      direction = -0.1;
    } else if (mouthOpenValue <= 0) {
      mouthOpenValue = 0;
      direction = 0.1;
    }
    
    // 各パラメータを試す
    if (model && model.internalModel && model.internalModel.coreModel) {
      try {
        // 優先順位の高いパラメータから順に試す
        mouthParams.forEach(param => {
          try {
            model.internalModel.coreModel.setParameterValueById(param, mouthOpenValue);
          } catch (e) {
            // このパラメータがなければスキップ
          }
        });
      } catch (e) {
        showDebugInfo(`口パク更新エラー: ${e.message}`);
      }
    }
  }, 100);
  
  // 5秒後にテスト停止
  setTimeout(() => {
    if (lipSyncInterval) {
      clearInterval(lipSyncInterval);
      lipSyncInterval = null;
      showDebugInfo('口パクテスト完了');
      
      // 口を閉じる
      if (model && model.internalModel && model.internalModel.coreModel) {
        mouthParams.forEach(param => {
          try {
            model.internalModel.coreModel.setParameterValueById(param, 0);
          } catch (e) {
            // このパラメータがなければスキップ
          }
        });
      }
    }
  }, 5000);
}

// 音声再生とリップシンク
async function playVoice(audioUrl) {
  // まず現在実行中のリップシンクをすべて停止
  stopCurrentLipSync();
  
  // リップシンクモードの取得
  const lipSyncModeSelect = document.getElementById('lip-sync-mode');
  const lipSyncMode = lipSyncModeSelect ? lipSyncModeSelect.value : 'auto';
  
  // リップシンクモードがオフの場合
  if (lipSyncMode === 'off') {
    showDebugInfo('リップシンクはオフに設定されています');
    return;
  }
  
  // ダミーモードが指定された場合
  if (lipSyncMode === 'dummy') {
    showDebugInfo('ダミーリップシンクモードを使用します');
    performDummyLipSync();
    return;
  }
  
  // モデルがロードされていない場合
  if (!model) {
    showDebugInfo('モデルが読み込まれていないため、リップシンクできません');
    return;
  }

  if (!audioContext) {
    try {
      // AudioContextを初期化（必要に応じて再生成）
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      showDebugInfo('AudioContextを再初期化しました');
    } catch (e) {
      showDebugInfo(`AudioContextの作成に失敗: ${e.message}`);
      // AudioContextが作成できなくても、ダミーリップシンクは実行
      performDummyLipSync();
      return;
    }
  } else if (audioContext.state === 'suspended') {
    // AudioContextが一時停止されている場合は再開
    try {
      await audioContext.resume();
      showDebugInfo('AudioContextを再開しました');
    } catch (e) {
      showDebugInfo(`AudioContextの再開に失敗: ${e.message}`);
      performDummyLipSync();
      return;
    }
  }

  try {
    // 完全なURLの構築
    const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${API_BASE_URL}${audioUrl}`;
    showDebugInfo(`音声再生URL: ${fullAudioUrl}`);

    // 音声データ取得
    const response = await fetch(fullAudioUrl);
    
    // レスポンスをチェック
    if (!response.ok) {
      showDebugInfo(`音声ファイル取得エラー: ${response.status} ${response.statusText}`);
      performDummyLipSync();
      return;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // 空のファイルかチェック
    if (arrayBuffer.byteLength === 0) {
      showDebugInfo('空の音声ファイルが検出されました。ダミーリップシンクを使用します。');
      performDummyLipSync();
      return;
    }
    
    try {
      showDebugInfo('音声データのデコードを開始...');
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      showDebugInfo(`音声データのデコード完了: 長さ ${audioBuffer.duration.toFixed(2)}秒`);
      
      // 事前解析モードを使用して口の動きデータを生成
      showDebugInfo('音声の事前解析を開始...');
      try {
        await preAnalyzeAudio(audioBuffer);
        showDebugInfo('音声の事前解析が完了しました');
      } catch (analyzeError) {
        showDebugInfo(`音声の事前解析に失敗: ${analyzeError.message}`);
        // 事前解析に失敗した場合でも、通常の再生とリアルタイム解析を試みる
      }
      
      // 前の音声が再生中なら停止
      if (audioSource) {
        try {
          audioSource.stop();
        } catch (e) {
          showDebugInfo(`既存の音声ソース停止エラー: ${e.message}`);
        }
        audioSource = null;
      }
      
      // 音声再生用のソースノード作成
      audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      
      // リップシンク用のAnalyserNodeを作成
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // より高い解像度で解析できるよう増加
      
      // 接続: ソース → アナライザー → 出力
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);
      
      // 音声終了時のイベントハンドラを設定
      audioSource.onended = () => {
        showDebugInfo('音声再生が完了しました');
        stopCurrentLipSync();
      };
      
      // 応答受信ログを音声再生開始と同時に表示
      if (aiResponse) {
        showDebugInfo(`応答受信: ${aiResponse}`);
      }
      
      // 事前解析データを使用したリップシンクアニメーションを準備
      usingPreAnalyzedData = preAnalyzedMouthData && preAnalyzedMouthData.length > 0;
      if (usingPreAnalyzedData) {
        showDebugInfo(`事前解析データを使用したリップシンクを開始: ${preAnalyzedMouthData.length}フレーム`);
        startPreAnalyzedLipSync();
      } else {
        showDebugInfo('リアルタイム解析によるリップシンクを開始');
        startLipSyncAnimation();
      }
      
      // 再生開始時間を記録
      audioPlaybackStartTime = audioContext.currentTime;
      
      // 再生開始
      audioSource.start(0);
      showDebugInfo('音声再生を開始しました');
      
    } catch (decodeError) {
      showDebugInfo(`音声デコードエラー: ${decodeError.message}. ダミーリップシンクを使用します。`);
      performDummyLipSync();
    }
    
  } catch (e) {
    showDebugInfo(`音声再生に失敗: ${e.message}. ダミーリップシンクを使用します。`);
    console.error('音声再生に失敗しました:', e);
    performDummyLipSync();
  }
}

// 音声データを事前解析して口の動きデータを生成
async function preAnalyzeAudio(audioBuffer) {
  try {
    showDebugInfo('音声の事前解析を開始...');
    
    // 解析間隔（秒）- 10msごとにサンプリング
    const analyzeInterval = 0.01;
    const audioLength = audioBuffer.duration;
    const sampleCount = Math.ceil(audioLength / analyzeInterval);
    
    // 口の動きデータを格納する配列
    preAnalyzedMouthData = [];
    
    // オフラインの音声コンテキストを作成（高速処理のため）
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // ソースノードとアナライザーノードを作成
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    
    const analyser = offlineCtx.createAnalyser();
    analyser.fftSize = 2048;
    
    // ノードを接続
    source.connect(analyser);
    analyser.connect(offlineCtx.destination);
    
    // 周波数データバッファを作成
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // 母音の周波数帯域に重点を置くウェイト
    const frequencyWeights = createFrequencyWeights(bufferLength, offlineCtx.sampleRate, analyser.fftSize);
    
    // リップシンクのパラメータを設定
    const volumeThreshold = 8;  // 音量しきい値
    const amplificationFactor = 3.8;  // 口の開き具合の増幅率（さらに増幅）
    
    // 時間変数と音量履歴
    let time = 0;
    const volumeHistory = new Array(8).fill(0);
    let historyIndex = 0;
    
    // 口の動きにリズムを加えるパターン
    const rhythmPatterns = [
      { frequency: 4, amplitude: 0.15 },
      { frequency: 8, amplitude: 0.1 },
      { frequency: 12, amplitude: 0.07 },
      { frequency: 2, amplitude: 0.05 }
    ];
    
    // 音声を開始
    source.start(0);
    
    // 現在の解析位置
    let currentTime = 0;
    
    try {
      // レンダリング処理を開始 (先にrenderPromiseを作成)
      const renderPromise = offlineCtx.startRendering();
      
      // オフラインコンテキストで一定間隔ごとにデータを取得
      while (currentTime < audioLength) {
        try {
          await offlineCtx.suspend(currentTime);
          
          // 周波数データを取得
          analyser.getByteFrequencyData(dataArray);
          
          // 母音の周波数帯域を重点的に解析
          let totalVolume = 0;
          let count = 0;
          
          for (let i = 2; i < Math.min(150, bufferLength); i++) {
            totalVolume += dataArray[i] * frequencyWeights[i];
            count++;
          }
          
          // 音量の平均値を計算
          const average = count > 0 ? totalVolume / count : 0;
          
          // 音量履歴を更新
          volumeHistory[historyIndex] = average;
          historyIndex = (historyIndex + 1) % volumeHistory.length;
          
          // 時間変数を更新
          time += analyzeInterval * 10; // 変調用の時間パラメータ
          
          // 口の開き具合を計算
          let mouthOpenValue;
          if (average < volumeThreshold) {
            mouthOpenValue = 0; // しきい値未満なら口を閉じる
          } else {
            // 基本値：音量をスケーリングしてamplificationFactor倍に
            const baseValue = Math.min(1.0, (average - volumeThreshold) / 80 * amplificationFactor);
            
            // 複数のリズムパターンを組み合わせて、より自然な周期的変調を追加
            let modulation = 0;
            rhythmPatterns.forEach(pattern => {
              modulation += Math.sin(time * pattern.frequency) * pattern.amplitude;
            });
            
            // 音量の変化率も加味（ダイナミクスを強調）
            const volumeVariation = Math.max(0, Math.min(0.35, getVolumeVariation(volumeHistory) * 2.5));
            
            // 基本値 + 変調 + 音量変化率
            mouthOpenValue = Math.min(Math.max(0, baseValue + modulation + volumeVariation), 1);
            
            // 音節の区切りをより明確にするために、音量の閾値に応じた追加処理
            if (average > volumeThreshold * 3) {
              // 大きな音量変化があれば口をより大きく開ける（子音など）
              mouthOpenValue = Math.min(mouthOpenValue * 1.3, 1);
            }
          }
          
          // 口の動きデータを配列に追加
          preAnalyzedMouthData.push({
            time: currentTime,
            value: mouthOpenValue
          });
          
          // 次の時間へ進む
          currentTime += analyzeInterval;
          
          // コンテキストを再開
          await offlineCtx.resume();
        } catch (e) {
          showDebugInfo(`事前解析のサスペンド/レジューム中にエラー: ${e.message}`);
          // エラーが発生しても次のサンプルへ進む
          currentTime += analyzeInterval;
        }
      }
      
      // レンダリングの完了を待つ
      await renderPromise;
      
    } catch (renderError) {
      showDebugInfo(`レンダリング中にエラーが発生: ${renderError.message}`);
      throw renderError;
    }
    
    // 必要なデータが生成できたかチェック
    if (preAnalyzedMouthData.length < 10) {
      showDebugInfo('事前解析で十分なデータが生成できませんでした。');
      throw new Error('事前解析データが不足しています');
    }
    
    // 音声データの事前解析が完了したことを通知
    showDebugInfo(`音声の事前解析が完了しました: ${preAnalyzedMouthData.length}フレーム生成`);
    
    // 口の動きをより自然にするための後処理（スムージング）
    smoothMouthData();
    
    return preAnalyzedMouthData;
  } catch (error) {
    showDebugInfo(`事前解析中にエラーが発生しました: ${error.message}`);
    console.error('事前解析エラー:', error);
    // 事前解析データをクリア
    preAnalyzedMouthData = null;
    // エラーを上位に伝播
    throw error;
  }
}

// 口の動きデータをスムージング処理する関数
function smoothMouthData() {
  if (!preAnalyzedMouthData || preAnalyzedMouthData.length < 3) return;
  
  // スムージング係数 - 値が大きいほど滑らか（0.0〜1.0）
  const smoothingFactor = 0.5;
  
  // 最初のデータは保持
  let prevValue = preAnalyzedMouthData[0].value;
  
  // 2番目以降のデータをスムージング
  for (let i = 1; i < preAnalyzedMouthData.length; i++) {
    const currentValue = preAnalyzedMouthData[i].value;
    // スムージングした値を計算
    const smoothedValue = prevValue + smoothingFactor * (currentValue - prevValue);
    // 値を更新
    preAnalyzedMouthData[i].value = smoothedValue;
    prevValue = smoothedValue;
  }
  
  // さらにピークを強調（メリハリをつける）
  enhancePeaks();
}

// 口の動きのピークを強調する関数
function enhancePeaks() {
  if (!preAnalyzedMouthData || preAnalyzedMouthData.length < 5) return;
  
  // ピーク検出とその強調
  for (let i = 2; i < preAnalyzedMouthData.length - 2; i++) {
    const prev2 = preAnalyzedMouthData[i-2].value;
    const prev1 = preAnalyzedMouthData[i-1].value;
    const current = preAnalyzedMouthData[i].value;
    const next1 = preAnalyzedMouthData[i+1].value;
    const next2 = preAnalyzedMouthData[i+2].value;
    
    // ピークを検出（現在の値が前後より大きければピーク）
    if (current > prev1 && current > next1 && current > 0.2) {
      // ピークを強調（最大1.0まで）
      preAnalyzedMouthData[i].value = Math.min(current * 1.3, 1.0);
      
      // ピークの前後も少し強調して自然な曲線に
      if (prev1 > 0.1) preAnalyzedMouthData[i-1].value = Math.min(prev1 * 1.15, 1.0);
      if (next1 > 0.1) preAnalyzedMouthData[i+1].value = Math.min(next1 * 1.15, 1.0);
    }
    
    // 谷を検出（現在の値が前後より小さければ谷）
    if (current < prev1 && current < next1 && current < 0.1) {
      // 谷をより深くする（最小0.0まで）
      preAnalyzedMouthData[i].value = Math.max(current * 0.7, 0.0);
    }
  }
}

// 事前解析したデータを使用したリップシンクアニメーション
function startPreAnalyzedLipSync() {
  if (!preAnalyzedMouthData || preAnalyzedMouthData.length === 0) {
    showDebugInfo('事前解析データがありません。リアルタイム解析に切り替えます。');
    startLipSyncAnimation();
    return;
  }
  
  showDebugInfo('事前解析データを使用したリップシンクを開始します。');
  
  // アニメーションフレーム関数
  function animateMouth() {
    // アニメーションフレームIDを保存
    animationFrameId = requestAnimationFrame(animateMouth);
    
    if (!model || !audioContext || !audioSource) return;
    
    // 現在の再生時間を取得
    const currentPlaybackTime = audioContext.currentTime - audioPlaybackStartTime;
    
    // 現在の時間に対応する口の開き具合を検索
    let mouthOpenValue = 0;
    
    // 最も近い時間のデータを使用
    for (let i = 0; i < preAnalyzedMouthData.length; i++) {
      const data = preAnalyzedMouthData[i];
      if (data.time > currentPlaybackTime) {
        // 前後のデータ間で線形補間
        if (i > 0) {
          const prevData = preAnalyzedMouthData[i-1];
          const t = (currentPlaybackTime - prevData.time) / (data.time - prevData.time);
          mouthOpenValue = prevData.value + t * (data.value - prevData.value);
        } else {
          mouthOpenValue = data.value;
        }
        break;
      }
    }
    
    // 現在の再生時間がすべてのデータを超えた場合は最後のデータを使用
    if (mouthOpenValue === 0 && preAnalyzedMouthData.length > 0 && currentPlaybackTime > preAnalyzedMouthData[0].time) {
      mouthOpenValue = preAnalyzedMouthData[preAnalyzedMouthData.length - 1].value;
    }
    
    // モデルに適用
    applyMouthOpenValue(mouthOpenValue);
  }
  
  // アニメーション開始
  animateMouth();
}

// 周波数重みを作成する関数
function createFrequencyWeights(bufferLength, sampleRate, fftSize) {
  const weights = new Array(bufferLength).fill(1);
  
  for (let i = 0; i < bufferLength; i++) {
    const freq = i * sampleRate / fftSize;
    if (freq < 80) {
      weights[i] = 0.1; // 低周波数は抑制
    } else if (freq >= 80 && freq < 500) {
      weights[i] = 0.8; // 低〜中域
    } else if (freq >= 500 && freq < 2000) {
      weights[i] = 1.5; // 母音が集中する周波数帯を強調
    } else if (freq >= 2000 && freq < 3000) {
      weights[i] = 1.0; // 中〜高域
    } else {
      weights[i] = 0.2; // 高周波数は抑制
    }
  }
  
  return weights;
}

// 音量の変化率を計算する関数
function getVolumeVariation(history) {
  if (history.length < 2) return 0;
  
  let totalDiff = 0;
  for (let i = 1; i < history.length; i++) {
    totalDiff += Math.abs(history[i] - history[i-1]);
  }
  
  return totalDiff / (history.length - 1) / 100; // 正規化
}

// リップシンクアニメーションを開始する関数（リアルタイム解析）
function startLipSyncAnimation() {
  if (!audioContext || !analyser) {
    showDebugInfo('オーディオコンテキストまたはアナライザーが初期化されていません');
    performDummyLipSync();
    return;
  }
  
  // バッファ長の取得
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  // 前回の値を保持して滑らかに変化させる
  let lastMouthOpenValue = 0;
  // 音量しきい値（これより小さい音量では口を閉じる）
  const volumeThreshold = 8; // より反応しやすく
  // 滑らかさ調整係数（値が大きいほど反応が早い）
  const smoothingFactor = 0.9; // より反応を早く
  // 口の開閉を増幅する係数
  const amplificationFactor = 3.8; // より目立つ口の動き
  
  // 口の動きをさらに増強するための周期的な変調に使用する変数
  let time = 0;
  const modulationSpeed = 0.25; // 変調速度
  
  // 音量履歴の記録用（口の動きをより自然にするため）
  const volumeHistory = new Array(8).fill(0);
  let historyIndex = 0;
  
  // 音声の特定周波数帯に重点を置くためのウェイト設定
  const frequencyWeights = createFrequencyWeights(bufferLength, audioContext.sampleRate, analyser.fftSize);
  
  // 口の開閉パターンの複雑さを増すためのパラメータ
  const rhythmPatterns = [
    { frequency: 4, amplitude: 0.15 },   // 基本リズム
    { frequency: 8, amplitude: 0.1 },    // 早いリズム
    { frequency: 12, amplitude: 0.07 },  // より細かいリズム
    { frequency: 2, amplitude: 0.05 }    // ゆっくりとした揺らぎ
  ];
  
  // デバッグ用のカウンタ
  let debugCounter = 0;
  
  // リップシンク用のアニメーションフレーム関数
  function animateMouth() {
    // アニメーションフレームIDを保存
    animationFrameId = requestAnimationFrame(animateMouth);
    
    if (!model || !analyser) return;
    
    // 周波数データの取得
    analyser.getByteFrequencyData(dataArray);
    
    // 音声の特徴を抽出（重み付けした周波数解析）
    let totalVolume = 0;
    let count = 0;
    
    // 人間の声に関連する周波数帯に重点を置く（およそ80Hz〜3000Hz）
    for (let i = 2; i < Math.min(150, bufferLength); i++) {
      totalVolume += dataArray[i] * frequencyWeights[i];
      count++;
    }
    
    // 音量の平均値を計算
    const average = count > 0 ? totalVolume / count : 0;
    
    // 音量履歴に追加
    volumeHistory[historyIndex] = average;
    historyIndex = (historyIndex + 1) % volumeHistory.length;
    
    // 時間変数を増加（周期的な変調に使用）
    time += modulationSpeed;
    
    // 音量変化に基づく口の開き具合の計算
    let targetMouthValue;
    if (average < volumeThreshold) {
      targetMouthValue = 0; // しきい値未満なら口を閉じる
    } else {
      // しきい値以上なら音量に応じて口を開く
      // 基本値：音量をスケーリングしてamplificationFactor倍に
      const baseValue = Math.min(1.0, (average - volumeThreshold) / 80 * amplificationFactor);
      
      // 複数のリズムパターンを組み合わせて、より自然な周期的変調を追加
      let modulation = 0;
      rhythmPatterns.forEach(pattern => {
        modulation += Math.sin(time * pattern.frequency) * pattern.amplitude;
      });
      
      // 音量の変化率も加味（ダイナミクスを強調）
      const volumeVariation = Math.max(0, Math.min(0.35, getVolumeVariation(volumeHistory) * 2.5));
      
      // 音量の急な変化に対してさらに口を開く（子音などの認識向上）
      const volumeChange = getRecentVolumeChange(volumeHistory);
      const accentFactor = volumeChange > 10 ? Math.min(0.2, volumeChange / 100) : 0;
      
      // 基本値 + 変調 + 音量変化率 + アクセント（急な変化）
      targetMouthValue = Math.min(Math.max(0, baseValue + modulation + volumeVariation + accentFactor), 1);
      
      // 音節の区切りをより明確にするために、音量の閾値に応じた追加処理
      if (average > volumeThreshold * 3) {
        // 大きな音量変化があれば口をより大きく開ける（子音など）
        targetMouthValue = Math.min(targetMouthValue * 1.3, 1);
      }
    }
    
    // スムージングを行うが、反応速度を改善
    const mouthOpenValue = lastMouthOpenValue + smoothingFactor * (targetMouthValue - lastMouthOpenValue);
    lastMouthOpenValue = mouthOpenValue;
    
    // モデルに適用
    applyMouthOpenValue(mouthOpenValue);
    
    // デバッグ情報（10フレームに1回だけ表示して負荷を減らす）
    if (DEBUG_MODE && ++debugCounter % 10 === 0) {
      showDebugInfo(`音量: ${average.toFixed(2)}, 口の開き: ${mouthOpenValue.toFixed(2)}`);
    }
  }
  
  // 最近の音量変化を計算（急な変化を検出するため）
  function getRecentVolumeChange(history) {
    if (history.length < 3) return 0;
    
    // 直近3サンプルのみで計算
    const i = historyIndex;
    const prev = history[(i - 1 + history.length) % history.length];
    const current = history[i];
    
    return Math.abs(current - prev);
  }
  
  // アニメーション開始
  animateMouth();
}

// 現在実行中のリップシンクをすべて停止する関数
function stopCurrentLipSync() {
  // インターバルタイマーの停止
  if (lipSyncInterval) {
    clearInterval(lipSyncInterval);
    lipSyncInterval = null;
  }
  
  // アニメーションフレームの停止
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // 事前解析データをクリア
  preAnalyzedMouthData = null;
  usingPreAnalyzedData = false;
  
  // 口を閉じる
  applyMouthOpenValue(0);
  
  showDebugInfo('リップシンクを停止しました');
}

// ダミーのリップシンク（音声ファイルがない場合やエラー時）
function performDummyLipSync() {
  showDebugInfo('ダミーリップシンクを開始します');
  
  // まず現在実行中のリップシンクをすべて停止
  stopCurrentLipSync();
  
  // ダミーリップシンク用のデータを生成
  const dummyDuration = 5; // 秒
  const frameRate = 60; // フレームレート
  const frameCount = dummyDuration * frameRate;
  
  // ダミーの口の動きデータを生成
  preAnalyzedMouthData = [];
  for (let i = 0; i < frameCount; i++) {
    const time = i / frameRate;
    
    // 複雑なパターンを生成（より自然な口の動き）
    const t = time * 6; // 時間パラメータ
    
    // 基本のリズムパターン
    const pattern1 = Math.sin(t * 5) * 0.5; // ゆっくり
    const pattern2 = Math.sin(t * 12) * 0.3; // 速い
    const pattern3 = Math.sin(t * 20) * 0.2; // より速い
    const pattern4 = Math.sin(t * 0.8) * 0.15; // 非常にゆっくり
    
    // ノイズ要素（ランダム性）
    const noise = Math.random() * 0.3;
    
    // パターンの組み合わせ
    let rawValue = Math.abs(pattern1 + pattern2 * noise + pattern3 * (noise * 0.5) + pattern4);
    
    // 音節のパターンを再現（ペースを変える）
    if (i % 15 === 0 && Math.random() > 0.3) {
      // 新しい音節の開始 - 口を大きく開ける
      rawValue = Math.min(rawValue * 2, 1);
    } else if (i % 15 >= 10) {
      // 音節の終わり - 口を閉じる傾向
      rawValue *= 0.5;
    }
    
    // 最終値を計算（範囲を0〜1に制限）
    let finalValue = Math.min(rawValue, 1);
    
    // しきい値を適用（小さい値では完全に口を閉じる）
    if (finalValue < 0.15) {
      finalValue = 0;
    }
    
    // データを追加
    preAnalyzedMouthData.push({
      time: time,
      value: finalValue
    });
  }
  
  // 口の動きをスムージング
  smoothMouthData();
  
  // ダミー再生開始時間を記録
  audioPlaybackStartTime = audioContext ? audioContext.currentTime : 0;
  usingPreAnalyzedData = true;
  
  // 応答受信ログを表示（再生開始と同時に）
  if (aiResponse) {
    showDebugInfo(`応答受信: ${aiResponse}`);
  }
  
  // 事前解析データを使用したリップシンクを開始
  startPreAnalyzedLipSync();
  
  // 5秒後に停止
  setTimeout(() => {
    stopCurrentLipSync();
    showDebugInfo('ダミーリップシンク完了');
  }, 5000);
}

// 口の開閉値を複数のパラメータに適用する関数
function applyMouthOpenValue(value) {
  if (!model || !model.internalModel || !model.internalModel.coreModel) return;
  
  // パラメータ候補リスト
  const mouthParams = [
    'ParamA',             // 虹色まおの口パクパラメータ
    'ParamMouthOpenY',
    'PARAM_MOUTH_OPEN_Y',
    'ParamMouthOpen',
    'PARAM_MOUTH_OPEN',
    'Param_mouth_open_y'
  ];
  
  // 口の開きを大きくするために値を増幅
  // 増幅率を上げるとより口が大きく開くが、最大値は1.0に制限される
  const amplifiedValue = Math.min(value * 3.8, 1);
  
  // すべてのパラメータを試す
  let applied = false;
  mouthParams.forEach(param => {
    try {
      model.internalModel.coreModel.setParameterValueById(param, amplifiedValue);
      applied = true;
    } catch (e) {
      // このパラメータがなければスキップ
    }
  });
  
  if (!applied) {
    // デバッグモードでのみ表示
    if (DEBUG_MODE && value > 0) {
      showDebugInfo('口パクパラメータが適用できませんでした。モデルが互換性のあるパラメータを持っていない可能性があります。');
    }
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
      
      // ボイスタイプの取得
      const voiceTypeSelect = document.getElementById('voice-type');
      const voiceType = voiceTypeSelect ? voiceTypeSelect.value : 'voicevox:1';
      showDebugInfo(`使用するボイスタイプ: ${voiceType}`);
      
      // テストモード中はその表示を追加
      if (testMode) {
        showDebugInfo('テストモードが有効です: OpenAI APIは使用されません');
      }
      
      // 実際のAPIを呼び出す
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, voiceType })
      });

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // AIの応答を保持（音声再生時のログ用）
      aiResponse = data.reply;
      
      // テストモードフラグを更新（サーバー側の状態を反映）
      if (data.testMode !== undefined && testMode !== data.testMode) {
        updateTestModeUI(data.testMode);
      }

      // AIの応答をUIに追加
      addMessageToUI('ai', data.reply);
      
      // 表情変更などの追加処理
      if (model && data.emotion) {
        changeExpression(data.emotion);
      }
      
      // 音声再生（応答受信ログは音声開始と同時に表示）
      if (data.audioUrl) {
        playVoice(data.audioUrl);
      } else {
        // 音声がない場合は即座に応答ログを表示
        showDebugInfo(`応答受信: ${data.reply}`);
      }

    } catch (error) {
      showDebugInfo(`エラー: ${error.message}`);
      console.error('メッセージ送信エラー:', error);
      addMessageToUI('ai', 'すみません、エラーが発生しました。もう一度お試しください。');
    }
  }
}

// テストコントロールのセットアップ
function setupTestControls() {
  const lipSyncTestButton = document.getElementById('lip-sync-test');
  const voicevoxTestButton = document.getElementById('voicevox-test');
  const voicevoxSpeakersButton = document.getElementById('voicevox-speakers');
  const testModeButton = document.getElementById('toggle-test-mode');
  
  // リップシンクテストボタン
  if (lipSyncTestButton) {
    lipSyncTestButton.addEventListener('click', async () => {
      showDebugInfo('リップシンクテストを実行します');
      
      try {
        // テストAPIを呼び出す
        const response = await fetch(`${API_BASE_URL}/api/lip-sync-test`);
        
        if (!response.ok) {
          throw new Error(`テストAPIエラー: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // テストメッセージを表示
        addMessageToUI('ai', `【テスト】 ${data.reply}`);
        
        // AIの応答を保持（音声再生時のログ用）
        aiResponse = data.reply;
        
        // 音声再生とリップシンク
        if (data.audioUrl) {
          playVoice(data.audioUrl);
        } else {
          // 音声がない場合は即座に応答ログを表示
          showDebugInfo(`応答受信: ${data.reply}`);
        }
        
      } catch (error) {
        showDebugInfo(`テストエラー: ${error.message}`);
        console.error('リップシンクテストエラー:', error);
        addMessageToUI('ai', '音声テストに失敗しました。サーバーが起動しているか確認してください。');
      }
    });
  } else {
    showDebugInfo('リップシンクテストボタンが見つかりません');
  }
  
  // VOICEVOXテストボタン
  if (voicevoxTestButton) {
    voicevoxTestButton.addEventListener('click', async () => {
      showDebugInfo('VOICEVOXテストを実行します');
      
      try {
        // VOICEVOXテストAPIを呼び出す
        const response = await fetch(`${API_BASE_URL}/api/voicevox-test`);
        
        if (!response.ok) {
          throw new Error(`VOICEVOX テストAPIエラー: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // テスト結果をUIに追加
        if (data.status === 'success') {
          addMessageToUI('ai', `【VOICEVOX】 接続テスト成功: バージョン ${JSON.stringify(data.version)}`);
          showDebugInfo(`VOICEVOX接続テスト成功: ${data.endpoint}`);
        } else {
          addMessageToUI('ai', `【VOICEVOX】 接続テスト失敗: ${data.message}`);
          showDebugInfo(`VOICEVOX接続テスト失敗: ${data.message}`);
        }
        
      } catch (error) {
        showDebugInfo(`VOICEVOXテストエラー: ${error.message}`);
        console.error('VOICEVOXテストエラー:', error);
        addMessageToUI('ai', 'VOICEVOXテストに失敗しました。VOICEVOXエンジンが起動しているか確認してください。');
      }
    });
  } else {
    showDebugInfo('VOICEVOXテストボタンが見つかりません');
  }
  
  // VOICEVOX話者一覧ボタン
  if (voicevoxSpeakersButton) {
    voicevoxSpeakersButton.addEventListener('click', async () => {
      showDebugInfo('VOICEVOX話者一覧を取得します');
      
      try {
        // VOICEVOX話者一覧APIを呼び出す
        const response = await fetch(`${API_BASE_URL}/api/voicevox-speakers`);
        
        if (!response.ok) {
          throw new Error(`VOICEVOX 話者一覧APIエラー: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && data.speakers) {
          // 話者一覧を表示
          let speakerInfo = '【VOICEVOX話者一覧】\n';
          
          data.speakers.forEach(speaker => {
            speakerInfo += `${speaker.name}:\n`;
            if (speaker.styles) {
              speaker.styles.forEach(style => {
                speakerInfo += `  - ID: ${style.id}, スタイル: ${style.name}\n`;
              });
            }
          });
          
          addMessageToUI('ai', speakerInfo);
          showDebugInfo('VOICEVOX話者一覧取得成功');
        } else {
          addMessageToUI('ai', '【VOICEVOX】 話者一覧の取得に失敗しました。');
          showDebugInfo(`VOICEVOX話者一覧取得失敗: ${data.message || 'エラー'}`);
        }
        
      } catch (error) {
        showDebugInfo(`VOICEVOX話者一覧取得エラー: ${error.message}`);
        console.error('VOICEVOX話者一覧取得エラー:', error);
        addMessageToUI('ai', 'VOICEVOX話者一覧の取得に失敗しました。VOICEVOXエンジンが起動しているか確認してください。');
      }
    });
  } else {
    showDebugInfo('VOICEVOX話者一覧ボタンが見つかりません');
  }
  
  // テストモード切り替えボタン
  if (testModeButton) {
    testModeButton.addEventListener('click', async () => {
      showDebugInfo('テストモード切り替えボタンがクリックされました');
      
      try {
        // テストモード切り替えAPIを呼び出す
        const response = await fetch(`${API_BASE_URL}/api/toggle-test-mode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`テストモード切り替えエラー: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // UIを更新
        updateTestModeUI(data.testMode);
        
        // 状態をメッセージとして表示
        addMessageToUI('ai', `【システム】テストモードを${data.testMode ? '有効' : '無効'}にしました。${data.testMode ? 'OpenAI APIは使用されません。' : ''}`);
        
      } catch (error) {
        showDebugInfo(`テストモード切り替えエラー: ${error.message}`);
        console.error('テストモード切り替えエラー:', error);
        addMessageToUI('ai', 'テストモードの切り替えに失敗しました。サーバーが起動しているか確認してください。');
      }
    });
  } else {
    showDebugInfo('テストモード切り替えボタンが見つかりません');
  }
}