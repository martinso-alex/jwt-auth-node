const postsControlador = require('./posts-controlador')
const { auth } = require('../usuarios')

module.exports = app => {
  app
    .route('/post')
    .get(postsControlador.lista)
    .post(auth.bearer, postsControlador.adiciona)
}
