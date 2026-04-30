const db = require('../data/peliculas')


const listarPeliculas = (req, res) => {
  const { genero } = req.query;
  
  const pagina = Number(req.query.pagina) || 1;
  const limite = Number(req.query.limite) || 5;

  const resultado = db.getAll(genero, pagina, limite);

  res.json(resultado);
};
// GET /api/peliculas/:id
const obtenerPelicula = (req, res) => {
  const id = Number(req.params.id)
  const pelicula = db.getById(id)

  if (!pelicula) {
    return res.status(404).json({ error: 'Película no encontrada' })
  }

  res.json(pelicula)
}

// POST /api/peliculas
const crearPelicula = (req, res) => {
  const { titulo, director, anio, genero, nota } = req.body

  if (!titulo || !director || !anio || !genero) {
    return res.status(400).json({
      error: 'Los campos titulo, director, anio y genero son obligatorios'
    })
  }

  if (nota !== undefined && (nota < 0 || nota > 10)) {
    return res.status(400).json({ error: 'La nota debe estar entre 0 y 10' })
  }

  const nueva = db.create({
    titulo,
    director,
    anio: Number(anio),
    genero,
    nota: nota !== undefined ? Number(nota) : null
  })

  res.status(201).json(nueva)
}

// PUT /api/peliculas/:id
const actualizarPelicula = (req, res) => {
  const id = Number(req.params.id)
  const { titulo, director, anio, genero, nota } = req.body

  if (!titulo || !director || !anio || !genero) {
    return res.status(400).json({
      error: 'PUT requiere todos los campos: titulo, director, anio, genero'
    })
  }

  const actualizada = db.update(id, { titulo, director, anio: Number(anio), genero, nota: nota ? Number(nota) : null })

  if (!actualizada) {
    return res.status(404).json({ error: 'Película no encontrada' })
  }

  res.json(actualizada)
}


const parchearPelicula = (req, res) => {
  const id = Number(req.params.id);
  
  const actualizada = db.patch(id, req.body);

  if (!actualizada) {
    return res.status(404).json({ error: 'Película no encontrada' });
  }

  res.json(actualizada);
};



// DELETE /api/peliculas/:id
const eliminarPelicula = (req, res) => {
  const id = Number(req.params.id)
  const eliminada = db.delete(id)

  if (!eliminada) {
    return res.status(404).json({ error: 'Película no encontrada' })
  }

  res.json({ mensaje: 'Película eliminada', pelicula: eliminada })
}

// GET /api/estadisticas
const obtenerEstadisticas = (req, res) => {
  res.json(db.getStats())
}

// GET /api/peliculas/:id/resenas
const listarResenas = (req, res) => {
  const peliculaId = Number(req.params.id)
  const pelicula = db.getById(peliculaId)

  if (!pelicula) {
    return res.status(404).json({ error: 'Película no encontrada' })
  }

  const resenas = db.getResenas(peliculaId)
  res.json({ pelicula: pelicula.titulo, resenas })
}

// POST /api/peliculas/:id/resenas
const crearResena = (req, res) => {
  const peliculaId = Number(req.params.id)
  const pelicula = db.getById(peliculaId)

  if (!pelicula) {
    return res.status(404).json({ error: 'Película no encontrada' })
  }

  const { autor, texto, puntuacion } = req.body

  if (!autor || !texto || puntuacion === undefined) {
    return res.status(400).json({
      error: 'Los campos autor, texto y puntuacion son obligatorios'
    })
  }

  if (puntuacion < 1 || puntuacion > 10) {
    return res.status(400).json({ error: 'La puntuacion debe ser entre 1 y 10' })
  }

  const nueva = db.createResena(peliculaId, {
    autor,
    texto,
    puntuacion: Number(puntuacion)
  })

  res.status(201).json(nueva)



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