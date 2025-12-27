import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5187;

app.use(cors());
app.use(express.json());
app.use('/images', express.static(join(__dirname, 'images')));

// Serve static frontend (for Docker deployment)
app.use(express.static(join(__dirname, 'dist')));

// Comic data
const comics = [
  {
    id: 1,
    title: "Evanston Cold Weather Alert",
    author: "National Weather Service",
    genre: "News",
    coverImage: "/images/evanston-cold-weather.png",
    description: "Saturday's cold gets substantially worse overnight with temperatures dropping to zero in Evanston and dangerous wind chill values.",
    rating: 4.7,
    chapters: 1,
    status: "Completed",
    hasTextVersion: true,
    textStory: `The National Weather Service says Saturday's cold — with the temperature just 10 degrees at noon — will get substantially worse overnight — with a temperature of zero predicted in Evanston.

Wind chill values are expected to be as low as minus 8 degrees, along with west northwest winds around 15 miles per hour gusting to 25.

It will continue to be unusually cold until Monday, when we can expect a relatively balmy high temperature of 26 degrees.

Conditions are expected to be worse to the south of the immediate Chicago area — with accumulating snow Saturday causing hazardous travel conditions, mostly south of Interstate 80.`,
    pages: [
      { id: 1, image: "/images/evanston-cold-weather.png", caption: "A scrollable comic strip for iPhone" }
    ],
    panels: [
      { id: 1, title: "Saturday Noon", description: "10°F - National Weather Service: It's 10 degrees now... but just wait!" },
      { id: 2, title: "Overnight", description: "Evanston: 0°F - Substantially worse! Wind chill -8°F! Gusts to 25 MPH!" },
      { id: 3, title: "Unusually Cold", description: "Unusually cold until Monday - calendar showing Sunday crossed out" },
      { id: 4, title: "Monday", description: "26°F - 'Relatively balmy' - 26 degrees? I'll believe it when I feel it." },
      { id: 5, title: "South of I-80", description: "Hazardous travel - Accumulating snow! Stay home!" }
    ]
  },
  {
    id: 2,
    title: "Started a Business Relationship with a Great Guy",
    author: "Anonymous",
    genre: "Non-Fiction",
    coverImage: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_1.png",
    description: "Met his wife who I had sex with in my 20s. A story about unexpected reconnections and moral choices.",
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
      { id: 1, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_1.png", caption: "Panel 1" },
      { id: 2, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_2.png", caption: "Panel 2" },
      { id: 3, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_3.png", caption: "Panel 3" },
      { id: 4, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_4.png", caption: "Panel 4" },
      { id: 5, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_5.png", caption: "Panel 5" },
      { id: 6, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_6.png", caption: "Panel 6" },
      { id: 7, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_7.png", caption: "Panel 7" },
      { id: 8, image: "/images/Started a business relationship with a great guy . Met his wife who I had sex with in my 20s/panel_8.png", caption: "Panel 8" }
    ],
    panels: [
      { id: 1, title: "The Beginning", description: "Five years ago, contacted by a guy for business services" },
      { id: 2, title: "Building Friendship", description: "Baseball games, bars, lunch - we became friends" },
      { id: 3, title: "The Event", description: "Board of Trade function - introduced to his wife" },
      { id: 4, title: "Recognition", description: "She recognized me immediately - we met in 1996" },
      { id: 5, title: "The Past", description: "A sexual relationship that lasted just under 1 year" },
      { id: 6, title: "Her Secret", description: "She doesn't want her husband to know her past" },
      { id: 7, title: "The Proposition", description: "She wants to start an affair - nostalgic for those times" },
      { id: 8, title: "The Decision", description: "I declined - not good business, and I respect her husband" }
    ]
  }
];

// In-memory bookmarks storage
let bookmarks = [];
let readingProgress = {};

// Get all comics
app.get('/api/comics', (req, res) => {
  const { genre, search, sort } = req.query;
  let result = [...comics];

  if (genre && genre !== 'All') {
    result = result.filter(comic => comic.genre === genre);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    result = result.filter(comic => 
      comic.title.toLowerCase().includes(searchLower) ||
      comic.author.toLowerCase().includes(searchLower)
    );
  }

  if (sort === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Return without pages for list view
  res.json(result.map(({ pages, ...comic }) => comic));
});

// Get single comic with pages
app.get('/api/comics/:id', (req, res) => {
  const comic = comics.find(c => c.id === parseInt(req.params.id));
  if (!comic) {
    return res.status(404).json({ error: 'Comic not found' });
  }
  res.json(comic);
});

// Get genres
app.get('/api/genres', (req, res) => {
  const genres = ['All', ...new Set(comics.map(c => c.genre))];
  res.json(genres);
});

// Bookmarks
app.get('/api/bookmarks', (req, res) => {
  const bookmarkedComics = comics
    .filter(c => bookmarks.includes(c.id))
    .map(({ pages, ...comic }) => comic);
  res.json(bookmarkedComics);
});

app.post('/api/bookmarks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!bookmarks.includes(id)) {
    bookmarks.push(id);
  }
  res.json({ success: true, bookmarks });
});

app.delete('/api/bookmarks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  bookmarks = bookmarks.filter(b => b !== id);
  res.json({ success: true, bookmarks });
});

app.get('/api/bookmarks/check/:id', (req, res) => {
  const id = parseInt(req.params.id);
  res.json({ isBookmarked: bookmarks.includes(id) });
});

// Reading progress
app.get('/api/progress/:id', (req, res) => {
  const id = req.params.id;
  res.json({ page: readingProgress[id] || 1 });
});

app.post('/api/progress/:id', (req, res) => {
  const id = req.params.id;
  const { page } = req.body;
  readingProgress[id] = page;
  res.json({ success: true });
});

// Featured/Popular comics
app.get('/api/featured', (req, res) => {
  const featured = comics
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)
    .map(({ pages, ...comic }) => comic);
  res.json(featured);
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Comic News running on http://localhost:${PORT}`);
});
