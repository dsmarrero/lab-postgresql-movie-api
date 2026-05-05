![logo_ironhack_blue 7](https://user-images.githubusercontent.com/23629340/40541063-a07a0a8a-601a-11e8-91b5-2f13e4e6b441.png)

# Lab | PostgreSQL — La API de Películas con Base de Datos Real

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

Reemplazar los datos en memoria de los labs anteriores por una base de datos PostgreSQL real. Crearás el esquema SQL, insertarás datos de prueba, y conectarás Express con PostgreSQL usando el driver `pg`. Al terminar, los datos persistirán aunque reinicies el servidor.

## Requisitos previos

- Haber completado el Lab D3 (o tener la estructura de Router + Controllers + Service)
- PostgreSQL instalado y corriendo localmente
- Haber leído el material del D4
- Postman o Thunder Client

## Lo que vas a construir

El esquema de base de datos:

```
┌──────────────┐       ┌─────────────────┐       ┌────────────────┐
│   directores │       │    peliculas     │       │    generos     │
├──────────────┤       ├─────────────────┤       ├────────────────┤
│ id (PK)      │◄──────│ id (PK)         │       │ id (PK)        │
│ nombre       │       │ titulo          │──────►│ nombre         │
│ nacionalidad │       │ anio            │       │ slug           │
│ fecha_nac    │       │ nota            │       └────────────────┘
└──────────────┘       │ director_id(FK) │
                       │ genero_id (FK)  │
                       └────────┬────────┘
                                │
                    ┌───────────▼───────────┐
                    │        resenas        │
                    ├───────────────────────┤
                    │ id (PK)               │
                    │ pelicula_id (FK)      │
                    │ autor                 │
                    │ texto                 │
                    │ puntuacion            │
                    │ created_at            │
                    └───────────────────────┘
```

## Paso 1: Crear la base de datos

Abre tu terminal y conéctate a PostgreSQL:

```bash
psql -U postgres
```

Dentro del shell de psql, ejecuta:

```sql
CREATE DATABASE peliculas_db;
\c peliculas_db
```

Verifica que estás en la base de datos correcta: el prompt debe cambiar a `peliculas_db=#`.

## Paso 2: Crear el esquema

Ejecuta este script SQL en psql. Hazlo **sentencia a sentencia** para entender qué hace cada una:

```sql
-- Tabla de géneros (primero, porque peliculas la referencia)
CREATE TABLE generos (
  id    SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  slug   VARCHAR(50) UNIQUE NOT NULL
);

-- Tabla de directores
CREATE TABLE directores (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  nacionalidad VARCHAR(50),
  fecha_nac    DATE
);

-- Tabla principal de películas
CREATE TABLE peliculas (
  id          SERIAL PRIMARY KEY,
  titulo      VARCHAR(255) NOT NULL,
  anio        INTEGER NOT NULL CHECK (anio >= 1888 AND anio <= 2100),
  nota        DECIMAL(3,1) CHECK (nota >= 0 AND nota <= 10),
  director_id INTEGER REFERENCES directores(id) ON DELETE SET NULL,
  genero_id   INTEGER REFERENCES generos(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_peliculas_director ON peliculas(director_id);
CREATE INDEX idx_peliculas_genero ON peliculas(genero_id);

-- Tabla de reseñas
CREATE TABLE resenas (
  id          SERIAL PRIMARY KEY,
  pelicula_id INTEGER NOT NULL REFERENCES peliculas(id) ON DELETE CASCADE,
  autor       VARCHAR(100) NOT NULL,
  texto       TEXT NOT NULL,
  puntuacion  INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 10),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Verifica las tablas creadas:
```sql
\dt
```
Debes ver las 4 tablas: `directores`, `generos`, `peliculas`, `resenas`.

## Paso 3: Insertar datos de prueba

```sql
-- Géneros
INSERT INTO generos (nombre, slug) VALUES
  ('Ciencia Ficción', 'ciencia-ficcion'),
  ('Crimen', 'crimen'),
  ('Fantasía', 'fantasia'),
  ('Thriller', 'thriller'),
  ('Drama', 'drama');

-- Directores
INSERT INTO directores (nombre, nacionalidad, fecha_nac) VALUES
  ('Christopher Nolan', 'Británico', '1970-07-30'),
  ('Quentin Tarantino', 'Estadounidense', '1963-03-27'),
  ('Peter Jackson', 'Neozelandés', '1961-10-31'),
  ('Denis Villeneuve', 'Canadiense', '1967-10-03');

-- Películas (usando los IDs de directores y géneros)
INSERT INTO peliculas (titulo, anio, nota, director_id, genero_id) VALUES
  ('Inception', 2010, 8.8, 1, 1),
  ('The Dark Knight', 2008, 9.0, 1, 4),
  ('Pulp Fiction', 1994, 8.9, 2, 2),
  ('Inglourious Basterds', 2009, 8.3, 2, 2),
  ('El Señor de los Anillos', 2001, 8.8, 3, 3),
  ('Blade Runner 2049', 2017, 8.0, 4, 1),
  ('Dune', 2021, 8.1, 4, 1);

-- Reseñas
INSERT INTO resenas (pelicula_id, autor, texto, puntuacion) VALUES
  (1, 'María García', 'Una obra maestra del cine moderno', 10),
  (1, 'Carlos López', 'Confusa al principio pero brillante', 8),
  (2, 'Ana Martínez', 'El mejor superhéroe del cine', 10),
  (3, 'Luis Fernández', 'Clásico imprescindible', 9),
  (6, 'Carmen Ruiz', 'Visualmente impresionante', 8);
```

Verifica los datos:
```sql
SELECT p.titulo, d.nombre AS director, g.nombre AS genero, p.nota
FROM peliculas p
JOIN directores d ON p.director_id = d.id
JOIN generos g ON p.genero_id = g.id
ORDER BY p.nota DESC;
```

## Paso 4: Conectar Node.js a PostgreSQL

Instala el driver:

```bash
npm install pg
```

Actualiza `.env` con las credenciales de tu base de datos:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=peliculas_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
```

Crea `src/config/db.js`:

```javascript
// src/config/db.js
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'peliculas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al conectar a PostgreSQL:', err.message)
    process.exit(1)
  }
  release()
  console.log('Conectado a PostgreSQL - Base de datos:', process.env.DB_NAME)
})

module.exports = pool
```

Añade en `index.js` al principio (antes de las rutas) para probar la conexión:
```javascript
require('./src/config/db') // Esto ejecuta el pool.connect de verificación
```

Arranca el servidor con `npm run dev`. Debes ver en consola:
```
Conectado a PostgreSQL - Base de datos: peliculas_db
Servidor en http://localhost:3000
```

## Paso 5: Implementar las consultas en el servicio

Reemplaza `src/services/PeliculaService.js` con la versión que usa PostgreSQL:

```javascript
// src/services/PeliculaService.js
const pool = require('../config/db')
const AppError = require('../utils/AppError')

class PeliculaService {

  async obtenerTodas(filtros = {}) {
    let query = `
      SELECT
        p.id,
        p.titulo,
        p.anio,
        p.nota,
        d.nombre AS director,
        g.nombre AS genero,
        g.slug   AS genero_slug
      FROM peliculas p
      LEFT JOIN directores d ON p.director_id = d.id
      LEFT JOIN generos g ON p.genero_id = g.id
    `
    const params = []

    if (filtros.genero) {
      params.push(filtros.genero)
      query += ` WHERE g.slug = $${params.length}`
    }

    if (filtros.buscar) {
      params.push(`%${filtros.buscar}%`)
      const condicion = `(p.titulo ILIKE $${params.length} OR d.nombre ILIKE $${params.length})`
      query += filtros.genero ? ` AND ${condicion}` : ` WHERE ${condicion}`
    }

    query += ' ORDER BY p.nota DESC NULLS LAST'

    const { rows } = await pool.query(query, params)
    return rows
  }

  async obtenerPorId(id) {
    const { rows } = await pool.query(
      `SELECT
        p.id, p.titulo, p.anio, p.nota,
        d.id AS director_id, d.nombre AS director, d.nacionalidad,
        g.id AS genero_id, g.nombre AS genero
       FROM peliculas p
       LEFT JOIN directores d ON p.director_id = d.id
       LEFT JOIN generos g ON p.genero_id = g.id
       WHERE p.id = $1`,
      [id]
    )

    if (rows.length === 0) throw new AppError('Película no encontrada', 404)
    return rows[0]
  }

  async crear(datos) {
    const { titulo, anio, nota, director_id, genero_id } = datos

    if (nota !== undefined && (nota < 0 || nota > 10)) {
      throw new AppError('La nota debe estar entre 0 y 10', 400)
    }

    const { rows } = await pool.query(
      `INSERT INTO peliculas (titulo, anio, nota, director_id, genero_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [titulo, Number(anio), nota ? Number(nota) : null, director_id || null, genero_id || null]
    )

    return rows[0]
  }

  async actualizar(id, datos) {
    const pelicula = await this.obtenerPorId(id) // lanza 404 si no existe

    const { titulo, anio, nota, director_id, genero_id } = datos

    const { rows } = await pool.query(
      `UPDATE peliculas
       SET titulo = $1, anio = $2, nota = $3, director_id = $4, genero_id = $5
       WHERE id = $6
       RETURNING *`,
      [
        titulo || pelicula.titulo,
        anio ? Number(anio) : pelicula.anio,
        nota !== undefined ? Number(nota) : pelicula.nota,
        director_id || pelicula.director_id,
        genero_id || pelicula.genero_id,
        id
      ]
    )

    return rows[0]
  }

  async eliminar(id) {
    const { rows } = await pool.query(
      'DELETE FROM peliculas WHERE id = $1 RETURNING *',
      [id]
    )

    if (rows.length === 0) throw new AppError('Película no encontrada', 404)
    return rows[0]
  }

  async obtenerEstadisticas() {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        ROUND(AVG(nota)::numeric, 2) AS media_nota,
        MAX(nota) AS nota_maxima,
        MIN(nota) AS nota_minima
      FROM peliculas
      WHERE nota IS NOT NULL
    `)

    const { rows: porGenero } = await pool.query(`
      SELECT g.nombre AS genero, COUNT(p.id)::int AS cantidad
      FROM generos g
      LEFT JOIN peliculas p ON p.genero_id = g.id
      GROUP BY g.id, g.nombre
      ORDER BY cantidad DESC
    `)

    return { ...rows[0], porGenero }
  }

  // =====================
  // Reseñas
  // =====================
  async obtenerResenas(peliculaId) {
    await this.obtenerPorId(peliculaId) // lanza 404 si no existe la película

    const { rows } = await pool.query(
      'SELECT * FROM resenas WHERE pelicula_id = $1 ORDER BY created_at DESC',
      [peliculaId]
    )

    return rows
  }

  async crearResena(peliculaId, datos) {
    await this.obtenerPorId(peliculaId) // lanza 404 si no existe

    const { autor, texto, puntuacion } = datos

    if (puntuacion < 1 || puntuacion > 10) {
      throw new AppError('La puntuacion debe ser entre 1 y 10', 400)
    }

    const { rows } = await pool.query(
      `INSERT INTO resenas (pelicula_id, autor, texto, puntuacion)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [peliculaId, autor, texto, Number(puntuacion)]
    )

    return rows[0]
  }
}

module.exports = new PeliculaService()
```

## Paso 6: Actualizar el controlador para métodos async

Ahora el servicio usa `async/await`. El controlador ya lo maneja correctamente con `try/catch` y `next(err)` si lo hiciste en el lab anterior. Si no, actualiza cada función para que sea `async`:

```javascript
// Ejemplo: antes era (req, res, next) =>
// Ahora debe ser async (req, res, next) =>
const obtenerPelicula = async (req, res, next) => {
  try {
    const pelicula = await peliculaService.obtenerPorId(Number(req.params.id))
    res.json(pelicula)
  } catch (err) {
    next(err)
  }
}
```

Asegúrate de que **todas** las funciones del controlador sean `async` y hagan `await` al llamar al servicio.

## Paso 7: Actualizar la ruta de estadísticas en index.js

La función de estadísticas ahora es `async`:

```javascript
app.get('/api/estadisticas', async (req, res, next) => {
  try {
    const stats = await peliculaService.obtenerEstadisticas()
    res.json(stats)
  } catch (err) {
    next(err)
  }
})
```

## Paso 8: Probar con datos reales

Arranca el servidor. Los datos ahora vienen de PostgreSQL.

**1. Listar películas con JOIN:**
```
GET http://localhost:3000/api/peliculas
```
Debe devolver películas con el nombre del director y género (no solo IDs).

**2. Filtrar por género:**
```
GET http://localhost:3000/api/peliculas?genero=ciencia-ficcion
```

**3. Buscar por texto:**
```
GET http://localhost:3000/api/peliculas?buscar=nolan
```

**4. Crear una película nueva:**
```
POST http://localhost:3000/api/peliculas
Body: {
  "titulo": "Tenet",
  "anio": 2020,
  "nota": 7.4,
  "director_id": 1,
  "genero_id": 1
}
```
Verifica en psql: `SELECT * FROM peliculas ORDER BY id DESC LIMIT 1;`

**5. Estadísticas:**
```
GET http://localhost:3000/api/estadisticas
```

**6. Persistencia** — el test definitivo:
- Crea una película vía POST
- Reinicia el servidor (Ctrl+C, `npm run dev`)
- Haz GET /api/peliculas
- La película creada debe seguir ahí

## Paso 9: Consultas SQL adicionales

Practica estas consultas directamente en psql (no en la API):

```sql
-- 1. Listar directores con el número de películas de cada uno
SELECT d.nombre, COUNT(p.id) AS num_peliculas
FROM directores d
LEFT JOIN peliculas p ON p.director_id = d.id
GROUP BY d.id, d.nombre
ORDER BY num_peliculas DESC;

-- 2. Películas con su nota media de reseñas (vs. la nota oficial)
SELECT
  p.titulo,
  p.nota AS nota_oficial,
  ROUND(AVG(r.puntuacion)::numeric, 1) AS media_resenas,
  COUNT(r.id) AS num_resenas
FROM peliculas p
LEFT JOIN resenas r ON r.pelicula_id = p.id
GROUP BY p.id, p.titulo, p.nota
ORDER BY num_resenas DESC;

-- 3. Las 3 películas mejor valoradas por los usuarios (media de reseñas)
SELECT p.titulo, ROUND(AVG(r.puntuacion)::numeric, 2) AS media
FROM peliculas p
INNER JOIN resenas r ON r.pelicula_id = p.id
GROUP BY p.id, p.titulo
HAVING COUNT(r.id) >= 2
ORDER BY media DESC
LIMIT 3;
```

## Criterios de evaluación

- [ ] `GET /api/peliculas` devuelve datos de PostgreSQL con el nombre del director y género
- [ ] Los filtros `?genero=` y `?buscar=` funcionan con consultas SQL reales
- [ ] `POST /api/peliculas` guarda en la base de datos y persiste tras reiniciar
- [ ] `DELETE /api/peliculas/:id` elimina de la base de datos
- [ ] `GET /api/peliculas/:id/resenas` devuelve las reseñas de la DB
- [ ] Los parámetros en las consultas usan `$1`, `$2`, etc. (nunca concatenación de strings)
- [ ] `GET /api/estadisticas` usa una consulta SQL con `AVG`, `MAX`, `MIN`

## Bonus

1. **Transacción**: Implementa un endpoint `POST /api/peliculas/:id/calificar` que en una **sola transacción** inserte una reseña Y actualice la nota de la película con la nueva media. Si una operación falla, usa `ROLLBACK`.

2. **Paginación real**: Modifica `GET /api/peliculas` para soportar `?pagina=1&limite=3` usando `LIMIT` y `OFFSET` en SQL. La respuesta debe incluir `{ data, total, pagina, totalPaginas }`.

3. **Endpoint de directores**: Crea `GET /api/directores` y `GET /api/directores/:id/peliculas` que devuelva un director con todas sus películas.