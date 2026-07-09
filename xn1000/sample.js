#!/usr/bin/env node

"use strict";

const net = require('net');

const SERVER_HOST = '127.0.0.1';  
const SERVER_PORT = 6000;

// Sample Sysmex XN-1000 data packets
const sampleData = {
    // Initial handshake message
    d1u: "\x02D1U   XN-1000^111340000000004000\x03",
    
    // Sample result data with different specimen IDs
    results: [
        // Sample 1 - Normal values
        "\x02D2U   XN-1000^111340000000004000         KCH26000000020101200395001190039400997003010030220297002104006240713400070000840021340006340072140000700000840142005100011500101002590015500612001350086500115000200003000000000000000000540005400000002020\x03",
        
        // Sample 2 - Different patient
        "\x02D2U   XN-1000^111340000000004000         KCH26000000030102150425001250042401087003210032240317002304007260763400080001850023340007350082240000800001850152006100013500121003090017500692001550096500135000300004000000000000000000590006400000002120\x03",
        
        // Sample 3 - Abnormal values (high WBC)
        "\x02D2U   XN-1000^111340000000004000         KCH26000000040103250525001350045401197003410034260337002504008280813400090002860025340008360092340000900002860162007100015500141003590019500772001750106500155000400005000000000000000000640007400000002220\x03"
    ],
    
    // R1000 acknowledgment request
    r1000: "\x02R1000\x03"
};

function connectAndSend() {
    const client = new net.Socket();
    
    client.connect(SERVER_PORT, SERVER_HOST, function() {
        console.log('Connected to Sysmex server');
        console.log(`Server: ${SERVER_HOST}:${SERVER_PORT}\n`);
        
        console.log('Sending D1U handshake...');
        client.write(sampleData.d1u);
        
        setTimeout(() => {
            sendResultData(client, 0);
        }, 1000);
    });
    
    client.on('data', function(data) {
        console.log('Received from server:', data.toString());
    });
    
    client.on('close', function() {
        console.log('\nConnection closed');
    });
    
    client.on('error', function(err) {
        console.error('Connection error:', err.message);
    });
}

// Send result data with delays between samples
function sendResultData(client, index) {
    if (index >= sampleData.results.length) {
        setTimeout(() => {
            console.log('\nSending R1000 final message...');
            client.write(sampleData.r1000);
            
            setTimeout(() => {
                client.end();
            }, 1000);
        }, 2000);
        return;
    }
    
    console.log(`\nSending sample ${index + 1} of ${sampleData.results.length}...`);
    
    // Extract specimen ID from the data
    const data = sampleData.results[index];
    const cleanData = data.replace(/\x02|\x03/g, '');
    const specimenId = cleanData.substr(44, 10);
    console.log(`Specimen ID: ${specimenId}`);
    
    client.write(sampleData.results[index]);
    
    setTimeout(() => {
        sendResultData(client, index + 1);
    }, 3000);  
}



console.log('=== Sysmex XN-1000 Client Simulator ===\n');

setTimeout(() => {
    connectAndSend();
}, 1000);