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
const suitColors: { [key: string]: string } = {
  '♠': '#1a1a2e',
  '♥': '#c41e3a',
  '♦': '#c41e3a',
  '♣': '#1a1a2e'
}

function createDeck(): Card[] {
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const deck: Card[] = []

  for (let d = 0; d < 2; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        let value = 0
        if (rank === 'A') value = 11
        else if (['K', 'Q', 'J'].includes(rank)) value = 10
        else value = parseInt(rank)

        deck.push({ rank, value, suit })
      }
    }
  }
  return deck
}

function shuffleDeck(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = deck[i]
    deck[i] = deck[j]
    deck[j] = temp
  }
  return deck
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

function PlayingCard({ card, hidden }: { card: Card; hidden?: boolean }) {
  if (hidden) {
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

function App() {
  const [numPlayers, setNumPlayers] = useState(8)
  const [players, setPlayers] = useState<Player[]>([])
  const [deck, setDeck] = useState<Card[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(-1)
  const [phase, setPhase] = useState<'setup' | 'betting' | 'dealing' | 'playing' | 'dealer' | 'result'>('setup')
  const [decision, setDecision] = useState<string>('')
  const [handNumber, setHandNumber] = useState(0)

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
    setDeck(shuffleDeck(createDeck()))
    setPhase('betting')
    setHandNumber(1)
    setCurrentPlayerIndex(-1)
    setDecision('')
  }

  function startNewHand() {
    const activePlayers = players.filter(p => !p.isDealer && p.chips > 0)
    if (activePlayers.length === 0) {
      alert('All players are out of chips! Game Over.')
      setPhase('setup')
      return
    }

    const newDeck = deck.length < 20 ? shuffleDeck(createDeck()) : deck
    const newPlayers = players.map(p => ({
      ...p,
      bet: 0,
      hands: [[]],
      currentHandIndex: 0,
      status: p.isDealer ? 'waiting' : (p.chips > 0 ? 'betting' : 'out')
    }))

    setPlayers(newPlayers)
    setDeck(newDeck)
    setPhase('betting')
    setCurrentPlayerIndex(-1)
    setDecision('')
    setHandNumber(h => h + 1)
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

  function dealCards() {
    let currentDeck = deck.length < 20 ? shuffleDeck(createDeck()) : [...deck]
    const newPlayers = [...players]

    for (let round = 0; round < 2; round++) {
      for (const player of newPlayers) {
        if (player.status === 'ready' || player.isDealer) {
          if (currentDeck.length === 0) currentDeck = shuffleDeck(createDeck())
          player.hands[0].push(currentDeck.pop()!)
        }
      }
    }

    for (const player of newPlayers) {
      if (player.isDealer) {
        player.status = 'waiting'
      } else if (player.status === 'ready') {
        player.status = 'playing'
      }
    }

    setDeck(currentDeck)
    setPlayers(newPlayers)
    setPhase('playing')

    const firstPlayer = newPlayers.findIndex(p => !p.isDealer && p.status === 'playing')
    setCurrentPlayerIndex(firstPlayer)
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

    if (!player || !dealerUpCard) return 'NO DEALER CARD'

    const hand = player.hands[player.currentHandIndex]
    const canDouble = hand.length === 2 && player.chips >= player.bet
    const canSplit = hand.length === 2 && hand[0].rank === hand[1].rank && player.chips >= player.bet

    return getDecision(hand, dealerUpCard, canDouble, canSplit)
  }

  function doHit() {
    const newPlayers = [...players]
    let currentDeck = deck.length === 0 ? shuffleDeck(createDeck()) : [...deck]
    const player = newPlayers[currentPlayerIndex]

    if (currentDeck.length === 0) currentDeck = shuffleDeck(createDeck())
    player.hands[player.currentHandIndex].push(currentDeck.pop()!)

    const handValue = getHandValue(player.hands[player.currentHandIndex])
    if (handValue > 21) {
      player.status = 'bust'
      setDeck(currentDeck)
      setPlayers(newPlayers)
      moveToNextPlayer()
    } else {
      setDeck(currentDeck)
      setPlayers(newPlayers)
      setDecision('')
    }
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
    let currentDeck = deck.length === 0 ? shuffleDeck(createDeck()) : [...deck]
    const player = newPlayers[currentPlayerIndex]

    if (player.chips >= player.bet) {
      player.chips -= player.bet
      player.bet *= 2
      player.hands[player.currentHandIndex].push(currentDeck.pop()!)

      const handValue = getHandValue(player.hands[player.currentHandIndex])
      player.status = handValue > 21 ? 'bust' : 'stand'

      setDeck(currentDeck)
      setPlayers(newPlayers)
      moveToNextPlayer()
    }
  }

  function doSplit() {
    const newPlayers = [...players]
    let currentDeck = deck.length === 0 ? shuffleDeck(createDeck()) : [...deck]
    const player = newPlayers[currentPlayerIndex]

    if (player.chips >= player.bet && player.hands[0].length === 2) {
      player.chips -= player.bet

      const card1 = player.hands[0][0]
      const card2 = player.hands[0][1]

      if (currentDeck.length < 2) currentDeck = shuffleDeck(createDeck())

      player.hands = [
        [card1, currentDeck.pop()!],
        [card2, currentDeck.pop()!]
      ]
      player.currentHandIndex = 0

      setDeck(currentDeck)
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
      const nextIndex = players.findIndex((p, i) =>
        i > currentPlayerIndex && !p.isDealer && (p.status === 'playing' || p.status === 'playing')
      )

      if (nextIndex >= 0) {
        setCurrentPlayerIndex(nextIndex)
      } else {
        dealerPlay()
      }
    }, 300)
  }

  function dealerPlay() {
    setPhase('dealer')

    const activePlayers = players.filter(p => !p.isDealer && (p.status === 'stand' || p.status === 'playing'))

    if (activePlayers.length === 0) {
      setResults()
      return
    }

    let currentDeck = deck.length === 0 ? shuffleDeck(createDeck()) : [...deck]
    const newPlayers = [...players]
    const dealerIndex = newPlayers.findIndex(p => p.isDealer)

    while (getHandValue(newPlayers[dealerIndex].hands[0]) < 17) {
      if (currentDeck.length === 0) currentDeck = shuffleDeck(createDeck())
      newPlayers[dealerIndex].hands[0].push(currentDeck.pop()!)
    }

    const dealerValue = getHandValue(newPlayers[dealerIndex].hands[0])
    newPlayers[dealerIndex].status = dealerValue > 21 ? 'bust' : 'stand'

    setDeck(currentDeck)
    setPlayers(newPlayers)

    setTimeout(() => setResults(), 800)
  }

  function setResults() {
    const dealer = players.find(p => p.isDealer)!
    const dealerValue = getHandValue(dealer.hands[0])
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
      } else if (playerBlackjack && !isBlackjack(dealer.hands[0])) {
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
          <h1 style={{ fontSize: '48px', margin: 0 }}>Blackjack</h1>
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
                onClick={dealCards}
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
                Deal Cards
              </button>
            </div>
          </div>
        )}

        {/* Playing/Dealer/Result Phase */}
        {(phase === 'playing' || phase === 'dealer' || phase === 'result') && (
          <div>
            {/* Dealer Section */}
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '30px',
              border: '3px solid #8b4513'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h2 style={{ color: '#ffd700', margin: 0 }}>Dealer</h2>
                {dealer && dealer.hands[0].length > 0 && (
                  <span style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                    {phase === 'playing' ? '?' : getHandValue(dealer.hands[0])}
                    {phase !== 'playing' && dealer.hands[0].length > 0 && isSoft(dealer.hands[0]) && ' (soft)'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {dealer && dealer.hands[0].slice(0, phase !== 'playing' ? undefined : 1).map((card, idx) => (
                  <PlayingCard key={idx} card={card} />
                ))}
                {phase === 'playing' && dealer && dealer.hands[0].length > 1 && (
                  <PlayingCard card={dealer.hands[0][1]} hidden={true} />
                )}
                {phase !== 'playing' && dealer && dealer.hands[0].slice(1).map((card, idx) => (
                  <PlayingCard key={idx + 1} card={card} />
                ))}
              </div>
            </div>

            {/* Players Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {players.filter(p => !p.isDealer).map((player, idx) => {
                const realIndex = players.findIndex(p => p.name === player.name)
                const isActive = currentPlayerIndex === realIndex
                const isBust = player.hands[0].length > 0 && getHandValue(player.hands[0]) > 21

                return (
                  <div key={idx} style={{
                    background: isActive ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '15px',
                    padding: '20px',
                    border: isActive ? '4px solid #ffd700' : '2px solid #052e23',
                    boxShadow: isActive ? '0 0 20px rgba(255,215,0,0.5)' : 'none'
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

                    <div style={{ color: '#a0d9c4', fontSize: '16px', marginBottom: '10px' }}>
                      Bet: ${player.bet} | {player.status.toUpperCase()}
                    </div>

                    {/* Cards */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {player.hands[0].map((card, cardIdx) => (
                        <PlayingCard key={cardIdx} card={card} />
                      ))}
                    </div>

                    {/* Hand Value */}
                    {player.hands[0].length > 0 && (
                      <div style={{
                        color: isBust ? '#ff6b6b' : '#fff',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        marginBottom: '10px'
                      }}>
                        {getHandValue(player.hands[0])}
                        {isSoft(player.hands[0]) && !isBust && ' (soft)'}
                        {isBust && ' BUST'}
                      </div>
                    )}

                    {/* Result */}
                    {phase === 'result' && (
                      <div style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        marginTop: '10px',
                        color: player.status === 'won' || player.status === 'blackjack' ? '#4caf50' :
                               player.status === 'push' ? '#ffd700' :
                               player.status === 'surrender' ? '#999' : '#ff6b6b'
                      }}>
                        {player.status === 'won' && `WON +$${player.bet * 2}`}
                        {player.status === 'blackjack' && `BLACKJACK! +$${Math.floor(player.bet * 1.5) + player.bet}`}
                        {player.status === 'lost' && 'LOST'}
                        {player.status === 'push' && 'PUSH'}
                        {player.status === 'bust' && 'BUST'}
                        {player.status === 'surrender' && `SURRENDERED (got back $${Math.floor(player.bet / 2)})`}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Action Panel */}
            {phase === 'playing' && currentPlayer && (
              <div style={{
                background: 'rgba(139,69,19,0.5)',
                borderRadius: '15px',
                padding: '25px',
                textAlign: 'center',
                border: '3px solid #8b4513'
              }}>
                <h2 style={{ color: '#ffd700', marginTop: 0 }}>
                  {currentPlayer.name}'s Turn
                </h2>

                <button
                  onClick={() => setDecision(calculateDecision())}
                  style={{
                    ...actionButtonStyle,
                    background: 'linear-gradient(180deg, #9c27b0 0%, #6a1b9a 100%)',
                    color: '#fff',
                    fontSize: '18px',
                    marginBottom: '20px'
                  }}
                >
                  Get Decision
                </button>

                {decision && (
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: decision === 'HIT' ? '#4caf50' :
                           decision === 'STAND' ? '#2196f3' :
                           decision === 'DOUBLE' ? '#ff9800' :
                           decision === 'SPLIT' ? '#9c27b0' :
                           '#ff6b6b',
                    marginBottom: '15px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {decision}
                  </div>
                )}

                <div>
                  <button
                    onClick={doHit}
                    style={{
                      ...actionButtonStyle,
                      background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
                      color: '#fff'
                    }}
                  >
                    HIT
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

            {phase === 'dealer' && (
              <div style={{
                background: 'rgba(255,215,0,0.1)',
                borderRadius: '15px',
                padding: '25px',
                textAlign: 'center',
                border: '3px solid #ffd700'
              }}>
                <h2 style={{ color: '#ffd700', margin: 0 }}>Dealer Playing...</h2>
              </div>
            )}

            {phase === 'result' && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
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
            )}
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
          <h3 style={{ color: '#ffd700', marginTop: 0 }}>House Rules</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            <span style={{ marginRight: '30px' }}>• Blackjack pays 3 to 2</span>
            <span style={{ marginRight: '30px' }}>• Dealer hits on 16, stands on 17</span>
            <span style={{ marginRight: '30px' }}>• Double any two cards</span>
            <span style={{ marginRight: '30px' }}>• Split pairs</span>
            <span>• 2 decks, reshuffle every hand</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
