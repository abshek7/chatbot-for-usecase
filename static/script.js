const API_CONFIG = {
  baseURL: 'http://localhost:8000',
  endpoints: {
    chat: '/ask-question',  // Changed from '/chat' to match backend
    upload: '/upload-files' // Changed from '/upload' to match backend
  }
};

let messages = [];
let uploadedFiles = [];
let isLoading = false;
let isTyping = false;
let isConnected = true;
let dragActive = false;

// DOM Elements
const messagesContainer = document.getElementById('messages-container');
const messagesEnd = document.getElementById('messages-end');
const inputMessage = document.getElementById('input-message');
const sendMessageBtn = document.getElementById('send-message');
const clearSessionBtn = document.getElementById('clear-session');
const openUploadModalBtn = document.getElementById('open-upload-modal');
const closeUploadModalBtn = document.getElementById('close-upload-modal');
const cancelUploadBtn = document.getElementById('cancel-upload');
const browseFilesBtn = document.getElementById('browse-files');
const fileInput = document.getElementById('file-input');
const uploadModal = document.getElementById('upload-modal');
const uploadArea = document.getElementById('upload-area');
const uploadContent = document.getElementById('upload-content');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const connectionStatus = document.getElementById('connection-status');
const uploadedFilesContainer = document.getElementById('uploaded-files');
const welcomeMessage = document.getElementById('welcome-message');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  inputMessage.focus();
  lucide.createIcons();
  checkBackendConnection(); // Check connection on load
});

// Check backend connection
async function checkBackendConnection() {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/health`);
    if (response.ok) {
      const data = await response.json();
      updateConnectionStatus(true);
    } else {
      updateConnectionStatus(false);
    }
  } catch (error) {
    updateConnectionStatus(false);
  }
}

// Scroll to bottom
function scrollToBottom() {
  messagesEnd.scrollIntoView({ behavior: 'smooth' });
}

// Format timestamp
function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Show error
function showError(message) {
  errorMessage.textContent = message;
  errorBanner.classList.remove('hidden');
}

// Hide error
function hideError() {
  errorBanner.classList.add('hidden');
}

// Update connection status
function updateConnectionStatus(connected) {
  connectionStatus.className = `flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${connected ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`;
  connectionStatus.innerHTML = `
    <div class="w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}"></div>
    <span class="font-medium">${connected ? 'Active' : 'Demo Mode'}</span>
  `;
  isConnected = connected;
}

// Add message to DOM
function addMessage({ text, sender, timestamp, isSystem = false, isDemo = false }) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`;
  messageDiv.style.animationDelay = `${messages.length * 0.1}s`;
  messageDiv.innerHTML = `
    <div class="flex items-end space-x-3 max-w-2xl ${sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}">
      <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg 
        ${sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : isDemo ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-gradient-to-br from-green-400 to-blue-500'}">
        <i data-lucide="${sender === 'user' ? 'user' : 'bot'}" class="w-5 h-5 text-white"></i>
      </div>
      <div class="relative rounded-3xl px-6 py-4 shadow-lg backdrop-blur-sm 
        ${sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : 
          isSystem ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-gray-800 border border-green-200' : 
          isDemo ? 'bg-gradient-to-br from-orange-50 to-pink-50 text-gray-800 border border-orange-200' : 
          'bg-white/80 text-gray-800 border border-white/20'}">
        ${isDemo ? `
          <div class="flex items-center space-x-1 mb-2 text-orange-600">
            <i data-lucide="sparkles" class="w-3 h-3"></i>
            <span class="text-xs font-medium">Demo Mode</span>
          </div>` : ''}
        ${isSystem ? `
          <div class="flex items-center space-x-1 mb-2 text-green-600">
            <i data-lucide="check" class="w-3 h-3"></i>
            <span class="text-xs font-medium">System</span>
          </div>` : ''}
        <p class="text-sm leading-relaxed whitespace-pre-wrap">${text}</p>
        <p class="text-xs mt-2 ${sender === 'user' ? 'text-blue-100' : 'text-gray-500'}">${timestamp}</p>
        <div class="message-tail-${sender} ${sender === 'user' ? 'bg-purple-600' : 'bg-white/80 border-l border-b border-white/20'}"></div>
      </div>
    </div>
  `;
  document.getElementById('messages').appendChild(messageDiv);
  lucide.createIcons();
  scrollToBottom();
}

// Show loading indicator
function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-indicator';
  loadingDiv.className = 'flex justify-start animate-fade-in';
  loadingDiv.innerHTML = `
    <div class="flex items-end space-x-3 max-w-2xl">
      <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
        <i data-lucide="bot" class="w-5 h-5 text-white"></i>
      </div>
      <div class="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-3xl px-6 py-4">
        <div class="flex items-center space-x-3">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
            <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
          </div>
          <span class="text-sm text-gray-600">AI is thinking...</span>
        </div>
      </div>
    </div>
  `;
  document.getElementById('messages').appendChild(loadingDiv);
  lucide.createIcons();
  scrollToBottom();
}

// Remove loading indicator
function removeLoading() {
  const loading = document.getElementById('loading-indicator');
  if (loading) loading.remove();
}

// Update uploaded files display
function updateUploadedFiles() {
  if (uploadedFiles.length === 0) {
    uploadedFilesContainer.classList.add('hidden');
    return;
  }
  uploadedFilesContainer.classList.remove('hidden');
  uploadedFilesContainer.innerHTML = `
    <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
      <div class="flex items-center space-x-2 mb-3">
        <i data-lucide="file-text" class="w-5 h-5 text-blue-600"></i>
        <span class="font-medium text-gray-800">Uploaded Documents</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${uploadedFiles.map(file => `
          <div class="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-gray-200">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center ${file.status === 'success' ? 'bg-green-100' : 'bg-orange-100'}">
                <i data-lucide="${file.status === 'success' ? 'check' : 'file-text'}" class="w-4 h-4 ${file.status === 'success' ? 'text-green-600' : 'text-orange-600'}"></i>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-800 truncate max-w-32">${file.name}</p>
                <p class="text-xs text-gray-500">${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.uploadedAt}</p>
              </div>
            </div>
            <button onclick="removeFile(${file.id})" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  lucide.createIcons();
}

// Remove file
function removeFile(id) {
  uploadedFiles = uploadedFiles.filter(file => file.id !== id);
  updateUploadedFiles();
}

// API call to upload document
async function uploadDocument(files) {
  const formData = new FormData();
  // Backend expects multiple files in a 'files' array
  for (let file of files) {
    formData.append('files', file);
  }
  
  const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.upload}`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Upload failed: ${response.status}`);
  }
  
  return await response.json();
}

// Handle file upload
async function handleFileUpload(files) {
  if (!files || files.length === 0) return;
  
  uploadArea.className = 'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 border-blue-300 bg-blue-50';
  uploadContent.innerHTML = `
    <div class="space-y-3">
      <i data-lucide="loader-2" class="w-12 h-12 text-blue-500 mx-auto animate-spin"></i>
      <p class="text-blue-600 font-medium">Processing documents...</p>
    </div>
  `;
  lucide.createIcons();

  const newFiles = Array.from(files);
  
  try {
    // Validate files
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    for (const file of newFiles) {
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not supported. Please upload PDF, DOC, TXT, CSV, Excel, PowerPoint, or image files.`);
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
      }
    }

    // Upload all files at once
    const result = await uploadDocument(newFiles);
    
    // Add files to uploaded files list
    for (const file of newFiles) {
      const fileInfo = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: getTimestamp(),
        status: 'success'
      };
      uploadedFiles.push(fileInfo);
    }
    
    // Show success message
    const successMessage = {
      id: Date.now() + Math.random(),
      text: `✅ Successfully processed ${result.processed_files} document(s)! ${result.message}`,
      sender: 'bot',
      timestamp: getTimestamp(),
      isSystem: true
    };
    messages.push(successMessage);
    addMessage(successMessage);
    
    uploadModal.classList.add('hidden');
    updateUploadedFiles();
    updateConnectionStatus(true);
    
  } catch (error) {
    console.error('Upload error:', error);
    
    if (!isConnected) {
      // Demo mode fallback
      for (const file of newFiles) {
        const fileInfo = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: getTimestamp(),
          status: 'demo'
        };
        uploadedFiles.push(fileInfo);
      }
      
      const demoMessage = {
        id: Date.now() + Math.random(),
        text: `📁 Files uploaded successfully! (Demo mode - connect your backend to process real documents)`,
        sender: 'bot',
        timestamp: getTimestamp(),
        isSystem: true,
        isDemo: true
      };
      messages.push(demoMessage);
      addMessage(demoMessage);
      uploadModal.classList.add('hidden');
      updateUploadedFiles();
    } else {
      showError(error.message);
    }
  } finally {
    uploadArea.className = 'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer';
    uploadContent.innerHTML = `
      <div class="space-y-3">
        <i data-lucide="upload" class="w-12 h-12 text-gray-400 mx-auto"></i>
        <div>
          <p class="text-gray-800 font-medium">Drop files here or click to browse</p>
          <p class="text-sm text-gray-500 mt-1">PDF, DOC, TXT, CSV, Excel, PowerPoint, Images up to 10MB</p>
        </div>
      </div>
    `;
    lucide.createIcons();
  }
}

// Drag and drop handlers
function handleDrag(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.type === 'dragenter' || e.type === 'dragover') {
    if (!dragActive) {
      dragActive = true;
      document.body.innerHTML += `
        <div id="drag-overlay" class="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-blue-300 shadow-2xl">
            <div class="text-center">
              <i data-lucide="upload" class="w-16 h-16 text-blue-500 mx-auto mb-4"></i>
              <h3 class="text-xl font-bold text-gray-800 mb-2">Drop your documents here</h3>
              <p class="text-gray-600">PDF, DOC, TXT, CSV, Excel, PowerPoint, Images supported</p>
            </div>
          </div>
        </div>
      `;
      lucide.createIcons();
    }
  } else if (e.type === 'dragleave') {
    if (e.relatedTarget === null || !document.contains(e.relatedTarget)) {
      dragActive = false;
      const overlay = document.getElementById('drag-overlay');
      if (overlay) overlay.remove();
    }
  }
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dragActive = false;
  const overlay = document.getElementById('drag-overlay');
  if (overlay) overlay.remove();
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFileUpload(e.dataTransfer.files);
  }
}

// API call to send message
async function sendMessageToAPI(message) {
  const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.chat}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: message }) // Backend expects 'question' field
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to get response');
  }
  
  return data.answer;
}

// Handle sending message
async function handleSendMessage() {
  if (!inputMessage.value.trim() || isLoading) return;
  
  const userMessage = inputMessage.value.trim();
  inputMessage.value = '';
  hideError();
  isLoading = true;
  isTyping = true;
  welcomeMessage.classList.add('hidden');

  const newUserMessage = {
    id: Date.now(),
    text: userMessage,
    sender: 'user',
    timestamp: getTimestamp()
  };
  messages.push(newUserMessage);
  addMessage(newUserMessage);
  showLoading();

  try {
    const botResponse = await sendMessageToAPI(userMessage);
    const newBotMessage = {
      id: Date.now() + 1,
      text: botResponse,
      sender: 'bot',
      timestamp: getTimestamp()
    };
    messages.push(newBotMessage);
    removeLoading();
    addMessage(newBotMessage);
    updateConnectionStatus(true);
  } catch (error) {
    console.error('Chat error:', error);
    showError('Connection failed - using demo mode');
    updateConnectionStatus(false);
    
    const demoResponses = [
      "I'm a RAG chatbot ready to help! (This is a demo response - connect your backend to see real responses)",
      "Your question is interesting! Once connected to the backend, I'll provide intelligent answers based on my knowledge base.",
      "I'd love to help with that! Please make sure the backend is running and properly configured.",
      "Great question! In demo mode, but ready to provide real RAG-powered responses when connected."
    ];
    
    const demoMessage = {
      id: Date.now() + 1,
      text: demoResponses[Math.floor(Math.random() * demoResponses.length)],
      sender: 'bot',
      timestamp: getTimestamp(),
      isDemo: true
    };
    messages.push(demoMessage);
    removeLoading();
    addMessage(demoMessage);
  } finally {
    isLoading = false;
    isTyping = false;
  }
}

// Clear chat
function clearChat() {
  messages = [];
  document.getElementById('messages').innerHTML = '';
  uploadedFiles = [];
  updateUploadedFiles();
  hideError();
  welcomeMessage.classList.remove('hidden');
}

// Event Listeners
sendMessageBtn.addEventListener('click', handleSendMessage);
inputMessage.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});
clearSessionBtn.addEventListener('click', clearChat);
openUploadModalBtn.addEventListener('click', () => uploadModal.classList.remove('hidden'));
closeUploadModalBtn.addEventListener('click', () => uploadModal.classList.add('hidden'));
cancelUploadBtn.addEventListener('click', () => uploadModal.classList.add('hidden'));
browseFilesBtn.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('click', () => !isLoading && fileInput.click());
fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files));

// Set up multiple file selection
fileInput.setAttribute('multiple', 'true');

// Drag and drop event listeners
document.addEventListener('dragenter', handleDrag);
document.addEventListener('dragleave', handleDrag);
document.addEventListener('dragover', handleDrag);
document.addEventListener('drop', handleDrop);