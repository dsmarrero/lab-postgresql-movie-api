const { Router } = require('express')
const {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
  parchearPelicula,
  eliminarPelicula,
  listarResenas,
  crearResena
} = require('../controllers/peliculasController')

const router = Router()

// Rutas de películas
router.get('/', listarPeliculas)
router.get('/:id', obtenerPelicula)
router.post('/', crearPelicula)
router.put('/:id', actualizarPelicula)
router.patch('/:id', parchearPelicula);
router.delete('/:id', eliminarPelicula)

// Rutas anidadas: reseñas de una película
router.get('/:id/resenas', listarResenas)
router.post('/:id/resenas', crearResena)

module.exports = router