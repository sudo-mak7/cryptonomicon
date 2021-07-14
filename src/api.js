const API_KEY = '27426a7b898a8560e6074bd08a4ed101682d88ecdab3f2b5f03789668e65ab53'

const tickersHandlers = new Map()

export const loadTickers = () => {
  if (tickersHandlers.size === 0) {
    return
  }

  fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(',')}&tsyms=USD&api_key=${API_KEY}`)
      .then((r) => r.json())
      .then((rawData) => {
        const updatePrices = Object.fromEntries(
            Object.entries(rawData)
                .map(([key, value]) => [key, value.USD])
        )
        Object.entries(updatePrices).forEach(([currency, newPrice]) => {
          const handlers = tickersHandlers.get(currency) ?? []
          handlers.forEach((fn) => fn(newPrice))
        })
      })
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || []
  tickersHandlers.set(ticker, [...subscribers, cb])
}

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker)
  // const subscribers = tickersHandlers.get(ticker) || []
  // tickersHandlers.set(
  //     ticker,
  //     subscribers.filter((fn) => fn !== cb)
  // )
}

setInterval(loadTickers, 5000)

window.tickers = tickersHandlers
