const API_KEY = '27426a7b898a8560e6074bd08a4ed101682d88ecdab3f2b5f03789668e65ab53'

const tickersHandlers = new Map()
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)

const AGGREGATE_INDEX = '5'
const INVALID_SUB = '500'

let errorCurrency = ''
let errorCurrencyPriceToBTC = ''
let errorCurrencyToCorrect = ''
let priceBTC = null

socket.addEventListener('message', (e) => {
  let {
    TYPE: type,
    MESSAGE: message,
    PARAMETER: parameter,
    FROMSYMBOL: currency,
    TOSYMBOL: tosymbol,
    PRICE: newPrice
  } = JSON.parse(e.data)

  if (type === AGGREGATE_INDEX && !newPrice) {
    return
  }

  highlightRedToErrorCurrency(type, message, currency, newPrice, parameter)

  fixSubscribeToErrorCurrency(type, message, currency, newPrice)

  if (tosymbol === 'BTC') {
    errorCurrencyPriceToBTC = newPrice
    getCrossRate(errorCurrencyPriceToBTC, priceBTC)
    newPrice = errorCurrencyToCorrect
  }

  if (type !== AGGREGATE_INDEX && type !== INVALID_SUB) {
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
  if (errorCurrency !== '' && ticker !== 'BTC') {
    sendToWebSocket({
      action: 'SubAdd',
      subs: [`5~CCCAGG~BTC~USD`]
    })

    sendToWebSocket({
      action: 'SubAdd',
      subs: [`5~CCCAGG~${ticker}~BTC`]
    })

    if (ticker !== 'BTC') {
      unsubscribeFromTickerOnWs(ticker)
    }
  } else {
    sendToWebSocket({
      action: 'SubAdd',
      subs: [`5~CCCAGG~${ticker}~USD`]
    })
  }
}

// eslint-disable-next-line require-jsdoc
function unsubscribeFromTickerOnWs(ticker) {
  if (ticker === errorCurrency) {
    sendToWebSocket({
      action: 'SubRemove',
      subs: [`5~CCCAGG~BTC~USD`]
    })
  }
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~USD`]
  })
}

// eslint-disable-next-line require-jsdoc
function highlightRedToErrorCurrency(type, message, currency, newPrice, parameter) {
  if (type === INVALID_SUB && message === 'INVALID_SUB' && newPrice === undefined) {
    unsubscribeFromTickerOnWs(currency)
    errorCurrency = parameter.split('~')[2]

    const element = document.getElementsByClassName('text-center')

    for (let i = 0; i < element.length; i++) {
      if (element[i].outerText.indexOf(errorCurrency) !== -1) {
        element[i].classList.add('bg-red-100')
      }
    }
  } else if (type === AGGREGATE_INDEX && newPrice) {
    const element = document.getElementsByClassName('bg-red-100')

    for (let i = 0; i < element.length; i++) {
      if (element[i].outerText.indexOf(currency) !== -1) {
        element[i].classList.remove('bg-red-100')
      }
    }
  }
}

// eslint-disable-next-line require-jsdoc
function fixSubscribeToErrorCurrency(type, message, currency, newPrice) {
  if (type !== ['3', '16'] && message === 'INVALID_SUB') {
    subscribeToTickerOnWs('BTC')
  }

  if (currency === 'BTC' && errorCurrency !== '') {
    priceBTC = newPrice

    let errorCurrencySubscribed = false
    if (!errorCurrencySubscribed) {
      subscribeToTickerOnWs(errorCurrency)
      errorCurrencySubscribed = true
    }
  }
}

// eslint-disable-next-line require-jsdoc
function getCrossRate(errorCurrencyToBTC, priceBTC) {
  errorCurrencyToCorrect = priceBTC * errorCurrencyToBTC
  return errorCurrencyToCorrect
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
