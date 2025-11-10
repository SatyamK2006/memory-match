import React, { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import "./index.css"; // important for Tailwind v4

const ICONS = ["🍎", "🍌", "🍇", "🍓", "🍑", "🍍", "🥝", "🍉"];

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [cards, setCards] = useState([]);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const confettiShownRef = useRef(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flippingCards, setFlippingCards] = useState(new Set());

  useEffect(() => {
    initGame();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (first && second) {
      setDisabled(true);
      if (first.icon === second.icon) {
        setCards(prev =>
          prev.map(c =>
            c.id === first.id || c.id === second.id ? { ...c, matched: true } : c
          )
        );
        setScore(s => s + 1);
        resetTurn();
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c
            )
          );
          resetTurn();
        }, 800);
      }
      setMoves(m => m + 1);
    }
  }, [first, second]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => {
    if (cards.length && cards.every(c => c.matched) && !confettiShownRef.current) {
      setRunning(false);
      confettiShownRef.current = true;
      // Trigger confetti celebration
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [cards]);

  function initGame() {
    const deck = shuffle([...ICONS, ...ICONS]).map((icon, idx) => ({
      id: idx + "-" + icon,
      icon,
      flipped: false,
      matched: false,
    }));
    setCards(deck);
    setFirst(null);
    setSecond(null);
    setDisabled(false);
    setMoves(0);
    setScore(0);
    setTime(0);
    setRunning(false);
    confettiShownRef.current = false;
  }

  function handleFlip(card) {
    if (disabled || isAnimating) return;
    if (!running) setRunning(true);
    if (card.flipped || card.matched) return;
    setCards(prev => prev.map(c => (c.id === card.id ? { ...c, flipped: true } : c)));
    if (!first) setFirst(card);
    else if (!second) setSecond(card);
  }

  function resetTurn() {
    setFirst(null);
    setSecond(null);
    setDisabled(false);
  }

  function restart() {
    // Check if game is completed (all cards matched)
    const gameCompleted = cards.length > 0 && cards.every(c => c.matched);
    
    if (gameCompleted && !isAnimating) {
      // Animate cards flipping back before restarting
      setIsAnimating(true);
      setDisabled(true);
      setFlippingCards(new Set());
      
      // Create array of card IDs in random order for cascading effect
      const matchedCardIds = cards.filter(c => c.matched).map(c => c.id);
      const shuffledIds = shuffle([...matchedCardIds]);
      
      // Flip cards back one by one with delay
      shuffledIds.forEach((cardId, delayIndex) => {
        setTimeout(() => {
          // Add card to flipping set for animation
          setFlippingCards(prev => new Set([...prev, cardId]));
          
          // After animation delay, flip the card
          setTimeout(() => {
            setCards(prev => 
              prev.map(c => 
                c.id === cardId ? { ...c, flipped: false, matched: false } : c
              )
            );
            setFlippingCards(prev => {
              const newSet = new Set(prev);
              newSet.delete(cardId);
              return newSet;
            });
            
            // After all cards are flipped, reset the game
            if (delayIndex === shuffledIds.length - 1) {
              setTimeout(() => {
                initGame();
                setIsAnimating(false);
                setFlippingCards(new Set());
              }, 200);
            }
          }, 200); // Wait for flip animation
        }, delayIndex * 80); // 80ms delay between each card flip start
      });
    } else if (!isAnimating) {
      // If game not completed, just restart immediately
      initGame();
    }
  }

  function handleShuffle() {
    if (isAnimating || disabled) return;
    
    // Check if there are any flipped (but not matched) cards
    const flippedCards = cards.filter(c => c.flipped && !c.matched);
    
    if (flippedCards.length > 0) {
      // First, flip all flipped cards back
      setIsAnimating(true);
      setDisabled(true);
      setFlippingCards(new Set());
      setFirst(null);
      setSecond(null);
      
      // Get all flipped card IDs
      const flippedCardIds = flippedCards.map(c => c.id);
      
      // Flip cards back one by one
      flippedCardIds.forEach((cardId, delayIndex) => {
        setTimeout(() => {
          // Add card to flipping set for animation
          setFlippingCards(prev => new Set([...prev, cardId]));
          
          // After animation delay, flip the card back
          setTimeout(() => {
            setCards(prev => 
              prev.map(c => 
                c.id === cardId ? { ...c, flipped: false } : c
              )
            );
            setFlippingCards(prev => {
              const newSet = new Set(prev);
              newSet.delete(cardId);
              return newSet;
            });
            
            // After all cards are flipped back, shuffle
            if (delayIndex === flippedCardIds.length - 1) {
              setTimeout(() => {
                // Now shuffle all cards while preserving their matched state
                // Matched cards stay matched and visible (flipped)
                setCards(prev => {
                  const shuffled = shuffle([...prev]);
                  // Preserve matched/flipped state - matched cards stay visible
                  return shuffled.map(card => ({
                    ...card,
                    flipped: card.matched ? true : false // Matched cards stay visible
                  }));
                });
                setIsAnimating(false);
                setDisabled(false);
                setFlippingCards(new Set());
              }, 200);
            }
          }, 200); // Wait for flip animation
        }, delayIndex * 60); // 60ms delay between each card flip start
      });
    } else {
      // No flipped cards, just shuffle directly
      setCards(prev => {
        const shuffled = shuffle([...prev]);
        // Preserve matched state - matched cards stay visible
        return shuffled.map(card => ({
          ...card,
          flipped: card.matched ? true : false // Matched cards stay visible
        }));
      });
      setFirst(null);
      setSecond(null);
    }
  }

  return (
    <div 
      className="h-screen w-screen flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradient 15s ease infinite'
      }}
    >
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes flipBack {
          0% {
            transform: rotateY(0deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: rotateY(90deg) scale(0.85);
            opacity: 0.7;
          }
          100% {
            transform: rotateY(0deg) scale(1);
            opacity: 1;
          }
        }
        
        .flip-animation {
          animation: flipBack 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      <div className="flex flex-col h-full w-full max-w-7xl">
        {/* Header - Fixed height */}
        <header className="flex items-center justify-between flex-shrink-0 px-4 pt-3 pb-2 backdrop-blur-sm bg-white/20 rounded-b-2xl mx-4 mb-2 shadow-lg">
          <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">🎮 Memory Match</h1>
          <div className="text-right text-xs sm:text-sm text-white font-semibold drop-shadow-md">
            <p>Moves: <span className="font-mono bg-white/30 px-2 py-0.5 rounded">{moves}</span></p>
            <p>Score: <span className="font-mono bg-white/30 px-2 py-0.5 rounded">{score}</span></p>
            <p>Time: <span className="font-mono bg-white/30 px-2 py-0.5 rounded">{time}s</span></p>
          </div>
        </header>

        {/* Game Board - Flexible, centered, with calculated sizing */}
        <div className="flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden px-4 py-2">
          <div 
            className="grid grid-cols-4"
            style={{
              gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
              width: 'min(calc(100vw - 2rem), calc(100vh - 12rem))',
              maxWidth: '100%',
              aspectRatio: '1'
            }}
          >
            {cards.map((card) => {
              const isFlipping = flippingCards.has(card.id);
              const showFront = card.flipped || card.matched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleFlip(card)}
                  className={`aspect-square rounded-xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden ${
                    isFlipping ? 'flip-animation' : ''
                  }`}
                  style={{
                    background: showFront
                      ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    border: card.matched ? '3px solid #10b981' : '3px solid transparent',
                    boxShadow: card.matched 
                      ? '0 10px 25px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.3)'
                      : '0 8px 20px rgba(0, 0, 0, 0.3)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {!showFront && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  )}
                  <div 
                    className="absolute inset-0 flex items-center justify-center select-none"
                    style={{
                      fontSize: 'clamp(1.25rem, 3.5vw, 2rem)',
                      color: showFront ? '#1f2937' : '#ffffff',
                      textShadow: showFront ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {showFront ? card.icon : "?"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer - Fixed height */}
        <footer className="flex items-center justify-center flex-shrink-0 px-4 pt-2 pb-3">
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                boxShadow: '0 8px 20px rgba(245, 87, 108, 0.4)'
              }}
            >
              🔄 Restart
            </button>
            <button
              onClick={handleShuffle}
              disabled={isAnimating}
              className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                boxShadow: '0 8px 20px rgba(79, 172, 254, 0.4)'
              }}
            >
              🔀 Shuffle
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

