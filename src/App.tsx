import { useState } from 'react'

function getCardValue(rank: string): number {
  if (rank === 'A') return 11
  if (['K', 'Q', 'J'].includes(rank)) return 10
  return parseInt(rank)
}

function getHandValue(cards: string[]): number {
  let total = 0
  let aces = 0

  for (const rank of cards) {
    total += getCardValue(rank)
    if (rank === 'A') aces++
  }

  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }

  return total
}

function App() {
  const [playerCards, setPlayerCards] = useState<string[]>([])
  const [dealerUp, setDealerUp] = useState('')
  const [dealerHole, setDealerHole] = useState('')
  const [dealerCards, setDealerCards] = useState<string[]>([])
  const [yourMoney, setYourMoney] = useState(100)
  const [buyIn, setBuyIn] = useState(100)
  const [currentBet, setCurrentBet] = useState(0)
  const [otherBets, setOtherBets] = useState('')
  const [suggestedBet, setSuggestedBet] = useState(0)
  const [result, setResult] = useState('')
  const [showHole, setShowHole] = useState(false)

  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

  function addCard(rank: string) {
    if (result !== '') return
    const newCards = [...playerCards, rank]
    setPlayerCards(newCards)
  }

  function setDealerUpCard(rank: string) {
    setDealerUp(rank)
  }

  function setDealerHoleCard(rank: string) {
    setDealerHole(rank)
  }

  function calculateBet() {
    if (otherBets.trim() === '') {
      setSuggestedBet(5)
      return
    }

    const bets = otherBets.split(',').map(b => parseInt(b.trim())).filter(b => !isNaN(b))
    if (bets.length === 0) {
      setSuggestedBet(5)
      return
    }

    const avg = Math.round(bets.reduce((a, b) => a + b, 0) / bets.length)
    setSuggestedBet(avg)
  }

  function placeBet() {
    if (suggestedBet > 0 && suggestedBet <= yourMoney) {
      setCurrentBet(suggestedBet)
      setYourMoney(yourMoney - suggestedBet)
    }
  }

  function revealHole() {
    if (dealerHole === '') return
    const newDealerCards = [dealerUp, dealerHole]
    setDealerCards(newDealerCards)
    setShowHole(true)
  }

  function addDealerCard(rank: string) {
    const newCards = [...dealerCards, rank]
    setDealerCards(newCards)
  }

  function stand() {
    if (playerCards.length === 0) return
    revealHole()
  }

  function determineWinner() {
    const playerTotal = getHandValue(playerCards)
    const dealerTotal = getHandValue(dealerCards)

    if (playerTotal > 21) {
      setResult('LOSE - You busted!')
      return
    }

    if (dealerTotal > 21) {
      setResult('WIN - Dealer busted!')
      setYourMoney(yourMoney + currentBet * 2)
      return
    }

    if (playerTotal > dealerTotal) {
      setResult('WIN!')
      setYourMoney(yourMoney + currentBet * 2)
    } else if (playerTotal < dealerTotal) {
      setResult('LOSE')
    } else {
      setResult('PUSH')
      setYourMoney(yourMoney + currentBet)
    }
  }

  function newHand() {
    setPlayerCards([])
    setDealerUp('')
    setDealerHole('')
    setDealerCards([])
    setCurrentBet(0)
    setResult('')
    setShowHole(false)
    setOtherBets('')
    setSuggestedBet(0)
  }

  function resetAll() {
    newHand()
    setYourMoney(100)
    setBuyIn(100)
  }

  function addBuyIn() {
    setBuyIn(buyIn + 50)
    setYourMoney(yourMoney + 50)
  }

  const playerTotal = getHandValue(playerCards)
  const dealerTotal = dealerCards.length > 0 ? getHandValue(dealerCards) : getCardValue(dealerUp)

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Blackjack Helper</h1>

      {/* Money */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', background: '#f5f5f5' }}>
        <h3 style={{ marginTop: 0 }}>Your Money</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
          <div><strong>Current:</strong> ${yourMoney}</div>
          <div><strong>Buy-in:</strong> ${buyIn}</div>
          <div>
            <strong>Profit:</strong>{' '}
            <span style={{ color: yourMoney >= buyIn ? 'green' : 'red' }}>
              {yourMoney - buyIn >= 0 ? '+' : ''}{yourMoney - buyIn}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span>Current Bet: ${currentBet}</span>
        </div>
        <button onClick={addBuyIn} style={{ marginTop: '10px' }}>Add $50 Buy-in</button>
      </div>

      {/* Bet Calculator */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Bet Suggestion</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>Enter other players' bets (example: 10, 15, 5)</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="10, 15, 5"
            value={otherBets}
            onChange={(e) => setOtherBets(e.target.value)}
            style={{ width: '200px', padding: '5px' }}
          />
          <button onClick={calculateBet}>Calculate</button>
          <span>Suggested: ${suggestedBet}</span>
          {currentBet === 0 && suggestedBet > 0 && (
            <button onClick={placeBet}>Place Bet</button>
          )}
        </div>
      </div>

      {/* Dealer Cards */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Dealer Cards</h3>

        <div style={{ marginBottom: '10px' }}>
          <strong>Up Card:</strong>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
            {ranks.map(r => (
              <button
                key={r}
                onClick={() => setDealerUpCard(r)}
                style={{
                  padding: '8px 12px',
                  background: dealerUp === r ? '#ddd' : '#fff',
                  border: '1px solid #999'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Hole Card (hidden):</strong>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
            {ranks.map(r => (
              <button
                key={r}
                onClick={() => setDealerHoleCard(r)}
                style={{
                  padding: '8px 12px',
                  background: dealerHole === r ? '#ddd' : '#fff',
                  border: '1px solid #999'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {dealerCards.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <p><strong>Dealer Cards:</strong> {dealerCards.join(', ')}</p>
            <p><strong>Dealer Total:</strong> {getHandValue(dealerCards)}</p>
            {!showHole && <button onClick={revealHole}>Reveal Hole Card</button>}
          </div>
        )}

        {showHole && (
          <div style={{ marginTop: '10px' }}>
            <p><strong>Extra cards for dealer:</strong></p>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {ranks.map(r => (
                <button
                  key={r}
                  onClick={() => addDealerCard(r)}
                  style={{ padding: '8px 12px', background: '#fff', border: '1px solid #999' }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player Cards */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Your Cards</h3>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {ranks.map(r => (
            <button
              key={r}
              onClick={() => addCard(r)}
              disabled={result !== '' || playerTotal > 21}
              style={{
                padding: '10px 15px',
                background: '#fff',
                border: '1px solid #999',
                opacity: result !== '' || playerTotal > 21 ? 0.5 : 1
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {playerCards.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <p><strong>Your Cards:</strong> {playerCards.join(', ')}</p>
            <p><strong>Your Total:</strong> {playerTotal}</p>
            {playerTotal > 21 && <p style={{ color: 'red', fontWeight: 'bold' }}>BUST!</p>}
            {playerTotal === 21 && playerCards.length === 2 && (
              <p style={{ color: 'green', fontWeight: 'bold' }}>BLACKJACK!</p>
            )}
          </div>
        )}

        {playerCards.length > 0 && playerTotal <= 21 && result === '' && (
          <button onClick={stand} style={{ marginTop: '10px', padding: '10px 20px' }}>
            STAND
          </button>
        )}
      </div>

      {/* Result */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
        {showHole && result === '' && (
          <button onClick={determineWinner} style={{ padding: '15px 30px', fontSize: '18px' }}>
            Show Result
          </button>
        )}

        {result !== '' && (
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: result.includes('WIN') ? 'green' : result.includes('LOSE') ? 'red' : '#666' }}>
            {result}
          </div>
        )}
      </div>

      {/* New Hand */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={newHand} style={{ padding: '10px 20px', background: '#eee', border: '1px solid #999' }}>
          New Hand
        </button>
        <button onClick={resetAll} style={{ padding: '10px 20px', background: '#eee', border: '1px solid #999' }}>
          Reset All
        </button>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h3>How to Use</h3>
        <p>1. Enter other bets, click Calculate, then Place Bet</p>
        <p>2. Click dealer's up card and hole card</p>
        <p>3. Click your cards as you get them</p>
        <p>4. Click STAND when done</p>
        <p>5. Dealer hole card shows, add more dealer cards if needed</p>
        <p>6. Click Show Result to see who won</p>
        <p>7. Click New Hand to continue</p>
      </div>
    </div>
  )
}

export default App
