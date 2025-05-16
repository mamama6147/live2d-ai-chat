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