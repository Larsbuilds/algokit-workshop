"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const algosdk_1 = __importDefault(require("algosdk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Create an algod client for Testnet
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;
const algodClient = new algosdk_1.default.Algodv2(algodToken, algodServer, algodPort);
// Your GitHub username
const GITHUB_USERNAME = 'larsbuilds';
// Your account with Testnet ALGOs
const account = {
    addr: 'V7L2A7JTXJZXUVV5YJUSWFJAUUOGC2N4ZYXUJTRWH2HJ6RBV5QGUBCPOWA',
    sk: new Uint8Array(Buffer.from('xmU20HesI89YLYJO4kJoZmzP2xFIJvAsydb87J9y3Zqv16B9M7pzela9wmkrFSClHGFpvM4vRM42Po6fRDXsDQ==', 'base64'))
};
async function compileProgram(source) {
    const compileResponse = await algodClient.compile(source).do();
    return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
}
async function waitForConfirmation(txId) {
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
        const txn = algosdk_1.default.makeApplicationCreateTxnFromObject({
            sender: account.addr,
            suggestedParams,
            onComplete: algosdk_1.default.OnApplicationComplete.NoOpOC,
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
        // Store GitHub username in a Box
        const boxName = 'github';
        const boxValue = new TextEncoder().encode(GITHUB_USERNAME);
        // Create box storage transaction
        const boxTxn = algosdk_1.default.makeApplicationCallTxnFromObject({
            sender: account.addr,
            appIndex: appId,
            suggestedParams,
            onComplete: algosdk_1.default.OnApplicationComplete.NoOpOC,
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
        // Update workshop submission file with the Application ID
        fs.writeFileSync('workshop-submission.txt', `Application ID: ${appId}`);
    }
    catch (err) {
        console.error('Error:', err);
    }
}
main();
