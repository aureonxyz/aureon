<script lang="ts">
  import { notificationStore } from '../stores/notificationStore';

  let show: boolean;
  let message: string;

  notificationStore.subscribe(value => {
    show = value.show;
    message = value.message;
  });

  function closeNotification() {
    notificationStore.set({ show: false, message: '' });
  }
</script>



{#if show}
  <div id="notification-modal">
    <div class="notification-content">
      <p id="notification-message">{message}</p>
      <button id="close-notification" on:click={closeNotification}>Close</button>
    </div>
  </div>
{/if}


<style>
  #notification-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1001;
  }

  .notification-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 400px;
    background-color: #2c2c2c;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  button {
    display: block;
    margin: 20px auto 0;
    padding: 8px 15px;
    background-color: #535;
    border: none;
    border-radius: 5px;
    color: #e0e0e0;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    font-weight: bold;
    font-size: 16px;
  }

  button:hover {
    background-color: #747;
    transform: scale(1.05);
  }

  button:active {
    transform: scale(0.95);
  }

  button:focus {
    outline: none;
    box-shadow: 0 0 0 2px #e0e0e0;
  }
</style>
