<!-- src/lib/pixelflux/components/WalletModal.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { walletModalStore, hideWalletModal } from '../stores/walletModalStore';
  import { showNotification } from '../stores/notificationStore';
  import { ethers } from 'ethers';

  let show: boolean;
  let message: string;
  let isConnecting: boolean = false;

  const POLYGON_CHAIN_ID = '0x89';
  const POLYGON_RPC_URL = 'https://polygon-rpc.com';

  $: walletModalStore.subscribe(value => {
    show = value.show;
    message = value.message;
  });

  async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
      showNotification('No Ethereum wallet detected. Please install MetaMask.');
      return;
    }

    isConnecting = true;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      const network = await provider.getNetwork();
      if (network.chainId !== parseInt(POLYGON_CHAIN_ID, 16)) {
        await switchToPolygon();
      }

      displayConnectedAddress(address);
      hideWalletModal();
      showNotification('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showNotification('Failed to connect wallet. Please try again.');
    } finally {
      isConnecting = false;
    }
  }

  async function switchToPolygon() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: POLYGON_CHAIN_ID,
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                rpcUrls: [POLYGON_RPC_URL],
                blockExplorerUrls: ['https://polygonscan.com/'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Polygon network');
        }
      } else {
        throw switchError;
      }
    }
  }

  function displayConnectedAddress(address: string) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    showNotification(`Connected: ${shortAddress}`);
    // You might want to update this in your global state or emit an event
  }

  onMount(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          displayConnectedAddress(accounts[0]);
        } else {
          showNotification('Wallet disconnected');
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        if (chainId !== POLYGON_CHAIN_ID) {
          showNotification('Please switch to the Polygon network');
        }
      });
    }
  });
</script>

{#if show}
  <div class="wallet-modal-overlay">
    <div class="wallet-modal">
      <h2>Connect to a Wallet</h2>
      <p>{message}</p>
      <button on:click={connectWallet} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
      </button>
      <button on:click={hideWalletModal}>Close</button>
    </div>
  </div>
{/if}

<style>
  .wallet-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .wallet-modal {
    background-color: #2c2c2c;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    width: 90%;
  }

  h2 {
    margin-top: 0;
    color: #e0e0e0;
  }

  p {
    color: #a0a0a0;
    margin-bottom: 1.5rem;
  }

  button {
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    background-color: #535;
    color: #e0e0e0;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
  }

  button:hover {
    background-color: #747;
    transform: translateY(-2px);
  }

  button:disabled {
    background-color: #444;
    cursor: not-allowed;
    transform: none;
  }
</style>