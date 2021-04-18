const passport = require('passport')
const Usuario = require('./usuarios-modelo')
const { InvalidArgumentError } = require('../erros')
const allowlist = require('../../redis/allowlist-refresh-token')

async function verificaRefreshToken (token) {
  if (!token)
    throw new InvalidArgumentError('refresh token nao enviado')

  const id = await allowlist.buscaValor(token)

  if (!id)
    throw new InvalidArgumentError('refresh token invalido')

  return id
}

async function invalidaRefreshToken (token) {
  await allowlist.deleta(token)
}

module.exports = {
  local: (req, res, next) => {
    passport.authenticate(
      'local',
      {session: false},
      (error, user, info) => {
        if (error && error.name === 'InvalidArgumentError')
          return res.status(401).json({error: error.message})

        if (error)
          return res.status(500).json({error: error.message})

        if (!user)
          return res.status(401).json()

        req.user = user
        next()
      }
    )(req, res, next)
  },

  bearer: (req, res, next) => {
    passport.authenticate(
      'bearer',
      {session: false},
      (error, user, info) => {
        if (error && error.name === 'JsonWebTokenError')
          return res.status(401).json({error: error.message})

        if (error && error.name === 'TokenExpiredError')
          return res.status(401).json({
            error: error.message,
            expiredAt: error.expiredAt
          })

        if (error)
          return res.status(500).json({error: error.message})

        if (!user)
          return res.status(401).json()

        req.token = info.token
        req.user = user
        next()
      }
    )(req, res, next)
  },

  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.body
      const id = await verificaRefreshToken(refreshToken)
  
      await invalidaRefreshToken(refreshToken)
  
      req.user = await Usuario.buscaPorId(id)
      next()
    } catch (error) {
      if (error.name === 'InvalidArgumentError')
        return res.status(401).json({error: error.message})

      return res.status(500).json({error: error.message})
    }
  }
}