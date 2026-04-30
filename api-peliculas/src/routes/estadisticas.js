const { Router } = require('express');
const { obtenerEstadisticas } = require('../controllers/peliculasController');

const router = Router();

router.get('/estadisticas', obtenerEstadisticas);

module.exports = router;