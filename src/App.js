import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RotateCcw, Play, Home, Star } from 'lucide-react';

const MemoryCardGame = () => {
  // 絵柄の定義（フルーツと動物）
  const symbols = ['🍎', '🍌', '🍓', '🍊', '🍇', '🥝', '🍑', '🥭'];
  
  // ゲーム状態
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [gameState, setGameState] = useState('idle'); // idle, countdown, memorizing, playing, finished
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [rankings, setRankings] = useState([]);
  const [showCongrats, setShowCongrats] = useState(false);
  const [scoreRegistered, setScoreRegistered] = useState(false);

  // カードを初期化
  const initializeCards = useCallback(() => {
    const cardPairs = symbols.map((symbol, index) => [
      { id: index * 2, symbol, matched: false, flipped: false },
      { id: index * 2 + 1, symbol, matched: false, flipped: false }
    ]).flat();
    
    // シャッフル
    const shuffled = [...cardPairs].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedCards([]);
    setElapsedTime(0);
    setScoreRegistered(false);
  }, []);

  // ゲーム開始
  const startGame = () => {
    initializeCards();
    setGameState('countdown');
    setCountdown(3);
  };

  // カウントダウン処理
  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'countdown' && countdown === 0) {
      setGameState('memorizing');
      // 3秒間全カードを表示
      setCards(prev => prev.map(card => ({ ...card, flipped: true })));
      setTimeout(() => {
        setCards(prev => prev.map(card => ({ ...card, flipped: false })));
        setGameState('playing');
        setStartTime(Date.now());
      }, 3000);
    }
  }, [gameState, countdown]);

  // タイマー更新
  useEffect(() => {
    if (gameState === 'playing' && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [gameState, startTime]);

  // カードクリック処理
  const handleCardClick = (cardId) => {
    if (gameState !== 'playing') return;
    if (flippedCards.length >= 2) return;
    if (flippedCards.includes(cardId)) return;
    if (matchedCards.includes(cardId)) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      const [firstCard, secondCard] = newFlippedCards.map(id => 
        cards.find(card => card.id === id)
      );

      if (firstCard.symbol === secondCard.symbol) {
        // マッチした場合
        setTimeout(() => {
          const newMatchedCards = [...matchedCards, ...newFlippedCards];
          setMatchedCards(newMatchedCards);
          setFlippedCards([]);
          
          // ゲームクリアチェック
          if (newMatchedCards.length === cards.length) {
            setGameState('finished');
            setShowCongrats(true);
            setTimeout(() => {
              setShowCongrats(false);
              checkTopScore();
            }, 3000);
          }
        }, 1000);
      } else {
        // マッチしなかった場合
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // トップスコアチェック
  const checkTopScore = () => {
    const currentTime = elapsedTime;
    const sortedRankings = [...rankings].sort((a, b) => a.time - b.time);
    
    if (sortedRankings.length < 10 || currentTime < sortedRankings[9].time) {
      setShowScoreModal(true);
    }
  };

  // スコア登録
  const registerScore = () => {
    if (scoreRegistered) return; // 重複登録防止
    
    const newScore = {
      name: playerName,
      time: elapsedTime,
      date: new Date().toISOString()
    };
    
    const newRankings = [...rankings, newScore]
      .sort((a, b) => a.time === b.time ? new Date(a.date) - new Date(b.date) : a.time - b.time)
      .slice(0, 10);
    
    setRankings(newRankings);
    setShowScoreModal(false);
    setPlayerName('');
    setScoreRegistered(true);
  };

  // スコア登録をスキップ
  const skipScoreRegistration = () => {
    setShowScoreModal(false);
    setPlayerName('');
    setScoreRegistered(true);
  };

  // 時間フォーマット
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  // カードの表示状態判定
  const isCardVisible = (card) => {
    return gameState === 'memorizing' || 
           flippedCards.includes(card.id) || 
           matchedCards.includes(card.id);
  };

  // 花火エフェクト
  const FireworksEffect = () => (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl font-bold text-yellow-400 mb-4 animate-bounce">
          🎉 Congratulations! 🎉
        </div>
        <div className="text-4xl">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="inline-block animate-ping"
              style={{
                animationDelay: `${i * 0.2}s`,
                fontSize: '2rem'
              }}
            >
              ✨
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (showRanking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                ランキング TOP10
              </h2>
              <button
                onClick={() => setShowRanking(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <Home size={18} />
                戻る
              </button>
            </div>
            
            <div className="space-y-3">
              {rankings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">まだ記録がありません</p>
              ) : (
                rankings.map((score, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      index === 0 ? 'bg-yellow-50 border-yellow-300' :
                      index === 1 ? 'bg-gray-50 border-gray-300' :
                      index === 2 ? 'bg-orange-50 border-orange-300' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-lg ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-600' :
                          index === 2 ? 'text-orange-600' :
                          'text-gray-700'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="font-medium">{score.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatTime(score.time)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(score.date).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">🧠 神経衰弱ゲーム</h1>
          <div className="flex justify-center gap-4 mb-4">
            {gameState === 'idle' && (
              <button
                onClick={startGame}
                className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors flex items-center gap-2 text-lg"
              >
                <Play size={20} />
                ゲーム開始
              </button>
            )}
            
            {gameState !== 'idle' && (
              <button
                onClick={() => {
                  setGameState('idle');
                  initializeCards();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <RotateCcw size={18} />
                リトライ
              </button>
            )}
            
            <button
              onClick={() => setShowRanking(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
            >
              <Trophy size={18} />
              ランキング
            </button>
          </div>
          
          {gameState === 'playing' && (
            <div className="text-2xl font-bold text-white">
              ⏱️ {formatTime(elapsedTime)}
            </div>
          )}
        </div>

        {/* カウントダウン */}
        {gameState === 'countdown' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="text-8xl font-bold text-white animate-bounce">
              {countdown}
            </div>
          </div>
        )}

        {/* 記憶時間の表示 */}
        {gameState === 'memorizing' && (
          <div className="text-center mb-4">
            <div className="text-xl font-bold text-yellow-300 animate-pulse">
              💭 カードを覚えてください！
            </div>
          </div>
        )}

        {/* ゲームエリア */}
        {cards.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto">
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`
                  aspect-square rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center text-3xl sm:text-4xl font-bold
                  ${isCardVisible(card)
                    ? 'bg-white shadow-lg transform scale-105'
                    : 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-md'
                  }
                  ${matchedCards.includes(card.id) ? 'animate-pulse ring-4 ring-yellow-400' : ''}
                  ${gameState !== 'playing' ? 'cursor-default' : ''}
                `}
              >
                {isCardVisible(card) ? card.symbol : '?'}
              </div>
            ))}
          </div>
        )}

        {/* 開始前の説明 */}
        {gameState === 'idle' && (
          <div className="text-center mt-8 max-w-2xl mx-auto">
            <div className="bg-white bg-opacity-20 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">🎮 ゲームの遊び方</h3>
              <div className="space-y-2 text-left">
                <p>• 4×4のカードで同じ絵柄のペアを見つけよう！</p>
                <p>• ゲーム開始時に3秒間、全てのカードが表示されます</p>
                <p>• 2枚のカードをクリックして、同じ絵柄なら成功！</p>
                <p>• 全てのペアを見つけてクリアタイムを競おう！</p>
              </div>
            </div>
          </div>
        )}

        {/* 花火エフェクト */}
        {showCongrats && <FireworksEffect />}

        {/* スコア登録モーダル */}
        {showScoreModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-center">
                🎉 TOP10入り！
              </h3>
              <p className="text-center mb-4">
                クリアタイム: <span className="font-bold text-blue-600">{formatTime(elapsedTime)}</span>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">お名前を入力してください</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="名前を入力"
                  maxLength={20}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={registerScore}
                  disabled={!playerName.trim() || scoreRegistered}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Star size={18} className="inline mr-2" />
                  登録
                </button>
                <button
                  onClick={skipScoreRegistration}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  登録しない
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryCardGame;