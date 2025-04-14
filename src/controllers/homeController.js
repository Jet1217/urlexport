/**
 * 健康检查
 */
const healthCheck = (req, res) => {
    res.status(200).send({ status: 'ok' });
};

/**
 * 渲染主页
 */
const renderHomePage = (req, res) => {
    res.send(`
    <html>
      <head>
        <title>Website Export Service</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          code {
            background-color: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
          }
          pre {
            background-color: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <h1>Website Export Service</h1>
        <p>This service allows you to export websites as PDF or image files.</p>
        
        <h2>PDF Export</h2>
        <p>Endpoint: <code>/export/pdf</code></p>
        <p>Parameters:</p>
        <ul>
          <li><code>url</code>: The website URL to export (required)</li>
          <li><code>filename</code>: Name of the download file (default: export.pdf)</li>
        </ul>
        <p>Example:</p>
        <pre>/export/pdf?url=https://example.com&filename=example.pdf</pre>
        
        <h2>Image Export</h2>
        <p>Endpoint: <code>/export/image</code></p>
        <p>Parameters:</p>
        <ul>
          <li><code>url</code>: The website URL to export (required)</li>
          <li><code>filename</code>: Name of the download file (default: export.png)</li>
          <li><code>format</code>: Image format, 'png' or 'jpeg' (default: png)</li>
          <li><code>fullPage</code>: Whether to capture the full page, 'true' or 'false' (default: true)</li>
        </ul>
        <p>Example:</p>
        <pre>/export/image?url=https://example.com&filename=example.png&format=png&fullPage=true</pre>
      </body>
    </html>
  `);
};

module.exports = {
    healthCheck,
    renderHomePage
}; 