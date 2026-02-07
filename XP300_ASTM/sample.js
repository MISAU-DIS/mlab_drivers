#!/usr/bin/env node

"use strict";

const net = require('net');

// Server configuration
const SERVER_HOST = '127.0.0.1';  // Change to your server's IP
const SERVER_PORT = 6010;          // Default XP-300 port (update if different)

// Control characters
const STX = '\x02';
const ETX = '\x03';
const CR = '\r';
const LF = '\n';
const ACK = '\x06';

// Sample XP-300 ASTM messages - Based on real XP-300 output
const sampleMessages = {
    // Sample 1 - Real format from actual XP-300 (specimen: 2300013216)
    sample1: [
        `H|\\^&|||XP-300^00-07^^^^A1573^AP807129||||||||E1394-97`,
        `P|1`,
        `O|1||^^     2300013216^B|^^^^WBC\\^^^^RBC\\^^^^HGB\\^^^^HCT\\^^^^MCV\\^^^^MCH\\^^^^MCHC\\^^^^PLT\\^^^^LYM%\\^^^^MXD%\\^^^^NEUT%\\^^^^LYM#\\^^^^MXD#\\^^^^NEUT#\\^^^^RDW-SD\\^^^^RDW-CV\\^^^^PDW\\^^^^MPV\\^^^^P-LCR\\^^^^PCT|||||||N||||||||||||||F`,
        `R|1|^^^^WBC^1|  4.8|10*3/uL||W||||WESLEY         ||20231115103722`,
        `R|2|^^^^RBC^1| 3.69|10*6/uL||L||||WESLEY         ||20231115103722`,
        `R|3|^^^^HGB^1| 11.8|g/dL||N||||WESLEY         ||20231115103722`,
        `R|4|^^^^HCT^1| 35.6|%||N||||WESLEY         ||20231115103722`,
        `R|5|^^^^MCV^1| 96.5|fL||H||||WESLEY         ||20231115103722`,
        `R|6|^^^^MCH^1| 32.0|pg||N||||WESLEY         ||20231115103722`,
        `R|7|^^^^MCHC^1| 33.1|g/dL||N||||WESLEY         ||20231115103722`,
        `R|8|^^^^PLT^1|   78|10*3/uL||W||||WESLEY         ||20231115103722`,
        `R|9|^^^^LYM%^1| 54.1|%||W||||WESLEY         ||20231115103722`,
        `R|10|^^^^MXD%^1|  8.7|%||W||||WESLEY         ||20231115103722`,
        `R|11|^^^^NEUT%^1| 37.2|%||W||||WESLEY         ||20231115103722`,
        `R|12|^^^^LYM#^1|  2.6|10*3/uL||W||||WESLEY         ||20231115103722`,
        `R|13|^^^^MXD#^1|  0.4|10*3/uL||W||||WESLEY         ||20231115103722`,
        `R|14|^^^^NEUT#^1|  1.8|10*3/uL||W||||WESLEY         ||20231115103722`,
        `R|15|^^^^RDW-SD^1| 41.1|fL||N||||WESLEY         ||20231115103722`,
        `R|16|^^^^RDW-CV^1| 11.8|%||N||||WESLEY         ||20231115103722`,
        `R|17|^^^^PDW^1| 21.1|fL||H||||WESLEY         ||20231115103722`,
        `R|18|^^^^MPV^1| 12.1|fL||N||||WESLEY         ||20231115103722`,
        `R|19|^^^^P-LCR^1| 39.6|%||N||||WESLEY         ||20231115103722`,
        `R|20|^^^^PCT^1| 0.10|%||W||||WESLEY         ||20231115103722`,
        `L|1|N`
    ],

    // Sample 2 - Normal CBC values (specimen: 2300013217)
    sample2: [
        `H|\\^&|||XP-300^00-07^^^^A1573^AP807129||||||||E1394-97`,
        `P|1`,
        `O|1||^^     2300013217^B|^^^^WBC\\^^^^RBC\\^^^^HGB\\^^^^HCT\\^^^^MCV\\^^^^MCH\\^^^^MCHC\\^^^^PLT\\^^^^LYM%\\^^^^MXD%\\^^^^NEUT%\\^^^^LYM#\\^^^^MXD#\\^^^^NEUT#\\^^^^RDW-SD\\^^^^RDW-CV\\^^^^PDW\\^^^^MPV\\^^^^P-LCR\\^^^^PCT|||||||N||||||||||||||F`,
        `R|1|^^^^WBC^1|  7.2|10*3/uL||N||||WESLEY         ||20231115110000`,
        `R|2|^^^^RBC^1| 4.50|10*6/uL||N||||WESLEY         ||20231115110000`,
        `R|3|^^^^HGB^1| 14.2|g/dL||N||||WESLEY         ||20231115110000`,
        `R|4|^^^^HCT^1| 42.5|%||N||||WESLEY         ||20231115110000`,
        `R|5|^^^^MCV^1| 88.9|fL||N||||WESLEY         ||20231115110000`,
        `R|6|^^^^MCH^1| 31.6|pg||N||||WESLEY         ||20231115110000`,
        `R|7|^^^^MCHC^1| 33.4|g/dL||N||||WESLEY         ||20231115110000`,
        `R|8|^^^^PLT^1|  250|10*3/uL||N||||WESLEY         ||20231115110000`,
        `R|9|^^^^LYM%^1| 28.5|%||N||||WESLEY         ||20231115110000`,
        `R|10|^^^^MXD%^1|  9.2|%||N||||WESLEY         ||20231115110000`,
        `R|11|^^^^NEUT%^1| 62.3|%||N||||WESLEY         ||20231115110000`,
        `R|12|^^^^LYM#^1|  2.1|10*3/uL||N||||WESLEY         ||20231115110000`,
        `R|13|^^^^MXD#^1|  0.7|10*3/uL||N||||WESLEY         ||20231115110000`,
        `R|14|^^^^NEUT#^1|  4.5|10*3/uL||N||||WESLEY         ||20231115110000`,
        `R|15|^^^^RDW-SD^1| 42.3|fL||N||||WESLEY         ||20231115110000`,
        `R|16|^^^^RDW-CV^1| 12.5|%||N||||WESLEY         ||20231115110000`,
        `R|17|^^^^PDW^1| 16.8|fL||N||||WESLEY         ||20231115110000`,
        `R|18|^^^^MPV^1| 10.5|fL||N||||WESLEY         ||20231115110000`,
        `R|19|^^^^P-LCR^1| 32.1|%||N||||WESLEY         ||20231115110000`,
        `R|20|^^^^PCT^1| 0.26|%||N||||WESLEY         ||20231115110000`,
        `L|1|N`
    ],

    // Sample 3 - Elevated WBC (specimen: 2300013218)
    sample3: [
        `H|\\^&|||XP-300^00-07^^^^A1573^AP807129||||||||E1394-97`,
        `P|1`,
        `O|1||^^     2300013218^B|^^^^WBC\\^^^^RBC\\^^^^HGB\\^^^^HCT\\^^^^MCV\\^^^^MCH\\^^^^MCHC\\^^^^PLT\\^^^^LYM%\\^^^^MXD%\\^^^^NEUT%\\^^^^LYM#\\^^^^MXD#\\^^^^NEUT#\\^^^^RDW-SD\\^^^^RDW-CV\\^^^^PDW\\^^^^MPV\\^^^^P-LCR\\^^^^PCT|||||||N||||||||||||||F`,
        `R|1|^^^^WBC^1| 15.3|10*3/uL||H||||WESLEY         ||20231115112000`,
        `R|2|^^^^RBC^1| 4.85|10*6/uL||N||||WESLEY         ||20231115112000`,
        `R|3|^^^^HGB^1| 15.2|g/dL||N||||WESLEY         ||20231115112000`,
        `R|4|^^^^HCT^1| 45.8|%||N||||WESLEY         ||20231115112000`,
        `R|5|^^^^MCV^1| 91.2|fL||N||||WESLEY         ||20231115112000`,
        `R|6|^^^^MCH^1| 31.3|pg||N||||WESLEY         ||20231115112000`,
        `R|7|^^^^MCHC^1| 33.2|g/dL||N||||WESLEY         ||20231115112000`,
        `R|8|^^^^PLT^1|  320|10*3/uL||N||||WESLEY         ||20231115112000`,
        `R|9|^^^^LYM%^1| 18.5|%||L||||WESLEY         ||20231115112000`,
        `R|10|^^^^MXD%^1|  7.8|%||N||||WESLEY         ||20231115112000`,
        `R|11|^^^^NEUT%^1| 73.7|%||H||||WESLEY         ||20231115112000`,
        `R|12|^^^^LYM#^1|  2.8|10*3/uL||N||||WESLEY         ||20231115112000`,
        `R|13|^^^^MXD#^1|  1.2|10*3/uL||H||||WESLEY         ||20231115112000`,
        `R|14|^^^^NEUT#^1| 11.3|10*3/uL||H||||WESLEY         ||20231115112000`,
        `R|15|^^^^RDW-SD^1| 43.5|fL||N||||WESLEY         ||20231115112000`,
        `R|16|^^^^RDW-CV^1| 12.8|%||N||||WESLEY         ||20231115112000`,
        `R|17|^^^^PDW^1| 17.2|fL||N||||WESLEY         ||20231115112000`,
        `R|18|^^^^MPV^1| 10.8|fL||N||||WESLEY         ||20231115112000`,
        `R|19|^^^^P-LCR^1| 33.5|%||N||||WESLEY         ||20231115112000`,
        `R|20|^^^^PCT^1| 0.35|%||N||||WESLEY         ||20231115112000`,
        `L|1|N`
    ]
};

function sendMessage(client, messageLines) {
    return new Promise((resolve, reject) => {
        // Join all lines with \r\n as the server expects
        const fullMessage = messageLines.join(CR + LF) + CR + LF;
        
        console.log(`Sending complete message (${messageLines.length} lines)...`);
        console.log(`First line: ${messageLines[0]}`);
        console.log(`Last line: ${messageLines[messageLines.length - 1]}`);
        
        // Send the complete message at once
        client.write(fullMessage);

        // Handle ACK from server
        const dataHandler = (data) => {
            const response = data.toString();
            if (response.includes(ACK)) {
                console.log('✓ Received ACK from server');
                client.removeListener('data', dataHandler);
                resolve();
            }
        };

        client.on('data', dataHandler);

        // Timeout after 10 seconds
        setTimeout(() => {
            client.removeListener('data', dataHandler);
            reject(new Error('Timeout waiting for server ACK'));
        }, 10000);
    });
}

async function connectAndSend() {
    const client = new net.Socket();
    
    client.connect(SERVER_PORT, SERVER_HOST, async function() {
        console.log('Connected to Sysmex XP-300 server');
        console.log(`Server: ${SERVER_HOST}:${SERVER_PORT}\n`);
        
        try {
            // Send Sample 1
            console.log('\n=== Sending Sample 1 (Low RBC/PLT) ===');
            console.log('Specimen ID: 2300013216');
            await sendMessage(client, sampleMessages.sample1);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Send Sample 2
            console.log('\n=== Sending Sample 2 (Normal CBC) ===');
            console.log('Specimen ID: 2300013217');
            await sendMessage(client, sampleMessages.sample2);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Send Sample 3
            console.log('\n=== Sending Sample 3 (Elevated WBC) ===');
            console.log('Specimen ID: 2300013218');
            await sendMessage(client, sampleMessages.sample3);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n=== All samples sent successfully ===');
            client.end();
        } catch (error) {
            console.error('Error sending data:', error.message);
            client.end();
        }
    });
    
    client.on('close', function() {
        console.log('\nConnection closed');
    });
    
    client.on('error', function(err) {
        console.error('Connection error:', err.message);
    });
}

// Parse ASTM message to display parameters
function parseASTMMessage(lines) {
    console.log('\nParsed Parameters:');
    lines.forEach(line => {
        if (line.startsWith('R|')) {
            const parts = line.split('|');
            if (parts.length >= 4) {
                const paramMatch = parts[2].match(/\^\^\^\^([\w%#-]+)\^1/);
                const value = parts[3];
                const unit = parts[4];
                if (paramMatch) {
                    console.log(`  ${paramMatch[1]}: ${value} ${unit}`);
                }
            }
        } else if (line.startsWith('O|')) {
            const parts = line.split('|');
            const specimenMatch = parts[2].match(/(\d+)\^/);
            if (specimenMatch) {
                console.log(`  Specimen ID: ${specimenMatch[1]}`);
            }
        }
    });
}

// Main execution
console.log('=== Sysmex XP-300 Client Simulator ===\n');
console.log('This script sends ASTM-formatted sample data to the XP-300 server.');
console.log('Make sure the server is running before starting.\n');

// Display sample info
console.log('Sample Data Summary:');
console.log('  Sample 1: Low RBC/PLT with elevated MCV (2300013216)');
console.log('  Sample 2: Normal CBC values (2300013217)');
console.log('  Sample 3: Elevated WBC with neutrophilia (2300013218)\n');

// Start connection
setTimeout(() => {
    connectAndSend();
}, 1000);