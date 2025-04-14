const express = require('express');
const { healthCheck, renderHomePage } = require('../controllers/homeController');

const router = express.Router();

// 健康检查路由
router.get('/health', healthCheck);

// 主页路由
router.get('/', renderHomePage);

module.exports = router; 