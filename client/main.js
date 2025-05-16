  // メッセージ送信処理
  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // UIにユーザーメッセージを追加
    addMessageToUI('user', message);
    userInput.value = '';
    
    try {
      showDebugInfo(`メッセージ送信: ${message}`);
      
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
      showDebugInfo(`応答受信: ${data.reply}`);
      
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
      showDebugInfo(`エラー: ${error.message}`);
      console.error('メッセージ送信エラー:', error);
      addMessageToUI('ai', 'すみません、エラーが発生しました。もう一度お試しください。');
    }
  }