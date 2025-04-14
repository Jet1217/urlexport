const express = require('express');
const { exportPDF } = require('../controllers/pdfController');

const router = express.Router();

// PDF导出路由
router.get('/export/pdf', exportPDF);

module.exports = router; 