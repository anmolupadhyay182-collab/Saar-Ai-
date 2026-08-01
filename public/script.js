const chatBox = document.getElementById('chatBox');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const exportChatBtn = document.getElementById('exportChatBtn');
const micBtn = document.querySelector('.mic-btn');

// Sidebar Elements
const menuBtn = document.getElementById('menuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const newChatBtn = document.getElementById('newChatBtn');
const themeBtns = document.querySelectorAll('.theme-btn');
const recentsList = document.getElementById('recentsList');
const searchChatsInput = document.getElementById('searchChatsInput');

// Floating Voice Player Elements
const floatingVoicePlayer = document.getElementById('floatingVoicePlayer');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const audioStatusSpinner = document.getElementById('audioStatusSpinner');
const audioPauseIcon = document.getElementById('audioPauseIcon');
const audioPlayIcon = document.getElementById('audioPlayIcon');
const audioWaveContainer = document.getElementById('audioWaveContainer');
const audioProgressBar = document.getElementById('audioProgressBar');
const closeAudioPlayerBtn = document.getElementById('closeAudioPlayerBtn');

// Find in Chat Elements
const findInChatBtn = document.getElementById('findInChatBtn');
const findWordBar = document.getElementById('findWordBar');
const findWordInput = document.getElementById('findWordInput');
const findCount = document.getElementById('findCount');
const closeFindBarBtn = document.getElementById('closeFindBarBtn');

// Global Speech State
let currentTextToSpeak = "";
let currentSpeechPosition = 0;
let isPaused = false;

// Global Chat State
let chats = JSON.parse(localStorage.getItem('saar_chats_session')) || [];
let currentChatId = null;

// Sidebar Toggle
menuBtn.addEventListener('click', () => {
  sidebar.classList.add('active');
  sidebarOverlay.classList.add('active');
});

function closeSidebar() {
  sidebar.classList.remove('active');
  sidebarOverlay.classList.remove('active');
}

closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Theme Switcher
themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    themeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const selectedTheme = btn.getAttribute('data-theme');
    document.body.setAttribute('data-theme', selectedTheme);
  });
});

// Start New Chat Session
function createNewChat() {
  stopSpeech();
  closeFindBar();
  currentChatId = null;
  chatBox.innerHTML = '';
  if (welcomeScreen) {
    chatBox.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'flex';
  }
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
  renderRecents();
}

newChatBtn.addEventListener('click', () => {
  createNewChat();
  closeSidebar();
});

// Search Filter Listener for Sidebar
searchChatsInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  renderRecents(query);
});

// Render Sessions in Sidebar (UPDATED: Pinned chats on TOP)
function renderRecents(filterQuery = '') {
  recentsList.innerHTML = '';

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(filterQuery)
  );

  if (filteredChats.length === 0) {
    recentsList.innerHTML = `<div style="font-size: 13px; color: var(--text-sub); text-align: center; padding: 10px;">${filterQuery ? 'No chats found' : 'No recent chats'}</div>`;
    return;
  }

  // 📌 PINNED CHATS SORTING LOGIC ADDED HERE:
  // Isse pinned chats automatic sabse top par aa jayenge
  filteredChats.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  filteredChats.forEach((chat) => {
    const item = document.createElement('div');
    item.classList.add('recent-item');
    if (chat.id === currentChatId) item.style.borderLeft = "3px solid var(--accent-green)";
    if (chat.pinned) item.classList.add('pinned');

    item.innerHTML = `
      <i class="fa-regular fa-message"></i>
      <span class="recent-title">${escapeHtml(chat.title)}</span>
      <div class="item-actions">
        <button class="action-btn pin-btn" title="Pin"><i class="fa-solid fa-thumbtack" style="${chat.pinned ? 'color: var(--accent-green);' : ''}"></i></button>
        <button class="action-btn delete-btn" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    `;

    item.querySelector('.recent-title').addEventListener('click', () => {
      loadChatSession(chat.id);
      closeSidebar();
    });

    item.querySelector('.pin-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      chat.pinned = !chat.pinned;
      saveChats();
      renderRecents(searchChatsInput.value.toLowerCase().trim());
    });

    item.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      chats = chats.filter(c => c.id !== chat.id);
      saveChats();
      if (currentChatId === chat.id) {
        createNewChat();
      } else {
        renderRecents(searchChatsInput.value.toLowerCase().trim());
      }
    });

    recentsList.appendChild(item);
  });
}

function loadChatSession(id) {
  stopSpeech();
  closeFindBar();
  const session = chats.find(c => c.id === id);
  if (!session) return;

  currentChatId = id;
  chatBox.innerHTML = '';
  if (welcomeScreen) welcomeScreen.style.display = 'none';

  session.messages.forEach(msg => {
    appendMessageUI(msg.sender, msg.content, false);
  });

  renderRecents(searchChatsInput.value.toLowerCase().trim());
}

function saveChats() {
  localStorage.setItem('saar_chats_session', JSON.stringify(chats));
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Marked Setup
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true
});

userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = userInput.scrollHeight + 'px';
  sendBtn.disabled = !userInput.value.trim();
});

function useSuggestion(text) {
  userInput.value = text;
  userInput.dispatchEvent(new Event('input'));
  sendMessage(text);
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (message) sendMessage(message);
});

// Code Blocks Helper
function wrapCodeBlocks(element) {
  const pres = element.querySelectorAll('pre');
  pres.forEach((pre) => {
    const code = pre.querySelector('code');
    if (!code) return;

    let lang = 'code';
    code.classList.forEach(cls => {
      if (cls.startsWith('language-')) {
        lang = cls.replace('language-', '');
      }
    });

    const container = document.createElement('div');
    container.classList.add('code-container');

    const header = document.createElement('div');
    header.classList.add('code-header');
    header.innerHTML = `
      <span>${lang}</span>
      <button class="code-copy-btn"><i class="fa-regular fa-copy"></i> Copy Code</button>
    `;

    const copyBtn = header.querySelector('.code-copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code.innerText).then(() => {
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
        setTimeout(() => {
          copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy Code`;
        }, 2000);
      });
    });

    pre.parentNode.insertBefore(container, pre);
    container.appendChild(header);
    container.appendChild(pre);
  });
}

/* 🔍 IN-CHAT SEARCH ENGINE */
findInChatBtn.addEventListener('click', () => {
  if (findWordBar.classList.contains('active')) {
    closeFindBar();
  } else {
    findWordBar.classList.add('active');
    findWordInput.focus();
  }
});

closeFindBarBtn.addEventListener('click', closeFindBar);

function closeFindBar() {
  findWordBar.classList.remove('active');
  findWordInput.value = '';
  findCount.textContent = '0/0';
  removeHighlights();
}

function removeHighlights() {
  const highlights = chatBox.querySelectorAll('mark.chat-highlight');
  highlights.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

function highlightInElement(element, query) {
  let count = 0;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

  const walk = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (node.parentNode.closest('pre') || node.parentNode.closest('button') || node.parentNode.closest('.msg-actions')) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    },
    false
  );

  const textNodes = [];
  let currentNode;
  while ((currentNode = walk.nextNode())) {
    textNodes.push(currentNode);
  }

  textNodes.forEach(node => {
    if (regex.test(node.data)) {
      const parent = node.parentNode;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;

      node.data.replace(regex, (match, p1, offset) => {
        if (offset > lastIdx) {
          frag.appendChild(document.createTextNode(node.data.substring(lastIdx, offset)));
        }
        const mark = document.createElement('mark');
        mark.className = 'chat-highlight';
        mark.textContent = match;
        frag.appendChild(mark);
        count++;
        lastIdx = offset + match.length;
      });

      if (lastIdx < node.data.length) {
        frag.appendChild(document.createTextNode(node.data.substring(lastIdx)));
      }

      parent.replaceChild(frag, node);
    }
  });

  return count;
}

findWordInput.addEventListener('input', () => {
  removeHighlights();
  const query = findWordInput.value.trim();

  if (!query) {
    findCount.textContent = '0/0';
    return;
  }

  let totalMatches = 0;
  const msgContents = chatBox.querySelectorAll('.msg-content');

  msgContents.forEach(msg => {
    totalMatches += highlightInElement(msg, query);
  });

  findCount.textContent = `${totalMatches} match${totalMatches !== 1 ? 'es' : ''}`;

  const firstMatch = chatBox.querySelector('mark.chat-highlight');
  if (firstMatch) {
    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

/* Floating Voice Player Controllers */
function startSpeech(text, offsetChar = 0) {
  if (!('speechSynthesis' in window)) {
    alert('Voice synthesis not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();

  if (offsetChar === 0) {
    currentTextToSpeak = text.replace(/[#*`_~]/g, '');
    currentSpeechPosition = 0;
  }

  isPaused = false;
  floatingVoicePlayer.classList.add('active');
  audioStatusSpinner.style.display = 'inline-block';
  audioPauseIcon.style.display = 'none';
  audioPlayIcon.style.display = 'none';
  audioWaveContainer.classList.remove('paused');

  const textToSpeakNow = currentTextToSpeak.substring(offsetChar);
  const utterance = new SpeechSynthesisUtterance(textToSpeakNow);
  utterance.lang = 'en-US';

  const totalChars = currentTextToSpeak.length;

  utterance.onstart = () => {
    audioStatusSpinner.style.display = 'none';
    audioPauseIcon.style.display = 'inline-block';
    audioPlayIcon.style.display = 'none';
  };

  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      currentSpeechPosition = offsetChar + event.charIndex;
      let progress = Math.min(100, Math.round((currentSpeechPosition / totalChars) * 100));
      audioProgressBar.style.width = progress + '%';
    }
  };

  utterance.onend = () => {
    if (!isPaused) stopSpeech();
  };

  utterance.onerror = () => {
    if (!isPaused) stopSpeech();
  };

  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  isPaused = false;
  currentSpeechPosition = 0;
  currentTextToSpeak = "";
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  floatingVoicePlayer.classList.remove('active');
  audioProgressBar.style.width = '0%';
  audioStatusSpinner.style.display = 'none';
  audioPauseIcon.style.display = 'none';
  audioPlayIcon.style.display = 'none';
}

function toggleSpeechPausePlay() {
  if (!('speechSynthesis' in window) || !currentTextToSpeak) return;

  if (!isPaused) {
    isPaused = true;
    window.speechSynthesis.cancel();
    audioPauseIcon.style.display = 'none';
    audioPlayIcon.style.display = 'inline-block';
    audioWaveContainer.classList.add('paused');
  } else {
    audioPlayIcon.style.display = 'none';
    audioPauseIcon.style.display = 'inline-block';
    audioWaveContainer.classList.remove('paused');
    startSpeech(currentTextToSpeak, currentSpeechPosition);
  }
}

audioToggleBtn.addEventListener('click', toggleSpeechPausePlay);
closeAudioPlayerBtn.addEventListener('click', stopSpeech);

function appendMessageUI(sender, content, isLoading = false) {
  if (welcomeScreen) welcomeScreen.style.display = 'none';

  const msgRow = document.createElement('div');
  msgRow.classList.add('message-row', sender);

  const msgContent = document.createElement('div');
  msgContent.classList.add('msg-content');

  if (sender === 'ai') {
    if (isLoading) {
      msgContent.innerHTML = `
        <div class="loading-dots">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
      `;
    } else {
      msgContent.innerHTML = marked.parse(content);
      wrapCodeBlocks(msgContent);

      const actionsDiv = document.createElement('div');
      actionsDiv.classList.add('msg-actions');

      const copyBtn = document.createElement('button');
      copyBtn.classList.add('msg-action-btn');
      copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(content).then(() => {
          copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
          setTimeout(() => {
            copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
          }, 2000);
        });
      });

      const listenBtn = document.createElement('button');
      listenBtn.classList.add('msg-action-btn');
      listenBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
      listenBtn.addEventListener('click', () => {
        startSpeech(content);
      });

      actionsDiv.appendChild(copyBtn);
      actionsDiv.appendChild(listenBtn);
      msgContent.appendChild(actionsDiv);
    }
  } else {
    msgContent.textContent = content;
  }

  msgRow.appendChild(msgContent);
  chatBox.appendChild(msgRow);
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
  return { msgRow, msgContent };
}

/* UPDATED SEND MESSAGE WITH FULL CHAT CONTEXT/HISTORY SUPPORT */
async function sendMessage(message) {
  if (!currentChatId) {
    currentChatId = 'chat_' + Date.now();
    chats.unshift({
      id: currentChatId,
      title: message.length > 25 ? message.substring(0, 25) + '...' : message,
      pinned: false,
      messages: []
    });
  }

  const activeSession = chats.find(c => c.id === currentChatId);
  activeSession.messages.push({ sender: 'user', content: message });
  saveChats();
  renderRecents(searchChatsInput.value.toLowerCase().trim());

  appendMessageUI('user', message);
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;

  const { msgRow: loadingRow } = appendMessageUI('ai', '', true);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: message,
        history: activeSession.messages 
      })
    });

    const data = await response.json();
    loadingRow.remove();

    let replyText = data.reply || ('⚠️ Error: ' + (data.error || 'Failed to generate response.'));
    
    activeSession.messages.push({ sender: 'ai', content: replyText });
    saveChats();

    appendMessageUI('ai', replyText);

  } catch (err) {
    loadingRow.remove();
    appendMessageUI('ai', '⚠️ Error: ' + err.message);
  }
}

// Download Chat Logic
exportChatBtn.addEventListener('click', () => {
  const rows = chatBox.querySelectorAll('.message-row');
  if (rows.length === 0) {
    alert('No chat messages to export!');
    return;
  }

  let chatHistory = "=========================================\n";
  chatHistory += "           SAAR AI Chat Export          \n";
  chatHistory += "=========================================\n\n";

  rows.forEach(row => {
    const isUser = row.classList.contains('user');
    const sender = isUser ? 'USER' : 'SAAR AI';
    const text = row.querySelector('.msg-content').innerText.replace('Copy Code', '').replace('Copy', '').replace('Listen', '').trim();
    chatHistory += `[${sender}]:\n${text}\n\n-----------------------------------------\n\n`;
  });

  const blob = new Blob([chatHistory], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SAAR_AI_Chat_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

clearChatBtn.addEventListener('click', createNewChat);

/* Voice Mic Feature */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let isListening = false;
  micBtn.addEventListener('click', () => {
    if (!isListening) recognition.start();
    else recognition.stop();
  });

  recognition.onstart = () => { isListening = true; micBtn.style.color = '#ef4444'; };
  recognition.onresult = (event) => {
    userInput.value = event.results[0][0].transcript;
    userInput.dispatchEvent(new Event('input'));
  };
  recognition.onerror = () => { micBtn.style.color = ''; isListening = false; };
  recognition.onend = () => { micBtn.style.color = ''; isListening = false; };
}

renderRecents();

// Clear AI Memory Handler
const clearMemoryBtn = document.getElementById('clearMemoryBtn');
if (clearMemoryBtn) {
  clearMemoryBtn.addEventListener('click', async () => {
    if (confirm("Are you sure you want to clear AI saved memory?")) {
      try {
        await fetch('/api/memory', { method: 'DELETE' });
        alert("AI memory cleared successfully!");
      } catch (err) {
        alert("Failed to clear memory.");
      }
    }
  });
}
