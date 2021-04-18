const redis = require('redis')
const blocklist = redis.createClient({prefix: 'blocklist-access-token:'})

const manipulaBlocklist = require('./manipula-lista')(blocklist)

const jwt = require('jsonwebtoken')
const { createHash } = require('crypto')

function geraTokenHash (token) {
  return createHash('sha256').update(token).digest('hex')
}

module.exports = {
  adiciona: async token => {
    const expireAt = jwt.decode(token).exp
    const tokenHash = geraTokenHash(token)
    
    await manipulaBlocklist.adiciona(tokenHash, '', expireAt)
  },

  contemToken: async token => {
    const tokenHash = geraTokenHash(token)
    
    return manipulaBlocklist.contemChave(tokenHash)
  }
}