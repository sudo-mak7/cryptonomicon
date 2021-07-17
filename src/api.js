const API_KEY = '27426a7b898a8560e6074bd08a4ed101682d88ecdab3f2b5f03789668e65ab53'

const tickersHandlers = new Map()
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)

const AGGREGATE_INDEX = '5'
const INVALID_SUB = '500'

socket.addEventListener('message', (e) => {
  const {
    TYPE: type,
    MESSAGE: message,
    PARAMETER: parameter,
    FROMSYMBOL: currency,
    PRICE: newPrice
  } = JSON.parse(e.data)

  if (message === 'INVALID_SUB' && type === INVALID_SUB) {
    const errorCurrency = parameter.split('~')[2]
    const element = document.getElementsByClassName('text-center')

    for (let i = 0; i < element.length; i++) {
      if (element[i].outerText.indexOf(errorCurrency) !== -1) {
        element[i].classList.add('bg-red-100')
      }
    }
  } else if (type === AGGREGATE_INDEX) {
    const errorCurrency = currency
    const element = document.getElementsByClassName('bg-red-100')

    for (let i = 0; i < element.length; i++) {
      if (element[i].outerText.indexOf(errorCurrency) !== -1) {
        element[i].classList.remove('bg-red-100')
      }
    }
  }

  if (type !== AGGREGATE_INDEX && type !== INVALID_SUB || newPrice === undefined) {
    return
  }

  const handlers = tickersHandlers.get(currency) ?? []
  handlers.forEach((fn) => fn(newPrice))
})

// eslint-disable-next-line require-jsdoc
function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message)

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage)
    return
  }

  socket.addEventListener('open', () => {
    socket.send(stringifiedMessage)
  },
  {once: true}
  )
}

// eslint-disable-next-line require-jsdoc
function subscribeToTickerOnWs(ticker) {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${ticker}~USD`]
  })
}

// eslint-disable-next-line require-jsdoc
function unsubscribeFromTickerOnWs(ticker) {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~USD`]
  })
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || []
  tickersHandlers.set(ticker, [...subscribers, cb])
  subscribeToTickerOnWs(ticker)
}

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker)
  unsubscribeFromTickerOnWs(ticker)
}

// export const highlightInvalidCoin = (ticker) => {
//     const element = document.getElementById('ticker')
//
//   // console.log(element.innerText.indexOf('42'))
//
//   if (element.innerText.indexOf(ticker) !== -1) {
//     console.log('INVALID_SUB')
//   }
// }
