const { TIMEOUT } = require('../utils/constants');
const { getBrowser, setupPage } = require('../utils/browser');

/**
 * 导出网站为PDF
 */
const exportPDF = async (req, res) => {
    const { url, filename = 'export.pdf' } = req.query;

    if (!url) {
        return res.status(400).send({ error: 'URL is required' });
    }

    console.log(`PDF Export request for URL: ${url}`);
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

            // 获取页面尺寸，以确定PDF设置
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

            // 先获取页面实际高度，确定PDF页数
            const pageCount = await page.evaluate(() => {
                const height = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.offsetHeight
                );
                // 估算需要的页数 (A4高度约为1123px at 96dpi)
                return Math.max(1, Math.ceil(height / 1123));
            });

            console.log(`Estimated page count: ${pageCount}, dimensions:`, dimensions);

            // Generate PDF with enhanced options
            console.log('Generating PDF');
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
                scale: 0.8, // 缩小比例以适应更多内容
                displayHeaderFooter: false,
                landscape: dimensions.width > dimensions.height,
                preferCSSPageSize: true, // 使用CSS页面大小设置
                width: '210mm',  // A4宽度
                height: '297mm',  // A4高度
                // 确保捕获所有页面内容
                pageRanges: `1-${Math.min(pageCount + 5, 100)}`, // 设置页码范围，多设置几页以防万一
                timeout: 60000, // 增加超时时间，以便字体处理
            });

            console.log('PDF generated successfully');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(pdf);
        })();

        // Race between timeout and export
        await Promise.race([exportPromise, timeoutPromise]);
    } catch (error) {
        console.error('PDF Export Error:', error);
        console.error('Error details:', error.message);
        if (error.stack) console.error('Stack trace:', error.stack);
        res.status(500).send({ error: 'Failed to export PDF', message: error.message });
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
    exportPDF
}; 