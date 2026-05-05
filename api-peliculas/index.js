require('dotenv').config() // 1. Primero cargamos las variables de entorno
require('./src/config/db') // 2. Después verificamos la conexión a la base de datos

const express = require('express')
const peliculaService = require('./src/services/PeliculaService') // Importamos el servicio para las estadísticas
const peliculasRouter = require('./src/routes/peliculas')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware global
app.use(express.json())

// Rutas de películas
app.use('/api/peliculas', peliculasRouter)

// Paso 7: Ruta de estadísticas asíncrona directamente en index.js
app.get('/api/estadisticas', async (req, res, next) => {
  try {
    const stats = await peliculaService.obtenerEstadisticas()
    res.json(stats)
  } catch (err) {
    next(err)
  }
})

// 404 global
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.url} no encontrada` })
})

// Manejador de errores global (captura los next(err) del controlador y del servicio)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor'
  })
})

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`)
})