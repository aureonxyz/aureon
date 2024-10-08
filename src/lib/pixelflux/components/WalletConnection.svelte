<script lang="ts">
    import { ethers } from 'ethers';
    import { showWalletModal, hideWalletModal } from '../stores/walletModalStore';
    import { showNotification } from '../stores/notificationStore';
  
    export let isWalletConnected = false;
    export let accountAddress = '';
  
    async function connectWallet() {
      showWalletModal('Please connect your wallet to continue.');
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts.length > 0) {
            isWalletConnected = true;
            accountAddress = accounts[0];
            await switchToPolygonNetwork();
            hideWalletModal();
            showNotification(`Connected: ${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`);
          }
        } catch (err) {
          console.error("Error connecting to Browser Wallet:", err);
        }
      } else {
        console.log("Browser Wallet is not installed.");
      }
    }
  
    async function switchToPolygonNetwork() {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }],
        });
      } catch (switchError) {
        console.error("Error switching to Polygon:", switchError);
      }
    }
  </script>
  
  <div id="wallet-connection">
    <button id="connect-wallet" on:click={connectWallet}>
      {#if isWalletConnected}
        <span id="address-text">{accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}</span>
      {:else}
        <span id="connect-text">Connect Wallet</span>
      {/if}
    </button>
  </div>
  
  <style>
    #wallet-connection {
      margin-bottom: 15px;
    }
  
    #connect-wallet {
      width: 100%;
      padding: 10px;
      background-color: #535;
      color: #e0e0e0;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 1em;
    }
  
    #connect-wallet:hover {
      background-color: #747;
      transform: translateY(-2px);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
  
    #address-text, #connect-text {
      display: inline-block;
      width: 100%;
      text-align: center;
    }
  
    @media screen and (max-width: 520px) {
      #connect-wallet {
        font-size: 0.9em;
        padding: 8px;
      }
    }
  </style>
  