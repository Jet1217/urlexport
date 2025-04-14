const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 3000; // Make sure this matches your .env PORT
const HOST = 'localhost';

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Test health endpoint
function testHealth() {
    console.log('Testing health endpoint...');

    const options = {
        hostname: HOST,
        port: PORT,
        path: '/health',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`Health Check Status: ${res.statusCode}`);
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`Health Response: ${data}`);
            if (res.statusCode === 200) {
                console.log('Health check successful! ✅');
                testPdfExport();
            } else {
                console.error('Health check failed! ❌');
            }
        });
    });

    req.on('error', (error) => {
        console.error('Health Check Error:', error.message);
        console.log('Is the server running? Make sure to start with: node src/index.js');
    });

    req.end();
}

// Test PDF export endpoint
function testPdfExport() {
    console.log('\nTesting PDF export endpoint...');

    const testUrl = 'https://hihdlsso.gleancard.com/';
    const filename = 'test-example.pdf';
    const outputPath = path.join(outputDir, filename);

    console.log(`Exporting ${testUrl} to PDF...`);

    const options = {
        hostname: HOST,
        port: PORT,
        path: `/export/pdf?url=${encodeURIComponent(testUrl)}&filename=${encodeURIComponent(filename)}`,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`PDF Export Status: ${res.statusCode}`);

        if (res.statusCode === 200) {
            const fileStream = fs.createWriteStream(outputPath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                console.log(`PDF saved to ${outputPath} ✅`);
                testImageExport();
            });

            fileStream.on('error', (error) => {
                console.error('Error saving PDF:', error.message);
            });
        } else {
            let errorData = '';
            res.on('data', (chunk) => {
                errorData += chunk;
            });

            res.on('end', () => {
                console.error('PDF Export Failed:', errorData);
                // Still try the image export even if PDF fails
                testImageExport();
            });
        }
    });

    req.on('error', (error) => {
        console.error('PDF Export Request Error:', error.message);
        // Still try the image export even if PDF fails
        testImageExport();
    });

    req.end();
}

// Test Image export endpoint
function testImageExport() {
    console.log('\nTesting Image export endpoint...');

    const testUrl = 'https://hihdlsso.gleancard.com/';
    const filename = 'test-example.png';
    const outputPath = path.join(outputDir, filename);

    console.log(`Exporting ${testUrl} to PNG image...`);

    const options = {
        hostname: HOST,
        port: PORT,
        path: `/export/image?url=${encodeURIComponent(testUrl)}&filename=${encodeURIComponent(filename)}&format=png&fullPage=true`,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`Image Export Status: ${res.statusCode}`);

        if (res.statusCode === 200) {
            const fileStream = fs.createWriteStream(outputPath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                console.log(`Image saved to ${outputPath} ✅`);
                console.log('\nAll tests completed!');
            });

            fileStream.on('error', (error) => {
                console.error('Error saving Image:', error.message);
            });
        } else {
            let errorData = '';
            res.on('data', (chunk) => {
                errorData += chunk;
            });

            res.on('end', () => {
                console.error('Image Export Failed:', errorData);
                console.log('\nTests completed with errors!');
            });
        }
    });

    req.on('error', (error) => {
        console.error('Image Export Request Error:', error.message);
        console.log('\nTests completed with errors!');
    });

    req.end();
}

// Start tests
console.log('Starting API tests...');
console.log(`Server: http://${HOST}:${PORT}`);
console.log(`Output directory: ${outputDir}\n`);
testHealth(); 