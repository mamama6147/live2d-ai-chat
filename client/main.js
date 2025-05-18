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
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      showDebugInfo(`AudioContextの作成に失敗: ${e.message}`);
      // AudioContextが作成できなくても、ダミーリップシンクは実行
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
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // 前の音声が再生中なら停止
      if (audioSource) {
        audioSource.stop();
        audioSource = null;
      }
      
      // 音声再生用のソースノード作成
      audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      
      // リップシンク用のAnalyserNodeを作成
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; // より詳細な解析のために増加（元は512）
      
      // 接続: ソース → アナライザー → 出力
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);
      
      // 音声終了時のイベントハンドラを設定
      audioSource.onended = () => {
        showDebugInfo('音声再生が完了しました');
        stopCurrentLipSync();
      };
      
      // 再生開始
      audioSource.start(0);
      showDebugInfo('音声再生を開始しました');
      
      // リップシンクのアニメーションを開始
      startLipSyncAnimation();
      
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

// リップシンクアニメーションを開始する関数
function startLipSyncAnimation() {
  // バッファ長の取得
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  // 前回の値を保持して滑らかに変化させる
  let lastMouthOpenValue = 0;
  // 音量しきい値（これより小さい音量では口を閉じる）
  const volumeThreshold = 10; // 少し下げて反応を良くする（元は15）
  // 滑らかさ調整係数（値が大きいほど反応が早い）
  const smoothingFactor = 0.8; // より反応を早く（元は0.6）
  // 口の開閉を増幅する係数
  const amplificationFactor = 3.0; // より目立つ口の動き（元は2.5）
  
  // 口の動きをさらに増強するための周期的な変調に使用する変数
  let time = 0;
  const modulationSpeed = 0.2; // 変調速度
  
  // 音量履歴の記録用（口の動きをより自然にするため）
  const volumeHistory = new Array(5).fill(0);
  let historyIndex = 0;
  
  // デバッグ用のカウンタ
  let debugCounter = 0;
  
  // リップシンク用のアニメーションフレーム関数
  function animateMouth() {
    // アニメーションフレームIDを保存
    animationFrameId = requestAnimationFrame(animateMouth);
    
    if (!model || !analyser) return;
    
    // 周波数データの取得
    analyser.getByteFrequencyData(dataArray);
    
    // 音声の特徴を抽出（低域〜中域の周波数に注目）
    let totalVolume = 0;
    let count = 0;
    
    // 人間の声に関連する周波数帯に重点を置く（およそ80Hz〜3000Hz）
    for (let i = 2; i < Math.min(75, bufferLength); i++) {
      totalVolume += dataArray[i];
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
      // 音量に応じて口の開閉度を調整（感度と増幅を調整）
      // 周期的な変調を追加して、音声中でも口が動き続けるようにする
      const baseValue = (average - volumeThreshold) / 70 * amplificationFactor;
      const modulation = Math.sin(time * 8) * 0.15 + Math.sin(time * 12) * 0.1;
      
      // 口の動きが単調にならないよう、音量の変化率も考慮
      const volumeVariation = Math.max(0, Math.min(0.3, getVolumeVariation(volumeHistory) * 2));
      
      // 基本値 + 変調 + 音量変化率に基づく追加の動き
      targetMouthValue = Math.min(Math.max(0, baseValue + modulation + volumeVariation), 1);
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
  
  // 音量の変化率を計算する関数
  function getVolumeVariation(history) {
    if (history.length < 2) return 0;
    
    let totalDiff = 0;
    for (let i = 1; i < history.length; i++) {
      totalDiff += Math.abs(history[i] - history[i-1]);
    }
    
    return totalDiff / (history.length - 1) / 100; // 正規化
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
  
  // 口を閉じる
  applyMouthOpenValue(0);
  
  showDebugInfo('リップシンクを停止しました');
}

// ダミーのリップシンク（音声ファイルがない場合やエラー時）
function performDummyLipSync() {
  showDebugInfo('ダミーリップシンクを開始します');
  
  // まず現在実行中のリップシンクをすべて停止
  stopCurrentLipSync();
  
  // 前の値
  let lastMouthOpenValue = 0;
  
  // スムージング係数
  const smoothingFactor = 0.8; // 値を大きくして反応を早く（0.6→0.8）
  
  // 口の開閉を時間単位でシミュレートする値
  let time = 0;
  
  // ダミーリップシンクタイマー
  lipSyncInterval = setInterval(() => {
    time += 0.1;
    
    // より複雑なパターンを生成（単純なサイン波ではなく、複数の周波数を組み合わせる）
    const pattern1 = Math.sin(time * 5) * 0.5;   // ゆっくりした基本波
    const pattern2 = Math.sin(time * 12) * 0.3;  // 速い変化の波
    const pattern3 = Math.sin(time * 20) * 0.2;  // さらに速い変化
    
    // 不規則なノイズを加える
    const noise = Math.random() * 0.3;
    
    // 複数のパターンを組み合わせて、さらに不規則さを加える
    const rawValue = Math.abs(pattern1 + pattern2 * noise + pattern3 * (noise * 0.5));
    
    // 値の範囲を調整
    const targetValue = Math.min(rawValue, 1);
    
    // しきい値を設けて、低い値では完全に口を閉じる（パクパク感を強調）
    let finalValue;
    if (targetValue < 0.15) {
      finalValue = 0;
    } else {
      finalValue = targetValue;
    }
    
    // スムージング処理
    const mouthOpenValue = lastMouthOpenValue + smoothingFactor * (finalValue - lastMouthOpenValue);
    lastMouthOpenValue = mouthOpenValue;
    
    // パラメータ適用
    applyMouthOpenValue(mouthOpenValue);
    
  }, 20); // 更新頻度をさらに上げる（25ms→20ms、約50FPS）
  
  // 5秒後に停止（実際の音声長に合わせる場合は調整）
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
  
  // 口の開きを大きくするために値を増幅（2.5倍に増幅）
  const amplifiedValue = Math.min(value * 2.5, 1);
  
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
      showDebugInfo(`応答受信: ${data.reply}`);
      
      // テストモードフラグを更新（サーバー側の状態を反映）
      if (data.testMode !== undefined && testMode !== data.testMode) {
        updateTestModeUI(data.testMode);
      }

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
        
        // 音声再生とリップシンク
        if (data.audioUrl) {
          playVoice(data.audioUrl);
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