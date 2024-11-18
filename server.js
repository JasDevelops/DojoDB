// Import Modules
const http = require('http'); // to set up server
const url = require('url');  // to grab and read URL request sent by user
const fs = require('fs'); // to send back appropriate file

http.createServer((request, response) => { // Create server
    let addr = request.url, // addr is declared with assigned request.url function
    q = new URL(addr, 'http://localhost:8080'), // Create q to  hold new URL (parsed URL from user)
    filePath = ''; // Store the path of the file

    fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date () + '\n\n', (err) => { // Takes 3 arguments: 1- file path ('log.txt'), 2- data to be appended, 3- error-handling function (callback function)
        if (err) {
            console.log(err); // Log errors if they occur
        } else {
            console.log('Added to log.');
        }
    });

    if (q.pathname.includes('documentation')) { // Check if pathname of entered URL contains the word "documentation"
        filePath = __dirname + '/documentation.html'; // If yes, use "documentation.html"
    } else {
        filePath = __dirname + '/index.html'; // If not, use "index.html"
    }
    fs.readFile(filePath, (err, data) => { // Gets appropriate file from server via filePath variable
        if (err) {
            throw err;
        }
        response.writeHead(200, {'Content-Type': 'text/html'}); // Set header with HTTP status code of 200
        response.write(data);
        response.end();
    });
}).listen(8080); // Server listens on port 8080
console.log('My 1st Node server is running on port 8080.');