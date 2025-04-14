const pdfRoutes = require('./pdfRoutes');
const imageRoutes = require('./imageRoutes');
const homeRoutes = require('./homeRoutes');

/**
 * 注册所有路由
 */
const setupRoutes = (app) => {
    // 使用各个路由模块
    app.use(pdfRoutes);
    app.use(imageRoutes);
    app.use(homeRoutes);
};

module.exports = setupRoutes; 