// --- 1. UI & Navigation Logic ---
const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll("[data-page]");
const mobileMenu = document.getElementById("mobileMenu");
const menuBtn = document.getElementById("menuBtn");
const toast = document.getElementById("toast");

function showPage(pageId) {
    const target = document.getElementById(pageId) || document.getElementById("home");
    pages.forEach(page => page.classList.toggle("active-page", page === target));

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === target.id);
    });

    mobileMenu.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

navLinks.forEach(link => {
    link.addEventListener("click", event => {
        const page = link.dataset.page;
        if (page) {
            event.preventDefault();
            history.replaceState(null, "", "#" + page);
            showPage(page);
        }
    });
});

menuBtn?.addEventListener("click", () => mobileMenu.classList.toggle("open"));

window.addEventListener("hashchange", () => {
    const page = location.hash.replace("#", "") || "home";
    showPage(page);
});

showPage(location.hash.replace("#", "") || "home");

// Topic buttons open the chat and insert a useful prompt.
document.querySelectorAll("[data-topic]").forEach(button => {
    button.addEventListener("click", () => {
        const topic = button.dataset.topic;
        history.replaceState(null, "", "#chat");
        showPage("chat");
        setTimeout(() => {
            messageInput.value = `I'd like general information about ${topic}.`;
            messageInput.focus();
        }, 50);
    });
});

// --- 2. Chat & API Logic ---
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");
const newChat = document.getElementById("newChat");
const clearChat = document.getElementById("clearChat");

function addMessage(text, type) {
    const item = document.createElement("div");
    item.className = `chat-message ${type}`;

    // لو الرسالة من الـ AI نترجمها لـ HTML، لو من المستخدم نعرضها زي ما هي
    const parsedText = type === "ai" ? marked.parse(text) : escapeHtml(text);

    item.innerHTML = `<div class="msg-avatar">${type === "user" ? "●" : "✚"}</div><div class="msg-body"><b>${type === "user" ? "You" : "Care360 AI"}</b><div>${parsedText}</div></div>`;
    chatMessages.appendChild(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));
}

async function sendChat(text) {
    if (!text.trim()) return;

    // Remove welcome screen if it's there
    document.querySelector(".chat-welcome")?.remove();

    // Show user message using your original styling
    addMessage(text.trim(), "user");
    messageInput.value = "";

    // Add a temporary loading message
    const loadingId = "loading-" + Date.now();
    const loadingDiv = document.createElement("div");
    loadingDiv.id = loadingId;
    loadingDiv.className = `chat-message ai`;
    loadingDiv.innerHTML = `<div class="msg-avatar">✚</div><div class="msg-body"><b>Care360 AI</b><p>Retrieving evidence from WHO Guidelines...</p></div>`;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text.trim() })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        // Remove loading message
        document.getElementById(loadingId).remove();

        // Build the final response with sources
        let finalResponse = data.answer;
        if (data.sources && data.sources.length > 0) {
            finalResponse += "<br><br><hr><small><b>Sources Used:</b><br>";
            data.sources.forEach(src => {
                // لو اسم القسم Unknown، نعرض اسم الملف ورقم الصفحة كبديل احترافي
                let secName = src.section_name && src.section_name !== "Unknown" ? src.section_name : "WHO Guidelines";
                let secNum = src.section_number && src.section_number !== "Unknown" ? `Section ${src.section_number}` : "General Evidence";
                finalResponse += `• ${secName} (${secNum})<br>`;
            });
            finalResponse += "</small>";
        }

        // Show AI response using your original styling
        addMessage(finalResponse, "ai");

    } catch (error) {
        console.error('Error fetching chat response:', error);
        document.getElementById(loadingId).remove();
        addMessage("Sorry, I couldn't connect to the local server. Make sure FastAPI is running on port 8000.", "ai");
    }
}

chatForm.addEventListener("submit", e => {
    e.preventDefault();
    sendChat(messageInput.value);
});

messageInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChat(messageInput.value);
    }
});

document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => sendChat(button.dataset.prompt));
});

function resetChat() {
    chatMessages.innerHTML = `
    <div class="chat-welcome">
      <div class="ai-logo">✚<small>AI</small></div>
      <h2>How can I help you today?</h2>
      <p>Ask a health question and I'll provide information grounded in trusted medical sources.</p>
      <div class="suggestions">
        <button data-prompt="I have back pain after sitting at my desk for many hours. What can I do?">I have back pain after sitting at my desk...</button>
        <button data-prompt="How much sleep should an adult get each night?">What is a healthy sleep schedule?</button>
        <button data-prompt="What are some ways to improve my posture?">How can I improve my posture?</button>
        <button data-prompt="What are general healthy daily habits?">What are healthy daily habits?</button>
      </div>
    </div>`;
    chatMessages.querySelectorAll("[data-prompt]").forEach(button => {
        button.addEventListener("click", () => sendChat(button.dataset.prompt));
    });
}

newChat?.addEventListener("click", resetChat);
clearChat?.addEventListener("click", resetChat);

document.querySelectorAll(".source-card button,.evidence-cards a").forEach(button => {
    button.addEventListener("click", e => {
        if (button.tagName === "A") return;
        e.preventDefault();
        notify("Source details will be connected to your knowledge base later.");
    });
});

document.querySelector(".round-btn")?.addEventListener("click", () => notify("Theme control is ready for your preferred light/dark mode."));