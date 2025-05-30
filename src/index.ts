import algosdk from 'algosdk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Create an algod client for Testnet
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Your GitHub username
const GITHUB_USERNAME = 'larsbuilds';

// Your account with Testnet ALGOs
const account = {
    addr: 'V7L2A7JTXJZXUVV5YJUSWFJAUUOGC2N4ZYXUJTRWH2HJ6RBV5QGUBCPOWA',
    sk: new Uint8Array(Buffer.from('xmU20HesI89YLYJO4kJoZmzP2xFIJvAsydb87J9y3Zqv16B9M7pzela9wmkrFSClHGFpvM4vRM42Po6fRDXsDQ==', 'base64'))
};

async function compileProgram(source: string): Promise<Uint8Array> {
    const compileResponse = await algodClient.compile(source).do();
    return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
}

async function waitForConfirmation(txId: string) {
    const response = await algodClient.status().do();
    let lastRound = response.lastRound;
    
    while (true) {
        const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
        if (pendingInfo.confirmedRound && pendingInfo.confirmedRound > 0) {
            return pendingInfo;
        }
        lastRound++;
        await algodClient.statusAfterBlock(lastRound).do();
    }
}

async function main() {
    try {
        // Get the current status
        const status = await algodClient.status().do();
        console.log('Algorand node status:', status);

        // Check account balance
        const accountInfo = await algodClient.accountInformation(account.addr).do();
        console.log('Account balance:', Number(accountInfo.amount) / 1000000, 'ALGOs');

        // Read and compile the TEAL programs
        const approvalProgramSource = fs.readFileSync(path.join(__dirname, 'teal', 'approval.teal'), 'utf8');
        const clearProgramSource = fs.readFileSync(path.join(__dirname, 'teal', 'clear.teal'), 'utf8');
        
        const approvalProgram = await compileProgram(approvalProgramSource);
        const clearProgram = await compileProgram(clearProgramSource);

        // Create application
        const suggestedParams = await algodClient.getTransactionParams().do();
        
        // Create the application
        const txn = algosdk.makeApplicationCreateTxnFromObject({
            sender: account.addr,
            suggestedParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram,
            clearProgram,
            numGlobalByteSlices: 0,
            numGlobalInts: 0,
            numLocalByteSlices: 0,
            numLocalInts: 0,
        });

        // Sign and submit the transaction
        const signedTxn = txn.signTxn(account.sk);
        const txId = await algodClient.sendRawTransaction(signedTxn).do();
        console.log('Transaction sent, waiting for confirmation...');
        
        // Wait for confirmation
        const confirmedTxn = await waitForConfirmation(txId.txid);
        const appId = Number(confirmedTxn.applicationIndex || 0);
        if (appId === 0) {
            throw new Error('Failed to create application');
        }
        
        console.log('Application created with ID:', appId);
        
        // Fund the application account with ALGOs
        const appAddress = algosdk.getApplicationAddress(appId);
        console.log('Application address:', appAddress.toString());
        
        const fundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: account.addr,
            receiver: appAddress.toString(),
            amount: 200000,
            suggestedParams,
        });

        // Sign and submit the funding transaction
        const signedFundingTxn = fundingTxn.signTxn(account.sk);
        const fundingTxId = await algodClient.sendRawTransaction(signedFundingTxn).do();
        console.log('Funding transaction sent, waiting for confirmation...');
        
        // Wait for funding transaction confirmation
        await waitForConfirmation(fundingTxId.txid);
        console.log('Application account funded');
        
        // Store GitHub username in a Box
        const boxName = 'github';
        const boxValue = new TextEncoder().encode(GITHUB_USERNAME);
        
        // Create box storage transaction
        const boxTxn = algosdk.makeApplicationCallTxnFromObject({
            sender: account.addr,
            appIndex: appId,
            suggestedParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            appArgs: [
                new TextEncoder().encode('store_github'),
                new TextEncoder().encode(GITHUB_USERNAME)
            ],
            boxes: [
                {
                    appIndex: appId,
                    name: new TextEncoder().encode(boxName)
                }
            ]
        });

        // Sign and submit the box transaction
        const signedBoxTxn = boxTxn.signTxn(account.sk);
        const boxTxId = await algodClient.sendRawTransaction(signedBoxTxn).do();
        console.log('Box transaction sent, waiting for confirmation...');
        
        // Wait for box transaction confirmation
        await waitForConfirmation(boxTxId.txid);
        console.log('GitHub username stored in box:', boxName);
        
        // Read the stored GitHub handle from the box
        const boxData = await algodClient.getApplicationBoxByName(appId, new TextEncoder().encode(boxName)).do();
        const storedHandle = new TextDecoder().decode(boxData.value);
        console.log('Stored GitHub handle:', storedHandle);
        
        // Update workshop submission file with the Application ID
        fs.writeFileSync('workshop-submission.txt', `Application ID: ${appId}`);
        
    } catch (err) {
        console.error('Error:', err);
    }
}

main(); 