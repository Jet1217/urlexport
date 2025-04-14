const { TIMEOUT } = require('../utils/constants');
const { getBrowser, setupPage } = require('../utils/browser');

/**
 * 导出网站为图片
 */
const exportImage = async (req, res) => {
    const { url, filename = 'export.png', format = 'png', fullPage = 'true' } = req.query;

    if (!url) {
        return res.status(400).send({ error: 'URL is required' });
    }

    console.log(`Image Export request for URL: ${url}`);

    const isFullPage = fullPage === 'true';
    const imageFormat = ['png', 'jpeg'].includes(format) ? format : 'png';
    let browser = null;
    let page = null;

    try {
        // Create a timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
        );

        // Export process
        const exportPromise = (async () => {
            browser = await getBrowser();
            console.log('Browser launched successfully');

            // 使用增强的页面设置
            page = await setupPage(browser, url);
            console.log('Page setup completed');

            // 获取页面实际尺寸
            const dimensions = await page.evaluate(() => {
                return {
                    height: Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight,
                        document.body.offsetHeight,
                        document.documentElement.offsetHeight
                    ),
                    width: Math.max(
                        document.body.scrollWidth,
                        document.documentElement.scrollWidth,
                        document.body.offsetWidth,
                        document.documentElement.offsetWidth
                    )
                };
            });

            console.log('Page dimensions:', dimensions);

            // 设置适当的视口大小
            await page.setViewport({
                width: Math.min(dimensions.width || 1200, 1920),  // Cap width to reasonable size
                height: Math.min(dimensions.height || 800, 30000),  // 增加最大高度限制，确保长页面可以被完整捕获
                deviceScaleFactor: 1.5,  // Higher quality
            });

            // Generate screenshot with enhanced options
            console.log(`Generating ${imageFormat} screenshot (fullPage: ${isFullPage})`);
            const screenshot = await page.screenshot({
                fullPage: isFullPage,
                type: imageFormat,
                omitBackground: false,
                quality: imageFormat === 'jpeg' ? 90 : undefined,
                captureBeyondViewport: true  // 捕获视口之外的内容
            });

            console.log('Screenshot generated successfully');

            res.setHeader('Content-Type', `image/${imageFormat}`);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(screenshot);
        })();

        // Race between timeout and export
        await Promise.race([exportPromise, timeoutPromise]);
    } catch (error) {
        console.error('Image Export Error:', error);
        console.error('Error details:', error.message);
        if (error.stack) console.error('Stack trace:', error.stack);
        res.status(500).send({ error: 'Failed to export image', message: error.message });
    } finally {
        if (page) {
            console.log('Closing page');
            try {
                await page.close();
                console.log('Page closed successfully');
            } catch (closeError) {
                console.error('Error closing page:', closeError);
            }
        }
        if (browser) {
            console.log('Closing browser');
            try {
                await browser.close();
                console.log('Browser closed successfully');
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
    }
};

module.exports = {
    exportImage
}; 