import compression from 'compression';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5187;

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://comic-news.tranthachnguyen.com';
app.set('trust proxy', 1);
app.use(compression({ level: 9 }));
app.use(cors({ origin: allowedOrigin, optionsSuccessStatus: 200 }));
app.use(express.json({ limit: '10kb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

// Simple in-memory rate limiter factory
function makeRateLimiter(windowMs, maxRequests) {
  const store = new Map();
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, entry] of store) {
      if (entry.start < cutoff) store.delete(key);
    }
  }, 5 * 60_000).unref();
  return function rateLimit(req, res, next) {
    const key = req.ip;
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || now - entry.start > windowMs) {
      store.set(key, { start: now, count: 1 });
      return next();
    }
    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    entry.count++;
    next();
  };
}

const writeRateLimit = makeRateLimiter(60_000, 30);
const readRateLimit = makeRateLimiter(60_000, 120);
app.use('/images', express.static(join(__dirname, 'images'), {
  maxAge: '365d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Serve static frontend (for Docker deployment)
// Vite hashes JS/CSS filenames, so they can be cached immutably for 1 year
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1h',
  index: false,
  setHeaders: (res, filePath) => {
    if (/\.(js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Comic data — each entry has:
//   id, title, author, genre, coverImage, description, rating, chapters, status,
//   hasTextVersion, textStory (optional), pages (array of {id, image, caption}),
//   panels (array of {id, title, description})
// List endpoints strip `pages` before sending to keep payloads small.
const comics = [
  {
    id: 1,
    title: "Evanston Cold Weather Alert",
    author: "National Weather Service",
    genre: "News",
    publishedDate: "2025-01-15",
    coverImage: "/images/evanston-cold-weather.png",
    description: "Saturday at noon: 10 degrees. Overnight: zero. Wind chill of minus 8. The National Weather Service would like a word about your weekend plans.",
    rating: 4.7,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `The National Weather Service says Saturday's cold — with the temperature just 10 degrees at noon — will get substantially worse overnight — with a temperature of zero predicted in Evanston.

Wind chill values are expected to be as low as minus 8 degrees, along with west northwest winds around 15 miles per hour gusting to 25.

It will continue to be unusually cold until Monday, when we can expect a relatively balmy high temperature of 26 degrees.

Conditions are expected to be worse to the south of the immediate Chicago area — with accumulating snow Saturday causing hazardous travel conditions, mostly south of Interstate 80.`,
    pages: [
      { id: 1, image: "/images/evanston-cold-weather.png", caption: "Evanston braces for dangerous wind chill and near-zero temperatures" }
    ],
    panels: [
      { id: 1, title: "Saturday Noon", description: "10°F - National Weather Service: It's 10 degrees now... but just wait!" },
      { id: 2, title: "Overnight", description: "Evanston: 0°F - Substantially worse! Wind chill -8°F! Gusts to 25 MPH!" },
      { id: 3, title: "Unusually Cold", description: "Sunday circled in dread — one more freezing night before any relief" },
      { id: 4, title: "Monday", description: "26°F — the forecast calls it 'relatively balmy.' Nobody is convinced." },
      { id: 5, title: "South of I-80", description: "Hazardous travel - Accumulating snow! Stay home!" }
    ]
  },
  {
    id: 2,
    title: "Started a Business Relationship with a Great Guy",
    author: "Anonymous",
    genre: "Non-Fiction",
    publishedDate: "2025-02-01",
    coverImage: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_1.png",
    description: "A trusted business friend turns complicated when his wife turns out to be someone from a distant past. A story about unexpected reconnections and moral choices.",
    rating: 4.6,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `Started a business relationship with a great guy. Met his wife who I had sex with in my 20s.

As per the title.

Five years ago just before Covid I was contacted by a guy. He was looking into our services. We started doing business on a regular basis. He always paid on time. Great customer and person. We got to know each other. Baseball games, bars, lunch… etc.

We became friends in many ways. I genuinely like him as a person.

A month ago we had a larger function at our local Board of Trade.

It is there that I was introduced to his wife. As per the title. I have not seen her in decades. We met in 1996. Saw each other a few times. Then one thing lead to another. A sexual relationship that lasted just under 1 year. We got along. I was hoping to start a relationship with her but she wanted an open relationship. She was promiscuous and told me so. She was hoping to have fun and "snag" a professional athlete. We went our separate ways and never had contact in almost 30 years.

Not until that event. When introduced, I could tell by her eyes that she recognized me immediately. I quickly caught on and played along that I did not know her. We all made small talk later and she admitted to remembering and liked seeing me. But she does not want her husband of 16 years to know of her sexual past. They have a 13 year old daughter. I respect her decision. It was long ago and I like both her and her husband.

About a week later she creeped me on social media. Then email. Inferring things. Basically she is nostalgic for those times and she wants to start an affair. I did not reply. I later received a call from her where I declined and stated my reasons. It is not good business, plus I got to know and respect her husband. For context: I am in my early 50s. Single. Never married or children.`,
    pages: [
      { id: 1, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_1.png", caption: "A great business contact — reliable, punctual, and easy to like" },
      { id: 2, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_2.png", caption: "Friendship grows beyond business — baseball games, bars, genuine connection" },
      { id: 3, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_3.png", caption: "The Board of Trade function — an introduction that changes everything" },
      { id: 4, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_4.png", caption: "A flash of recognition — she remembered, and so did I" },
      { id: 5, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_5.png", caption: "Nearly 30 years ago — a brief chapter neither expected to revisit" },
      { id: 6, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_6.png", caption: "Her request for silence — protecting 16 years of marriage" },
      { id: 7, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_7.png", caption: "The messages arrive — nostalgia edging toward something reckless" },
      { id: 8, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_8.png", caption: "The answer is no — integrity over temptation" }
    ],
    panels: [
      { id: 1, title: "The Beginning", description: "Five years of reliable business — always paid on time, always easy to work with" },
      { id: 2, title: "Building Friendship", description: "Baseball games, bars, lunch. A business contact becomes something more like a friend." },
      { id: 3, title: "The Event", description: "A Board of Trade function. A formal introduction. A face from a very different chapter of life." },
      { id: 4, title: "Recognition", description: "Her eyes said it before anything else — she knew exactly who I was" },
      { id: 5, title: "The Past", description: "1996. A brief chapter that ended quietly and was never expected to resurface" },
      { id: 6, title: "Her Secret", description: "Sixteen years of marriage. A 13-year-old daughter. Some things are better left in the past." },
      { id: 7, title: "The Proposition", description: "A social media creep. Then email. Then a call. Nostalgia dressed up as something reckless." },
      { id: 8, title: "The Decision", description: "I said no. Integrity is a better business plan than regret." }
    ]
  },
  {
    id: 3,
    title: "I Accidentally Said 'Love You' to a Cashier",
    author: "Anonymous",
    genre: "Slice of Life",
    publishedDate: "2024-12-10",
    coverImage: "/images/love-you-cashier.png",
    description: "An awkward moment at the checkout that spiraled into the most embarrassing exit of my life. Full volume. Clear as a bell. The cashier handled it with more grace than deserved.",
    rating: 4.8,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `I accidentally said "love you" to a cashier.

It was a Thursday. I was tired. I grabbed my coffee, my sad little sandwich, put it all on the counter.

The cashier — friendly guy, probably around my age — scanned everything and said "Have a good one!"

And I said "Love you."

Not quietly. Not under my breath. Full volume. Clear as a bell. "Love you."

He froze. I froze. The person behind me in line froze. Time froze.

He said "...thanks, man."

I could not recover from this. I grabbed my bag, said "okay" for some reason, and walked directly into the automatic door before it had fully opened.

I now do all my grocery shopping online.`,
    pages: [
      { id: 1, image: "/images/love-you-cashier.png", caption: "The moment that changed everything at the checkout counter" }
    ],
    panels: [
      { id: 1, title: "A Normal Thursday", description: "Coffee, sad sandwich, checkout counter — a routine errand" },
      { id: 2, title: "Have a Good One!", description: "The cashier offers a perfectly normal farewell" },
      { id: 3, title: "Love You", description: "Full volume. Clear as a bell. No taking it back." },
      { id: 4, title: "The Freeze", description: "All parties involved experience a collective system failure" },
      { id: 5, title: "...Thanks, Man", description: "The cashier handles it with more grace than deserved" },
      { id: 6, title: "Okay", description: "A nonsensical parting word before walking into a closed door" }
    ]
  },
  {
    id: 4,
    title: "I Said 'You Too' When the Waiter Said 'Enjoy Your Meal'",
    author: "Anonymous",
    genre: "Slice of Life",
    publishedDate: "2024-12-15",
    coverImage: "/images/you-too-waiter.svg",
    description: "The two words left my mouth before any part of my brain could intervene. The waiter accepted it with extraordinary dignity. Three years later, he still works there.",
    rating: 4.9,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `I said "you too" when the waiter said "enjoy your meal."

It was a Saturday. My wife and I had a reservation. Nice place. I was having a good night until precisely the moment I was not.

The waiter — professional, composed, clearly excellent at his job — set down our plates with a warm smile.

"Enjoy your meal!" he said.

"You too," I said.

There was a pause. Not a long pause. But a very specific kind of pause. The kind where everyone in a two-foot radius immediately understands what has just occurred.

My wife looked down at the table. The waiter looked at me. I looked at the waiter.

"Thank you," he said, and walked away with extraordinary dignity.

I've been coming back to this restaurant for three years. He still works there. He still remembers. I can tell by the way he carefully avoids eye contact while taking my order.

I still tip 25%. It feels like the right thing to do.`,
    pages: [
      { id: 1, image: "/images/you-too-waiter.svg", caption: "The moment two words brought an entire restaurant to a halt" }
    ],
    panels: [
      { id: 1, title: "A Nice Saturday", description: "Reservation made, good restaurant, everything going smoothly" },
      { id: 2, title: "Enjoy Your Meal!", description: "The waiter delivers plates with professional warmth" },
      { id: 3, title: "You Too", description: "The words exit before any part of my brain can intervene" },
      { id: 4, title: "The Pause", description: "A very specific kind of pause. Everyone in range understands." },
      { id: 5, title: "Thank You", description: "He accepts it with extraordinary dignity and walks away" },
      { id: 6, title: "Three Years Later", description: "He still works there. He still remembers. I still tip 25%." }
    ]
  },
  {
    id: 5,
    title: "I Waved Back at Someone Who Wasn't Waving at Me",
    author: "Anonymous",
    genre: "Slice of Life",
    publishedDate: "2025-01-05",
    coverImage: "/images/wave-back.svg",
    description: "Full commitment. Meaningful eye contact. A warm smile. They were waving at the person standing three feet behind me. The half-second between confidence and comprehension was the best I have ever felt.",
    rating: 4.7,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `I waved back at someone who wasn't waving at me.

It was a Sunday morning. I was walking to the coffee shop, feeling good, sun out, birds doing bird things.

Someone across the street raised their hand in my direction. Big, warm wave. Very deliberate.

I raised my hand. Waved back. Smiled. Made meaningful eye contact.

Immediately, the person walked past me to embrace the actual human being standing three feet behind me.

They had not seen me at all. They had never seen me. I did not exist to them in any meaningful way.

I kept walking as if nothing had happened. I entered the coffee shop. I ordered my coffee. I sat down in the corner facing the wall.

I think about this sometimes. Specifically, I think about the window of time between when I committed to the wave and when I understood what I had done. That half-second of pure, unearned confidence.

It was the best I have ever felt.`,
    pages: [
      { id: 1, image: "/images/wave-back.svg", caption: "A warm wave across the street that was meant for absolutely nobody I know" }
    ],
    panels: [
      { id: 1, title: "Sunday Morning", description: "Sun out, birds doing bird things — a genuinely pleasant walk" },
      { id: 2, title: "The Wave", description: "Big, warm, deliberate. Raised hand. Aimed directly at me. Or so I thought." },
      { id: 3, title: "I Waved Back", description: "Full commitment. Meaningful eye contact. A warm smile. Peak confidence." },
      { id: 4, title: "The Hug", description: "They walked past me to embrace the person standing three feet behind me" },
      { id: 5, title: "I Kept Walking", description: "Like absolutely nothing had occurred. Corner seat. Facing the wall." },
      { id: 6, title: "The Half-Second", description: "That moment between commitment and comprehension — the best I have ever felt." }
    ]
  },
  {
    id: 6,
    title: "My Autocorrect Changed 'Meeting' to 'Mating' at Work",
    author: "Anonymous",
    genre: "Slice of Life",
    publishedDate: "2025-01-20",
    coverImage: "/images/autocorrect-mating.svg",
    description: "I typed quickly. I hit send. My manager replied in forty seconds. My colleague said he'd bring snacks. On the conference table that Thursday: a small bowl of mixed nuts.",
    rating: 4.8,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `My autocorrect changed "meeting" to "mating" in a work email.

It was a Tuesday. I had a quarterly review to schedule with my manager and two senior colleagues. I was busy. I typed quickly.

"Just wanted to confirm our quarterly mating is still on for Thursday at 2pm."

I hit send before reading it back.

My phone had autocorrected "meeting" to "mating" and I did not notice.

My manager replied within forty seconds. The email read: "Ha. Yes. Confirmed."

One colleague replied: "Looking forward to our mating."

The other wrote: "Can't wait for the mating. Will bring snacks."

I considered not going. I considered going but pretending to be a different person. I considered a new career entirely.

I went. I sat down. On the conference table was a small bowl of mixed nuts.

Nobody said anything directly. They didn't have to.

I now proofread every email three times. Sometimes four. I read them aloud. I have my wife read them. I am considering a proofreading service.`,
    pages: [
      { id: 1, image: "/images/autocorrect-mating.svg", caption: "SENT. One word different. Forty seconds to the first reply." }
    ],
    panels: [
      { id: 1, title: "A Busy Tuesday", description: "Quarterly review to schedule. Typing fast. No time to reread." },
      { id: 2, title: "Autocorrect Strikes", description: "\"meeting\" becomes \"mating.\" The phone is very confident about this." },
      { id: 3, title: "SENT", description: "It is gone. It is out there. It cannot be recalled." },
      { id: 4, title: "40 Seconds Later", description: "\"Ha. Yes. Confirmed.\" — Manager. Bless him." },
      { id: 5, title: "The Replies", description: "\"Looking forward to our mating. Will bring snacks.\" — Colleague." },
      { id: 6, title: "The Nuts", description: "Thursday, 2pm. A bowl of mixed nuts on the conference table. No explanation given." }
    ]
  },
  {
    id: 7,
    title: "I Held the Door for Someone Way Too Far Away",
    author: "Anonymous",
    genre: "Slice of Life",
    publishedDate: "2025-01-25",
    coverImage: "/images/held-door.svg",
    description: "I had committed. There was no graceful exit. I held that door for approximately twenty-seven seconds. It felt like three to five business days. I have since developed a precise system. I run drills.",
    rating: 4.6,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `I held the door open for someone who was way too far away.

It was a Wednesday. The grocery store. I reached the entrance a few steps ahead of someone and, in a burst of misguided goodwill, held the door open.

They were roughly thirty feet away.

I had committed. There was no graceful exit. I stood there, holding the door, smiling at an approaching stranger from a significant distance.

They walked faster. Not a jog — but a slightly accelerated, uncomfortable walk. The walk of someone who knows exactly what has happened and is now obligated to participate in it against their will.

They reached the door. "Thanks." They went inside.

I let go of the door. It swung shut. I stood outside for a moment.

I had been holding that door for approximately twenty-seven seconds. It felt like three to five business days.

I have since developed a precise system. Eight feet or fewer: hold the door. Nine to fifteen feet: make eye contact, nod toward the door, and go in first. Sixteen feet or more: go inside. You don't know them. They don't need your help. Everyone is fine.

I run drills.`,
    pages: [
      { id: 1, image: "/images/held-door.svg", caption: "Twenty-seven seconds. Approximately thirty feet. One very specific kind of eye contact." }
    ],
    panels: [
      { id: 1, title: "Wednesday. Grocery Store.", description: "A burst of goodwill. A door. An approaching stranger — at distance." },
      { id: 2, title: "The Commitment", description: "I had started. There was no undoing it. The door was open. I was holding it." },
      { id: 3, title: "Thirty Feet Away", description: "They saw me. I saw them see me. We both understood what this was now." },
      { id: 4, title: "The Walk", description: "Not a jog. A very specific, slightly accelerated, deeply reluctant walk." },
      { id: 5, title: "Thanks", description: "One word. They went inside. The door swung shut behind them." },
      { id: 6, title: "The System", description: "Eight feet: hold. Sixteen feet: go in. I have a system now. I run drills." }
    ]
  },
  {
    id: 8,
    title: "I Called My Teacher 'Mom' in Front of the Whole Class",
    author: "Anonymous",
    genre: "Slice of Life",
    publishedDate: "2024-11-20",
    coverImage: "/images/called-teacher-mom.svg",
    description: "Third period. Quiz handed back. Full confidence. Zero hesitation. Thirty-two witnesses. She said 'you're welcome' because she was a professional. I am 34 now. I still think about this.",
    rating: 4.8,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `I called my teacher "Mom" in front of the whole class.

It was a Tuesday. Third period. She had just handed back my quiz and I said, without any hesitation, with full confidence:

"Thanks, Mom."

The class went quiet in the way that classrooms only go quiet when something truly has occurred.

She looked at me. I looked at her. I looked at the quiz. The quiz could not help me.

"You're welcome," she said, because she was a professional.

I spent the rest of the period studying the surface of my desk in extraordinary detail. It had a scratch shaped like a lightning bolt. I thought about that scratch for years afterward.

I am 34 now. My teacher is retired. I still think about this sometimes. I assume she does too.`,
    pages: [
      { id: 1, image: "/images/called-teacher-mom.svg", caption: "Third period. A quiz returned. One word too many." }
    ],
    panels: [
      { id: 1, title: "Third Period, Tuesday", description: "Quiz handed back. A moment of pure, innocent confidence." },
      { id: 2, title: "Thanks, Mom.", description: "Full volume. No hesitation. Thirty-two witnesses." },
      { id: 3, title: "The Silence", description: "The whole class experienced a collective pause. Even the clock seemed to stop." },
      { id: 4, title: "The Eye Contact", description: "She looked at me. I looked at her. The quiz offered no guidance." },
      { id: 5, title: "You're Welcome", description: "Professional. Measured. She absolutely did not have to do that." },
      { id: 6, title: "The Desk Scratch", description: "A lightning bolt shape. I thought about it for years. Still do." }
    ]
  },
  {
    id: 9,
    title: "I Replied 'You're Welcome' Before Anyone Said Thank You",
    author: "Anonymous",
    genre: "Slice of Life",
    publishedDate: "2025-02-10",
    coverImage: "/images/youre-welcome-early.svg",
    description: "The gratitude was clearly on its way. I could see it coming. I just didn't wait for it to arrive.",
    rating: 4.7,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `I replied "you're welcome" before anyone said thank you.

It was a Friday afternoon. A colleague stopped by my desk with a question about a spreadsheet. I walked her through it. She nodded. She seemed satisfied.

I could see it coming. The gratitude was right there. Inevitable.

"You're welcome," I said.

She had not said thank you yet. She was going to. But she hadn't. I just preemptively accepted the gratitude that had not yet been offered.

She paused. Then she said "...thank you."

"Yeah," I said, which was the wrong response.

She left. I spent the next twenty minutes reconstructing exactly what had happened and why I had done it. I still don't have a satisfying answer.

I now wait. I wait for the thank you. I do not rush it. Some things need to arrive in their own time.`,
    pages: [
      { id: 1, image: "/images/youre-welcome-early.svg", caption: "The thank you was coming. I just didn't let it arrive on its own." }
    ],
    panels: [
      { id: 1, title: "Friday Afternoon", description: "A colleague. A spreadsheet question. A clear and solvable problem." },
      { id: 2, title: "It Was Going Well", description: "She nodded. The gratitude was clearly on its way. Any moment now." },
      { id: 3, title: "You're Welcome", description: "Said before the thank you. Confident. Deeply premature." },
      { id: 4, title: "The Pause", description: "She processed what had just occurred. So did I, in real time." },
      { id: 5, title: "...Thank You", description: "Graciously delivered, one beat late. Or one beat early. Depending on perspective." },
      { id: 6, title: "Yeah.", description: "The wrong response. I was there. I know. I'm still working on it." }
    ]
  },
  {
    id: 10,
    title: "I Laughed at the Wrong Part of Someone's Story",
    author: "Anonymous",
    genre: "Slice of Life",
    publishedDate: "2025-01-30",
    coverImage: "/images/laughed-wrong-part.svg",
    description: "I had misread the tone. I thought the worst was already behind them. I was wrong — the worst was the part I laughed at. She stopped talking. I nodded with great seriousness for the remainder of the evening.",
    rating: 4.6,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `I laughed at the wrong part of someone's story.

It was a dinner party. Someone was telling a story about their car breaking down on the highway. A bad day. Stressful. No shoulder. Cars going by at 70 miles per hour.

At some point I laughed.

I don't know what I was expecting the story to be. I had misread the tone. I thought the worst was already behind them. I was wrong — the worst was the part I laughed at.

She stopped talking.

Everyone looked at me.

I said "sorry, I thought—" and then didn't finish the sentence because there was no good ending to it.

She finished the story. It got worse before it got better. I did not laugh at any of it. I nodded with great seriousness for the remainder of the evening.

I now wait for other people to laugh first. This is not cowardice. It is calibration.`,
    pages: [
      { id: 1, image: "/images/laughed-wrong-part.svg", caption: "A dinner party. A story about a highway breakdown. One person who laughed at the wrong moment." }
    ],
    panels: [
      { id: 1, title: "A Dinner Party", description: "Comfortable setting. Someone starting a story. Reasonable expectations." },
      { id: 2, title: "The Highway", description: "No shoulder. Cars at 70 mph. The tone was clearly not light." },
      { id: 3, title: "I Laughed", description: "Wrong moment. Wrong read. Full commitment to the wrong interpretation." },
      { id: 4, title: "She Stopped", description: "The table went quiet. Eight people recalibrated their understanding of me." },
      { id: 5, title: "Sorry, I Thought—", description: "A sentence with no good ending. Left unfinished. Wisely." },
      { id: 6, title: "Very Serious Nodding", description: "For the remainder of the evening. I had earned this. I nodded through all of it." }
    ]
  }
];

// In-memory bookmarks and reading progress.
// NOTE: These are process-scoped — data is lost on server restart and is shared
// across all users. Limits (500 bookmarks, 1000 progress entries) are enforced
// in the write endpoints to prevent unbounded memory growth.
let bookmarks = [];
let readingProgress = {};

// Precomputed static data
const genreList = ['All', ...new Set(comics.map(c => c.genre))];
const comicsListDefault = comics.map(({ pages, ...comic }) => comic);
const comicsSortedByRating = [...comicsListDefault].sort((a, b) => b.rating - a.rating);
const comicsSortedByTitle = [...comicsListDefault].sort((a, b) => a.title.localeCompare(b.title));
const featuredComics = [...comics]
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 4)
  .map(({ pages, ...comic }) => comic);

// Precomputed genre-filtered sorted lists
const comicsByGenre = new Map();
for (const genre of genreList) {
  if (genre === 'All') continue;
  const filtered = comicsListDefault.filter(c => c.genre === genre);
  comicsByGenre.set(genre, {
    byRating: [...filtered].sort((a, b) => b.rating - a.rating),
    byTitle: [...filtered].sort((a, b) => a.title.localeCompare(b.title)),
    default: filtered,
  });
}

// Precomputed lowercase strings for search
const comicsWithLower = comics.map(c => ({
  ...c, _titleLower: c.title.toLowerCase(), _authorLower: c.author.toLowerCase(),
}));

// ETags for static endpoints (computed once at startup)
const _dataHash = crypto.createHash('sha1').update(JSON.stringify(comics)).digest('hex').slice(0, 16);
const comicsETag = `"${_dataHash}"`;
const genresETag = `"${_dataHash}-genres"`;
const featuredETag = `"${_dataHash}-featured"`;
const comicETags = new Map(comics.map(c => [c.id, `"${_dataHash}-${c.id}"`]));

const _rawBaseUrl = process.env.BASE_URL || 'https://comic-news.tranthachnguyen.com';
if (!/^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?$/.test(_rawBaseUrl)) {
  console.error(`Invalid BASE_URL: "${_rawBaseUrl}". Must be https://hostname or http://hostname[:port].`);
  process.exit(1);
}
const baseUrl = _rawBaseUrl;
const today = new Date().toISOString().split('T')[0];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Safely serialize an object as JSON for embedding in an HTML <script> tag.
// Escapes </ to prevent </script> from terminating the script block prematurely.
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

let indexHtmlTemplate = '';
try {
  indexHtmlTemplate = readFileSync(join(__dirname, 'dist', 'index.html'), 'utf-8');
} catch (err) {
  if (err.code !== 'ENOENT') console.error('Failed to read dist/index.html:', err);
}

const _escapedBaseUrl = escapeHtml(baseUrl);
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>${_escapedBaseUrl}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${_escapedBaseUrl}/library</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
${comics.map(c =>
  `  <url><loc>${_escapedBaseUrl}/comic/${c.id}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority>
    <image:image><image:loc>${_escapedBaseUrl}${escapeHtml(c.coverImage)}</image:loc><image:title>${escapeHtml(c.title)}</image:title><image:caption>${escapeHtml(c.description)}</image:caption></image:image>
  </url>`
).join('\n')}
</urlset>`;

const VALID_SORT_VALUES = new Set(['', 'rating', 'title', 'default']);

// Get all comics
app.get('/api/comics', readRateLimit, (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  const { genre, search, sort } = req.query;

  if (sort !== undefined && !VALID_SORT_VALUES.has(sort)) {
    return res.status(400).json({ error: 'Invalid sort value' });
  }

  // Fast path: no filters — serve precomputed results with ETag
  if (!genre && !search) {
    res.set('ETag', comicsETag);
    if (req.headers['if-none-match'] === comicsETag) return res.status(304).end();
    if (!sort || sort === 'rating') return res.json(comicsSortedByRating);
    if (sort === 'title') return res.json(comicsSortedByTitle);
    return res.json(comicsListDefault);
  }

  // Genre filter: use precomputed map when no search
  if (genre && genre !== 'All' && !search) {
    const genreData = comicsByGenre.get(genre);
    if (genreData) {
      if (!sort || sort === 'rating') return res.json(genreData.byRating);
      if (sort === 'title') return res.json(genreData.byTitle);
      return res.json(genreData.default);
    }
    return res.json([]);
  }

  // Search path: use precomputed lowercase strings
  const searchLower = search ? String(search).slice(0, 100).toLowerCase() : null;
  let result = comicsWithLower.filter(comic =>
    (genre && genre !== 'All' ? comic.genre === genre : true) &&
    (searchLower ? comic._titleLower.includes(searchLower) || comic._authorLower.includes(searchLower) : true)
  );

  if (sort === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Return without pages or internal fields
  res.json(result.map(({ pages, _titleLower, _authorLower, ...comic }) => comic));
});

// Get single comic with pages
app.get('/api/comics/:id', readRateLimit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const comic = comics.find(c => c.id === id);
  if (!comic) return res.status(404).json({ error: 'Comic not found' });
  const etag = comicETags.get(id);
  res.set('Cache-Control', 'public, max-age=3600');
  res.set('ETag', etag);
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.json(comic);
});

// Get genres
app.get('/api/genres', readRateLimit, (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.set('ETag', genresETag);
  if (req.headers['if-none-match'] === genresETag) return res.status(304).end();
  res.json(genreList);
});

// Bookmarks
app.get('/api/bookmarks', readRateLimit, (req, res) => {
  res.set('Cache-Control', 'no-store');
  const bookmarkedComics = comics
    .filter(c => bookmarks.includes(c.id))
    .map(({ pages, ...comic }) => comic);
  res.json(bookmarkedComics);
});

app.get('/api/bookmarks/check/:id', readRateLimit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  res.set('Cache-Control', 'no-store');
  res.json({ isBookmarked: bookmarks.includes(id) });
});

app.post('/api/bookmarks/:id', writeRateLimit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  if (!comics.find(c => c.id === id)) return res.status(404).json({ error: 'Comic not found' });
  if (!bookmarks.includes(id)) {
    if (bookmarks.length >= 500) return res.status(429).json({ error: 'Bookmark limit reached' });
    bookmarks.push(id);
  }
  res.json({ success: true });
});

app.delete('/api/bookmarks/:id', writeRateLimit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const idx = bookmarks.indexOf(id);
  if (idx !== -1) bookmarks.splice(idx, 1);
  res.json({ success: true });
});

// Reading progress
app.get('/api/progress/:id', readRateLimit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  res.set('Cache-Control', 'no-store');
  res.json({ page: readingProgress[id] || 1 });
});

app.post('/api/progress/:id', writeRateLimit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  if (!comics.find(c => c.id === id)) return res.status(404).json({ error: 'Comic not found' });
  const page = parseInt(req.body.page, 10);
  if (isNaN(page) || page < 1 || page > 10000) return res.status(400).json({ error: 'Invalid page' });
  if (Object.keys(readingProgress).length >= 1000 && !(id in readingProgress)) {
    return res.status(429).json({ error: 'Progress storage limit reached' });
  }
  readingProgress[id] = page;
  res.json({ success: true });
});

// Featured/Popular comics
app.get('/api/featured', readRateLimit, (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.set('ETag', featuredETag);
  if (req.headers['if-none-match'] === featuredETag) return res.status(304).end();
  res.json(featuredComics);
});

// robots.txt
app.get('/robots.txt', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /bookmarks\nDisallow: /read/\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

// sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.type('application/xml');
  res.send(sitemapXml);
});

// SSR meta injection for comic detail pages (improves crawler visibility)
app.get('/comic/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const comic = comics.find(c => c.id === id);
  if (!comic || !indexHtmlTemplate) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(join(__dirname, 'dist', 'index.html'), (err) => {
      if (err && !res.headersSent) res.status(500).end();
    });
  }

  const pageTitle = `${comic.title} - Comic News`;
  const imgUrl = `${baseUrl}${comic.coverImage}`;
  const canonicalUrl = `${baseUrl}/comic/${id}`;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    headline: comic.title,
    description: comic.description,
    author: { '@type': 'Person', name: comic.author },
    publisher: { '@type': 'Organization', name: 'Comic News', url: baseUrl, logo: { '@type': 'ImageObject', url: `${baseUrl}/favicon.svg` } },
    image: { '@type': 'ImageObject', url: imgUrl },
    genre: comic.genre,
    inLanguage: 'en-US',
    url: canonicalUrl,
    datePublished: comic.publishedDate,
    dateModified: today,
    ...(comic.hasTextVersion && comic.textStory ? { wordCount: comic.textStory.trim().split(/\s+/).length } : {}),
    ...(comic.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: comic.rating, bestRating: 5, worstRating: 1, ratingCount: Math.round(comic.rating * comic.chapters * 15) } } : {}),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Library', item: `${baseUrl}/library` },
      { '@type': 'ListItem', position: 3, name: comic.title, item: canonicalUrl },
    ],
  };

  const html = indexHtmlTemplate
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,  `$1${escapeHtml(comic.description)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/,  `$1article$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,  `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${escapeHtml(comic.description)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/,  `$1${escapeHtml(imgUrl)}$2`)
    .replace(/(<meta property="og:image:secure_url" content=")[^"]*(")/,  `$1${escapeHtml(imgUrl)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,  `$1${escapeHtml(canonicalUrl)}$2`)
    .replace(/(<meta property="og:image:alt" content=")[^"]*(")/,  `$1${escapeHtml(comic.title)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,  `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${escapeHtml(comic.description)}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/,  `$1${escapeHtml(imgUrl)}$2`)
    .replace(/(<meta name="twitter:image:alt" content=")[^"]*(")/,  `$1${escapeHtml(comic.title)}$2`)
    .replace(/(<meta name="keywords" content=")[^"]*(")/,  `$1${escapeHtml([comic.genre, comic.author, 'comic news', 'visual storytelling', 'news comics'].join(', '))}$2`)
    .replace(/(<link id="canonical-link" rel="canonical" href=")[^"]*(")/,  `$1${escapeHtml(canonicalUrl)}$2`)
    .replace(
      /(<script type="application\/ld\+json">[\s\S]*?<\/script>)/,
      `$1\n    <script type="application/ld+json">${safeJsonLd(articleLd)}</script>\n    <script type="application/ld+json">${safeJsonLd(breadcrumbLd)}</script>`
    )
    .replace(/<meta property="og:image:width" content="[^"]*" \/>\n?/, '')
    .replace(/<meta property="og:image:height" content="[^"]*" \/>\n?/, '');

  res.set('Cache-Control', 'public, max-age=3600');
  res.type('html').send(html);
});

// SSR meta injection for library page (improves crawler visibility)
app.get('/library', (req, res) => {
  if (!indexHtmlTemplate) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(join(__dirname, 'dist', 'index.html'), (err) => {
      if (err && !res.headersSent) res.status(500).end();
    });
  }

  const pageTitle = 'Story Library - Comic News';
  const pageDesc = 'Browse all news stories transformed into comics. Filter by genre, sort by rating, and discover visual storytelling at its best.';
  const canonicalUrl = `${baseUrl}/library`;

  const topComic = featuredComics[0];
  const libraryImgUrl = topComic ? `${baseUrl}${topComic.coverImage}` : null;

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    url: canonicalUrl,
    description: pageDesc,
    hasPart: comicsSortedByRating.slice(0, 20).map(c => ({
      '@type': 'Article',
      headline: c.title,
      url: `${baseUrl}/comic/${c.id}`,
      image: `${baseUrl}${c.coverImage}`,
      author: { '@type': 'Person', name: c.author },
      genre: c.genre,
    })),
  };

  let html = indexHtmlTemplate
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,  `$1${escapeHtml(pageDesc)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,  `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${escapeHtml(pageDesc)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,  `$1${escapeHtml(canonicalUrl)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,  `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${escapeHtml(pageDesc)}$2`)
    .replace(/(<link id="canonical-link" rel="canonical" href=")[^"]*(")/,  `$1${escapeHtml(canonicalUrl)}$2`);
  if (libraryImgUrl) {
    html = html
      .replace(/(<meta property="og:image" content=")[^"]*(")/,  `$1${escapeHtml(libraryImgUrl)}$2`)
      .replace(/(<meta property="og:image:secure_url" content=")[^"]*(")/,  `$1${escapeHtml(libraryImgUrl)}$2`)
      .replace(/(<meta property="og:image:alt" content=")[^"]*(")/,  `$1Story Library - Comic News$2`)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/,  `$1${escapeHtml(libraryImgUrl)}$2`)
      .replace(/(<meta name="twitter:image:alt" content=")[^"]*(")/,  `$1Story Library - Comic News$2`);
  }
  html = html
    .replace(
      /(<script type="application\/ld\+json">[\s\S]*?<\/script>)/,
      `$1\n    <script type="application/ld+json">${safeJsonLd(collectionLd)}</script>`
    )
    .replace(/<meta property="og:image:width" content="[^"]*" \/>\n?/, '')
    .replace(/<meta property="og:image:height" content="[^"]*" \/>\n?/, '');

  res.set('Cache-Control', 'public, max-age=3600');
  res.type('html').send(html);
});

// SSR noindex injection for reader and bookmarks pages (prevents duplicate/thin content indexing)
function serveNoindex(res) {
  if (!indexHtmlTemplate) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(join(__dirname, 'dist', 'index.html'), (err) => {
      if (err && !res.headersSent) res.status(500).end();
    });
  }
  const html = indexHtmlTemplate
    .replace(/(<meta name="robots" content=")[^"]*(")/,  '$1noindex, follow$2');
  res.set('Cache-Control', 'no-store');
  res.type('html').send(html);
}

app.get('/read/:id', (req, res) => serveNoindex(res));
app.get('/bookmarks', (req, res) => serveNoindex(res));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(join(__dirname, 'dist', 'index.html'), (err) => {
    if (err && !res.headersSent) res.status(500).end();
  });
});

app.listen(PORT, () => {
  console.log(`Comic News running on http://localhost:${PORT}`);
});
