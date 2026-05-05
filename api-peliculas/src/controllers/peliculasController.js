const peliculaService = require('../services/PeliculaService')

// GET /api/peliculas
const listarPeliculas = async (req, res, next) => {
  try {
    const { genero, buscar } = req.query;

    // El servicio espera un objeto con filtros (genero, buscar)
    const resultado = await peliculaService.obtenerTodas({ genero, buscar });

    res.json(resultado);
  } catch (err) {
    next(err);
  }
};

// GET /api/peliculas/:id
const obtenerPelicula = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    
    // El servicio ya lanza un AppError 404 por dentro si no existe
    const pelicula = await peliculaService.obtenerPorId(id)

    res.json(pelicula)
  } catch (err) {
    next(err)
  }
}

// POST /api/peliculas
const crearPelicula = async (req, res, next) => {
  try {
    const { titulo, director_id, anio, genero_id, nota } = req.body

    if (!titulo || !anio) {
      return res.status(400).json({
        error: 'Los campos titulo y anio son obligatorios'
      })
    }

    const nueva = await peliculaService.crear({
      titulo,
      anio,
      nota,
      director_id,
      genero_id
    })

    res.status(201).json(nueva)
  } catch (err) {
    next(err)
  }
}

// PUT /api/peliculas/:id
const actualizarPelicula = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { titulo, director_id, anio, genero_id, nota } = req.body

    const actualizada = await peliculaService.actualizar(id, { 
      titulo, 
      director_id, 
      anio, 
      genero_id, 
      nota 
    })

    res.json(actualizada)
  } catch (err) {
    next(err)
  }
}

// PATCH /api/peliculas/:id
const parchearPelicula = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    // El método actualizar del servicio maneja campos opcionales, sirviendo para PATCH
    const actualizada = await peliculaService.actualizar(id, req.body);

    res.json(actualizada);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/peliculas/:id
const eliminarPelicula = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const eliminada = await peliculaService.eliminar(id)

    res.json({ mensaje: 'Película eliminada', pelicula: eliminada })
  } catch (err) {
    next(err)
  }
}

// GET /api/estadisticas
const obtenerEstadisticas = async (req, res, next) => {
  try {
    const estadisticas = await peliculaService.obtenerEstadisticas()
    res.json(estadisticas)
  } catch (err) {
    next(err)
  }
}

// GET /api/peliculas/:id/resenas
const listarResenas = async (req, res, next) => {
  try {
    const peliculaId = Number(req.params.id)
    const resenas = await peliculaService.obtenerResenas(peliculaId)
    
    res.json(resenas)
  } catch (err) {
    next(err)
  }
}

// POST /api/peliculas/:id/resenas
const crearResena = async (req, res, next) => {
  try {
    const peliculaId = Number(req.params.id)
    const { autor, texto, puntuacion } = req.body

    if (!autor || !texto || puntuacion === undefined) {
      return res.status(400).json({
        error: 'Los campos autor, texto y puntuacion son obligatorios'
      })
    }

    const nueva = await peliculaService.crearResena(peliculaId, {
      autor,
      texto,
      puntuacion
    })

    res.status(201).json(nueva)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
  parchearPelicula,
  eliminarPelicula,
  obtenerEstadisticas,
  listarResenas,
  crearResena
}