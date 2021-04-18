const usuariosControlador = require('./usuarios-controlador')
const auth = require('./middleware-auth')

module.exports = app => {
  app
    .route('/usuario/login')
    .post(auth.local, usuariosControlador.login)

  app
    .route('/usuario/logout')
    .post([auth.refresh, auth.bearer], usuariosControlador.logout)

  app
    .route('/usuario/refresh')
    .post(auth.refresh, usuariosControlador.login)

  app
    .route('/usuario')
    .post(usuariosControlador.adiciona)
    .get(usuariosControlador.lista)

  app
    .route('/usuario/:id')
    .delete(auth.bearer, usuariosControlador.deleta)
}
