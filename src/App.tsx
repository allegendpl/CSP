import { useState } from 'react'

type Card = {
  rank: string
  value: number
  suit: string
}

type Player = {
  name: string
  chips: number
  bet: number
  hands: Card[][]
  currentHandIndex: number
  status: string
  isDealer: boolean
}

const suits = ['♠', '♥', '♦', '♣']
const allRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const suitColors: { [key: string]: string } = {
  '♠': '#1a1a2e',
  '♥': '#c41e3a',
  '♦': '#c41e3a',
  '♣': '#1a1a2e'
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

function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && getHandValue(hand) === 21
}

function isSoft(hand: Card[]): boolean {
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

  return aces > 0 && total <= 21
}

function getDecision(playerHand: Card[], dealerUpCard: Card, canDouble: boolean, canSplit: boolean): string {
  const playerTotal = getHandValue(playerHand)
  const dealerValue = dealerUpCard.value
  const soft = isSoft(playerHand)

  if (playerTotal > 21) return 'BUST'

  if (canSplit && playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank) {
    const pairRank = playerHand[0].rank

    if (pairRank === 'A' || pairRank === '8') return 'SPLIT'
    if (pairRank === '9') {
      if (dealerValue === 7 || dealerValue >= 10) return 'STAND'
      return 'SPLIT'
    }
    if (pairRank === '7' || pairRank === '6' || pairRank === '3' || pairRank === '2') {
      if (dealerValue <= 7) return 'SPLIT'
    }
    if (pairRank === '4' && (dealerValue === 5 || dealerValue === 6)) return 'SPLIT'
  }

  if (soft) {
    if (playerTotal >= 19) return 'STAND'
    if (playerTotal === 18) {
      if (dealerValue >= 9) return 'HIT'
      if (dealerValue === 2 || dealerValue >= 7) return 'STAND'
      if (canDouble && dealerValue >= 3 && dealerValue <= 6) return 'DOUBLE'
      return 'STAND'
    }
    if (playerTotal <= 17) {
      if (canDouble && dealerValue >= 3 && dealerValue <= 6) return 'DOUBLE'
      return 'HIT'
    }
    return 'HIT'
  }

  if (playerTotal >= 17) return 'STAND'
  if (playerTotal >= 13 && playerTotal <= 16) {
    return dealerValue <= 6 ? 'STAND' : 'HIT'
  }
  if (playerTotal === 12) {
    return (dealerValue >= 4 && dealerValue <= 6) ? 'STAND' : 'HIT'
  }
  if (playerTotal === 11) {
    return canDouble ? 'DOUBLE' : 'HIT'
  }
  if (playerTotal === 10) {
    return (canDouble && dealerValue <= 9) ? 'DOUBLE' : 'HIT'
  }
  if (playerTotal === 9) {
    return (canDouble && dealerValue >= 3 && dealerValue <= 6) ? 'DOUBLE' : 'HIT'
  }

  return 'HIT'
}

function PlayingCard({ card }: { card: Card }) {
  const color = suitColors[card.suit]

  return (
    <div style={{
      width: '70px',
      height: '100px',
      background: 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
      borderRadius: '8px',
      border: '2px solid #888',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '5px',
        left: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: color
      }}>
        {card.rank}
      </div>
      <div style={{
        fontSize: '32px',
        color: color,
        marginTop: '10px'
      }}>
        {card.suit}
      </div>
      <div style={{
        position: 'absolute',
        bottom: '5px',
        right: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: color,
        transform: 'rotate(180deg)'
      }}>
        {card.rank}
      </div>
    </div>
  )
}

function HiddenCard() {
  return (
    <div style={{
      width: '70px',
      height: '100px',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
      borderRadius: '8px',
      border: '2px solid #2d5a87',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      color: '#3d7ab5'
    }}>
      ?
    </div>
  )
}

function App() {
  const [numPlayers, setNumPlayers] = useState(8)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(-1)
  const [phase, setPhase] = useState<'setup' | 'betting' | 'dealing' | 'playing' | 'dealer' | 'result'>('setup')
  const [decision, setDecision] = useState<string>('')
  const [handNumber, setHandNumber] = useState(0)

  // Track dealer's hole card separately
  const [dealerHoleCard, setDealerHoleCard] = useState<Card | null>(null)

  // Dealer result value
  const [dealerFinalValue, setDealerFinalValue] = useState(0)

  function initPlayers() {
    const newPlayers: Player[] = []
    for (let i = 0; i < numPlayers; i++) {
      const isDealer = i === numPlayers - 1
      newPlayers.push({
        name: isDealer ? 'Dealer' : `Player ${i + 1}`,
        chips: isDealer ? 0 : 25,
        bet: 0,
        hands: [[]],
        currentHandIndex: 0,
        status: isDealer ? 'waiting' : 'betting',
        isDealer: isDealer
      })
    }
    setPlayers(newPlayers)
    setPhase('betting')
    setHandNumber(1)
    setCurrentPlayerIndex(-1)
    setDecision('')
    setDealerHoleCard(null)
    setDealerFinalValue(0)
  }

  function startNewHand() {
    const activePlayers = players.filter(p => !p.isDealer && p.chips > 0)
    if (activePlayers.length === 0) {
      alert('All players are out of chips! Game Over.')
      setPhase('setup')
      return
    }

    const newPlayers = players.map(p => ({
      ...p,
      bet: 0,
      hands: [[]],
      currentHandIndex: 0,
      status: p.isDealer ? 'waiting' : (p.chips > 0 ? 'betting' : 'out')
    }))

    setPlayers(newPlayers)
    setPhase('betting')
    setCurrentPlayerIndex(-1)
    setDecision('')
    setHandNumber(h => h + 1)
    setDealerHoleCard(null)
    setDealerFinalValue(0)
  }

  function placeBet(playerIndex: number, betAmount: number) {
    const newPlayers = [...players]
    if (betAmount > 0 && betAmount <= newPlayers[playerIndex].chips) {
      newPlayers[playerIndex].chips -= betAmount
      newPlayers[playerIndex].bet = betAmount
      newPlayers[playerIndex].status = 'ready'
      setPlayers(newPlayers)
    }
  }

  function startPlaying() {
    const newPlayers = [...players]
    for (const player of newPlayers) {
      if (!player.isDealer && player.status === 'ready') {
        player.status = 'playing'
      }
    }

    setPlayers(newPlayers)
    setPhase('playing')

    const firstPlayer = newPlayers.findIndex(p => !p.isDealer && p.status === 'playing')
    setCurrentPlayerIndex(firstPlayer)
  }

  function addCardToPlayer(playerIndex: number, rank: string, suit: string) {
    const newPlayers = [...players]
    const card: Card = {
      rank,
      suit,
      value: getCardValue(rank)
    }

    const player = newPlayers[playerIndex]
    const handIndex = player.currentHandIndex
    player.hands[handIndex].push(card)

    const handValue = getHandValue(player.hands[handIndex])
    if (handValue > 21) {
      player.status = 'bust'
    }

    setPlayers(newPlayers)
    setDecision('')
  }

  function removeLastCardFromPlayer(playerIndex: number) {
    const newPlayers = [...players]
    const player = newPlayers[playerIndex]
    const handIndex = player.currentHandIndex

    if (player.hands[handIndex].length > 0) {
      player.hands[handIndex].pop()
      if (player.status === 'bust') {
        player.status = 'playing'
      }
    }

    setPlayers(newPlayers)
    setDecision('')
  }

  function setDealerUpCard(rank: string, suit: string) {
    const card: Card = {
      rank,
      suit,
      value: getCardValue(rank)
    }

    const newPlayers = [...players]
    const dealerIndex = newPlayers.findIndex(p => p.isDealer)
    newPlayers[dealerIndex].hands[0] = [card]
    setPlayers(newPlayers)
  }

  function setDealerHoleCardManual(rank: string, suit: string) {
    const card: Card = {
      rank,
      suit,
      value: getCardValue(rank)
    }
    setDealerHoleCard(card)
  }

  function setDealerFinalTotal(value: number) {
    setDealerFinalValue(value)
  }

  function getCurrentPlayer(): Player | null {
    if (currentPlayerIndex < 0 || currentPlayerIndex >= players.length) return null
    return players[currentPlayerIndex]
  }

  function getDealerUpCard(): Card | null {
    const dealer = players.find(p => p.isDealer)
    if (dealer && dealer.hands[0].length > 0) {
      return dealer.hands[0][0]
    }
    return null
  }

  function calculateDecision(): string {
    const player = getCurrentPlayer()
    const dealerUpCard = getDealerUpCard()

    if (!player || !dealerUpCard) return 'SELECT DEALER CARD FIRST'

    const hand = player.hands[player.currentHandIndex]
    if (hand.length === 0) return 'SELECT YOUR CARDS'

    const canDouble = hand.length === 2 && player.chips >= player.bet
    const canSplit = hand.length === 2 && hand[0].rank === hand[1].rank && player.chips >= player.bet

    return getDecision(hand, dealerUpCard, canDouble, canSplit)
  }

  function doHit() {
    setDecision('')
    // Player adds more cards manually
  }

  function doStand() {
    const newPlayers = [...players]
    const player = newPlayers[currentPlayerIndex]
    player.status = 'stand'

    setPlayers(newPlayers)
    moveToNextPlayer()
  }

  function doDouble() {
    const newPlayers = [...players]
    const player = newPlayers[currentPlayerIndex]

    if (player.chips >= player.bet) {
      player.chips -= player.bet
      player.bet *= 2
      player.status = 'stand'

      setPlayers(newPlayers)
      moveToNextPlayer()
    }
  }

  function doSplit() {
    const newPlayers = [...players]
    const player = newPlayers[currentPlayerIndex]

    if (player.chips >= player.bet && player.hands[0].length === 2) {
      player.chips -= player.bet

      const card1 = player.hands[0][0]
      const card2 = player.hands[0][1]

      player.hands = [
        [card1],
        [card2]
      ]
      player.currentHandIndex = 0

      setPlayers(newPlayers)
      setDecision('')
    }
  }

  function doSurrender() {
    const newPlayers = [...players]
    const player = newPlayers[currentPlayerIndex]
    player.chips += Math.floor(player.bet / 2)
    player.status = 'surrender'

    setPlayers(newPlayers)
    moveToNextPlayer()
  }

  function moveToNextPlayer() {
    setDecision('')
    setPlayers([...players])

    setTimeout(() => {
      const activePlayers = players.filter(p => !p.isDealer && p.status === 'playing')

      if (activePlayers.length === 0) {
        setPhase('dealer')
      }
    }, 100)
  }

  function finishHand() {
    setPhase('dealer')
  }

  function setResults() {
    const dealerValue = dealerFinalValue
    const dealerBust = dealerValue > 21

    const newPlayers = [...players]

    for (let i = 0; i < newPlayers.length; i++) {
      const player = newPlayers[i]
      if (player.isDealer || player.status === 'out') continue

      if (player.status === 'surrender') continue

      const playerValue = getHandValue(player.hands[0])
      const playerBust = playerValue > 21
      const playerBlackjack = isBlackjack(player.hands[0])

      if (playerBust) {
        player.status = 'lost'
      } else if (dealerBust) {
        const winAmount = playerBlackjack ? Math.floor(player.bet * 1.5) + player.bet : player.bet * 2
        player.chips += winAmount
        player.status = playerBlackjack ? 'blackjack' : 'won'
      } else if (playerBlackjack && dealerValue !== 21) {
        player.chips += Math.floor(player.bet * 1.5) + player.bet
        player.status = 'blackjack'
      } else if (playerValue > dealerValue) {
        player.chips += player.bet * 2
        player.status = 'won'
      } else if (playerValue === dealerValue) {
        player.chips += player.bet
        player.status = 'push'
      } else {
        player.status = 'lost'
      }
    }

    setPlayers(newPlayers)
    setPhase('result')
  }

  const currentPlayer = getCurrentPlayer()
  const dealer = players.find(p => p.isDealer)
  const dealerUpCard = getDealerUpCard()

  const actionButtonStyle = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    margin: '5px'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d4f3c 0%, #052e23 100%)',
      padding: '20px',
      fontFamily: 'Georgia, serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: '#ffd700',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          <h1 style={{ fontSize: '48px', margin: 0 }}>Blackjack Strategy Helper</h1>
          <p style={{ fontSize: '20px', margin: '10px 0 0 0', color: '#a0d9c4' }}>
            Hand #{handNumber || 1}
          </p>
        </div>

        {/* Setup Phase */}
        {phase === 'setup' && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '50px auto'
          }}>
            <h2 style={{ color: '#ffd700', marginBottom: '20px' }}>Setup Game</h2>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ color: '#fff', fontSize: '18px', marginRight: '15px' }}>
                Players:
              </label>
              <select
                value={numPlayers}
                onChange={(e) => setNumPlayers(parseInt(e.target.value))}
                style={{
                  padding: '10px 20px',
                  fontSize: '18px',
                  borderRadius: '6px',
                  border: '2px solid #ffd700',
                  background: '#052e23',
                  color: '#fff'
                }}
              >
                {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <option key={n} value={n}>{n - 1} players + dealer</option>
                ))}
              </select>
            </div>
            <button
              onClick={initPlayers}
              style={{
                ...actionButtonStyle,
                background: 'linear-gradient(180deg, #ffd700 0%, #ffaa00 100%)',
                color: '#052e23',
                fontSize: '20px',
                padding: '15px 50px'
              }}
            >
              Start Game
            </button>
          </div>
        )}

        {/* Betting Phase */}
        {phase === 'betting' && (
          <div>
            <h2 style={{ color: '#ffd700', textAlign: 'center', marginBottom: '20px' }}>
              Place Your Bets
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px',
              marginBottom: '30px'
            }}>
              {players.filter(p => !p.isDealer).map((player, idx) => {
                const realIndex = players.findIndex(p => p.name === player.name)
                return (
                  <div key={idx} style={{
                    background: player.status === 'out' ? '#444' : 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '20px',
                    border: player.status === 'ready' ? '3px solid #4caf50' : '2px solid #052e23'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px'
                    }}>
                      <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '20px' }}>
                        {player.name}
                      </span>
                      <span style={{ color: '#4caf50', fontSize: '18px' }}>
                        ${player.chips}
                      </span>
                    </div>
                    {player.status === 'betting' && (
                      <div style={{ marginTop: '15px' }}>
                        <input
                          type="number"
                          id={`bet-${realIndex}`}
                          min="1"
                          max={player.chips}
                          defaultValue="5"
                          style={{
                            width: '80px',
                            padding: '8px',
                            fontSize: '16px',
                            borderRadius: '4px',
                            border: '2px solid #ffd700',
                            background: '#fff',
                            color: '#000'
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`bet-${realIndex}`) as HTMLInputElement
                            placeBet(realIndex, parseInt(input.value) || 1)
                          }}
                          style={{
                            ...actionButtonStyle,
                            background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
                            color: '#fff',
                            marginLeft: '10px'
                          }}
                        >
                          Bet
                        </button>
                      </div>
                    )}
                    {player.status === 'ready' && (
                      <div style={{ color: '#4caf50', marginTop: '10px', fontWeight: 'bold' }}>
                        Bet: ${player.bet} - Ready!
                      </div>
                    )}
                    {player.status === 'out' && (
                      <div style={{ color: '#999', marginTop: '10px' }}>
                        Out of chips
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={startPlaying}
                disabled={!players.some(p => !p.isDealer && p.status === 'ready')}
                style={{
                  ...actionButtonStyle,
                  background: players.some(p => !p.isDealer && p.status === 'ready')
                    ? 'linear-gradient(180deg, #ffd700 0%, #ffaa00 100%)'
                    : '#555',
                  color: '#052e23',
                  fontSize: '20px',
                  padding: '15px 40px',
                  cursor: players.some(p => !p.isDealer && p.status === 'ready') ? 'pointer' : 'not-allowed'
                }}
              >
                Start Playing
              </button>
            </div>
          </div>
        )}

        {/* Playing Phase */}
        {phase === 'playing' && (
          <div>
            {/* Dealer Up Card Selection */}
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '20px',
              border: '3px solid #8b4513'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h2 style={{ color: '#ffd700', margin: 0 }}>Dealer's Up Card</h2>
                {dealerUpCard && (
                  <span style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                    {getHandValue([dealerUpCard])}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#fff', marginRight: '10px' }}>Card:</label>
                <select
                  id="dealer-rank"
                  style={{
                    padding: '8px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '2px solid #ffd700',
                    background: '#fff',
                    color: '#000',
                    marginRight: '10px'
                  }}
                >
                  {allRanks.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <label style={{ color: '#fff', marginRight: '10px' }}>Suit:</label>
                <select
                  id="dealer-suit"
                  style={{
                    padding: '8px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '2px solid #ffd700',
                    background: '#fff',
                    color: '#000'
                  }}
                >
                  {suits.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const rankSelect = document.getElementById('dealer-rank') as HTMLSelectElement
                    const suitSelect = document.getElementById('dealer-suit') as HTMLSelectElement
                    setDealerUpCard(rankSelect.value, suitSelect.value)
                  }}
                  style={{
                    ...actionButtonStyle,
                    background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
                    color: '#fff',
                    marginLeft: '10px'
                  }}
                >
                  Set
                </button>
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {dealer && dealer.hands[0].map((card, idx) => (
                  <PlayingCard key={idx} card={card} />
                ))}
              </div>
            </div>

            {/* Current Player Cards */}
            {currentPlayer && (
              <div style={{
                background: 'rgba(139,69,19,0.5)',
                borderRadius: '15px',
                padding: '25px',
                marginBottom: '20px',
                border: '4px solid #ffd700',
                boxShadow: '0 0 20px rgba(255,215,0,0.5)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '15px'
                }}>
                  <h2 style={{ color: '#ffd700', margin: 0 }}>
                    {currentPlayer.name}
                  </h2>
                  <span style={{ color: '#4caf50', fontSize: '24px' }}>
                    ${currentPlayer.chips} | Bet: ${currentPlayer.bet}
                  </span>
                </div>

                {/* Card Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ color: '#fff', marginRight: '10px' }}>Add Card:</label>
                  <select
                    id={`player-rank-${currentPlayerIndex}`}
                    style={{
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '2px solid #ffd700',
                      background: '#fff',
                      color: '#000',
                      marginRight: '10px'
                    }}
                  >
                    {allRanks.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <select
                    id={`player-suit-${currentPlayerIndex}`}
                    style={{
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '2px solid #ffd700',
                      background: '#fff',
                      color: '#000',
                      marginRight: '10px'
                    }}
                  >
                    {suits.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const rankSelect = document.getElementById(`player-rank-${currentPlayerIndex}`) as HTMLSelectElement
                      const suitSelect = document.getElementById(`player-suit-${currentPlayerIndex}`) as HTMLSelectElement
                      addCardToPlayer(currentPlayerIndex, rankSelect.value, suitSelect.value)
                    }}
                    style={{
                      ...actionButtonStyle,
                      background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
                      color: '#fff'
                    }}
                  >
                    Add Card
                  </button>
                  <button
                    onClick={() => removeLastCardFromPlayer(currentPlayerIndex)}
                    style={{
                      ...actionButtonStyle,
                      background: 'linear-gradient(180deg, #f44336 0%, #c62828 100%)',
                      color: '#fff'
                    }}
                  >
                    Undo
                  </button>
                </div>

                {/* Display Cards */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {currentPlayer.hands[0].map((card, idx) => (
                    <PlayingCard key={idx} card={card} />
                  ))}
                </div>

                {/* Hand Value */}
                {currentPlayer.hands[0].length > 0 && (
                  <div style={{
                    color: getHandValue(currentPlayer.hands[0]) > 21 ? '#ff6b6b' : '#fff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '15px'
                  }}>
                    Total: {getHandValue(currentPlayer.hands[0])}
                    {isSoft(currentPlayer.hands[0]) && getHandValue(currentPlayer.hands[0]) <= 21 && ' (soft)'}
                    {getHandValue(currentPlayer.hands[0]) > 21 && ' BUST'}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ marginBottom: '15px' }}>
                  <button
                    onClick={() => setDecision(calculateDecision())}
                    style={{
                      ...actionButtonStyle,
                      background: 'linear-gradient(180deg, #9c27b0 0%, #6a1b9a 100%)',
                      color: '#fff',
                      fontSize: '18px'
                    }}
                  >
                    Get Decision
                  </button>

                  {decision && (
                    <span style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      marginLeft: '20px',
                      color: decision === 'HIT' ? '#4caf50' :
                             decision === 'STAND' ? '#2196f3' :
                             decision === 'DOUBLE' ? '#ff9800' :
                             decision === 'SPLIT' ? '#9c27b0' :
                             '#ff6b6b',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {decision}
                    </span>
                  )}
                </div>

                <div>
                  <button
                    onClick={doHit}
                    style={{
                      ...actionButtonStyle,
                      background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
                      color: '#fff'
                    }}
                  >
                    HIT (Add Another Card)
                  </button>
                  <button
                    onClick={doStand}
                    style={{
                      ...actionButtonStyle,
                      background: 'linear-gradient(180deg, #2196f3 0%, #1565c0 100%)',
                      color: '#fff'
                    }}
                  >
                    STAND
                  </button>
                  {currentPlayer.hands[0].length === 2 && currentPlayer.chips >= currentPlayer.bet && (
                    <>
                      <button
                        onClick={doDouble}
                        style={{
                          ...actionButtonStyle,
                          background: 'linear-gradient(180deg, #ff9800 0%, #e65100 100%)',
                          color: '#fff'
                        }}
                      >
                        DOUBLE
                      </button>
                      {currentPlayer.hands[0][0].rank === currentPlayer.hands[0][1].rank && (
                        <button
                          onClick={doSplit}
                          style={{
                            ...actionButtonStyle,
                            background: 'linear-gradient(180deg, #9c27b0 0%, #6a1b9a 100%)',
                            color: '#fff'
                          }}
                        >
                          SPLIT
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={doSurrender}
                    style={{
                      ...actionButtonStyle,
                      background: 'linear-gradient(180deg, #607d8b 0%, #37474f 100%)',
                      color: '#fff'
                    }}
                  >
                    SURRENDER
                  </button>
                </div>
              </div>
            )}

            {/* All Players Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              {players.filter(p => !p.isDealer).map((player, idx) => {
                const realIndex = players.findIndex(p => p.name === player.name)
                const isActive = currentPlayerIndex === realIndex
                const hasCards = player.hands[0].length > 0

                return (
                  <div key={idx} style={{
                    background: isActive ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '15px',
                    border: isActive ? '3px solid #ffd700' : '2px solid #052e23'
                  }}>
                    <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '5px' }}>
                      {player.name}
                    </div>
                    <div style={{ color: '#4caf50', fontSize: '14px' }}>
                      ${player.chips} chips | Bet: ${player.bet}
                    </div>
                    <div style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>
                      {hasCards ? `Cards: ${getHandValue(player.hands[0])}` : 'No cards yet'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Move to Dealer Button */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={finishHand}
                style={{
                  ...actionButtonStyle,
                  background: 'linear-gradient(180deg, #ffd700 0%, #ffaa00 100%)',
                  color: '#052e23',
                  fontSize: '18px'
                }}
              >
                Finish Player Turns - Dealer's Turn
              </button>
            </div>
          </div>
        )}

        {/* Dealer Phase - Select Hole Card and Final Value */}
        {phase === 'dealer' && (
          <div>
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '20px',
              border: '3px solid #ffd700'
            }}>
              <h2 style={{ color: '#ffd700', marginTop: 0 }}>Dealer's Turn</h2>

              {/* Dealer Up Card */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#fff', marginBottom: '10px', fontWeight: 'bold' }}>Up Card:</div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {dealerUpCard && <PlayingCard card={dealerUpCard} />}
                </div>
              </div>

              {/* Hole Card Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#fff', marginRight: '10px' }}>Hole Card:</label>
                <select
                  id="hole-rank"
                  style={{
                    padding: '8px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '2px solid #ffd700',
                    background: '#fff',
                    color: '#000',
                    marginRight: '10px'
                  }}
                >
                  {allRanks.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  id="hole-suit"
                  style={{
                    padding: '8px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '2px solid #ffd700',
                    background: '#fff',
                    color: '#000',
                    marginRight: '10px'
                  }}
                >
                  {suits.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const rankSelect = document.getElementById('hole-rank') as HTMLSelectElement
                    const suitSelect = document.getElementById('hole-suit') as HTMLSelectElement
                    setDealerHoleCardManual(rankSelect.value, suitSelect.value)
                  }}
                  style={{
                    ...actionButtonStyle,
                    background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
                    color: '#fff'
                  }}
                >
                  Set Hole Card
                </button>
              </div>

              {dealerHoleCard && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#fff', marginBottom: '10px' }}>Dealer's Hand:</div>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {dealerUpCard && <PlayingCard card={dealerUpCard} />}
                    <PlayingCard card={dealerHoleCard} />
                  </div>
                </div>
              )}

              {/* Dealer Final Total */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#fff', marginRight: '10px' }}>Dealer's Final Total:</label>
                <select
                  id="dealer-final"
                  style={{
                    padding: '8px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '2px solid #ffd700',
                    background: '#fff',
                    color: '#000',
                    marginRight: '10px'
                  }}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(v => (
                    <option key={v} value={v}>{v}{v > 21 ? ' (BUST)' : ''}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const select = document.getElementById('dealer-final') as HTMLSelectElement
                    setDealerFinalTotal(parseInt(select.value))
                  }}
                  style={{
                    ...actionButtonStyle,
                    background: 'linear-gradient(180deg, #ff9800 0%, #e65100 100%)',
                    color: '#fff'
                  }}
                >
                  Set Total
                </button>

                {dealerFinalValue > 0 && (
                  <span style={{
                    marginLeft: '15px',
                    color: dealerFinalValue > 21 ? '#ff6b6b' : '#fff',
                    fontSize: '28px',
                    fontWeight: 'bold'
                  }}>
                    {dealerFinalValue}{dealerFinalValue > 21 ? ' BUST' : ''}
                  </span>
                )}
              </div>

              <button
                onClick={setResults}
                disabled={dealerFinalValue === 0}
                style={{
                  ...actionButtonStyle,
                  background: dealerFinalValue > 0
                    ? 'linear-gradient(180deg, #ffd700 0%, #ffaa00 100%)'
                    : '#555',
                  color: '#052e23',
                  fontSize: '20px',
                  padding: '15px 40px',
                  cursor: dealerFinalValue > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Calculate Results
              </button>
            </div>

            {/* Players Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              {players.filter(p => !p.isDealer && p.status !== 'out').map((player, idx) => {
                const hasCards = player.hands[0].length > 0
                const isBust = hasCards && getHandValue(player.hands[0]) > 21

                return (
                  <div key={idx} style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '15px'
                  }}>
                    <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '5px' }}>
                      {player.name}
                    </div>
                    <div style={{ color: '#4caf50', fontSize: '14px', marginBottom: '10px' }}>
                      Bet: ${player.bet}
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {player.hands[0].map((card, cardIdx) => (
                        <PlayingCard key={cardIdx} card={card} />
                      ))}
                    </div>
                    <div style={{
                      color: isBust ? '#ff6b6b' : '#fff',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      marginTop: '10px'
                    }}>
                      {hasCards ? getHandValue(player.hands[0]) : 0}
                      {isBust && ' BUST'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Results Phase */}
        {phase === 'result' && (
          <div>
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h2 style={{ color: '#ffd700', marginTop: 0 }}>Results</h2>
              <div style={{ color: '#fff', fontSize: '24px', marginBottom: '10px' }}>
                Dealer: {dealerFinalValue}{dealerFinalValue > 21 ? ' (BUST)' : ''}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px',
              marginBottom: '30px'
            }}>
              {players.filter(p => !p.isDealer).map((player, idx) => {
                return (
                  <div key={idx} style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '20px'
                  }}>
                    <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '20px', marginBottom: '10px' }}>
                      {player.name}
                    </div>
                    <div style={{ color: '#4caf50', fontSize: '16px', marginBottom: '10px' }}>
                      Chips: ${player.chips} | Bet was: ${player.bet}
                    </div>

                    <div style={{
                      fontSize: '22px',
                      fontWeight: 'bold',
                      color: player.status === 'won' || player.status === 'blackjack' ? '#4caf50' :
                             player.status === 'push' ? '#ffd700' :
                             player.status === 'surrender' ? '#999' : '#ff6b6b'
                    }}>
                      {player.status === 'won' && `WON!`}
                      {player.status === 'blackjack' && `BLACKJACK!`}
                      {player.status === 'lost' && 'LOST'}
                      {player.status === 'push' && 'PUSH'}
                      {player.status === 'bust' && 'BUST'}
                      {player.status === 'surrender' && 'SURRENDERED'}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={startNewHand}
                style={{
                  ...actionButtonStyle,
                  background: 'linear-gradient(180deg, #ffd700 0%, #ffaa00 100%)',
                  color: '#052e23',
                  fontSize: '22px',
                  padding: '18px 50px'
                }}
              >
                Next Hand
              </button>
            </div>
          </div>
        )}

        {/* Rules */}
        <div style={{
          marginTop: '40px',
          padding: '25px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          color: '#a0d9c4'
        }}>
          <h3 style={{ color: '#ffd700', marginTop: 0 }}>How to Use</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            <p>1. Select dealer's visible card</p>
            <p>2. For each player, select the cards they were dealt</p>
            <p>3. Click "Get Decision" to see optimal play</p>
            <p>4. After all players finish, select dealer's hole card and final total</p>
            <p>5. Results show wins/losses for each player</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
