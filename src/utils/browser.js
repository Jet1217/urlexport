const puppeteer = require('puppeteer');

// Launch options for Puppeteer that work well on Render
const getBrowser = async () => {
    const isDev = process.env.NODE_ENV === 'development';
    const options = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--font-render-hinting=none',
            '--disable-web-security',
            '--allow-file-access-from-files'
        ],
        ignoreHTTPSErrors: true
    };

    // In production, use single-process mode and specific executable path if available
    if (!isDev) {
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }
    }

    console.log('Launching browser with options:', JSON.stringify(options, null, 2));
    return puppeteer.launch(options);
};

// Helper function to setup page with optimizations
async function setupPage(browser, url) {
    console.log('Setting up page for export:', { url });
    const page = await browser.newPage();

    try {
        // 设置更高的超时时间
        await page.setDefaultNavigationTimeout(60000);
        await page.setDefaultTimeout(60000);

        // Set viewport to a reasonable default size
        await page.setViewport({
            width: 1280,
            height: 900,
            deviceScaleFactor: 1.5, // 使用更高的设备缩放比例以获得更好的渲染质量
        });

        // 设置更好的浏览器选项
        await page.emulateMediaType('screen'); // 使用屏幕媒体类型以确保样式正确应用

        // 启用JavaScript和CSS
        await page.setJavaScriptEnabled(true);

        // Set user agent to a modern browser
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 禁用可能干扰渲染的动画
        await page.evaluateOnNewDocument(() => {
            const disableAnimations = `
                *,
                *::before,
                *::after {
                    animation-duration: 0.001s !important;
                    transition-duration: 0.001s !important;
                    animation-iteration-count: 1 !important;
                    scroll-behavior: auto !important;
                }
            `;

            // 添加样式以禁用动画
            const style = document.createElement('style');
            style.innerHTML = disableAnimations;
            document.head.appendChild(style);

            // 确保页面包含中文字体支持
            const fontStyle = document.createElement('style');
            fontStyle.innerHTML = `
                @font-face {
                    font-family: 'Noto Sans CJK SC';
                    src: local('Noto Sans CJK SC'), local('Microsoft YaHei'), local('PingFang SC'), local('Hiragino Sans GB');
                    font-weight: normal;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Noto Sans CJK TC';
                    src: local('Noto Sans CJK TC'), local('Microsoft JhengHei'), local('PingFang TC');
                    font-weight: normal;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Noto Sans CJK JP';
                    src: local('Noto Sans CJK JP'), local('Hiragino Kaku Gothic ProN'), local('Yu Gothic');
                    font-weight: normal;
                    font-style: normal;
                }
                
                body, p, h1, h2, h3, h4, h5, h6, div, span, a, button, input, textarea, select, option, li, td, th {
                    font-family: 'Noto Sans CJK SC', 'Microsoft YaHei', 'PingFang SC', 'SimSun', 'Noto Sans CJK TC', 'Noto Sans CJK JP', 'Hiragino Sans GB', sans-serif !important;
                }
            `;
            document.head.appendChild(fontStyle);
        });

        // Configure request interception for better stability
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            // 可以选择性地阻止某些请求以提高性能
            // 但这里我们让所有请求通过以确保完整渲染
            request.continue();
        });

        // Enable console logging from the page for debugging
        page.on('console', msg => console.log('Browser console:', msg.text()));
        page.on('pageerror', err => console.error('Browser page error:', err));

        // 监控请求以确保加载完成
        let pendingRequests = 0;
        page.on('request', () => pendingRequests++);
        page.on('requestfinished', () => pendingRequests--);
        page.on('requestfailed', () => pendingRequests--);

        // Navigate to URL with retry logic
        console.log(`Navigating to ${url}`);
        let retryCount = 0;
        const maxRetries = 3;

        async function tryNavigation() {
            try {
                // 使用更严格的等待条件
                const response = await page.goto(url, {
                    waitUntil: ['networkidle2', 'load', 'domcontentloaded'],
                    timeout: 30000
                });

                if (!response) {
                    throw new Error('Navigation failed to return a response');
                }

                if (!response.ok()) {
                    throw new Error(`Page load failed with status: ${response.status()}`);
                }

                console.log('Navigation completed successfully');
                return true;
            } catch (navError) {
                console.error(`Navigation error (attempt ${retryCount + 1}/${maxRetries}):`, navError.message);
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log(`Retrying navigation to ${url} with simpler options...`);
                    try {
                        // If first attempt fails, try with minimal options
                        const response = await page.goto(url, {
                            waitUntil: 'domcontentloaded',
                            timeout: 40000
                        });

                        if (response && response.ok()) {
                            console.log('Navigation completed with fallback options');
                            return true;
                        }
                    } catch (retryError) {
                        console.error('Retry navigation error:', retryError.message);
                    }
                    return tryNavigation();
                } else {
                    throw new Error(`Failed to navigate after ${maxRetries} attempts: ${navError.message}`);
                }
            }
        }

        await tryNavigation();

        // 等待所有网络请求完成（最多等待10秒）
        const networkIdlePromise = new Promise((resolve) => {
            const startTime = Date.now();
            const checkNetworkIdle = () => {
                if (pendingRequests <= 0 || Date.now() - startTime > 10000) {
                    resolve(true);
                } else {
                    setTimeout(checkNetworkIdle, 100);
                }
            };
            checkNetworkIdle();
        });

        await networkIdlePromise;

        // Wait for content to be fully rendered
        try {
            await page.waitForFunction(() => {
                return document.readyState === 'complete' && document.body.querySelector('*');
            }, { timeout: 15000 });
        } catch (waitError) {
            console.warn('Wait for page content warning:', waitError.message);
            // Continue anyway, some content might be available
        }

        // 等待懒加载图片完成
        try {
            await page.evaluate(() => {
                return new Promise((resolve) => {
                    // 检查所有图片是否加载完成
                    const checkImagesLoaded = () => {
                        const images = Array.from(document.querySelectorAll('img'));
                        const allLoaded = images.every(img => img.complete);

                        if (allLoaded || images.length === 0) {
                            resolve(true);
                        } else {
                            setTimeout(checkImagesLoaded, 500);
                        }
                    };

                    setTimeout(checkImagesLoaded, 1000); // 给予一些初始时间
                });
            });
        } catch (imgError) {
            console.warn('Wait for images warning:', imgError.message);
        }

        // 尝试滚动页面以触发懒加载内容
        await autoScroll(page);

        // 增加页面初始化后的等待时间，确保JavaScript完全执行
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 注入中文字体支持和PDF打印相关样式
        await page.addStyleTag({
            content: `
                * {
                    font-family: 'Export Font', Arial, sans-serif !important;
                }
                
                /* 强制所有文本元素使用我们定义的字体 */
                body, h1, h2, h3, h4, h5, h6, p, div, span, a, button, input, textarea, select, li, td, th {
                    font-family: 'Export Font', Arial, sans-serif !important;
                }
                
                @page {
                    margin: 1cm;
                    size: A4;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* 防止页面截断 */
                    .page-break {
                        page-break-after: always;
                    }
                }
            `
        });

        // Apply optimizations for better rendering
        await page.evaluate(() => {
            try {
                // Safely handle DOM manipulations with try/catch
                const elementsToRemove = document.querySelectorAll('.no-export');
                elementsToRemove.forEach(el => el.remove());

                // Override any theme or default styles that might apply the gray background
                const transparentBackgroundStyle = document.createElement('style');
                transparentBackgroundStyle.innerHTML = `
                    .bg-base-100 {
                        background-color: transparent !important;
                    }
                `;
                document.head.appendChild(transparentBackgroundStyle);

                // Ensure all elements are visible and properly rendered with appropriate type casting
                const elements = document.querySelectorAll('*');
                elements.forEach(el => {
                    try {
                        const htmlEl = el;
                        htmlEl.style.maxHeight = 'none';
                        htmlEl.style.overflow = 'visible';
                        if (htmlEl.style.display === 'none') {
                            // Skip hidden elements
                            return;
                        }
                        // 移除任何可能导致内容被截断的样式
                        htmlEl.style.pageBreakInside = 'auto';
                        htmlEl.style.breakInside = 'auto';
                        htmlEl.style.position = htmlEl.style.position === 'fixed' ? 'absolute' : htmlEl.style.position;
                    } catch (err) {
                        console.error('Failed to modify element style', err);
                    }
                });

                // Make images responsive
                const images = document.querySelectorAll('img');
                images.forEach(img => {
                    try {
                        const imgEl = img;
                        // 确保图片加载完成
                        if (!imgEl.complete) {
                            imgEl.style.visibility = 'visible';
                        }
                        imgEl.style.width = '100%';
                        imgEl.style.maxWidth = '100%';
                    } catch (err) {
                        console.error('Failed to modify image style', err);
                    }
                });

                // 确保页面内所有iframe内容都被捕获
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    try {
                        iframe.style.height = 'auto';
                        iframe.style.width = '100%';
                        iframe.style.maxWidth = '100%';
                    } catch (err) {
                        console.error('Failed to modify iframe style', err);
                    }
                });

                // 移除可能限制内容完整显示的全局样式元素
                document.querySelectorAll('style').forEach(style => {
                    try {
                        const text = style.textContent || '';
                        if (text.includes('overflow:') || text.includes('max-height:') ||
                            text.includes('position: fixed') || text.includes('break-inside:')) {
                            // 修改可能限制内容显示的样式
                            style.textContent = text
                                .replace(/overflow\s*:\s*hidden/g, 'overflow: visible')
                                .replace(/max-height\s*:/g, 'min-height:')
                                .replace(/position\s*:\s*fixed/g, 'position: absolute')
                                .replace(/break-inside\s*:\s*avoid/g, 'break-inside: auto');
                        }
                    } catch (err) {
                        console.error('Failed to process style element', err);
                    }
                });

                document.body.style.height = 'auto';
                document.body.style.overflow = 'visible';
                document.body.style.width = '100%';
                document.documentElement.style.height = 'auto';
                document.documentElement.style.overflow = 'visible';

                // 强制确保内容显示完整
                window.scrollTo(0, document.body.scrollHeight);
            } catch (err) {
                console.error('Error in page evaluation:', err);
            }
        });

        // 再次等待以确保DOM更新完成
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if page content is available
        const contentCheck = await page.evaluate(() => {
            const bodyHtml = document.body.innerHTML;
            return {
                hasContent: bodyHtml.length > 100,
                htmlLength: bodyHtml.length,
                hasBody: !!document.body,
                hasImages: document.querySelectorAll('img').length > 0,
                hasDivs: document.querySelectorAll('div').length > 0
            };
        });

        console.log('Content check:', contentCheck);

        if (!contentCheck.hasContent) {
            console.warn('Page has minimal content, quality may be affected');
        }

        return page;
    } catch (error) {
        console.error('Setup page error:', error);

        // Attempt to capture error state for debugging
        try {
            const html = await page.content();
            console.error('Page HTML at error:', html.substring(0, 500) + '...');
        } catch (debugError) {
            console.error('Error capturing debug info:', debugError);
        }

        await page.close();
        throw error;
    }
}

// 自动滚动页面函数，触发懒加载内容
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const maxScrolls = 100; // 防止无限滚动
            let scrollCount = 0;

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrollCount++;

                if (totalHeight >= scrollHeight || scrollCount > maxScrolls) {
                    clearInterval(timer);
                    // 滚动回顶部
                    window.scrollTo(0, 0);
                    resolve(true);
                }
            }, 100);
        });
    });
}

module.exports = {
    getBrowser,
    setupPage,
    autoScroll
}; 