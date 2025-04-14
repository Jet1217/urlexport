const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const express = require('express');

/**
 * 设置通用中间件
 */
const setupMiddleware = (app) => {
    // Enable CORS for all routes
    app.use(cors());

    // Security headers (but disable CSP for PDF export functionality)
    app.use(helmet({ contentSecurityPolicy: false }));

    // Compress responses
    app.use(compression());

    // Parse JSON request bodies
    app.use(express.json());

    // Serve static files from 'public' directory
    app.use(express.static('public'));
};

module.exports = {
    setupMiddleware
}; 