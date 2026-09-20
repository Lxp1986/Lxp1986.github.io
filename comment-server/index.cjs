const Application = require('@waline/vercel')

module.exports = Application({
  plugins: [],
  async postSave () {
    // keep hook for later notification
  }
})
