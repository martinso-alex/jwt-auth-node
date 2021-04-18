const { InvalidArgumentError, InternalServerError } = require('../erros')
const Usuario = require('./usuarios-modelo')

const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const moment = require('moment')

const blocklist = require('../../redis/blocklist-access-token')
const allowlist = require('../../redis/allowlist-refresh-token')

function criaTokenJWT (usuario) {
  const payload = {id: usuario.id}

  return jwt.sign(payload, process.env.CHAVE_JWT, {expiresIn: '20s'})
}

async function criaTokenOpaco (usuario) {
  const dataExpiracao = moment().add(5, 'd').unix()
  const token = crypto.randomBytes(24).toString('hex')

  await allowlist.adiciona(token, usuario.id, dataExpiracao)

  return token
}

module.exports = {
  adiciona: async (req, res) => {
    const { nome, email, senha } = req.body

    try {
      const usuario = new Usuario({
        nome,
        email
      });

      await usuario.adicionaSenha(senha)

      await usuario.adiciona()

      res.status(201).json()
    } catch (erro) {
      if (erro instanceof InvalidArgumentError) {
        res.status(422).json({ erro: erro.message })
      } else if (erro instanceof InternalServerError) {
        res.status(500).json({ erro: erro.message })
      } else {
        res.status(500).json({ erro: erro.message })
      }
    }
  },

  lista: async (req, res) => {
    const usuarios = await Usuario.lista()
    res.json(usuarios)
  },

  deleta: async (req, res) => {
    const usuario = await Usuario.buscaPorId(req.params.id)
    try {
      await usuario.deleta()
      res.status(200).send()
    } catch (erro) {
      res.status(500).json({ erro: erro.message })
    }
  },

  login: async (req, res) => {
    try {
      const accessToken = criaTokenJWT(req.user)
      const refreshToken = await criaTokenOpaco(req.user)
  
      res.set('Authorization', accessToken)
      res.json({refreshToken})
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  logout: async (req, res) => {
    try {
      const token = req.token
      await blocklist.adiciona(token)
      
      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
};
