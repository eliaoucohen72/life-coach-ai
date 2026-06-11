# Technical Brief — AI Life Coach App

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| LLM Provider | Groq API (free tier) |
| Model | llama-3.3-70b-versatile |
| Storage (MVP) | localStorage (profile + history) |
| Language detection | Auto via LLM prompt instruction |

---

## Project Structure

```
/coach-app
├── /client                  # React frontend
│   ├── /src
│   │   ├── /components
│   │   │   ├── Chat.jsx         # Main chat interface
│   │   │   ├── Message.jsx      # Single message bubble
│   │   │   ├── InputBar.jsx     # Text input + send button
│   │   │   ├── Sidebar.jsx      # Conversation history list
│   │   │   ├── ProfileForm.jsx  # User profile editor
│   │   │   └── Onboarding.jsx   # First-time flow
│   │   ├── /hooks
│   │   │   ├── useChat.js       # Chat state + API calls
│   │   │   ├── useProfile.js    # Profile CRUD (localStorage)
│   │   │   └── useHistory.js    # Conversation persistence
│   │   ├── /context
│   │   │   └── AppContext.jsx   # Global state (profile, active convo)
│   │   ├── /utils
│   │   │   └── storage.js       # localStorage helpers
│   │   └── App.jsx
├── /server                  # Express backend
│   ├── server.js            # Entry point
│   ├── /routes
│   │   └── chat.js          # POST /api/chat
│   ├── /middleware
│   │   └── errorHandler.js
│   └── .env                 # GROQ_API_KEY
├── package.json (root, with workspaces or separate)
└── README.md
```

---

## API Contract

### POST /api/chat

**Request:**
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "profile": {
    "name": "Yoni",
    "age": 32,
    "gender": "male",
    "weight": 85,
    "goal": "lose weight",
    "activityLevel": "sedentary",
    "dietaryRestrictions": ["gluten-free"],
    "language": "fr"
  }
}
```

**Response (streaming):**
```
Content-Type: text/event-stream
data: {"delta": "Bonjour"}
data: {"delta": " Yoni"}
data: [DONE]
```

---

## System Prompt Template

```js
const buildSystemPrompt = (profile) => `
You are Flex, a personal AI coach specializing in sport, nutrition, and quality of life.
You are warm, motivating, direct, and science-based. You never shame the user.
You adapt your tone to the user's mood. You respond in the same language the user writes in.
You always personalize your advice based on the user profile below.

User profile:
- Name: ${profile.name || 'unknown'}
- Age: ${profile.age || 'unknown'}
- Gender: ${profile.gender || 'unknown'}
- Weight: ${profile.weight ? profile.weight + 'kg' : 'unknown'}
- Goal: ${profile.goal || 'general wellness'}
- Activity level: ${profile.activityLevel || 'unknown'}
- Dietary restrictions: ${profile.dietaryRestrictions?.join(', ') || 'none'}

Keep answers concise unless the user asks for detail.
Never provide medical diagnoses. Always recommend consulting a professional for medical concerns.
`.trim();
```

---

## Key Implementation Details

### Streaming (server-side)
```js
// routes/chat.js
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/chat', async (req, res) => {
  const { messages, profile } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const systemPrompt = buildSystemPrompt(profile);
  const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: fullMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});
```

### Streaming (client-side hook)
```js
// hooks/useChat.js
const sendMessage = async (text) => {
  const userMessage = { role: 'user', content: text };
  const updated = [...messages, userMessage];
  setMessages(updated);

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: updated, profile }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let assistantText = '';

  setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const { delta } = JSON.parse(line.slice(6));
        assistantText += delta;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: assistantText };
          return copy;
        });
      }
    }
  }
};
```

### localStorage structure
```js
// Profile
localStorage.setItem('coach_profile', JSON.stringify({ name, age, ... }));

// Conversations
// Key: 'coach_conversations'
// Value: array of { id, title, createdAt, messages: [] }
```

---

## Environment Variables

```env
# /server/.env
GROQ_API_KEY=your_key_here
PORT=3001
CLIENT_URL=http://localhost:5173
```

---

## BMAD Prompt Instructions

When passing this brief to BMAD + Claude Code:

1. Use **Architect** role first to validate structure and flag gaps
2. Use **Developer** role to scaffold the project and implement features
3. Implement in this order:
   - Backend: server + /api/chat route with streaming
   - Frontend: AppContext + hooks (useProfile, useHistory, useChat)
   - UI: Onboarding → Chat → Sidebar → ProfileForm
4. Run lint + basic smoke test after each major component
5. Do NOT add authentication in Phase 1
