<template>
  <section :disabled="tooManyTickersAdded">
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700">
          Тикер
        </label>
        <div class="mt-1 relative rounded-md shadow-md">
          <input
              v-model="ticker"
              @keyup="autocompleteCoins(); resetDuplicateAndInvalidCoinError()"
              @keyup.enter="checkInvalidCoin(); add()"
              :disabled="tooManyTickersAdded"
              type="text"
              name="wallet"
              id="wallet"
              class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
              :class="{
                'opacity-50': tooManyTickersAdded
              }"
              placeholder="Например DOGE"
              autocomplete="off"
          />
        </div>
        <div
            v-if="this.autocompleteResult"
            class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
        >
              <span
                  v-for="autocompleteCoin in autocomplete.slice(0, 4)"
                  :key="autocompleteCoin"
                  @click="ticker = autocompleteCoin; add()"
                  class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
                  :class="{
                    'opacity-50': tooManyTickersAdded
                  }"
              >
                {{ autocompleteCoin }}
              </span>
        </div>
        <div
            v-if="duplicate && !tooManyTickersAdded"
            class="text-sm text-red-600"
        >
          Тикер {{ ticker.toUpperCase() }} уже добавлен
        </div>
        <div
            v-if="emptyName && !tooManyTickersAdded"
            class="text-sm text-red-600"
        >
          Тикер не может быть пустым
        </div>
        <div
            v-if="invalidCoin && !emptyName && !tooManyTickersAdded"
            class="text-sm text-red-600"
        >
          Такой тикер нельзя добавить
        </div>
        <div
            v-if="tooManyTickersAdded"
            class="text-sm text-red-600"
        >
          Добавлено максимально количество тикеров: {{maximumNumberOfTickers}}
        </div>
      </div>
    </div>
    <add-button
        @click="checkInvalidCoin(); add()"
        type="button"
        :disabled="tooManyTickersAdded"
        class="my-4"
    />
  </section>
</template>

<script>
import AddButton from '@/components/AddButton'

export default {
  name: 'AddTicker',

  components: {
    AddButton
  },

  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false
    }
  },

  emits: {
    'add-ticker': (value) => typeof value === 'string'
  },

  data() {
    return {
      ticker: '',
      coinlistAPI: [],
      duplicate: false,
      emptyName: false,
      invalidCoin: false,
      autocomplete: [],
      autocompleteValidCoins: [],
      maximumNumberOfTickers: 24
    }
  },

  async mounted() {
    const response = await fetch(`https://min-api.cryptocompare.com/data/all/coinlist?summary=true`)
    this.coinlistAPI = await response.json()
    this.autocompleteCollectData()
    this.$root.loading = false
  },

  computed: {
    autocompleteResult() {
      return Object.keys(this.autocomplete).length
    },

    tooManyTickersAdded() {
      return this.$root.tickers.length >= this.maximumNumberOfTickers
    },
  },

  methods: {
    checkEmptyName() {
      return this.emptyName = this.ticker === ''
    },

    checkDuplicate() {
      return this.duplicate = this.tickers.find((t) => t.name.toUpperCase() === this.ticker.toUpperCase())
    },

    autocompleteCollectData() {
      const symbols = Object
          .keys(this.coinlistAPI.Data)
          .map((e) => this.coinlistAPI.Data[e].Symbol)

      const fullNames = Object
          .keys(this.coinlistAPI.Data)
          .map((e) => this.coinlistAPI.Data[e].FullName)

      this.autocompleteValidCoins = [...new Set(symbols.concat(fullNames))]
      this.autocomplete = this.autocompleteValidCoins
    },

    autocompleteCoins() {
      this.emptyName = false
      this.autocomplete = this.autocompleteValidCoins.filter((t) => {
        return t.toUpperCase()
            .indexOf(`${this.ticker.toUpperCase()}`) !== -1
      })
      this.invalidCoin = false
      this.checkInvalidCoin()
    },

    resetDuplicateAndInvalidCoinError() {
      this.duplicate = false
      this.invalidCoin = false
    },

    checkInvalidCoin() {
      if (this.autocompleteResult) {
        this.invalidCoin = !this.autocompleteValidCoins.find(
            (c) => c.toUpperCase() === this.ticker.toUpperCase()
        )
        return this.autocompleteValidCoins
      } else this.invalidCoin = true
      return this.invalidCoin
    },

    getSymbol() {
      if (this.ticker.match(/\(/)) {
        return this.ticker = this.ticker.substring(this.ticker.lastIndexOf('(') + 1, this.ticker.lastIndexOf(')'))
      }
    },

    add() {
      this.checkEmptyName()
      this.getSymbol()
      this.checkInvalidCoin()

      if (!this.duplicate && !this.invalidCoin && !this.emptyName && !this.tooManyTickersAdded) {
        this.$emit('add-ticker', this.ticker)
      }
      this.ticker = ''
    }
  }
}
</script>
