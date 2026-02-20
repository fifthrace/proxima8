import './styles/main.css'
import './styles/components/GalaxyMap.css'
import './styles/components/PuzzleView.css'
import './styles/components/OverlayPanels.css'
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

function toggleHelp() {
  const p = document.getElementById('help-panel');
  if (!p) return;
  const isHidden = p.style.display !== 'block';
  p.style.display = isHidden ? 'block' : 'none';
  if (isHidden) document.getElementById('settings-panel').style.display = 'none';
}

function toggleSettings() {
  const p = document.getElementById('settings-panel');
  if (!p) return;
  const isHidden = p.style.display !== 'block';
  p.style.display = isHidden ? 'block' : 'none';
  if (isHidden) document.getElementById('help-panel').style.display = 'none';
}

function closeAllPanels() {
  document.getElementById('settings-panel').style.display = 'none';
  document.getElementById('help-panel').style.display = 'none';
}

function exportData() {
  const json = gameState.exportState();
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `proxima8_save_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const success = gameState.importState(ev.target.result);
    if (success) {
      alert("Save data imported successfully.");
      location.reload();
    } else {
      alert("Failed to import save data. Invalid format.");
    }
  };
  reader.readAsText(file);
}

// Expose globals for HTML event handlers
window.closeModal = closeModal;
window.toggleHelp = toggleHelp;
window.toggleSettings = toggleSettings;
window.closeAllPanels = closeAllPanels;
window.exportData = exportData;
window.importData = importData;

// Initialize Router
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app') || document.body;
  const router = new Router(appContainer);
  router.init();
});

console.log('Proxima 8: Vite environment active with Engine, State, and Router modules.');
