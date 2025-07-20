class ChatGPT {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.chatMessages = document.getElementById('chatMessages');
        this.sendBtn = document.getElementById('sendBtn');
        this.attachBtn = document.getElementById('attachBtn');
        this.searchBtn = document.getElementById('searchBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.systemPromptInput = document.getElementById('systemPromptInput');
        this.saveConfigBtn = document.getElementById('saveConfigBtn');
        this.toggleConfigBtn = document.getElementById('toggleConfigBtn');
        this.configSection = document.getElementById('configSection');
        
        // Configuration
        this.apiKey = localStorage.getItem('openrouter_api_key') || '';
        this.systemPrompt = localStorage.getItem('system_prompt') || 'You are ChatGPT, a large language model trained by OpenAI. You are helpful, harmless, and honest. Answer questions accurately and provide detailed explanations when needed.';
        this.conversationHistory = [];
        this.isProcessing = false;
        
        this.initializeEventListeners();
        this.loadConfiguration();
    }

    initializeEventListeners() {
        // Input field events
        this.messageInput.addEventListener('input', () => this.handleInputChange());
        this.messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
        
        // Button events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.attachBtn.addEventListener('click', () => this.handleAttach());
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.voiceBtn.addEventListener('click', () => this.handleVoice());
        this.saveConfigBtn.addEventListener('click', () => this.saveConfiguration());
        this.toggleConfigBtn.addEventListener('click', () => this.toggleConfiguration());
    }

    loadConfiguration() {
        this.apiKeyInput.value = this.apiKey;
        this.systemPromptInput.value = this.systemPrompt;
        
        if (!this.apiKey) {
            this.showWelcomeMessage();
        }
    }

    showWelcomeMessage() {
        this.addMessage("Welcome! To get started, please enter your OpenRouter API key in the settings above. This will enable real AI responses powered by GPT-4o.", 'assistant');
    }

    saveConfiguration() {
        this.apiKey = this.apiKeyInput.value.trim();
        this.systemPrompt = this.systemPromptInput.value.trim();
        
        localStorage.setItem('openrouter_api_key', this.apiKey);
        localStorage.setItem('system_prompt', this.systemPrompt);
        
        if (this.apiKey) {
            this.addMessage("Configuration saved! You can now chat with real AI intelligence.", 'assistant');
        } else {
            this.addMessage("Please enter a valid API key to enable AI responses.", 'assistant');
        }
    }

    toggleConfiguration() {
        const isHidden = this.configSection.style.display === 'none';
        this.configSection.style.display = isHidden ? 'block' : 'none';
        this.toggleConfigBtn.textContent = isHidden ? 'Hide Settings' : 'Show Settings';
    }

    handleInputChange() {
        const hasText = this.messageInput.value.trim().length > 0;
        if (hasText && !this.isProcessing) {
            this.sendBtn.classList.remove('opacity-0');
            this.sendBtn.classList.add('opacity-100');
        } else {
            this.sendBtn.classList.add('opacity-0');
            this.sendBtn.classList.remove('opacity-100');
        }
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;

        if (!this.apiKey) {
            this.addMessage("Please configure your API key first to enable AI responses.", 'assistant');
            return;
        }

        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input and show processing state
        this.messageInput.value = '';
        this.handleInputChange();
        this.isProcessing = true;
        
        // Add user message to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: [{ type: 'text', text: message }]
        });

        // Show typing indicator
        const typingDiv = this.addTypingIndicator();

        try {
            // Get AI response
            const response = await this.getAIResponse();
            
            // Remove typing indicator
            typingDiv.remove();
            
            // Add AI response
            this.addMessage(response, 'assistant');
            
            // Add AI response to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: [{ type: 'text', text: response }]
            });
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            typingDiv.remove();
            this.addMessage("Sorry, I encountered an error while processing your request. Please check your API key and try again.", 'assistant');
        } finally {
            this.isProcessing = false;
            this.handleInputChange();
        }
    }

    addTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-6 mr-auto max-w-3xl';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'p-4 rounded-lg bg-white border border-gray-200 text-black';
        
        const typingText = document.createElement('p');
        typingText.className = 'text-sm leading-relaxed text-gray-500';
        typingText.innerHTML = 'Thinking<span class="typing-dots">...</span>';
        
        messageContent.appendChild(typingText);
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        return messageDiv;
    }

    async getAIResponse() {
        const messages = [
            {
                role: 'system',
                content: [{ type: 'text', text: this.systemPrompt }]
            },
            ...this.conversationHistory
        ];

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'ChatGPT Clone'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `mb-6 ${sender === 'user' ? 'ml-auto max-w-3xl' : 'mr-auto max-w-3xl'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = `p-4 rounded-lg ${
            sender === 'user' 
                ? 'bg-gray-100 text-black ml-auto max-w-md' 
                : 'bg-white border border-gray-200 text-black'
        }`;
        
        const messageText = document.createElement('div');
        messageText.className = 'text-sm leading-relaxed';
        
        // Handle markdown-like formatting for better display
        const formattedContent = this.formatMessage(content);
        messageText.innerHTML = formattedContent;
        
        messageContent.appendChild(messageText);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    formatMessage(content) {
        // Basic markdown formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
            .replace(/\n/g, '<br>');
    }

    async handleAttach() {
        if (!this.apiKey) {
            this.addMessage("Please configure your API key first to enable file analysis.", 'assistant');
            return;
        }

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = 'image/*,text/*,.pdf,.doc,.docx';
        
        fileInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                for (const file of files) {
                    await this.processFile(file);
                }
            }
        };
        
        fileInput.click();
    }

    async processFile(file) {
        const fileNames = file.name;
        this.addMessage(`Analyzing file: ${fileNames}`, 'user');
        
        try {
            if (file.type.startsWith('image/')) {
                const base64 = await this.fileToBase64(file);
                await this.analyzeImage(base64, file.type);
            } else if (file.type === 'text/plain') {
                const text = await file.text();
                await this.analyzeText(text, file.name);
            } else {
                this.addMessage(`File type ${file.type} is not yet supported for analysis. Currently supported: images and text files.`, 'assistant');
            }
        } catch (error) {
            console.error('Error processing file:', error);
            this.addMessage("Sorry, I encountered an error while processing the file.", 'assistant');
        }
    }

    async analyzeImage(base64, mimeType) {
        this.isProcessing = true;
        const typingDiv = this.addTypingIndicator();

        try {
            const messages = [
                {
                    role: 'system',
                    content: [{ type: 'text', text: this.systemPrompt }]
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Please analyze this image and describe what you see.' },
                        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
                    ]
                }
            ];

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'ChatGPT Clone'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            const data = await response.json();
            typingDiv.remove();
            this.addMessage(data.choices[0].message.content, 'assistant');
        } catch (error) {
            typingDiv.remove();
            this.addMessage("Sorry, I couldn't analyze the image. Please try again.", 'assistant');
        } finally {
            this.isProcessing = false;
        }
    }

    async analyzeText(text, filename) {
        this.isProcessing = true;
        const typingDiv = this.addTypingIndicator();

        try {
            const messages = [
                {
                    role: 'system',
                    content: [{ type: 'text', text: this.systemPrompt }]
                },
                {
                    role: 'user',
                    content: [{ type: 'text', text: `Please analyze this text file (${filename}):\n\n${text}` }]
                }
            ];

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'ChatGPT Clone'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            const data = await response.json();
            typingDiv.remove();
            this.addMessage(data.choices[0].message.content, 'assistant');
        } catch (error) {
            typingDiv.remove();
            this.addMessage("Sorry, I couldn't analyze the text file. Please try again.", 'assistant');
        } finally {
            this.isProcessing = false;
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    handleSearch() {
        const query = prompt('Enter your search query:');
        if (query && this.apiKey) {
            this.messageInput.value = `Search for information about: ${query}`;
            this.sendMessage();
        } else if (query && !this.apiKey) {
            this.addMessage("Please configure your API key first to enable search functionality.", 'assistant');
        }
    }

    handleVoice() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onstart = () => {
                this.voiceBtn.classList.add('text-red-500');
            };
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.handleInputChange();
            };
            
            recognition.onend = () => {
                this.voiceBtn.classList.remove('text-red-500');
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.voiceBtn.classList.remove('text-red-500');
            };
            
            recognition.start();
        } else {
            alert('Speech recognition is not supported in your browser.');
        }
    }
}

// Add CSS for typing animation
const style = document.createElement('style');
style.textContent = `
    .typing-dots {
        animation: typing 1.5s infinite;
    }
    
    @keyframes typing {
        0%, 60%, 100% { opacity: 1; }
        30% { opacity: 0.5; }
    }
`;
document.head.appendChild(style);

// Initialize the ChatGPT clone when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatGPT();
});
