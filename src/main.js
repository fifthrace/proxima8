import './styles/main.css'
import './styles/components/GalaxyMap.css'
import './styles/components/PuzzleView.css'
import { GridLogic } from './engine/GridLogic'
import { LevelLoader } from './engine/LevelLoader'
import { gameState } from './state/GameState'
import { Router } from './router/Router'

// Expose modules to window for transitional period (Modularization Steps)
window.ProximaEngine = {
  GridLogic,
  LevelLoader,
  gameState
};

// Global UI Event Handlers
window.addEventListener('show-modal', (e) => {
  const { title, body, confirmText, onConfirm, hideCancel } = e.detail;
  const modalOverlay = document.getElementById('modal-overlay');
  if (!modalOverlay) return;

  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-body').innerText = body;
  const cb = document.getElementById('modal-confirm-btn');
  cb.innerText = confirmText;
  cb.onclick = () => { 
    if (onConfirm) onConfirm(); 
    closeModal(); 
  };
  document.getElementById('modal-cancel-btn').style.display = hideCancel ? 'none' : 'block';
  modalOverlay.style.display = 'flex';
});

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

window.closeModal = closeModal;

// Initialize Router
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app') || document.body;
  const router = new Router(appContainer);
  router.init();
});

console.log('Proxima 8: Vite environment active with Engine, State, and Router modules.');
