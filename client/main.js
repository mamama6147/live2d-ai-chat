  // メッセージ送信処理
  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // UIにユーザーメッセージを追加
    addMessageToUI('user', message);
    userInput.value = '';
    
    try {
      showDebugInfo(`メッセージ送信: ${message}`);
      
      // 実際のAPIを呼び出し
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
        showDebugInfo(`音声URL: ${data.audioUrl}`);
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