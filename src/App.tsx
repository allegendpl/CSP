import { useState } from 'react'

type Card = {
  rank: string
  value: number
}

function getCardValue(rank: string): number {
  if (rank === 'A') return 11
  if (['K', 'Q', 'J'].includes(rank)) return 10
  return parseInt(rank)
}

function getHandValue(hand: Card[]): number {
  let total = 0
  let aces = 0

  for (const card of hand) {
    total += card.value
    if (card.rank === 'A') aces++
  }

  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }

  return total
}

function getDecision(total: number): string {
  if (total > 21) return 'BUST'
  if (total < 15) return 'HIT'
  return 'STAND'
}

function App() {
  const [playerCards, setPlayerCards] = useState<Card[]>([])
  const [dealerCard, setDealerCard] = useState<Card | null>(null)
  const [playerTotal, setPlayerTotal] = useState(0)
  const [decision, setDecision] = useState('')
  const [yourMoney, setYourMoney] = useState(100)
  const [buyIn, setBuyIn] = useState(100)
  const [otherBets, setOtherBets] = useState<string>('')
  const [suggestedBet, setSuggestedBet] = useState(0)
  const [betAmount, setBetAmount] = useState('')

  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

  function addCard(rank: string) {
    const card: Card = {
      rank,
      value: getCardValue(rank)
    }
    const newCards = [...playerCards, card]
    setPlayerCards(newCards)
    const total = getHandValue(newCards)
    setPlayerTotal(total)
    setDecision('')
  }

  function setDealer(rank: string) {
    setDealerCard({
      rank,
      value: getCardValue(rank)
    })
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

  function updateMoney(amount: number) {
    setYourMoney(yourMoney + amount)
  }

  function clearHand() {
    setPlayerCards([])
    setPlayerTotal(0)
    setDecision('')
    setDealerCard(null)
    setBetAmount('')
  }

  function resetAll() {
    clearHand()
    setYourMoney(100)
    setBuyIn(100)
    setOtherBets('')
    setSuggestedBet(0)
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Blackjack Helper</h1>

      {/* Money Tracker */}
      <div style={{
        border: '1px solid #ccc',
        padding: '15px',
        marginBottom: '20px',
        background: '#f5f5f5'
      }}>
        <h3 style={{ marginTop: 0 }}>Your Money</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <div>
            <strong>Current:</strong> ${yourMoney}
          </div>
          <div>
            <strong>Buy-in:</strong> ${buyIn}
          </div>
          <div>
            <strong>Profit:</strong> <span style={{ color: yourMoney >= buyIn ? 'green' : 'red' }}>
              {yourMoney - buyIn >= 0 ? '+' : ''}{yourMoney - buyIn}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="Amount"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            style={{ width: '100px', padding: '5px' }}
          />
          <button onClick={() => updateMoney(parseInt(betAmount) || 0)}>
            Won
          </button>
          <button onClick={() => updateMoney(-(parseInt(betAmount) || 0))}>
            Lost
          </button>
          <button onClick={() => { setBuyIn(buyIn + 50); setYourMoney(yourMoney + 50) }}>
            Add $50
          </button>
        </div>
      </div>

      {/* Bet Calculator */}
      <div style={{
        border: '1px solid #ccc',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Bet Suggestion</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Enter other players' bets separated by commas (example: 10, 15, 5)
        </p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="10, 15, 5"
            value={otherBets}
            onChange={(e) => setOtherBets(e.target.value)}
            style={{ width: '200px', padding: '5px' }}
          />
          <button onClick={calculateBet}>Calculate</button>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            Suggested: ${suggestedBet}
          </span>
        </div>
      </div>

      {/* Dealer Card */}
      <div style={{
        border: '1px solid #ccc',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Dealer's Up Card</h3>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {ranks.map(r => (
            <button
              key={r}
              onClick={() => setDealer(r)}
              style={{
                padding: '10px 15px',
                background: dealerCard?.rank === r ? '#ddd' : '#fff',
                border: '1px solid #999'
              }}
            >
              {r}
            </button>
          ))}
        </div>
        {dealerCard && (
          <p style={{ marginTop: '10px' }}>
            <strong>Dealer shows: {dealerCard.rank} ({dealerCard.value})</strong>
          </p>
        )}
      </div>

      {/* Player Cards */}
      <div style={{
        border: '1px solid #ccc',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Your Cards</h3>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {ranks.map(r => (
            <button
              key={r}
              onClick={() => addCard(r)}
              style={{
                padding: '10px 15px',
                background: '#fff',
                border: '1px solid #999'
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {playerCards.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <p><strong>Card:</strong> {playerCards.map(c => c.rank).join(', ')}</p>
            <p><strong>Total:</strong> {playerTotal}</p>
            {playerTotal > 21 && <p style={{ color: 'red' }}>BUST!</p>}
          </div>
        )}
      </div>

      {/* Decision */}
      <div style={{
        border: '1px solid #ccc',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setDecision(getDecision(playerTotal))}
          disabled={playerCards.length === 0}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            background: '#000',
            color: '#fff',
            border: 'none'
          }}
        >
          What Should I Do?
        </button>

        {decision && (
          <div style={{
            marginTop: '15px',
            fontSize: '36px',
            fontWeight: 'bold',
            color: decision === 'HIT' ? '#000' : '#666'
          }}>
            {decision}
          </div>
        )}
      </div>

      {/* Clear Button */}
      <button
        onClick={clearHand}
        style={{
          padding: '10px 20px',
          background: '#eee',
          border: '1px solid #999'
        }}
      >
        Clear Hand
      </button>

      <button
        onClick={resetAll}
        style={{
          marginLeft: '10px',
          padding: '10px 20px',
          background: '#eee',
          border: '1px solid #999'
        }}
      >
        Reset All
      </button>

      {/* Instructions */}
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h3>Instructions</h3>
        <p>1. Enter other players' bets to get a suggested bet</p>
        <p>2. Click on dealer's up card</p>
        <p>3. Click on your cards (click multiple for each card)</p>
        <p>4. Click "What Should I Do?" to see the play</p>
        <p>5. Hit on anything under 15, Stand on 15+</p>
      </div>
    </div>
  )
}

export default App
