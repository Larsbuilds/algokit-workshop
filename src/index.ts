import algosdk from 'algosdk';

// Create an algod client
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'http://localhost';
const algodPort = 4001;

const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

async function main() {
    try {
        // Get the current status
        const status = await algodClient.status().do();
        console.log('Algorand node status:', status);
    } catch (err) {
        console.error('Error:', err);
    }
}

main(); 