![logo_ironhack_blue 7](https://user-images.githubusercontent.com/23629340/40541063-a07a0a8a-601a-11e8-91b5-2f13e4e6b441.png)

# Lab | Routing y Controladores — Refactorizar la API de Películas

### Requisitos

* Haz un fork de este repositorio
* Clona este repositorio

### Entrega

* Al finalizar, ejecuta los siguientes comandos:

```
git add .
git commit -m "done"
git push origin [master/main]
```

* Crea un Pull Request y envía tu entrega.

## Objetivo

Tomar el servidor del lab anterior (todo en un solo `index.js`) y reorganizarlo siguiendo el patrón **MVC**: separar las rutas en un Router, la lógica en controladores, y los datos en su propio módulo. También añadirás rutas anidadas para gestionar **reseñas** de cada película.

## Requisitos previos

- Haber completado el Lab D1 (o tener un servidor Express básico funcionando)
- Haber leído el material del D2
- Postman o Thunder Client

## Lo que vas a construir

La misma funcionalidad del Lab D1, pero con esta estructura de carpetas:

```
api-peliculas/
├── src/
│   ├── routes/
│   │   └── peliculas.js       ← Solo define las rutas
│   ├── controllers/
│   │   └── peliculasController.js  ← Solo lógica HTTP
│   └── data/
│       └── peliculas.js       ← Datos y operaciones sobre ellos
├── .env
├── .gitignore
├── package.json
└── index.js                   ← Solo configuración del servidor
```

Además añadirás:
- `GET /api/peliculas/:id/resenas` — reseñas de una película
- `POST /api/peliculas/:id/resenas` — añadir una reseña

### Paso 1: Preparar el proyecto

Si continúas desde el Lab D1, crea la estructura de carpetas:

```bash
mkdir -p src/routes src/controllers src/data
```

Si empiezas desde cero:

```bash
mkdir api-peliculas && cd api-peliculas
npm init -y
npm install express dotenv
npm install --save-dev nodemon
mkdir -p src/routes src/controllers src/data
```

Actualiza `package.json` con los scripts si no los tienes:
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

### Paso 2: Módulo de datos

Los datos ya no vivirán en `index.js`. Crea `src/data/peliculas.js`:

```javascript
// src/data/peliculas.js

let peliculas = [
  { id: 1, titulo: 'Inception', director: 'Christopher Nolan', anio: 2010, genero: 'ciencia-ficcion', nota: 8.8 },
  { id: 2, titulo: 'Pulp Fiction', director: 'Quentin Tarantino', anio: 1994, genero: 'crimen', nota: 8.9 },
  { id: 3, titulo: 'El Señor de los Anillos', director: 'Peter Jackson', anio: 2001, genero: 'fantasia', nota: 8.8 }
]

let resenas = [
  { id: 1, pelicula_id: 1, autor: 'María', texto: 'Obra maestra', puntuacion: 9 },
  { id: 2, pelicula_id: 1, autor: 'Carlos', texto: 'Confusa pero brillante', puntuacion: 8 },
  { id: 3, pelicula_id: 2, autor: 'Ana', texto: 'Clásico imprescindible', puntuacion: 10 }
]

let nextPeliculaId = 4
let nextResenaId = 4

// Funciones de acceso a datos
const db = {
  // Películas
  getAll: (genero) => {
    if (genero) return peliculas.filter(p => p.genero === genero)
    return peliculas
  },
  getById: (id) => peliculas.find(p => p.id === id) || null,
  create: (datos) => {
    const nueva = { id: nextPeliculaId++, ...datos }
    peliculas.push(nueva)
    return nueva
  },
  update: (id, datos) => {
    const index = peliculas.findIndex(p => p.id === id)
    if (index === -1) return null
    peliculas[index] = { ...peliculas[index], ...datos }
    return peliculas[index]
  },
  delete: (id) => {
    const index = peliculas.findIndex(p => p.id === id)
    if (index === -1) return null
    return peliculas.splice(index, 1)[0]
  },
  getStats: () => {
    const conNota = peliculas.filter(p => p.nota !== null)
    if (conNota.length === 0) return { media: null, total: peliculas.length }
    const media = conNota.reduce((acc, p) => acc + p.nota, 0) / conNota.length
    return { media: Number(media.toFixed(2)), total: peliculas.length }
  },

  // Reseñas
  getResenas: (peliculaId) => resenas.filter(r => r.pelicula_id === peliculaId),
  createResena: (peliculaId, datos) => {
    const nueva = { id: nextResenaId++, pelicula_id: peliculaId, ...datos }
    resenas.push(nueva)
    return nueva
  }
}

module.exports = db
```

### Paso 3: El controlador

Crea `src/controllers/peliculasController.js`. Aquí va toda la lógica que antes estaba directamente en las rutas:

```javascript
// src/controllers/peliculasController.js
const db = require('../data/peliculas')

// GET /api/peliculas
const listarPeliculas = (req, res) => {
  const { genero } = req.query
  const peliculas = db.getAll(genero)
  res.json(peliculas)
}

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
  eliminarPelicula,
  obtenerEstadisticas,
  listarResenas,
  crearResena
}
```

### Paso 4: El Router

Crea `src/routes/peliculas.js`. Aquí **solo** se definen las rutas — sin lógica:

```javascript
// src/routes/peliculas.js
const { Router } = require('express')
const {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
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
router.delete('/:id', eliminarPelicula)

// Rutas anidadas: reseñas de una película
router.get('/:id/resenas', listarResenas)
router.post('/:id/resenas', crearResena)

module.exports = router
```

### Paso 5: El index.js — punto de entrada limpio

Reemplaza (o crea) `index.js` con:

```javascript
// index.js
require('dotenv').config()
const express = require('express')

const peliculasRouter = require('./src/routes/peliculas')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware global
app.use(express.json())

// Rutas
app.use('/api/peliculas', peliculasRouter)

// Ruta de estadísticas (no pertenece a peliculasRouter, pero podrías moverla también)
app.get('/api/estadisticas', require('./src/controllers/peliculasController').obtenerEstadisticas)

// 404 global
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.url} no encontrada` })
})

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`)
})
```

**Comprobación de estructura**: Ejecuta `npm run dev` y verifica que el servidor arranca sin errores.

### Paso 6: Probar todas las rutas

Fíjate que ahora las URLs tienen el prefijo `/api`:

| Antes (Lab D1) | Ahora (Lab D2) |
|----------------|----------------|
| `GET /peliculas` | `GET /api/peliculas` |
| `GET /peliculas/1` | `GET /api/peliculas/1` |
| `POST /peliculas` | `POST /api/peliculas` |

Prueba en Postman o Thunder Client:

**1. Listar todas:**
```
GET http://localhost:3000/api/peliculas
```

**2. Filtrar por género:**
```
GET http://localhost:3000/api/peliculas?genero=crimen
```

**3. Obtener una:**
```
GET http://localhost:3000/api/peliculas/2
```

**4. Crear nueva:**
```
POST http://localhost:3000/api/peliculas
Body: { "titulo": "Dunkirk", "director": "Christopher Nolan", "anio": 2017, "genero": "belico", "nota": 7.9 }
```

**5. Actualizar:**
```
PUT http://localhost:3000/api/peliculas/4
Body: { "titulo": "Dunkirk", "director": "Christopher Nolan", "anio": 2017, "genero": "guerra", "nota": 8.0 }
```

**6. Listar reseñas de una película:**
```
GET http://localhost:3000/api/peliculas/1/resenas
```

**7. Crear reseña:**
```
POST http://localhost:3000/api/peliculas/1/resenas
Body: { "autor": "Luis", "texto": "Una joya del cine", "puntuacion": 9 }
```

**8. Crear reseña en película inexistente:**
```
POST http://localhost:3000/api/peliculas/999/resenas
Body: { "autor": "Luis", "texto": "Test", "puntuacion": 7 }
```
→ Debe devolver 404

### Paso 7: Reflexión sobre el código

Responde estas preguntas (puedes escribirlas como comentarios en un archivo `NOTAS.md`):

1. ¿Por qué es mejor tener el controlador separado de las rutas?
2. Si mañana quisieras cambiar los datos en memoria por una base de datos PostgreSQL, ¿en qué archivo harías el cambio principalmente?
3. ¿Qué pasaría si en el router tuvieras `/:id` antes que `/:id/resenas`? Pruébalo y describe el resultado.

## Criterios de evaluación

- [ ] La estructura de carpetas coincide con la indicada en el objetivo
- [ ] `index.js` no contiene lógica de rutas (solo configuración y montaje)
- [ ] El router solo contiene `router.get/post/put/delete` y exports, sin lógica
- [ ] El controlador no usa `app`, solo `req`, `res` y el módulo de datos
- [ ] Todas las rutas del Lab D1 siguen funcionando bajo `/api/`
- [ ] `GET /api/peliculas/:id/resenas` devuelve las reseñas de esa película
- [ ] `POST /api/peliculas/:id/resenas` valida los campos y crea la reseña
- [ ] `POST /api/peliculas/999/resenas` devuelve 404

## Bonus

1. **Mover estadísticas al router**: Crea `src/routes/estadisticas.js` con su ruta y monta en `index.js` como `app.use('/api', estadisticasRouter)`. La URL final debe ser `/api/estadisticas`.

2. **Ruta PATCH**: Implementa `PATCH /api/peliculas/:id` que permita actualizar solo algunos campos (a diferencia de PUT que requiere todos).

3. **Paginación**: Modifica `GET /api/peliculas` para soportar `?pagina=1&limite=2`. La respuesta debe incluir `{ data: [...], total, pagina, totalPaginas }`.