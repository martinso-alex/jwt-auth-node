const express = require('express')
const app = express()

const { estrategiasAutenticacao } = require('./src/usuarios')

app.use(express.json())
app.use(
  express.urlencoded({
    extended: true
  })
)

module.exports = app
