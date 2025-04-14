const express = require('express');
const { exportImage } = require('../controllers/imageController');

const router = express.Router();

// 图片导出路由
router.get('/export/image', exportImage);

module.exports = router; 