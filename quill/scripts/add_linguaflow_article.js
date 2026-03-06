import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, '../server/db/quill.db'));

const slug = 'linguaflow-ai-language-learning-voice-practice';
const title = 'Master Any Language with AI Voice Practice - LinguaFlow';
const subtitle = 'Practice speaking 7 languages with Google Gemini AI and get instant pronunciation feedback';

const content = `
<p>Picture this: You've been studying Spanish for months. You've memorized vocabulary, conquered verb conjugations, and can read restaurant menus with confidence. But the moment a native speaker says "Hola, ¿cómo estás?" your mind goes blank, and you mumble something that sounds more like a cat sneezing than Spanish.</p>

<p>Sound familiar? You're not alone.</p>

<p>The biggest gap in language learning isn't vocabulary or grammar—it's <strong>speaking practice</strong>. And that's exactly what LinguaFlow was built to solve.</p>

<h2>The Speaking Practice Problem</h2>

<p>Traditional language apps are great at teaching you to <em>read</em> and <em>write</em>. But when it comes to actual conversation? They leave you hanging. Here's what most learners face:</p>

<ul>
<li><strong>No practice partner</strong> - Native speakers aren't available 24/7</li>
<li><strong>Fear of judgment</strong> - Who wants to embarrass themselves in front of a real person?</li>
<li><strong>Generic feedback</strong> - "Good job!" doesn't tell you that your rolled R sounds like a motorboat</li>
<li><strong>No flexibility</strong> - Classes have schedules; life doesn't</li>
</ul>

<p>What if you could practice speaking anytime, get real feedback on your pronunciation, and never worry about someone laughing at your accent?</p>

<h2>Meet LinguaFlow: Your AI Conversation Partner</h2>

<p>LinguaFlow is an AI-powered language learning platform that lets you have real voice conversations with an intelligent tutor. Powered by Google's Gemini Native Audio technology, it doesn't just listen to what you say—it understands <em>how</em> you say it and gives you instant, specific feedback.</p>

<p>This isn't your typical chatbot that responds with pre-recorded phrases. LinguaFlow generates natural, flowing conversations that adapt to your level and respond to what you actually said.</p>

<h2>Key Features That Actually Help You Improve</h2>

<h3>Real-Time Voice Conversations</h3>

<p>Talk to LinguaFlow like you would talk to a friend. The AI listens, processes your speech in real-time, and responds naturally. No awkward pauses. No robotic responses. Just conversation.</p>

<p>The WebSocket-powered audio streaming means the delay is minimal—it feels like talking to a real person, not waiting for a loading spinner.</p>

<h3>Instant Pronunciation Correction</h3>

<p>This is where LinguaFlow shines. When you mispronounce something, the AI doesn't just say "try again." It:</p>

<ol>
<li>Identifies the exact error ("You missed the rolled R in 'perro'")</li>
<li>Pronounces the word slowly and clearly in isolation</li>
<li>Explains what your mouth should be doing</li>
<li>Gives you another chance to try it correctly</li>
</ol>

<p>Each language has a specialized tutor that understands that language's unique challenges. The Japanese tutor knows about pitch accent. The Vietnamese tutor focuses on tones. The French tutor catches those tricky nasal sounds.</p>

<h3>Adjustable Difficulty Levels</h3>

<p>Whether you're just starting out or polishing your pronunciation for business meetings, LinguaFlow adapts. A 1-5 difficulty scale lets you:</p>

<ul>
<li>Start with basic greetings and simple phrases (Level 1-2)</li>
<li>Move to everyday conversations and storytelling (Level 3)</li>
<li>Tackle complex topics and natural speech patterns (Level 4-5)</li>
</ul>

<p>For Vietnamese speakers learning English, there's a unique hybrid mode that gradually shifts the conversation from Vietnamese to English as you improve.</p>

<h3>Live Transcript & Message History</h3>

<p>Everything you say and everything the AI responds with appears in a real-time transcript. This means:</p>

<ul>
<li>You can see exactly what the AI understood</li>
<li>You can review corrections after the conversation</li>
<li>You have a record of your practice sessions</li>
</ul>

<h3>Progress Tracking That Actually Matters</h3>

<p>LinguaFlow remembers you. When you come back, it knows:</p>

<ul>
<li>Which lesson you're on</li>
<li>Words you've learned</li>
<li>How many sessions you've completed</li>
</ul>

<p>The AI even greets you by name and picks up where you left off. No more starting from "Hola, me llamo..." for the hundredth time.</p>

<h2>7 Languages, One Platform</h2>

<p>LinguaFlow currently supports seven languages, each with specialized pronunciation coaching:</p>

<table>
<thead>
<tr><th>Language</th><th>Focus Area</th></tr>
</thead>
<tbody>
<tr><td>🇪🇸 Spanish</td><td>Rolled R, accent marks, regional variations</td></tr>
<tr><td>🇫🇷 French</td><td>Nasal sounds, liaison, silent letters</td></tr>
<tr><td>🇩🇪 German</td><td>Consonant clusters, umlauts, word stress</td></tr>
<tr><td>🇯🇵 Japanese</td><td>Pitch accent, long vowels, rhythm</td></tr>
<tr><td>🇻🇳 Vietnamese</td><td>Six tones, vowel sounds, consonant finals</td></tr>
<tr><td>🇬🇧 English</td><td>Stress patterns, linking, accent reduction</td></tr>
<tr><td>🇻🇳🇬🇧 Vietnamese-English</td><td>Bilingual mode for Vietnamese speakers</td></tr>
</tbody>
</table>

<h2>How It Works</h2>

<p>Getting started takes less than a minute:</p>

<ol>
<li><strong>Pick your language</strong> - Choose from the 7 available options</li>
<li><strong>Select a topic</strong> - Free talk, greetings, travel, food, work, and more</li>
<li><strong>Click "Start Conversation"</strong> - Allow microphone access</li>
<li><strong>Start speaking</strong> - The AI will respond and guide the conversation</li>
<li><strong>Get feedback</strong> - Corrections appear in real-time</li>
</ol>

<p>That's it. No accounts to create (though you can save your progress). No complex setup. Just talk.</p>

<h2>Who Is This For?</h2>

<p><strong>Complete Beginners:</strong> Start with greetings and basic phrases. The AI adjusts to your level and won't throw advanced vocabulary at you before you're ready.</p>

<p><strong>Busy Professionals:</strong> Practice during your commute, lunch break, or while cooking dinner. Sessions can be as short as 5 minutes or as long as you want.</p>

<p><strong>Advanced Learners:</strong> Fine-tune your pronunciation and work on the subtle details that separate "good" from "native-like."</p>

<p><strong>Vietnamese Speakers Learning English:</strong> The unique hybrid mode starts with 80% Vietnamese and 20% English, gradually shifting as your confidence grows.</p>

<h2>Why LinguaFlow Works</h2>

<p>Three things make LinguaFlow different from other language learning tools:</p>

<p><strong>1. Real AI, Not Recordings:</strong> Google's Gemini Native Audio generates responses in real-time. Every conversation is unique.</p>

<p><strong>2. Pronunciation-First Philosophy:</strong> Most apps treat pronunciation as an afterthought. LinguaFlow puts it front and center because speaking is the hardest skill to develop on your own.</p>

<p><strong>3. No Judgment:</strong> An AI doesn't laugh at your accent. It doesn't get impatient. It doesn't have a bad day. It's just there to help you improve.</p>

<h2>Ready to Start Speaking?</h2>

<p>LinguaFlow is <strong>free to use</strong> and requires no account to get started. Just visit the app, select your language, and start talking.</p>

<p><a href="https://linguaflow.tranthachnguyen.com" target="_blank"><strong>Try LinguaFlow Now →</strong></a></p>

<p>Your AI conversation partner is waiting. What language will you practice today?</p>
`;

const tags = 'language-learning,AI,education,pronunciation,speaking-practice,google-gemini,voice-technology';
const readingTime = 10;
const coverImage = '/uploads/linguaflow-cover.png';

db.run(`
  INSERT INTO articles (slug, title, subtitle, content, coverImage, tags, status, readingTime, publishedAt)
  VALUES (?, ?, ?, ?, ?, ?, 'published', ?, datetime('now'))
`, [slug, title, subtitle, content, coverImage, tags, readingTime], function (err) {
    if (err) {
        console.error('Error inserting article:', err);
        console.error('Error details:', err.message);
    } else {
        console.log(`✅ Article created successfully with ID: ${this.lastID}`);
        console.log(`📝 Title: ${title}`);
        console.log(`🔗 Slug: ${slug}`);
        console.log(`📊 Reading Time: ${readingTime} minutes`);
        console.log(`🏷️  Tags: ${tags}`);
        console.log(`\n🌐 View at: http://localhost:5173/article/${slug}`);
    }
    db.close();
});
