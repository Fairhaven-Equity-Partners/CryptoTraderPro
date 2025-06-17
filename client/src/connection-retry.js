// Connection retry mechanism
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function attemptReconnection() {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    console.log(`Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts}`);
    
    setTimeout(() => {
      window.location.reload();
    }, 2000 * reconnectAttempts);
  }
}

// Listen for connection errors
window.addEventListener('error', (event) => {
  if (event.message.includes('WebSocket') || event.message.includes('connection')) {
    attemptReconnection();
  }
});