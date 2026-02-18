const net = require('net');

const PORT = 6010;
const HOST = '0.0.0.0'; // Listen on all network interfaces

const server = net.createServer((socket) => {
    // Log connection status
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`[+] New connection from: ${clientAddress}`);

    // Handle incoming data
    socket.on('data', (data) => {
        console.log(`[Data from ${clientAddress}]: ${data.toString().trim()}`);
    });

    // Handle client disconnection
    socket.on('end', () => {
        console.log(`[-] Client disconnected: ${clientAddress}`);
    });

    // Handle socket errors (e.g., sudden connection resets)
    socket.on('error', (err) => {
        console.error(`[!] Socket error: ${err.message}`);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`[*] TCP Server is running on ${HOST}:${PORT}`);
});
