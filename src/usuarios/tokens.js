const allowlist = require('../../redis/allowlist-refresh-token')
const blocklist = require('../../redis/blocklist-access-token')

const { InvalidArgumentError } = require('../erros')

const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const moment = require('moment')

function criaTokenJWT (id, [tempoQuantidade, tempoUnidade]) {
  const payload = { id }

  return jwt.sign(
    payload,
    process.env.CHAVE_JWT,
    {expiresIn: tempoQuantidade + tempoUnidade}
  )
}

async function verificaTokenJWT (token, nome, blocklist) {
  await verificaTokenBlocklist(token, nome, blocklist)

  const { id } = jwt.verify(token, process.env.CHAVE_JWT)
  return id
}

async function verificaTokenBlocklist (token, nome, blocklist) {
  if (!blocklist) return

  const tokenNaBlocklist = await blocklist.contemToken(token)

  if (tokenNaBlocklist)
    throw new jwt.JsonWebTokenError(`${nome} invalido por logout`)
}

async function invalidaTokenJWT (token, blocklist) {
  await blocklist.adiciona(token)
}

async function criaTokenOpaco (id, [tempoQuantidade, tempoUnidade], allowlist) {
  const dataExpiracao = moment().add(tempoQuantidade, tempoUnidade).unix()
  const token = crypto.randomBytes(24).toString('hex')

  await allowlist.adiciona(token, id, dataExpiracao)

  return token
}

async function verificaTokenOpaco (token, nome, allowlist) {
  verificaTokenEnviado(token, nome)
  const id = await allowlist.buscaValor(token)
  verificaTokenValido(id, nome)

  return id
}

function verificaTokenValido(id, nome) {
  if (!id)
    throw new InvalidArgumentError(`${nome} invalido`)
}

function verificaTokenEnviado(token, nome) {
  if (!token)
    throw new InvalidArgumentError(`${nome} nao enviado`)
}

async function invalidaTokenOpaco (token, allowlist) {
  await allowlist.deleta(token)
}



module.exports = {
  access: {
    expiracao: [15, 'm'],
    lista: blocklist,
    nome: 'access token',
    cria (id) {
      return criaTokenJWT(id, this.expiracao)
    },
    verifica (token) {
      return verificaTokenJWT(token, this.nome, this.lista)
    },
    invalida (token) {
      return invalidaTokenJWT(token, this.lista)
    }
  },

  refresh: {
    expiracao: [5, 'd'],
    lista: allowlist,
    nome: 'refresh token',
    cria (id) {
      return criaTokenOpaco(id, this.expiracao, this.lista)
    },
    verifica (token) {
      return verificaTokenOpaco(token, this.nome, this.lista)
    },
    invalida (token) {
      return invalidaTokenOpaco (token, this.lista)
    }
  },

  verification: {
    expiracao: [1, 'h'],
    nome: 'verification token',
    cria (id) {
      return criaTokenJWT(id, this.expiracao)
    },
    verifica (token) {
      return verificaTokenJWT(token, this.nome)
    }
  }
}