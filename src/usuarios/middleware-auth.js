const passport = require('passport')
const Usuario = require('./usuarios-modelo')
const tokens = require('./tokens')

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
      const id = await tokens.refresh.verifica(refreshToken)
  
      tokens.refresh.invalida(refreshToken)
  
      req.user = await Usuario.buscaPorId(id)
      next()
    } catch (error) {
      if (error.name === 'InvalidArgumentError')
        return res.status(401).json({error: error.message})

      return res.status(500).json({error: error.message})
    }
  },

  verificaEmail: async (req, res, next) => {
    try {
      const { token } = req.params
      const id = await tokens.verification.verifica(token)
      const usuario = await Usuario.buscaPorId(id)
      req.user = usuario
      next()
    } catch (error) {
      if (error && error.name === 'JsonWebTokenError')
          return res.status(401).json({error: error.message})

      if (error && error.name === 'TokenExpiredError')
        return res.status(401).json({
          error: error.message,
          expiredAt: error.expiredAt
        })

      return res.status(500).json({error: error.message})
    }
  }
}