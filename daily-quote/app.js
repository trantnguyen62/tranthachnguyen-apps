/**
 * Quotidian: Daily Literature
 * JavaScript Application
 */

// ===================================
// Splash Screen Handler
// ===================================

// Handle splash screen fade out
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splashScreen');

    if (splashScreen) {
        // Show splash for 2.5 seconds, then fade out slowly
        setTimeout(() => {
            splashScreen.classList.add('fade-out');

            // After fade animation completes (1.5s), hide completely
            setTimeout(() => {
                splashScreen.classList.add('hidden');
            }, 1500);
        }, 2500);
    }
});

// ===================================
// Quote Database
// ===================================

// ===================================
// Category Definitions for Explore
// ===================================

const categories = [
    { id: 'emotions', name: 'Emotions', icon: '💭', color: '#8B4557' },
    { id: 'senses', name: 'Senses', icon: '🌸', color: '#6B8E7B' },
    { id: 'time', name: 'Time of Day', icon: '🌙', color: '#4A6FA5' },
    { id: 'nature', name: 'Nature', icon: '🌿', color: '#5D8A4E' },
    { id: 'seasons', name: 'Seasons', icon: '🍂', color: '#C17F59' },
    { id: 'weather', name: 'Weather', icon: '☁️', color: '#7A8B99' }
];

const quotes = [
    {
        id: 1,
        text: "If we had a keen vision and feeling of all ordinary human life, it would be like hearing the grass grow and the squirrel's heart beat, and we should die of that roar which lies on the other side of silence.",
        book: "Middlemarch",
        author: "George Eliot",
        year: 1871,
        category: 'senses',
        story: "Sarah paused at her kitchen window, watching a sparrow hop along the fence. For the first time in months, she truly saw it—its tiny heartbeat visible in its throat, the morning light catching each feather. She realized how much life she'd been missing by rushing through her days."
    },
    {
        id: 2,
        text: "His soul swooned slowly as he heard the snow falling faintly through the universe and faintly falling, like the descent of their last end, upon all the living and the dead.",
        book: "The Dead",
        author: "James Joyce",
        year: 1914,
        category: 'weather',
        story: "Marcus stood at his grandmother's funeral as snow began to fall. Watching the flakes land softly on the casket, he felt connected to everyone who had ever loved and lost—the snow falling on all of them, living and dead, the same quiet blessing covering the world."
    },
    {
        id: 3,
        text: "In the opening sentence of the Lighthouse, Woolf brings you straight into the day lives of the Ramsays. Once you've read it, we challenge you to hear the question: 'Can we go to the lighthouse?'",
        book: "To the Lighthouse",
        author: "Virginia Woolf",
        year: 1927,
        category: 'time',
        story: "Every summer, Emma's daughter asked if they could visit the old family cabin. Year after year, life got in the way. Now, walking through its dusty rooms alone, Emma understood—some journeys must be made before time runs out."
    },
    {
        id: 4,
        text: "The past is never dead. It's not even past. All of us labor in webs spun long before we were born, webs of heredity and environment, of desire and consequence, of history and eternity.",
        book: "Requiem for a Nun",
        author: "William Faulkner",
        year: 1951,
        category: 'time',
        story: "When Derek found his grandfather's journal, he discovered the old man had struggled with the same fears Derek now faced. The patterns ran deep—but understanding them, he realized, was the first step to finally breaking free."
    },
    {
        id: 5,
        text: "I took a deep breath and listened to the old brag of my heart: I am, I am, I am.",
        book: "The Bell Jar",
        author: "Sylvia Plath",
        year: 1963,
        category: 'emotions',
        story: "After months of feeling invisible, Mia placed her hand on her chest during a quiet moment. Each heartbeat was a declaration: she was here, she was real, she mattered. Sometimes survival itself is a form of victory."
    },
    {
        id: 6,
        text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        book: "Pride and Prejudice",
        author: "Jane Austen",
        year: 1813,
        category: 'emotions',
        story: "At the family reunion, everyone asked Tom when he'd settle down. He smiled politely, but inside recognized the irony—society's assumptions about what we 'must' want rarely align with what truly makes us whole."
    },
    {
        id: 7,
        text: "A book must be the axe for the frozen sea within us. That is my belief.",
        book: "Letters to Oskar Pollak",
        author: "Franz Kafka",
        year: 1904,
        category: 'seasons',
        story: "Julia had felt numb for years until she picked up a novel that cracked her open. Reading about a character's grief, she finally wept for her own losses. Some books don't just entertain—they thaw what we've frozen to survive."
    },
    {
        id: 8,
        text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.",
        book: "The Stranger",
        author: "Albert Camus",
        year: 1942,
        category: 'emotions',
        story: "In a company that demanded conformity, Rosa wore her grandmother's colorful shawl to work every day. Her small act of authenticity became her quiet revolution—a reminder that freedom starts in the choices we refuse to surrender."
    },
    {
        id: 9,
        text: "We read to know we are not alone. In reading, we find companions we never knew we needed.",
        book: "Shadowlands",
        author: "C.S. Lewis",
        year: 1993,
        category: 'emotions',
        story: "Moving to a new city, Alex knew no one. But curled up with a book each night, surrounded by characters who felt like friends, the loneliness eased. Stories became bridges to connection, even in solitude."
    },
    {
        id: 10,
        text: "The world breaks everyone and afterward many are strong at the broken places.",
        book: "A Farewell to Arms",
        author: "Ernest Hemingway",
        year: 1929,
        category: 'emotions',
        story: "After his divorce, Nathan thought he'd never recover. But years later, helping a friend through the same pain, he realized his broken places had become his strongest—filled with wisdom he couldn't have gained any other way."
    },
    {
        id: 11,
        text: "Not all those who wander are lost. The old that is strong does not wither, deep roots are not reached by the frost.",
        book: "The Fellowship of the Ring",
        author: "J.R.R. Tolkien",
        year: 1954,
        category: 'nature',
        story: "Friends worried when Lily quit her stable job to travel. But in each new city, she discovered more of herself. Her wandering wasn't aimlessness—it was a journey toward finding where she truly belonged."
    },
    {
        id: 12,
        text: "One must still have chaos in oneself to be able to give birth to a dancing star.",
        book: "Thus Spoke Zarathustra",
        author: "Friedrich Nietzsche",
        year: 1883,
        category: 'nature',
        story: "Carlos's mind was a storm of ideas that others called 'too scattered.' But from that beautiful chaos came his most innovative work—proof that creativity needs disorder to spark into something brilliant."
    },
    {
        id: 13,
        text: "The things you own end up owning you. It's only after we've lost everything that we're free to do anything.",
        book: "Fight Club",
        author: "Chuck Palahniuk",
        year: 1996,
        category: 'emotions',
        story: "After the fire took everything, Maria expected devastation. Instead, she felt unexpectedly light. Without the weight of accumulated possessions defining her, she was finally free to become whoever she wanted."
    },
    {
        id: 14,
        text: "Perhaps one did not want to be loved so much as to be understood.",
        book: "1984",
        author: "George Orwell",
        year: 1949,
        category: 'emotions',
        story: "Everyone told Sam they loved him. But it was his old college roommate, who simply said 'I get it,' during a hard time, who made him feel truly seen. Understanding runs deeper than love alone."
    },
    {
        id: 15,
        text: "There is no greater agony than bearing an untold story inside you.",
        book: "I Know Why the Caged Bird Sings",
        author: "Maya Angelou",
        year: 1969,
        category: 'emotions',
        story: "For decades, Elena kept her childhood secret locked away. The day she finally wrote it down, tears streaming, she felt the weight of years lift. Some stories must be told to release their hold on us."
    },
    {
        id: 16,
        text: "The only people for me are the mad ones, the ones who are mad to live, mad to talk, mad to be saved.",
        book: "On the Road",
        author: "Jack Kerouac",
        year: 1957,
        category: 'emotions',
        story: "At the quiet office party, Jake gravitated toward the woman passionately debating art in the corner. 'She's intense,' someone warned. Perfect, Jake thought—he'd always preferred fire to lukewarm."
    },
    {
        id: 17,
        text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
        book: "A Tale of Two Cities",
        author: "Charles Dickens",
        year: 1859,
        category: 'time',
        story: "Looking back on that year, Grace couldn't decide if it was wonderful or terrible. Her mother passed, but she also fell in love. Life, she learned, refuses to be just one thing."
    },
    {
        id: 18,
        text: "I have loved the stars too fondly to be fearful of the night.",
        book: "The Old Astronomer",
        author: "Sarah Williams",
        year: 1868,
        category: 'time',
        story: "While others rushed home at sunset, Daniel lingered in the observatory. The darkness that frightened others had become his friend—it was when the stars revealed their secrets to those patient enough to watch."
    },
    {
        id: 19,
        text: "We accept the love we think we deserve.",
        book: "The Perks of Being a Wallflower",
        author: "Stephen Chbosky",
        year: 1999,
        category: 'emotions',
        story: "It wasn't until therapy that Sophie understood why she kept choosing partners who didn't value her. The work wasn't just learning to expect more—it was believing she deserved it."
    },
    {
        id: 20,
        text: "Whatever our souls are made of, his and mine are the same.",
        book: "Wuthering Heights",
        author: "Emily Brontë",
        year: 1847,
        category: 'emotions',
        story: "Meeting her best friend at five, Priya couldn't explain the instant recognition. Decades later, she still felt it—some connections transcend logic, running soul-deep from the very first moment."
    },
    {
        id: 21,
        text: "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.",
        book: "Paradise Lost",
        author: "John Milton",
        year: 1667,
        category: 'senses',
        story: "Trapped in a hospital bed for weeks, Michael expected misery. But he discovered meditation, made friends with nurses, finished books he'd always meant to read. The room didn't change—his mind transformed it."
    },
    {
        id: 22,
        text: "I cannot fix on the hour, or the spot, or the look, or the words, which laid the foundation. It is too long ago. I was in the middle before I knew that I had begun.",
        book: "Pride and Prejudice",
        author: "Jane Austen",
        year: 1813,
        category: 'emotions',
        story: "When did she fall in love? Rachel couldn't say. It wasn't a thunderbolt—more like dawn breaking imperceptibly until suddenly there was light everywhere, and she was standing in it."
    },
    {
        id: 23,
        text: "So we beat on, boats against the current, borne back ceaselessly into the past.",
        book: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        year: 1925,
        category: 'time',
        story: "Jim kept returning to his hometown, chasing memories of a simpler time. But the diner was gone, friends had moved. The past he longed for existed only in his heart—beautiful and forever out of reach."
    },
    {
        id: 24,
        text: "The sea, once it casts its spell, holds one in its net of wonder forever.",
        book: "The Sea Around Us",
        author: "Jacques Cousteau",
        year: 1953,
        category: 'nature',
        story: "After her first dive, Angela was ruined for ordinary life. The underwater world had shown her another dimension. Twenty years later, she still chased that feeling wherever water met horizon."
    },
    {
        id: 25,
        text: "Beauty is truth, truth beauty—that is all ye know on earth, and all ye need to know.",
        book: "Ode on a Grecian Urn",
        author: "John Keats",
        year: 1819,
        category: 'senses',
        story: "Standing before the ancient statue, Tanya felt equations and philosophies fall away. Some truths can't be argued—only felt. The sculpture's beauty was its own perfect proof."
    },
    {
        id: 26,
        text: "The cure for anything is salt water: sweat, tears, or the sea.",
        book: "Seven Gothic Tales",
        author: "Isak Dinesen",
        year: 1934,
        category: 'nature',
        story: "After the breakup, Maya tried everything—therapy, distraction, burying herself in work. But it was the long beach walks, salt air stinging her eyes, that finally let the tears come and wash the grief away."
    },
    {
        id: 27,
        text: "You don't write because you want to say something, you write because you have something to say.",
        book: "Collected Essays",
        author: "F. Scott Fitzgerald",
        year: 1945,
        category: 'senses',
        story: "For years Ben chased trends, writing what he thought would sell. His breakthrough came when he finally wrote the story that had been burning inside him for decades—the one he needed to tell."
    },
    {
        id: 28,
        text: "I have not failed. I've just found 10,000 ways that won't work.",
        book: "Attributed",
        author: "Thomas Edison",
        year: 1910,
        category: 'emotions',
        story: "Startup number seven had crashed. But looking at her failures, Aisha saw not defeat but a map of eliminated dead ends. Every 'no' had brought her closer to the 'yes' that was coming."
    },
    {
        id: 29,
        text: "To live is the rarest thing in the world. Most people exist, that is all.",
        book: "The Soul of Man Under Socialism",
        author: "Oscar Wilde",
        year: 1891,
        category: 'emotions',
        story: "At sixty, George realized he'd spent forty years 'getting by.' The cancer scare changed everything. Now he tasted his coffee, really talked to strangers, watched sunsets. Finally, he was living."
    },
    {
        id: 30,
        text: "The only thing we have to fear is fear itself—nameless, unreasoning, unjustified terror.",
        book: "Inaugural Address",
        author: "Franklin D. Roosevelt",
        year: 1933,
        category: 'emotions',
        story: "The job interview terrified Paula until she asked herself: what was the worst that could happen? Rejection—survivable. The fear had been bigger than any real threat. She walked in confident."
    },
    {
        id: 31,
        text: "Real courage is when you know you're licked before you begin, but you begin anyway and see it through no matter what.",
        book: "To Kill a Mockingbird",
        author: "Harper Lee",
        year: 1960,
        category: 'emotions',
        story: "The case was unwinnable—everyone said so. But Atticus took it anyway because courage isn't about victory. It's about standing for what's right, even when standing alone."
    },
    {
        id: 32,
        text: "The heart has its reasons which reason knows nothing of.",
        book: "Pensées",
        author: "Blaise Pascal",
        year: 1670,
        category: 'emotions',
        story: "All logic said to stay. The job was stable, the house paid off. But Luna's heart kept whispering Paris. She couldn't explain it to anyone, but she trusted it anyway."
    },
    {
        id: 33,
        text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life.",
        book: "Walden",
        author: "Henry David Thoreau",
        year: 1854,
        category: 'nature',
        story: "The cabin had no WiFi, no TV, nothing but trees and silence. After a week alone, Marcus stopped reaching for his phone. The essentials, he discovered, had been hiding under all the noise."
    },
    {
        id: 34,
        text: "April is the cruellest month, breeding lilacs out of the dead land, mixing memory and desire.",
        book: "The Waste Land",
        author: "T.S. Eliot",
        year: 1922,
        category: 'seasons',
        story: "Spring should have felt hopeful, but it only reminded Vera of what she'd lost. The flowers blooming where her mother's garden once grew—beautiful and devastating all at once."
    },
    {
        id: 35,
        text: "The night is darkest just before the dawn. And I promise you, the dawn is coming.",
        book: "The Dark Knight",
        author: "Jonathan Nolan",
        year: 2008,
        category: 'time',
        story: "At 3 AM, sleep wouldn't come. The problems felt insurmountable. But Owen remembered his grandmother's words—mornings always bring clarity. He just had to survive until sunrise."
    },
    {
        id: 36,
        text: "It was a bright cold day in April, and the clocks were striking thirteen.",
        book: "1984",
        author: "George Orwell",
        year: 1949,
        category: 'weather',
        story: "The office felt wrong that Monday, though Nina couldn't explain why. The fluorescent lights too bright, the smiles too forced. Something had shifted. Some days announce themselves as turning points."
    },
    {
        id: 37,
        text: "The fog comes on little cat feet. It sits looking over harbor and city on silent haunches and then moves on.",
        book: "Fog",
        author: "Carl Sandburg",
        year: 1916,
        category: 'weather',
        story: "Watching the morning mist roll through the valley, Thomas understood patience. Some things can't be forced or hurried. They arrive quietly, linger as long as needed, then disappear just as gently."
    },
    {
        id: 38,
        text: "In the depth of winter, I finally learned that within me there lay an invincible summer.",
        book: "Return to Tipasa",
        author: "Albert Camus",
        year: 1954,
        category: 'seasons',
        story: "The depression had felt endless, a winter that would never thaw. But in her darkest moment, Clara found a warmth inside she didn't know existed—a strength that had been waiting for her to need it."
    },
    {
        id: 39,
        text: "The smell of the sea and the sight of white horses racing to shore filled me with a wild restlessness.",
        book: "Rebecca",
        author: "Daphne du Maurier",
        year: 1938,
        category: 'senses',
        story: "Living inland, James had forgotten. But standing at the ocean's edge again, salt spray on his face, the restlessness returned. Some souls are meant for wider horizons."
    },
    {
        id: 40,
        text: "There is a pleasure in the pathless woods, there is a rapture on the lonely shore.",
        book: "Childe Harold's Pilgrimage",
        author: "Lord Byron",
        year: 1818,
        category: 'nature',
        story: "Everyone else followed the marked trail. But Kim wandered off, pushing through underbrush, finding a hidden waterfall no map had promised. The best discoveries wait where paths don't go."
    },
    {
        id: 41,
        text: "I have spread my dreams under your feet; tread softly because you tread on my dreams.",
        book: "Aedh Wishes for the Cloths of Heaven",
        author: "W.B. Yeats",
        year: 1899,
        category: 'emotions',
        story: "When Raj finally shared his poetry with the writing group, his hands shook. These weren't just words—they were pieces of his heart, vulnerable on the page. 'Be gentle,' he wanted to say. 'This is me.'"
    },
    {
        id: 42,
        text: "The afternoon knows what the morning never suspected.",
        book: "Collected Poems",
        author: "Robert Frost",
        year: 1942,
        category: 'time',
        story: "That morning, everything seemed ordinary. By sunset, Mei had met her future husband, lost her job, and found her calling. Life's biggest surprises rarely announce themselves at dawn."
    },
    {
        id: 43,
        text: "Nowadays people know the price of everything and the value of nothing.",
        book: "The Picture of Dorian Gray",
        author: "Oscar Wilde",
        year: 1890,
        category: 'emotions',
        story: "His apartment was full of expensive things, but empty of meaning. It took losing it all for David to discover that the worn wooden bowl from his grandmother was worth more than everything combined."
    },
    {
        id: 44,
        text: "The summer night is like a perfection of thought.",
        book: "The House Was Quiet and the World Was Calm",
        author: "Wallace Stevens",
        year: 1947,
        category: 'seasons',
        story: "On the porch, fireflies blinking in the darkness, Anna felt her racing mind finally still. The warm night air held no urgency. For once, everything made perfect, wordless sense."
    },
    {
        id: 45,
        text: "I sound my barbaric yawp over the roofs of the world.",
        book: "Song of Myself",
        author: "Walt Whitman",
        year: 1855,
        category: 'senses',
        story: "Polite her whole life, Keiko finally shouted at the ocean, letting out decades of held-back voices. The waves didn't judge. They just roared back, welcoming her to the chorus."
    },
    {
        id: 46,
        text: "The rain began again. It fell heavily, easily, with no meaning or intention but the fulfilment of its own nature.",
        book: "The Left Hand of Darkness",
        author: "Ursula K. Le Guin",
        year: 1969,
        category: 'weather',
        story: "Watching the downpour, Leo stopped asking why. The rain didn't fall for a reason—it simply was. Perhaps he too could exist without justifying himself constantly."
    },
    {
        id: 47,
        text: "Dawn comes slowly, but dusk is rapid.",
        book: "The Old Patagonian Express",
        author: "Paul Theroux",
        year: 1979,
        category: 'time',
        story: "Building her business took ten years. Losing it took three months. But standing in the ruins, Fatima understood—beginnings are gentle, endings swift. The next beginning would come."
    },
    {
        id: 48,
        text: "I am rooted, but I flow.",
        book: "The Waves",
        author: "Virginia Woolf",
        year: 1931,
        category: 'nature',
        story: "Her family had lived in this town for generations, but that didn't mean Harper was stuck. She could honor her roots while still letting life carry her toward new shores."
    },
    {
        id: 49,
        text: "The wind shows us how close to the edge we are.",
        book: "The Elements",
        author: "Joan Didion",
        year: 1979,
        category: 'weather',
        story: "The Santa Ana winds made everyone edgy. In that strange, charged air, Milo saw how thin the veneer of normal life really was—how close they all danced to chaos."
    },
    {
        id: 50,
        text: "The autumn leaves are falling like rain. Although my neighbors are all barbarians and you, you are a thousand miles away.",
        book: "A Letter to a Friend",
        author: "Li Bai",
        year: 750,
        category: 'seasons',
        story: "Watching leaves drift past her window in a foreign city, Yuki felt the ancient poem's ache. Distance doesn't diminish love—it only makes presence more precious."
    },
    {
        id: 51,
        text: "I felt my lungs inflate with the onrush of scenery—air, mountains, trees, people. I thought, This is what it is to be happy.",
        book: "The Bell Jar",
        author: "Sylvia Plath",
        year: 1963,
        category: 'senses',
        story: "After years of gray office walls, Zara's first day hiking in the mountains was overwhelming. Every breath felt like waking up. Sometimes happiness arrives when we finally let the world in."
    },
    {
        id: 52,
        text: "The wilderness holds answers to questions man has not yet learned to ask.",
        book: "Wilderness Essays",
        author: "Nancy Newhall",
        year: 1964,
        category: 'nature',
        story: "Corporate retreats solved nothing. But three days alone in the forest showed Chen what he couldn't see from his desk—the questions he should have been asking all along."
    },
    {
        id: 53,
        text: "How glorious a greeting the sun gives the mountains!",
        book: "The Mountains of California",
        author: "John Muir",
        year: 1894,
        category: 'nature',
        story: "Waking at 4 AM seemed insane until Emma saw the alpenglow paint the peaks gold and pink. Some greetings are so beautiful they're worth any sacrifice to witness."
    },
    {
        id: 54,
        text: "When spring came, even the false spring, there were no problems except where to be happiest.",
        book: "A Moveable Feast",
        author: "Ernest Hemingway",
        year: 1964,
        category: 'seasons',
        story: "The warm February day was a trick—winter would return. But sitting in the café sunshine, Paul didn't care. Brief joys are still joys, and he would take them all."
    },
    {
        id: 55,
        text: "Time moves slowly, but passes quickly.",
        book: "The Autobiography",
        author: "Alice Walker",
        year: 2006,
        category: 'time',
        story: "The days with infants had felt endless—the nights, eternal. But suddenly her daughter was graduating, and Diana wondered where the decades had vanished."
    },
    {
        id: 56,
        text: "The stars are threshed, and the souls are threshed from their husks.",
        book: "Collected Poetry",
        author: "William Blake",
        year: 1794,
        category: 'senses',
        story: "Grief stripped everything away—pretenses, distractions, all the husks. But in that exposed state, Ravi found his truest self, like wheat separated from chaff."
    },
    {
        id: 57,
        text: "After rain, the mountain wears clouds like scarves.",
        book: "Mountain Poems",
        author: "Hanshan",
        year: 800,
        category: 'weather',
        story: "The storm had passed, leaving mist tangled in the ridges like silk. Lena photographed it, but knew no camera could capture the mountain's elegance."
    },
    {
        id: 58,
        text: "Loneliness is the first thing which God's eye named not good.",
        book: "Paradise Lost",
        author: "John Milton",
        year: 1667,
        category: 'emotions',
        story: "Success had come with isolation. At the top, Rico looked around at his empty penthouse and understood—we are not made to be alone, no matter how high we climb."
    },
    {
        id: 59,
        text: "The garden flew round with the angel, the plants were still growing, and still the rain whispered.",
        book: "The Garden",
        author: "Andrew Marvell",
        year: 1681,
        category: 'nature',
        story: "Even in chaos—job loss, heartbreak, uncertainty—Nadia's garden kept growing. Life persisted, quietly, reminding her that some things continue no matter what."
    },
    {
        id: 60,
        text: "One swallow does not make a summer, neither does one fine day.",
        book: "Nicomachean Ethics",
        author: "Aristotle",
        year: -350,
        category: 'seasons',
        story: "The first date was magical, but Kira waited. Real love, like summer, needs more than one warm day to prove itself. Patience reveals true patterns."
    },
    {
        id: 61,
        text: "The eye is always caught by light, but shadows have more to say.",
        book: "The Book of Disquiet",
        author: "Fernando Pessoa",
        year: 1982,
        category: 'senses',
        story: "Everyone praised the highlight reel. But it was in quiet conversations in dark corners that Oliver learned what people really thought and felt."
    },
    {
        id: 62,
        text: "Every man has his secret sorrows which the world knows not; and often times we call a man cold when he is only sad.",
        book: "Hyperion",
        author: "Henry Wadsworth Longfellow",
        year: 1839,
        category: 'emotions',
        story: "The gruff neighbor never smiled. But when Helen learned his wife had died that spring, his distance suddenly looked less like coldness and more like quiet devastation."
    },
    {
        id: 63,
        text: "Music, when soft voices die, vibrates in the memory.",
        book: "To—: Music, When Soft Voices Die",
        author: "Percy Bysshe Shelley",
        year: 1821,
        category: 'senses',
        story: "Years after her mother passed, Grace still heard her humming in the kitchen. Some melodies outlast their singers, echoing in the chambers of the heart."
    },
    {
        id: 64,
        text: "Winter is not a season, it's a celebration.",
        book: "Winter Tales",
        author: "Anamika Mishra",
        year: 2015,
        category: 'seasons',
        story: "Others dreaded the cold, but Sven saw magic—sparkling frost, cozy fires, the world dressed in white. Winter wasn't something to survive; it was something to savor."
    },
    {
        id: 65,
        text: "Keep some room in your heart for the unimaginable.",
        book: "The Shawl",
        author: "Mary Oliver",
        year: 2006,
        category: 'emotions',
        story: "Dana had planned everything—career, marriage, retirement. But the best things that happened were ones she never expected, arriving in spaces she'd left open."
    },
    {
        id: 66,
        text: "The thunder was his voice; one hand held the summer, the other winter.",
        book: "Metamorphoses",
        author: "Ovid",
        year: 8,
        category: 'weather',
        story: "Her father could shift the mood of any room—warm laughter or cold silence. Growing up under that changeable weather taught Jenna to watch the sky carefully."
    },
    {
        id: 67,
        text: "Stars got tangled in her hair, night wherever she wandered.",
        book: "Poems",
        author: "Tomas Tranströmer",
        year: 1954,
        category: 'time',
        story: "There was something of midnight about her—a quietness, a depth. When Iris entered a room, Theo felt the energy shift toward contemplation."
    },
    {
        id: 68,
        text: "There is no frigate like a book to take us lands away.",
        book: "Poems",
        author: "Emily Dickinson",
        year: 1894,
        category: 'emotions',
        story: "Bedridden for months, Amara traveled the world from her bed. Russia, Japan, ancient Rome—books carried her farther than any plane could."
    },
    {
        id: 69,
        text: "The earth has music for those who listen.",
        book: "Collected Works",
        author: "William Shakespeare",
        year: 1600,
        category: 'nature',
        story: "With headphones finally removed, Ali heard it—birdsong, wind, distant laughter. The world had been composing symphonies all along; he'd just been too busy to attend."
    },
    {
        id: 70,
        text: "At the touch of love everyone becomes a poet.",
        book: "Symposium",
        author: "Plato",
        year: -385,
        category: 'emotions',
        story: "Marcus had never written anything creative. But after meeting Anna, words poured out of him—clumsy verses scribbled on napkins, love making a poet of even the most practical heart."
    },
    {
        id: 71,
        text: "Hope is the thing with feathers that perches in the soul.",
        book: "Poems",
        author: "Emily Dickinson",
        year: 1891,
        category: 'nature',
        story: "In the hospital waiting room, a sparrow landed on the windowsill. Silly to find meaning in it, Tanya knew—but she did anyway. Hope needs no logic to take flight."
    },
    {
        id: 72,
        text: "The clearest way into the Universe is through a forest wilderness.",
        book: "John of the Mountains",
        author: "John Muir",
        year: 1938,
        category: 'nature',
        story: "The philosophy books gave answers, but the redwoods gave understanding. Standing among giants, Darius felt how small his worries were—and how connected to everything."
    },
    {
        id: 73,
        text: "I dwell in Possibility – a fairer House than Prose.",
        book: "Poems",
        author: "Emily Dickinson",
        year: 1862,
        category: 'emotions',
        story: "While others demanded certainty, Fiona loved the open door. Not knowing what came next wasn't scary—it was the most spacious room in her life."
    },
    {
        id: 74,
        text: "The night walked down the sky with the moon in her hand.",
        book: "Poems",
        author: "Frederick L. Knowles",
        year: 1906,
        category: 'time',
        story: "Insomnia had always felt like punishment until Helena reframed it. Now she watched the night descend like a graceful woman, moon in hand, offering quiet company."
    },
    {
        id: 75,
        text: "Autumn is a second spring when every leaf is a flower.",
        book: "Letters",
        author: "Albert Camus",
        year: 1950,
        category: 'seasons',
        story: "Getting older felt like decline until Akiko walked through the maple grove. The trees were more beautiful now than in spring. Perhaps her later years could bloom too."
    },
    {
        id: 76,
        text: "I felt the full breadth of the sky above me, and for a moment, I was infinite.",
        book: "The Perks of Being a Wallflower",
        author: "Stephen Chbosky",
        year: 1999,
        category: 'senses',
        story: "Driving through the desert at night, windows down, music loud, Sam felt the universe expand to include him. Infinity wasn't distant—it was here, now, him."
    },
    {
        id: 77,
        text: "The storm starts, when the drops start dropping. When the drops stop dropping then the storm starts stopping.",
        book: "Storm Poetry",
        author: "Dr. Seuss",
        year: 1956,
        category: 'weather',
        story: "Life advice from a children's book stayed with Roy. Storms are simple—they start, they stop. The anxiety about them is more complicated, and more optional."
    },
    {
        id: 78,
        text: "Trees are poems the earth writes upon the sky.",
        book: "Sand and Foam",
        author: "Kahlil Gibran",
        year: 1926,
        category: 'nature',
        story: "The oak outside her window wasn't just a tree anymore. Each morning, Iris read its silhouette against the dawn—the earth's poetry, always there, if she bothered to look."
    },
    {
        id: 79,
        text: "Tell me, what is it you plan to do with your one wild and precious life?",
        book: "The Summer Day",
        author: "Mary Oliver",
        year: 1990,
        category: 'emotions',
        story: "The question stopped Jordan cold. He'd been so busy surviving he'd forgotten to live. Wild and precious—his life was both, and time was running out to use it."
    },
    {
        id: 80,
        text: "The wound is the place where the Light enters you.",
        book: "Selected Poems",
        author: "Rumi",
        year: 1260,
        category: 'senses',
        story: "She'd hidden her scars for years. But in the support group, sharing them became a doorway—light poured through the broken places, connecting her to others with similar cracks."
    },
    {
        id: 81,
        text: "What is coming is better than what is gone.",
        book: "Verses",
        author: "Arabic Proverb",
        year: 1200,
        category: 'time',
        story: "Packing up the old apartment, nostalgia pulled at him. But his grandmother's proverb echoed: the best is ahead. Amos taped the last box and walked toward tomorrow."
    },
    {
        id: 82,
        text: "Snow falling soundlessly in the middle of the night will always fill my heart with sweet clarity.",
        book: "A Natural History of the Senses",
        author: "Diane Ackerman",
        year: 1990,
        category: 'weather',
        story: "The world muffled by snow at 2 AM—Petra stood at the window feeling thoughts settle like flakes. Something about silence made everything clearer."
    },
    {
        id: 83,
        text: "And the day came when the risk to remain tight in a bud was more painful than the risk it took to blossom.",
        book: "Risk",
        author: "Anaïs Nin",
        year: 1969,
        category: 'emotions',
        story: "For years, staying small felt safe. But safety became a prison. The day Lee finally spoke up, the words hurt less than the silence ever had."
    },
    {
        id: 84,
        text: "I carry your heart with me (I carry it in my heart).",
        book: "Complete Poems",
        author: "E.E. Cummings",
        year: 1952,
        category: 'emotions',
        story: "Across countries and time zones, Nina felt her grandmother's presence. Death hadn't separated them—love had simply changed addresses, moving from hand to heart."
    },
    {
        id: 85,
        text: "The old man walked along the morning shore, the tide pulling secrets from the sand.",
        book: "The Old Man and the Sea",
        author: "Ernest Hemingway",
        year: 1952,
        category: 'time',
        story: "Every morning's beach walk revealed new treasures—shells, glass, memories. The tide kept its rhythm, and so did Walter, both of them patient with time."
    },
    {
        id: 86,
        text: "Green was the silence, wet was the light, the month of June trembled like a butterfly.",
        book: "100 Love Sonnets",
        author: "Pablo Neruda",
        year: 1959,
        category: 'seasons',
        story: "June arrived with possibility quivering in the air. Summer stretched ahead like an unwritten page, and Marta felt herself trembling too—ready for something new."
    },
    {
        id: 87,
        text: "The sky broke like an egg into full sunset and the water caught fire.",
        book: "Poems",
        author: "Pamela Hansford Johnson",
        year: 1967,
        category: 'weather',
        story: "They'd nearly missed it, rushing home from work. But traffic stopped, and there it was—the sky cracking open with color. Some delays are disguised gifts."
    },
    {
        id: 88,
        text: "I have measured out my life with coffee spoons.",
        book: "The Love Song of J. Alfred Prufrock",
        author: "T.S. Eliot",
        year: 1915,
        category: 'time',
        story: "Another morning, another measured scoop. Bertie suddenly saw herself—life measured in small routines instead of bold adventures. Tomorrow, she chose a different cup."
    },
    {
        id: 89,
        text: "In the middle of the journey of our life I found myself within a dark woods where the straight way was lost.",
        book: "The Divine Comedy",
        author: "Dante Alighieri",
        year: 1320,
        category: 'nature',
        story: "Forty and directionless, Kara finally understood the old poet. The straight path vanishing was terrifying—but also the beginning of her real journey."
    },
    {
        id: 90,
        text: "Let us step into the night and pursue that flighty temptress, adventure.",
        book: "Harry Potter and the Half-Blood Prince",
        author: "J.K. Rowling",
        year: 2005,
        category: 'time',
        story: "The practical choice was sleep. But the full moon beckoned, and Jules grabbed her keys. Not every night needs to end sensibly."
    },
    {
        id: 91,
        text: "The scent of pine needles, fir and black spruce filled her senses with childhood.",
        book: "Where the Crawdads Sing",
        author: "Delia Owens",
        year: 2018,
        category: 'senses',
        story: "One whiff of Christmas tree lot and Marcus was seven again, holding his father's hand. Smell is the shortest road home, even when home exists only in memory."
    },
    {
        id: 92,
        text: "Summer afternoon—summer afternoon; to me those have always been the two most beautiful words in the English language.",
        book: "A Backward Glance",
        author: "Edith Wharton",
        year: 1934,
        category: 'seasons',
        story: "No agenda, no obligations—just long golden hours stretching lazily toward sunset. On her porch, Diane finally understood why those two words held such power."
    },
    {
        id: 93,
        text: "The soul becomes dyed with the color of its thoughts.",
        book: "Meditations",
        author: "Marcus Aurelius",
        year: 180,
        category: 'emotions',
        story: "Years of bitter thinking had left Ben's soul gray. It took deliberate cultivation of gratitude to slowly add color back. We become our habitual thoughts."
    },
    {
        id: 94,
        text: "Between the dark and the daylight, when the night is beginning to lower, comes a pause in the day's occupations.",
        book: "The Children's Hour",
        author: "Henry Wadsworth Longfellow",
        year: 1859,
        category: 'time',
        story: "That golden hour before dinner—children bathed in fading light, work set aside—became sacred to Mara. The pause between was where the real living happened."
    },
    {
        id: 95,
        text: "The river is within us, the sea is all about us.",
        book: "Four Quartets",
        author: "T.S. Eliot",
        year: 1943,
        category: 'nature',
        story: "Blood flowing like rivers, tears salt as the sea—Jenna felt the water metaphors in her body. We carry oceans within us wherever we go."
    },
    {
        id: 96,
        text: "Season of mists and mellow fruitfulness, close bosom-friend of the maturing sun.",
        book: "To Autumn",
        author: "John Keats",
        year: 1819,
        category: 'seasons',
        story: "The farmer's market in October: apples, squash, the smell of decaying leaves. Autumn's richness overwhelmed Clara with the generosity of the year's end."
    },
    {
        id: 97,
        text: "The lightning sparked like thoughts in a fevered brain.",
        book: "Collected Stories",
        author: "Ray Bradbury",
        year: 1980,
        category: 'weather',
        story: "Creativity felt like that—electric, uncontrolled, illuminating random corners. During the storm, Vic wrote feverishly, catching thoughts before they vanished into dark."
    },
    {
        id: 98,
        text: "Smell is a potent wizard that transports us across thousands of miles and all the years we have lived.",
        book: "The Story of My Life",
        author: "Helen Keller",
        year: 1903,
        category: 'senses',
        story: "One breath of his late wife's perfume, found in an old drawer, and Lawrence was back in their kitchen, young, laughing, together. Scent is a time machine."
    },
    {
        id: 99,
        text: "Out of the night that covers me, black as the pit from pole to pole, I thank whatever gods may be for my unconquerable soul.",
        book: "Invictus",
        author: "William Ernest Henley",
        year: 1875,
        category: 'emotions',
        story: "The diagnosis was grim. But something in Rosa refused to break. She wasn't in control of the disease, but her spirit remained entirely her own."
    },
    {
        id: 100,
        text: "The mountains are calling and I must go.",
        book: "Letters",
        author: "John Muir",
        year: 1873,
        category: 'nature',
        story: "The cubicle felt smaller every day. When the mountains finally called loud enough, Theo answered—trading security for summits, and never looking back."
    },
    {
        id: 101,
        text: "The sun was setting in a sea of gold, and the clouds were castles of amber.",
        book: "The Voyage Out",
        author: "Virginia Woolf",
        year: 1915,
        category: 'weather',
        story: "The commute home meant nothing until the day traffic stopped and Carmen looked up. The sky was on fire with gold. Beauty waits in ordinary moments for those who pause to see."
    },
    {
        id: 102,
        text: "Time is the longest distance between two places.",
        book: "The Glass Menagerie",
        author: "Tennessee Williams",
        year: 1944,
        category: 'time',
        story: "Standing in his childhood bedroom, now a storage closet, Felix felt the decades press in. The house was the same; he was not. Time had moved them worlds apart."
    },
    {
        id: 103,
        text: "The world is full of magical things patiently waiting for our wits to grow sharper.",
        book: "The World of Dreams",
        author: "Bertrand Russell",
        year: 1959,
        category: 'senses',
        story: "As a child, every rock was potential treasure. Adulthood dulled that vision—until his daughter handed him a perfectly ordinary stone, and he saw the magic again."
    },
    {
        id: 104,
        text: "Some people feel the rain. Others just get wet.",
        book: "Sayings",
        author: "Bob Marley",
        year: 1977,
        category: 'weather',
        story: "The tourists complained about the downpour. But Ina stood in it, arms wide, feeling each drop as a tiny blessing. Same rain, different worlds."
    },
    {
        id: 105,
        text: "Deep into that darkness peering, long I stood there wondering, fearing.",
        book: "The Raven",
        author: "Edgar Allan Poe",
        year: 1845,
        category: 'time',
    },
    {
        id: 106,
        text: "The flower that blooms in adversity is the most rare and beautiful of all.",
        book: "Mulan",
        author: "Chinese Proverb",
        year: 1998,
        category: 'nature',
        story: "Everyone predicted she'd fail. But it was precisely that pressure that forced Rosie to dig deeper, bloom brighter. Her success tasted sweeter for having been doubted."
    },
    {
        id: 107,
        text: "I like spring, but it is too young. I like summer, but it is too proud. So I like best of all autumn.",
        book: "Collected Writings",
        author: "Henry James",
        year: 1881,
        category: 'seasons',
        story: "Youth's fire, middle age's ambition—Victor had lived them both. But at sixty, in autumn of life, he found a mellow contentment that the other seasons never offered."
    },
    {
        id: 108,
        text: "Follow your bliss and the universe will open doors where there were only walls.",
        book: "The Power of Myth",
        author: "Joseph Campbell",
        year: 1988,
        category: 'emotions',
        story: "Every logical path led to dead ends. But when Rita finally followed her joy—pottery, of all things—opportunities appeared she never could have planned. The universe rewards authenticity."
    },
    {
        id: 109,
        text: "Listen to the mustn'ts, child. Listen to the don'ts. Listen to the shouldn'ts, the impossibles, the won'ts.",
        book: "Where the Sidewalk Ends",
        author: "Shel Silverstein",
        year: 1974,
        category: 'senses',
        story: "The poem continued: 'Then listen close to me—anything can happen.' Young Kai memorized it. Every 'you can't' he heard became fuel, not limitation."
    },
    {
        id: 110,
        text: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.",
        book: "New Writings",
        author: "Maya Angelou",
        year: 2004,
        category: 'emotions',
        story: "Her grandmother's deathbed advice: 'Count the gasps, not the years.' Now every sunset, every kindness, every laugh became a treasure to tally."
    },
    {
        id: 111,
        text: "The very instant that I saw you, did my heart fly to your service.",
        book: "The Tempest",
        author: "William Shakespeare",
        year: 1611,
        category: 'emotions',
        story: "Love at first sight felt like fiction until Dina saw her across the crowded gallery. Before a word was spoken, something had already been decided. Some hearts recognize home instantly."
    },
    {
        id: 112,
        text: "Winter kept us warm, covering earth in forgetful snow.",
        book: "The Waste Land",
        author: "T.S. Eliot",
        year: 1922,
        category: 'seasons',
        story: "The blank whiteness erased everything—tracks, refuse, the visible evidence of struggle. Under the snow, Alec felt permission to forget, to start fresh when spring came."
    },
    {
        id: 113,
        text: "You cannot swim for new horizons until you have courage to lose sight of the shore.",
        book: "Reflections",
        author: "William Faulkner",
        year: 1950,
        category: 'nature',
        story: "The familiar life waited behind her. The unknown stretched ahead. But Misha knew she couldn't have both—to find something new, she had to let go of the old."
    },
    {
        id: 114,
        text: "The privilege of a lifetime is being who you are.",
        book: "The Hero with a Thousand Faces",
        author: "Joseph Campbell",
        year: 1949,
        category: 'emotions',
        story: "Years of trying to fit in, to please, to belong. At fifty, Nadia finally stopped. Being herself wasn't easy—but pretending had been harder."
    },
    {
        id: 115,
        text: "Every moment of light and dark is a miracle.",
        book: "Leaves of Grass",
        author: "Walt Whitman",
        year: 1855,
        category: 'time',
        story: "The mundane morning—coffee, emails, traffic—transformed when Eric really looked. Sunlight through steam. The miracle was always there; his attention had been elsewhere."
    },
    {
        id: 116,
        text: "The wind blew and seemed to scatter the stars like sparks from a fire.",
        book: "Collected Works",
        author: "Nikolai Gogol",
        year: 1842,
        category: 'weather',
        story: "The wild night made nature feel alive, mischievous. Standing in the gale, Yuri felt the sky rearranging itself just to show him something spectacular."
    },
    {
        id: 117,
        text: "Spring work is going on with joyful enthusiasm.",
        book: "Our National Parks",
        author: "John Muir",
        year: 1901,
        category: 'seasons',
        story: "The first warm Saturday drew everyone outdoors—gardens tended, walks taken, windows opened. Spring's arrival sparked something ancient and hopeful in the whole neighborhood."
    },
    {
        id: 118,
        text: "Color is a power which directly influences the soul.",
        book: "Concerning the Spiritual in Art",
        author: "Wassily Kandinsky",
        year: 1911,
        category: 'senses',
        story: "She painted her gray apartment yellow. Within a week, her mood lifted. The color hadn't changed her circumstances—just made it possible to see them differently."
    },
    {
        id: 119,
        text: "We are all in the gutter, but some of us are looking at the stars.",
        book: "Lady Windermere's Fan",
        author: "Oscar Wilde",
        year: 1892,
        category: 'nature',
        story: "Same homeless shelter, same hard days. But while others stared at the floor, Maurice watched the sky through the high window. Where you look determines what you see."
    },
    {
        id: 120,
        text: "The moon was so beautiful that the ocean held up a mirror.",
        book: "Poems",
        author: "Ani DiFranco",
        year: 1993,
        category: 'time',
        story: "That night, the water lay perfectly still, reflecting the full moon in a second perfect circle. Daria felt she was standing between two worlds, both silver."
    },
    {
        id: 121,
        text: "Each morning we are born again. What we do today is what matters most.",
        book: "Dhammapada Commentary",
        author: "Buddha",
        year: -500,
        category: 'time',
        story: "Yesterday's failures, tomorrow's worries—both vanished when Derek focused on the present. Each morning offered a clean slate. He just had to accept the gift."
    },
    {
        id: 122,
        text: "The earth laughs in flowers.",
        book: "Hamatreya",
        author: "Ralph Waldo Emerson",
        year: 1847,
        category: 'nature',
        story: "The hospital courtyard bloomed with wildflowers. Even in this place of suffering, the earth kept its sense of humor—color and beauty persistent despite everything."
    },
    {
        id: 123,
        text: "To see the world in a grain of sand, and heaven in a wild flower.",
        book: "Auguries of Innocence",
        author: "William Blake",
        year: 1803,
        category: 'senses',
        story: "Under the microscope, a simple grain of sand became a universe. Zoe realized infinity wasn't out there in space—it was here, in the smallest things."
    },
    {
        id: 124,
        text: "Nothing gold can stay.",
        book: "Poems",
        author: "Robert Frost",
        year: 1923,
        category: 'seasons',
        story: "That perfect summer ended, as perfect things must. But Lucia understood now—the transience was part of the beauty. Nothing gold can stay, so she treasured it while it lasted."
    },
    {
        id: 125,
        text: "The silence depressed me. It wasn't the silence of silence. It was my own silence.",
        book: "The Bell Jar",
        author: "Sylvia Plath",
        year: 1963,
        category: 'emotions',
        story: "The room wasn't quiet—the world hummed with life. It was inside where the silence lived, where her voice had retreated. Breaking it was the first step back."
    },
    {
        id: 126,
        text: "A single sunbeam is enough to drive away many shadows.",
        book: "Collected Works",
        author: "Francis of Assisi",
        year: 1220,
        category: 'weather',
        story: "One kind word from a stranger shifted everything. The darkness had seemed so vast, but one ray of light revealed how much shadow was just illusion."
    },
    {
        id: 127,
        text: "In one drop of water are found all the secrets of all the oceans.",
        book: "The Prophet",
        author: "Kahlil Gibran",
        year: 1923,
        category: 'nature',
        story: "She didn't need to understand everything. One moment of genuine connection held all the wisdom she'd ever need. The universe fits inside the small and true."
    },
    {
        id: 128,
        text: "Dawn arrives whether you set an alarm or not.",
        book: "Essays",
        author: "Ursula K. Le Guin",
        year: 2004,
        category: 'time',
        story: "Anxiety about tomorrow kept Ali awake. But the sunrise came anyway, indifferent to his worry. Time moves forward—he could fight it or flow with it."
    },
    {
        id: 129,
        text: "There is nothing in the world so irresistibly contagious as laughter and good humor.",
        book: "A Christmas Carol",
        author: "Charles Dickens",
        year: 1843,
        category: 'emotions',
        story: "The funeral reception was somber until someone told the story about Uncle Gerald's fishing disaster. Soon everyone was laughing through tears—joy spreading like medicine."
    },
    {
        id: 130,
        text: "The voice of the sea speaks to the soul.",
        book: "The Awakening",
        author: "Kate Chopin",
        year: 1899,
        category: 'senses',
        story: "Standing at the ocean's edge, Camilla heard something beneath the waves—a wordless voice that bypassed her ears and spoke directly to the deepest part of her."
    },
    {
        id: 131,
        text: "May your trails be crooked, winding, lonesome, dangerous, leading to the most amazing view.",
        book: "Desert Solitaire",
        author: "Edward Abbey",
        year: 1968,
        category: 'nature',
        story: "The easy path led to mediocre views. But the rugged trail—exhausting and uncertain—opened onto a vista that took Nina's breath away. The best destinations require hard journeys."
    },
    {
        id: 132,
        text: "There came a wind like a bugle; it quivered through the grass.",
        book: "Poems",
        author: "Emily Dickinson",
        year: 1890,
        category: 'weather',
        story: "The sudden gust announced change. Standing in the field, Luis felt the wind's declaration—something was shifting, and nature was the first to know."
    },
    {
        id: 133,
        text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
        book: "Attributed Essays",
        author: "Ralph Waldo Emerson",
        year: 1850,
        category: 'emotions',
        story: "Her resume was thin, her future uncertain. But the fire in Elena's heart was enough. Past and future matter less than the strength we carry inside."
    },
    {
        id: 134,
        text: "The trees that are slow to grow bear the best fruit.",
        book: "Sayings",
        author: "Molière",
        year: 1670,
        category: 'nature',
        story: "Everyone else seemed to succeed faster. But forty years later, the quick risers had burned out while Kenji's slowly built career still bore fruit."
    },
    {
        id: 135,
        text: "Every sunset brings the promise of a new dawn.",
        book: "Collected Writings",
        author: "Ralph Waldo Emerson",
        year: 1841,
        category: 'time',
        story: "The day had been a disaster. But watching the sun sink, Sophie remembered—every ending carries a beginning. Tomorrow would come."
    },
    {
        id: 136,
        text: "The snow fell softly, erasing the hard edges of the world.",
        book: "Winter Journal",
        author: "Paul Auster",
        year: 2012,
        category: 'weather',
        story: "The city's harsh lines—buildings, cars, fences—disappeared under white. Omar walked through a softer world, grateful for nature's temporary mercy."
    },
    {
        id: 137,
        text: "Adopt the pace of nature: her secret is patience.",
        book: "Essays",
        author: "Ralph Waldo Emerson",
        year: 1836,
        category: 'nature',
        story: "Rushing produced nothing but anxiety. When Bridget finally slowed down, the answers came naturally—like flowers that bloom only when given time."
    },
    {
        id: 138,
        text: "The poetry of earth is never dead.",
        book: "On the Grasshopper and Cricket",
        author: "John Keats",
        year: 1816,
        category: 'seasons',
        story: "Even in the frozen depths of February, a cricket sang from the hearth. Life's poetry continues; we just have to listen for the new verses."
    },
    {
        id: 139,
        text: "I felt the silence pouring into me like water into a dry sponge.",
        book: "Pilgrim at Tinker Creek",
        author: "Annie Dillard",
        year: 1974,
        category: 'senses',
        story: "After years of noise—city, screens, chatter—the quiet forest filled something parched in Dimitri. He hadn't known how thirsty his soul had become."
    },
    {
        id: 140,
        text: "After the storm, the birds returned, their songs sweeter than before.",
        book: "Nature Essays",
        author: "John Burroughs",
        year: 1895,
        category: 'weather',
        story: "The argument had been fierce. But afterward, the making-up felt truer, deeper. Some storms clear the air for better things."
    },
    {
        id: 141,
        text: "The world is mud-luscious and puddle-wonderful.",
        book: "Collected Poems",
        author: "E.E. Cummings",
        year: 1920,
        category: 'seasons',
        story: "Adults skirted the puddles. But children splashed through, discovering what Cora had forgotten—sometimes the messy parts are the most wonderful."
    },
    {
        id: 142,
        text: "Where there is love there is life.",
        book: "Writings",
        author: "Mahatma Gandhi",
        year: 1930,
        category: 'emotions',
        story: "The house was shabby, resources scarce. But it overflowed with love, and that made it more alive than any mansion she'd ever entered."
    },
    {
        id: 143,
        text: "The scent of ripe apples and freshly cut hay filled the autumn air.",
        book: "Country Life",
        author: "Wendell Berry",
        year: 1990,
        category: 'senses',
        story: "One breath at the farmers' market transported Aiden back to his grandmother's farm. Smell carries memory more faithfully than photographs."
    },
    {
        id: 144,
        text: "Time flows like a river, and we are but leaves upon its current.",
        book: "Collected Meditations",
        author: "Lao Tzu",
        year: -500,
        category: 'time',
        story: "Fighting the current only exhausted her. When Maya finally let go, she found she could steer while still flowing—surrendering to time's direction while choosing her own way within it."
    },
    {
        id: 145,
        text: "The first fall of snow is not only an event, it is a magical event.",
        book: "New York Times Essays",
        author: "J.B. Priestley",
        year: 1957,
        category: 'seasons',
        story: "Every year Petra forgot. Then the first flakes would fall and the world became enchanted again—the same magic, reliably returning, waiting to be rediscovered."
    },
    {
        id: 146,
        text: "Light thinks it travels faster than anything but it is wrong. No matter how fast light travels, it finds the darkness has always got there first.",
        book: "Reaper Man",
        author: "Terry Pratchett",
        year: 1991,
        category: 'time',
        story: "The cynical observation made Charlie laugh. But there was wisdom in it—darkness isn't something light chases. It's what's there when light arrives."
    },
    {
        id: 147,
        text: "The mountains taught me silence, the lakes taught me reflection.",
        book: "Mountain Meditations",
        author: "Nan Shepherd",
        year: 1977,
        category: 'nature',
        story: "City life had made him loud and reactive. But a week in the highlands taught Ramon lessons his therapist hadn't—stillness, and the value of looking inward."
    },
    {
        id: 148,
        text: "Happiness is a warm sun on tired shoulders.",
        book: "Simple Pleasures",
        author: "Robert M. Pirsig",
        year: 1984,
        category: 'weather',
        story: "After the long hike, Rose sat against a sun-warmed rock. No achievement, no possession—just warmth and rest. This, she realized, was happiness stripped to its essence."
    },
    {
        id: 149,
        text: "We do not remember days, we remember moments.",
        book: "The Burning Brand",
        author: "Cesare Pavese",
        year: 1950,
        category: 'emotions',
        story: "The vacation blurred in memory, except: his daughter's laugh at the waterfall, the taste of that strange fruit, the sunset that made them cry. Moments, not days, are what lasts."
    },
    {
        id: 150,
        text: "The smell of good bread baking, like the sound of lightly flowing water, is indescribable in its evocation of innocence and delight.",
        book: "The Art of Eating",
        author: "M.F.K. Fisher",
        year: 1954,
        category: 'senses',
        story: "The bakery's scent stopped Leo mid-stride. For a moment, he was six again, waiting for his mother's loaves.Some pleasures speak directly to who we used to be."
    },
    {
        id: 151,
        text: "A garden is a grand teacher. It teaches patience and careful watchfulness.",
        book: "On Gardens",
        author: "Gertrude Jekyll",
        year: 1899,
        category: 'nature',
        story: "Impatient by nature, Dante learned differently in his garden. Seeds take time. Growth can't be rushed. Watching taught him what forcing never could."
    },
    {
        id: 152,
        text: "The rain drummed on the windows like impatient fingers.",
        book: "Storm Writings",
        author: "Susan Sontag",
        year: 1982,
        category: 'weather',
        story: "Inside, warm and dry, Fatima listened to the rain's insistent rhythm. It seemed to be tapping out a message—urgent, demanding attention she was finally giving."
    },
    {
        id: 153,
        text: "I would rather walk with a friend in the dark, than alone in the light.",
        book: "Essays",
        author: "Helen Keller",
        year: 1933,
        category: 'emotions',
        story: "The diagnosis was terrifying. But when her friend showed up to wait with her, the darkness felt more bearable than any bright room alone ever had."
    },
    {
        id: 154,
        text: "The breaking of a wave cannot explain the whole sea.",
        book: "Things Fall Apart",
        author: "Chinua Achebe",
        year: 1958,
        category: 'nature',
        story: "One bad experience with Ahmed made people dismiss his whole culture. But Ria knew better—one wave tells you nothing about the ocean's full depths."
    },
    {
        id: 155,
        text: "Morning glories bloom in the cool of dawn, closing before the heat of day.",
        book: "Garden Notes",
        author: "Vita Sackville-West",
        year: 1946,
        category: 'time',
        story: "Early risers caught their glory; late sleepers missed it entirely. Some beauty, Mei learned, rewards only those willing to meet it when it appears."
    },
    {
        id: 156,
        text: "The summer poured out warmth like honey from a jar.",
        book: "Seasonal Essays",
        author: "Laurie Lee",
        year: 1959,
        category: 'seasons',
        story: "Days thick and golden, time slowing like syrup. That summer stretched and sweetened, coating every memory with light she could still taste years later."
    },
    {
        id: 157,
        text: "Be yourself; everyone else is already taken.",
        book: "Attributed",
        author: "Oscar Wilde",
        year: 1895,
        category: 'emotions',
        story: "Years spent trying to be like influencers exhausted Nova. The day she stopped performing, she lost followers but found herself—the only audience that truly mattered."
    },
    {
        id: 158,
        text: "The sound of the cello is like a human voice, rich with sorrow and joy.",
        book: "Music Essays",
        author: "Pablo Casals",
        year: 1970,
        category: 'senses',
        story: "The concert moved Ivan to tears he couldn't explain. The cello wept and consoled in the same bow stroke—speaking feelings words could never reach."
    },
    {
        id: 159,
        text: "Lightning lit the sky like cracks in a cosmic eggshell.",
        book: "Weather Chronicles",
        author: "Barry Lopez",
        year: 1986,
        category: 'weather',
        story: "For an instant, the darkness fractured, revealing a glimpse of something vast beyond. Carmen felt she'd seen a secret the night usually kept hidden."
    },
    {
        id: 160,
        text: "Between stimulus and response there is a space. In that space is our power to choose.",
        book: "Prison Reflections",
        author: "Viktor Frankl",
        year: 1946,
        category: 'emotions',
        story: "The insult stung, and Jabril almost lashed back. But in that breath of pause, he chose differently—and that gap became his freedom."
    },
    {
        id: 161,
        text: "The forest makes your heart gentle. You become one with it.",
        book: "Forest Bathing",
        author: "Qing Li",
        year: 2018,
        category: 'nature',
        story: "The anxiety that followed Ava everywhere faded among the trees. Here, she wasn't a problem to solve—just another creature belonging to the green."
    },
    {
        id: 162,
        text: "Spring is nature's way of saying, Let's party!",
        book: "Quotes",
        author: "Robin Williams",
        year: 2002,
        category: 'seasons',
        story: "After the long gray winter, the first crocuses felt like confetti. Nature, Pedro realized, knows when it's time to celebrate."
    },
    {
        id: 163,
        text: "In every walk with nature one receives far more than he seeks.",
        book: "Steep Trails",
        author: "John Muir",
        year: 1918,
        category: 'nature',
        story: "She went looking for exercise. She came back with peace, perspective, and a butterfly that landed on her shoulder. The trail gave gifts she hadn't asked for."
    },
    {
        id: 164,
        text: "The cure for boredom is curiosity. There is no cure for curiosity.",
        book: "Writings",
        author: "Dorothy Parker",
        year: 1930,
        category: 'emotions',
        story: "Retirement bored Felix until he started asking questions—about birds, about history, about his neighbors. Now there weren't enough hours for all he wanted to learn."
    },
    {
        id: 165,
        text: "Stars are the daisies that begem the blue fields of the sky.",
        book: "Poems",
        author: "David Macbeth Moir",
        year: 1852,
        category: 'time',
        story: "Her daughter's question—'Why are stars there?'—sparked an answer Lucia hadn't considered: maybe the sky just needs flowers too."
    },
    {
        id: 166,
        text: "I love the smell of rain on hot pavement, the petrichor of memory.",
        book: "Memory Essays",
        author: "Joan Didion",
        year: 1979,
        category: 'senses',
        story: "One breath of summer rain and Malik was ten again, running through storms with his brother. Petrichor: a word for how scent carries the past."
    },
    {
        id: 167,
        text: "October's poplars are flaming torches lighting the way to winter.",
        book: "Nature Poetry",
        author: "Nova Bair",
        year: 1965,
        category: 'seasons',
        story: "The golden trees lined the path like lanterns. Winter waited ahead, but autumn was handing over the light, making the transition beautiful."
    },
    {
        id: 168,
        text: "The clouds gathered like thoughts before sleep.",
        book: "Sky Meditations",
        author: "Galway Kinnell",
        year: 1980,
        category: 'weather',
        story: "Watching the sky darken, Vera felt her own mind doing the same—thoughts accumulating, preparing for the release that rest would bring."
    },
    {
        id: 169,
        text: "Simplicity is the ultimate sophistication.",
        book: "Notebooks",
        author: "Leonardo da Vinci",
        year: 1500,
        category: 'emotions',
        story: "The elaborate designs failed. But the simple one succeeded. Jack learned that stripping away was often harder—and better—than adding more."
    },
    {
        id: 170,
        text: "The fragrance of tea is like a whisper from distant gardens.",
        book: "The Book of Tea",
        author: "Kakuzo Okakura",
        year: 1906,
        category: 'senses',
        story: "Steam rose from the cup, carrying jasmine from somewhere across the world. Sipping, Hana felt connected to growers she'd never meet."
    },
    {
        id: 171,
        text: "Nature does not hurry, yet everything is accomplished.",
        book: "Tao Te Ching",
        author: "Lao Tzu",
        year: -500,
        category: 'nature',
        story: "Watching the oak add another ring, Tyler understood. Rushing made humans feel productive, but the tree grew more in patience than he did in haste."
    },
    {
        id: 172,
        text: "The hours pass like silent women bearing baskets of water.",
        book: "Collected Poems",
        author: "Federico García Lorca",
        year: 1928,
        category: 'time',
        story: "The afternoon drifted past, unhurried and graceful. Elena stopped watching the clock and let time carry what it carried, silently, onward."
    },
    {
        id: 173,
        text: "Love is the flower you've got to let grow.",
        book: "Interviews",
        author: "John Lennon",
        year: 1980,
        category: 'emotions',
        story: "Forcing it only strangled the relationship. When Sam finally gave it space and light, love bloomed on its own schedule."
    },
    {
        id: 174,
        text: "The haze of heat rose from the summer fields like a benediction.",
        book: "Country Essays",
        author: "Willa Cather",
        year: 1922,
        category: 'seasons',
        story: "Standing in the shimmering heat, dust in her lungs, Lila felt unexpectedly blessed. The land was giving everything it had."
    },
    {
        id: 175,
        text: "Rivers know this: there is no hurry. We shall get there some day.",
        book: "Winnie-the-Pooh",
        author: "A.A. Milne",
        year: 1926,
        category: 'nature',
        story: "The kayak wouldn't go faster than the current. Fighting it exhausted Brent. Surrendering to the river's pace, he arrived relaxed instead of rushed."
    },
    {
        id: 176,
        text: "The touch of silk is like cool water on a summer day.",
        book: "Fabric Essays",
        author: "Issey Miyake",
        year: 1989,
        category: 'senses',
        story: "Her grandmother's silk scarf against her cheek—cool, impossibly soft. Some luxuries, Priya knew, you remember with your skin."
    },
    {
        id: 177,
        text: "Midnight is as bright as noon in the eyes of the imagination.",
        book: "Collected Essays",
        author: "Charles Lamb",
        year: 1823,
        category: 'time',
        story: "The darkness made no difference to the story unfolding in her mind. Luz wrote by the glow of imagination, brighter than any lamp."
    },
    {
        id: 178,
        text: "The frost performs its secret ministry, unhelped by any wind.",
        book: "Frost at Midnight",
        author: "Samuel Taylor Coleridge",
        year: 1798,
        category: 'weather',
        story: "Overnight, the world transformed silently. By morning, every surface glittered. Magic, it seemed, worked best when no one was watching."
    },
    {
        id: 179,
        text: "There is always music amongst the trees in the garden, but our hearts must be very quiet to hear it.",
        book: "Sanctuary",
        author: "Minnie Aumonier",
        year: 1928,
        category: 'nature',
        story: "The garden seemed silent until Jorge stopped rushing. Then he heard it—leaves rustling, wind humming, insects buzzing. A whole concert, waiting for an audience."
    },
    {
        id: 180,
        text: "Joy is the simplest form of gratitude.",
        book: "Letters",
        author: "Karl Barth",
        year: 1962,
        category: 'emotions',
        story: "She couldn't find words for thank you. But her laughter said it all—pure joy, the most honest gratitude she could offer."
    },
    {
        id: 181,
        text: "Every leaf speaks bliss to me, fluttering from the autumn tree.",
        book: "Fall Leaves, Fall",
        author: "Emily Brontë",
        year: 1838,
        category: 'seasons',
        story: "Children saw falling leaves as confetti. Adults saw mess to rake. But when Marcus looked again, each leaf was waving goodbye—a tiny, beautiful farewell."
    },
    {
        id: 182,
        text: "The sky was the color of a bruise, purple and yellow and green.",
        book: "Storm Stories",
        author: "Louise Erdrich",
        year: 1993,
        category: 'weather',
        story: "The approaching storm painted the sky in warning colors. Paula felt small beneath it—a reminder that nature still had moods we couldn't control."
    },
    {
        id: 183,
        text: "Look deep into nature, and then you will understand everything better.",
        book: "Notes",
        author: "Albert Einstein",
        year: 1954,
        category: 'nature',
        story: "Physics equations swirled in his head until Uri stepped outside. Watching bees work a flower, patterns became clear that the blackboard had hidden."
    },
    {
        id: 184,
        text: "Joy is the simplest form of gratitude.",
        book: "Letters",
        author: "Karl Barth",
        year: 1962,
        category: 'emotions',
        story: "Words weren't enough. But when she laughed with pure delight, the thank-you was unmistakable—joy as gratitude's most honest expression."
    },
    {
        id: 185,
        text: "The dawn showed high ridges white with new snow.",
        book: "A Farewell to Arms",
        author: "Ernest Hemingway",
        year: 1929,
        category: 'time',
        story: "Overnight, the world had been rewritten. Kurt woke to find familiar mountains transformed—proof that every dawn brings the possibility of new."
    },
    {
        id: 186,
        text: "The taste of ripe strawberries is summer concentrated into a small red heart.",
        book: "Food Essays",
        author: "Nigel Slater",
        year: 2000,
        category: 'senses',
        story: "Supermarket strawberries disappointed. But the ones from the farm—still warm from sun—tasted like July distilled into a single bite."
    },
    {
        id: 187,
        text: "March winds and April showers bring forth May flowers.",
        book: "Proverbs",
        author: "Thomas Tusser",
        year: 1557,
        category: 'seasons',
        story: "The gray spring felt endless. But Nora reminded herself: without this rain, the garden would never bloom. Difficult seasons prepare beautiful ones."
    },
    {
        id: 188,
        text: "The thunder muttered across far mountains like old men grumbling.",
        book: "Mountain Tales",
        author: "Peter Matthiessen",
        year: 1978,
        category: 'weather',
        story: "The distant rumble felt almost conversational. Gabe sat on the porch, listening to the mountains complain about the weather."
    },
    {
        id: 189,
        text: "Everything has beauty, but not everyone sees it.",
        book: "Analects",
        author: "Confucius",
        year: -500,
        category: 'senses',
        story: "The crumbling wall. The wrinkled face. The rusted hinge. Sasha photographed what others ignored and found beauty waiting to be noticed."
    },
    {
        id: 190,
        text: "The oak fought the wind and was broken, the willow bent when it must and survived.",
        book: "Fables",
        author: "Aesop",
        year: -600,
        category: 'nature',
        story: "When change came, Darren resisted. It broke him. His sister yielded, adapted, and flourished. Flexibility isn't weakness—it's survival."
    },
    {
        id: 191,
        text: "Time is a physician that heals every grief.",
        book: "Poems",
        author: "Diphilus",
        year: -300,
        category: 'time',
        story: "Fresh wounds don't close quickly. But Mariana noticed—each year, the anniversary hurt a little less. Time, the patient healer, was working."
    },
    {
        id: 192,
        text: "Gratitude is not only the greatest of virtues, but the parent of all others.",
        book: "Pro Plancio",
        author: "Cicero",
        year: -54,
        category: 'emotions',
        story: "When Eli began listing what he was grateful for, kindness followed. Then patience. Then generosity. Gratitude had children."
    },
    {
        id: 193,
        text: "The sea lives in every one of us.",
        book: "Blue Mind",
        author: "Wallace J. Nichols",
        year: 2014,
        category: 'nature',
        story: "Her tears were salt. Her blood's salinity matched the ocean's. Jade felt it—she wasn't separate from the sea, just temporarily landlocked."
    },
    {
        id: 194,
        text: "Wherever you go, go with all your heart.",
        book: "Analects",
        author: "Confucius",
        year: -500,
        category: 'emotions',
        story: "Half-hearted attempts yielded half-baked results. But when Kofi finally committed fully, everything changed. The heart, it turns out, is the engine."
    },
    {
        id: 195,
        text: "Dusk fell like a curtain of purple silk.",
        book: "Evening Essays",
        author: "Colette",
        year: 1928,
        category: 'time',
        story: "The day didn't end abruptly—it dressed for the occasion, draping the sky in violet. Lydia watched the performance, grateful for the show."
    },
    {
        id: 196,
        text: "The warmth of wool against skin on a cold day is the embrace of sheep.",
        book: "Textile Meditations",
        author: "William Morris",
        year: 1883,
        category: 'senses',
        story: "Pulling on the sweater, Anya felt connected to creatures she'd never met. Their gift of warmth, woven into cloth, hugging her back."
    },
    {
        id: 197,
        text: "In December we plant seeds of hope for the gardens of May.",
        book: "Seasonal Reflections",
        author: "Hal Borland",
        year: 1955,
        category: 'seasons',
        story: "The frozen ground held no promise—yet. But Hiro planned anyway, seeds ordered, maps drawn. Winter is where gardens begin."
    },
    {
        id: 198,
        text: "The wind was a torrent of darkness among the gusty trees.",
        book: "The Highwayman",
        author: "Alfred Noyes",
        year: 1906,
        category: 'weather',
        story: "The wild night matched her wild heart. Riding through the storm, Maria felt the wind wasn't fighting her—it was running alongside her."
    },
    {
        id: 199,
        text: "Happiness is not a station you arrive at, but a manner of traveling.",
        book: "Writings",
        author: "Margaret Lee Runbeck",
        year: 1938,
        category: 'emotions',
        story: "He kept waiting to be happy when—when he got the job, the house, the family. Until he realized happiness wasn't at the destination. It was the whole journey."
    },
    {
        id: 200,
        text: "The fragrance of pine carried memories of childhood Christmas mornings.",
        book: "Memoir",
        author: "Annie Dillard",
        year: 1982,
        category: 'senses',
        story: "One breath of pine and Raj was eight again, unwrapping presents in pajamas. The tree was a time machine hidden in plain sight."
    },
    {
        id: 201,
        text: "Like the moon, come out from behind the clouds! Shine.",
        book: "Divan",
        author: "Rumi",
        year: 1260,
        category: 'nature',
        story: "She'd been hiding her talents, afraid of judgment. But the moon doesn't ask permission to glow. Finally, Simone let herself shine."
    },
    {
        id: 202,
        text: "The clock ticked like a heart in the quiet house.",
        book: "Night Tales",
        author: "Shirley Jackson",
        year: 1959,
        category: 'time',
        story: "In the empty house, the only sound was the clock. Eliza felt it beating—the house's heart, still alive even when everyone was gone."
    },
    {
        id: 203,
        text: "The best time to plant a tree was twenty years ago. The second best time is now.",
        book: "Proverbs",
        author: "Chinese Proverb",
        year: 1800,
        category: 'nature',
        story: "Regret about the past could have paralyzed Gabriel. Instead, he picked up a shovel. The tree wouldn't be tall for years—but it would be taller than if he never started."
    },
    {
        id: 204,
        text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        book: "Long Walk to Freedom",
        author: "Nelson Mandela",
        year: 1994,
        category: 'emotions',
        story: "Failure after failure nearly broke Cassandra. But each time she stood back up, she grew stronger. The glory wasn't in perfection—it was in persistence."
    },
    {
        id: 205,
        text: "The stars were bright like scattered salt on black velvet.",
        book: "Night Essays",
        author: "Antoine de Saint-Exupéry",
        year: 1939,
        category: 'time',
        story: "City lights had hidden them. But out here, the stars appeared by the thousands—seasoning the night with ancient light."
    },
    {
        id: 206,
        text: "The feel of cold marble beneath my fingers was ancient history made touchable.",
        book: "Travel Essays",
        author: "Jan Morris",
        year: 1985,
        category: 'senses',
        story: "Books told of Rome. But touching the Forum's stones, Liam understood—history wasn't past. It was here, cold and solid under his palm."
    },
    {
        id: 207,
        text: "Summer set lip to earth's bosom bare, and left the flushed print in a poppy there.",
        book: "The Hound of Heaven",
        author: "Francis Thompson",
        year: 1893,
        category: 'seasons',
        story: "The red poppy in the wheat field—summer's kiss made visible. Hannah photographed it, a love letter from season to earth."
    },
    {
        id: 208,
        text: "The fog lay thick upon the city, muffling sound and softening edges.",
        book: "London Stories",
        author: "Peter Ackroyd",
        year: 2000,
        category: 'weather',
        story: "The fog transformed the familiar city into a mystery. Walking through, Viktor felt he'd slipped into a softer, older world."
    },
    {
        id: 209,
        text: "Let everything happen to you: beauty and terror. Just keep going. No feeling is final.",
        book: "Letters to a Young Poet",
        author: "Rainer Maria Rilke",
        year: 1903,
        category: 'emotions',
        story: "The heartbreak felt permanent. But Rilke's words reminded Freya—this too would pass. She just had to keep walking through it."
    },
    {
        id: 210,
        text: "The taste of honey lingers long after the flower is forgotten.",
        book: "Apiary Essays",
        author: "Gene Stratton-Porter",
        year: 1921,
        category: 'senses',
        story: "She couldn't remember what they talked about. But the sweetness of that afternoon—that stayed. Some moments leave flavor without details."
    },
    {
        id: 211,
        text: "A tree is known by its fruit; a man by his deeds.",
        book: "Attributed",
        author: "Saint Basil",
        year: 370,
        category: 'nature',
        story: "His words were impressive. But watching what he actually did—how he treated waiters, how he kept promises—showed Oscar who the man really was."
    },
    {
        id: 212,
        text: "Tomorrow is a new day with no mistakes in it yet.",
        book: "Anne of Green Gables",
        author: "L.M. Montgomery",
        year: 1908,
        category: 'time',
        story: "Today had been a disaster of errors. But closing her eyes, Jess took comfort—tomorrow arrived fresh, unmarked, full of possibility."
    },
    {
        id: 213,
        text: "The butterfly counts not months but moments, and has time enough.",
        book: "Fireflies",
        author: "Rabindranath Tagore",
        year: 1928,
        category: 'nature',
        story: "Her life would be short, the doctors said. But watching the butterfly—alive for just weeks yet lacking nothing—taught Vera a new way to count time."
    },
    {
        id: 214,
        text: "Kindness is a language which the deaf can hear and the blind can see.",
        book: "Notebooks",
        author: "Mark Twain",
        year: 1897,
        category: 'emotions',
        story: "No common language between them. But when the stranger shared his lunch, compassion translated perfectly. Kindness needs no words."
    },
    {
        id: 215,
        text: "The hour before dawn holds more secrets than the night itself.",
        book: "Dawn Essays",
        author: "Anaïs Nin",
        year: 1966,
        category: 'time',
        story: "The party had ended but sleep wouldn't come. In that strange hour, sitting on the balcony, Anton felt truths surfacing that daylight kept hidden."
    },
    {
        id: 216,
        text: "The sound of a violin can break your heart or mend it.",
        book: "Music Memoirs",
        author: "Yehudi Menuhin",
        year: 1977,
        category: 'senses',
        story: "The same instrument, the same strings. But one song could shatter her and another could heal. Sound, Bianca realized, knew no limits."
    },
    {
        id: 217,
        text: "In the bleak midwinter, frosty wind made moan.",
        book: "In the Bleak Midwinter",
        author: "Christina Rossetti",
        year: 1872,
        category: 'seasons',
        story: "The coldest months felt endless. But there was beauty even in bleakness—frost on windows, stars sharp as ice, the world stripped to essentials."
    },
    {
        id: 218,
        text: "The sun was a red ball sinking into a sea of clouds.",
        book: "Sunset Poems",
        author: "Mary Oliver",
        year: 1992,
        category: 'weather',
        story: "Another day's end, another ordinary miracle. Dennis stopped the car just to watch the sun drown, painting its own memorial in color."
    },
    {
        id: 219,
        text: "The purpose of life is not to be happy. It is to be useful, honorable, compassionate.",
        book: "Essays",
        author: "Ralph Waldo Emerson",
        year: 1844,
        category: 'emotions',
        story: "The pursuit of happiness had exhausted Cleo. When she shifted to pursuing usefulness, happiness arrived anyway—as a byproduct, not a goal."
    },
    {
        id: 220,
        text: "The perfume of roses can make the whole room feel like a garden.",
        book: "Rose Essays",
        author: "Gertrude Jekyll",
        year: 1902,
        category: 'senses',
        story: "Just one rose from her garden transformed the hospital room. Suddenly there was green and life in the sterile white. Scent made the invisible garden real."
    },
    {
        id: 221,
        text: "Only those who risk going too far can possibly find out how far one can go.",
        book: "Preface to Transit of Venus",
        author: "T.S. Eliot",
        year: 1931,
        category: 'emotions',
        story: "Playing it safe had kept Ruby comfortable but small. The day she risked 'too far,' she discovered territories she never knew existed in herself."
    },
    {
        id: 222,
        text: "The forest was quiet, but it was the quiet of a thousand listeners.",
        book: "Into the Wild",
        author: "Jon Krakauer",
        year: 1996,
        category: 'nature',
        story: "It felt like silence until Joel tuned in. Then he sensed it—presence everywhere, the forest paying attention, watching back."
    },
    {
        id: 223,
        text: "Life shrinks or expands in proportion to one's courage.",
        book: "Diary",
        author: "Anaïs Nin",
        year: 1969,
        category: 'emotions',
        story: "Her world had become tiny through timidity. But each brave step widened it—courage as expansion, fear as cage."
    },
    {
        id: 224,
        text: "The night sky is a book written in stars, waiting to be read.",
        book: "Astronomy Essays",
        author: "Carl Sagan",
        year: 1980,
        category: 'time',
        story: "The same constellations that guided ancient sailors shone over Maya. She was reading the same book as her ancestors, centuries later."
    },
    {
        id: 225,
        text: "I felt the crisp texture of autumn leaves crumbling in my palm.",
        book: "Seasonal Memoir",
        author: "Diane Ackerman",
        year: 1991,
        category: 'senses',
        story: "The leaf dissolved into fragments between her fingers—summer's flesh gone fragile. Touch taught Nadia about time."
    },
    {
        id: 226,
        text: "Summer's lease hath all too short a date.",
        book: "Sonnet 18",
        author: "William Shakespeare",
        year: 1609,
        category: 'seasons',
        story: "August already. Sean felt summer slipping away, its brief lease almost up. He squeezed every drop of sunlight he could."
    },
    {
        id: 227,
        text: "The rain came down in sheets, washing the world clean.",
        book: "Storm Stories",
        author: "Alice Munro",
        year: 1994,
        category: 'weather',
        story: "After the downpour, everything smelled new. The rain had scrubbed the air, the streets, and somehow, Devi's worried mind too."
    },
    {
        id: 228,
        text: "To love and be loved is to feel the sun from both sides.",
        book: "Attributed",
        author: "David Viscott",
        year: 1976,
        category: 'emotions',
        story: "She loved him. He loved her back. For the first time, Cara felt warmth coming from every direction—sunlight doubled."
    },
    {
        id: 229,
        text: "The smell of old books is the perfume of knowledge.",
        book: "Library Meditations",
        author: "Alberto Manguel",
        year: 1996,
        category: 'senses',
        story: "New books smelled of nothing. But the old library stacks—dust, glue, aged paper—smelled of centuries of learning waiting to be inhaled."
    },
    {
        id: 230,
        text: "The tree which moves some to tears of joy is in the eyes of others only a green thing that stands in the way.",
        book: "Letters",
        author: "William Blake",
        year: 1799,
        category: 'nature',
        story: "Developers saw an obstacle. Children saw a climbing throne. The tree was the same; the eyes were everything."
    },
    {
        id: 231,
        text: "Lost time is never found again.",
        book: "Poor Richard's Almanack",
        author: "Benjamin Franklin",
        year: 1748,
        category: 'time',
        story: "Scrolling consumed hours that evaporated without memory. Isaac finally understood—time lost left no trail to follow back."
    },
    {
        id: 232,
        text: "February makes a bridge and March breaks it.",
        book: "Proverbs",
        author: "English Proverb",
        year: 1600,
        category: 'seasons',
        story: "The ice that had held firm for weeks cracked in March warmth. Winter's bridge collapsed as spring broke through."
    },
    {
        id: 233,
        text: "The earth has its music for those who listen to the wind.",
        book: "Wind Poems",
        author: "George Santayana",
        year: 1910,
        category: 'nature',
        story: "Headphones removed, Riley heard the symphony—wind through leaves, across grass, over stones. The earth was always singing; he'd just been plugged into other sounds."
    },
    {
        id: 234,
        text: "Courage is not the absence of fear, but rather the judgment that something else is more important.",
        book: "The Princess Diaries",
        author: "Meg Cabot",
        year: 2000,
        category: 'emotions',
        story: "Terrified of public speaking, Erika stepped to the podium anyway. Her cause mattered more than her fear. That, she realized, was courage."
    },
    {
        id: 235,
        text: "At three in the morning, you can hear the world breathe.",
        book: "Night Essays",
        author: "Vladimir Nabokov",
        year: 1951,
        category: 'time',
        story: "Insomnia brought him to the window at 3 AM. The city slept, and Paul heard it—a collective exhale, the world at rest."
    },
    {
        id: 236,
        text: "The taste of fresh bread with butter is a prayer of gratitude made edible.",
        book: "Bread Essays",
        author: "M.F.K. Fisher",
        year: 1961,
        category: 'senses',
        story: "Warm bread, melting butter—Zara's first bite felt like saying grace. Some prayers are spoken. This one was tasted."
    },
    {
        id: 237,
        text: "November always seemed to me the Norway of the year.",
        book: "Journals",
        author: "Emily Dickinson",
        year: 1858,
        category: 'seasons',
        story: "The short days, long darkness, the cold that wasn't quite winter yet—November lived in twilight, northern and mysterious."
    },
    {
        id: 238,
        text: "The mist hung low over the fields like a blessing made visible.",
        book: "Field Essays",
        author: "Wendell Berry",
        year: 1988,
        category: 'weather',
        story: "Morning mist softened every edge. Walking through, Terry felt wrapped in something gentle—the land's quiet benediction."
    },
    {
        id: 239,
        text: "Art washes away from the soul the dust of everyday life.",
        book: "Attributed",
        author: "Pablo Picasso",
        year: 1960,
        category: 'emotions',
        story: "The museum visit felt indulgent. But leaving, Janine felt cleaner somehow—the accumulated grime of routine rinsed away by beauty."
    },
    {
        id: 240,
        text: "The sound of water is the sound of time passing gently.",
        book: "Water Essays",
        author: "Matsuo Bashō",
        year: 1689,
        category: 'senses',
        story: "By the stream, Xavier lost track of hours. Water's endless flow made time feel gentler, less urgent, more like itself."
    },
    {
        id: 241,
        text: "Study nature, love nature, stay close to nature. It will never fail you.",
        book: "Writings",
        author: "Frank Lloyd Wright",
        year: 1943,
        category: 'nature',
        story: "Every building Francis designed echoed his walks in the woods. Nature was his reliable teacher, never absent, always patient."
    },
    {
        id: 242,
        text: "The best dreams happen when you're awake.",
        book: "Attributed",
        author: "Cherie Gilderbloom",
        year: 2005,
        category: 'emotions',
        story: "Napping brought only confusion. But wide awake, vividly imagining her future—that was where the real dreams lived."
    },
    {
        id: 243,
        text: "Every artist dips his brush in his own soul, and paints his own nature into his pictures.",
        book: "Proverbs from Plymouth Pulpit",
        author: "Henry Ward Beecher",
        year: 1887,
        category: 'emotions',
        story: "Two painters faced the same sunset. But their canvases revealed not the sky but themselves—their hopes, fears, and souls."
    },
    {
        id: 244,
        text: "The darkest hour has only sixty minutes.",
        book: "Writings",
        author: "Morris Mandel",
        year: 1960,
        category: 'time',
        story: "In her worst moment, Laila watched the clock. Even this—even this—would end. One hour, however dark, still had sixty finite minutes."
    },
    {
        id: 245,
        text: "The touch of morning dew on bare feet is the earth's cool greeting.",
        book: "Garden Essays",
        author: "Rachel Carson",
        year: 1962,
        category: 'senses',
        story: "Walking to the garden at dawn, cold dew on his toes, Ben felt welcomed. The earth was saying good morning the only way it knew."
    },
    {
        id: 246,
        text: "January is here, with eyes that keenly glow, a frost-mailed warrior striding a shadowy steed of snow.",
        book: "Winter Poems",
        author: "Edgar Fawcett",
        year: 1882,
        category: 'seasons',
        story: "January arrived like a fierce king—cold, brilliant, uncompromising. There was no negotiating with this warrior month."
    },
    {
        id: 247,
        text: "Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky.",
        book: "Stray Birds",
        author: "Rabindranath Tagore",
        year: 1916,
        category: 'weather',
        story: "The troubles that once seemed threatening now just added depth to her days. Soraya had learned to love her clouds."
    },
    {
        id: 248,
        text: "A river cuts through rock, not because of its power, but because of its persistence.",
        book: "Attributed",
        author: "Jim Watkins",
        year: 2001,
        category: 'nature',
        story: "Grand canyons carved by patient water. Diego applied the lesson—small daily efforts, not one mighty push, would shape his life."
    },
    {
        id: 249,
        text: "The way I see it, if you want the rainbow, you gotta put up with the rain.",
        book: "Interviews",
        author: "Dolly Parton",
        year: 1994,
        category: 'weather',
        story: "The difficult years had been miserable. But looking back, Mateo saw—without that rain, this brilliant life wouldn't exist."
    },
    {
        id: 250,
        text: "Morning comes whether you set the alarm or not.",
        book: "Essays",
        author: "Ursula K. Le Guin",
        year: 2004,
        category: 'time',
        story: "Dread about tomorrow kept her up. But dawn came anyway, indifferent to dread. Time moves; worry doesn't stop it."
    },
    {
        id: 251,
        text: "The perfume of dying leaves is autumn's signature fragrance.",
        book: "Seasonal Essays",
        author: "Hal Borland",
        year: 1973,
        category: 'senses',
        story: "That earthy, slightly sweet decay smell—autumn announcing itself through scent. Kai breathed deeply. Even endings had their perfume."
    },
    {
        id: 252,
        text: "Life begins the day you start a garden.",
        book: "Garden Sayings",
        author: "Chinese Proverb",
        year: 1700,
        category: 'nature',
        story: "Before the garden, time blurred. After, each season marked and meaningful. The dirt under his nails made everything real."
    },
    {
        id: 253,
        text: "Joy does not simply happen to us. We have to choose joy and keep choosing it every day.",
        book: "Writings",
        author: "Henri Nouwen",
        year: 1992,
        category: 'emotions',
        story: "Happiness sometimes came by accident. But joy—real joy—Nadia chose each morning. It was a practice, not a stroke of luck."
    },
    {
        id: 254,
        text: "Noon sun makes the shadows disappear, proving light conquers all darkness.",
        book: "Sun Meditations",
        author: "John Ruskin",
        year: 1860,
        category: 'time',
        story: "At midday, no shadows existed. Full light erased them completely. For one hour, Eli stood shadowless—surrounded by proof that light wins."
    },
    {
        id: 255,
        text: "The texture of homespun cloth carries the warmth of human hands.",
        book: "Craft Essays",
        author: "William Morris",
        year: 1883,
        category: 'senses',
        story: "The handwoven blanket felt different—imperfect, alive with the maker's presence. Some textures carry souls."
    },
    {
        id: 256,
        text: "May and June, when the weather is warm, have nothing but birdsong up their sleeve.",
        book: "Season Poems",
        author: "Eleanor Farjeon",
        year: 1938,
        category: 'seasons',
        story: "Those golden months—warm mornings, long twilights, and birds singing as if they'd never stop. May and June were the year's most generous gift."
    },
    {
        id: 257,
        text: "The rainbow is the signature of God's promise written across the sky.",
        book: "Spiritual Essays",
        author: "Max Lucado",
        year: 1987,
        category: 'weather',
        story: "After the storm, the arc appeared—light refracted through rain. Whether divine or physical, it felt like a promise kept."
    },
    {
        id: 258,
        text: "You are never too old to set another goal or to dream a new dream.",
        book: "Lectures",
        author: "C.S. Lewis",
        year: 1952,
        category: 'emotions',
        story: "At seventy-two, Grandfather started painting. 'Too old,' they said. His gallery show, at seventy-five, said otherwise."
    },
    {
        id: 259,
        text: "Every mountain top is within reach if you just keep climbing.",
        book: "Climbing Essays",
        author: "Barry Finley",
        year: 2009,
        category: 'nature',
        story: "The summit looked impossibly far. But step by step, Yuki closed the distance. Every peak is conquered not in leaps, but in steps."
    },
    {
        id: 260,
        text: "The tick of a grandfather clock measures time in generations.",
        book: "Time Essays",
        author: "Eudora Welty",
        year: 1970,
        category: 'time',
        story: "The same pendulum swing her grandmother heard—and her grandmother before. The clock made time feel less like loss and more like inheritance."
    },
    {
        id: 261,
        text: "The aroma of a wood fire on a winter evening is the smell of home.",
        book: "Home Essays",
        author: "Laura Ingalls Wilder",
        year: 1935,
        category: 'senses',
        story: "Wood smoke on a cold night—suddenly Craig was seven, warm by the fire, safe. Some smells are time machines to security."
    },
    {
        id: 262,
        text: "August brings the sheaves of corn, then the harvest home is borne.",
        book: "Seasonal Rhymes",
        author: "Sara Coleridge",
        year: 1834,
        category: 'seasons',
        story: "The fields heavy with grain, the air thick with dust and accomplishment. August meant looking at what the year had grown."
    },
    {
        id: 263,
        text: "After a storm comes a calm, and sunshine follows rain.",
        book: "Proverbs",
        author: "Matthew Henry",
        year: 1710,
        category: 'weather',
        story: "The argument had been fierce. But afterward came quiet, then reconciliation. Storms, whether literal or metaphorical, always end."
    },
    {
        id: 264,
        text: "What we think, we become.",
        book: "Dhammapada",
        author: "Buddha",
        year: -500,
        category: 'emotions',
        story: "Negative thoughts had shaped negative outcomes for years. When Leah finally changed the mind, the life followed."
    },
    {
        id: 265,
        text: "In the garden of memory, in the palace of dreams, that is where you and I shall meet.",
        book: "Salomé",
        author: "Oscar Wilde",
        year: 1891,
        category: 'nature',
        story: "His grandmother was gone, but she lived still—in memories bright as flowers, in dreams vivid as palaces. They still met there."
    },
    {
        id: 266,
        text: "The moon's reflection on still water is stillness teaching stillness.",
        book: "Zen Essays",
        author: "Thich Nhat Hanh",
        year: 1991,
        category: 'time',
        story: "The lake held the moon perfectly—no ripple disturbing the reflection. Watching, Oliver's own turbulent mind grew calm."
    },
    {
        id: 267,
        text: "The crunch of autumn leaves underfoot is the sound of summer's farewell.",
        book: "Fall Essays",
        author: "Donald Hall",
        year: 1975,
        category: 'senses',
        story: "Each leaf crackled like a whispered goodbye. Summer was leaving, and the forest was saying farewell one step at a time."
    },
    {
        id: 268,
        text: "May your life be like a wildflower, growing freely in the beauty of each day.",
        book: "Blessings",
        author: "Native American Proverb",
        year: 1800,
        category: 'nature',
        story: "No plans, no rigid structure—Amelia let life unfold like a wildflower. The result was more beautiful than any formal garden."
    },
    {
        id: 269,
        text: "September days have the warmth of summer in their briefer hours, but in their lengthening evenings a prophetic breath of autumn.",
        book: "September Essays",
        author: "Rowland E. Robinson",
        year: 1886,
        category: 'seasons',
        story: "The days were still warm, but the evenings whispered of change. September lived in two seasons at once."
    },
    {
        id: 270,
        text: "Wind is the breath of the earth, and it speaks in sighs and whispers.",
        book: "Weather Essays",
        author: "Loren Eiseley",
        year: 1969,
        category: 'weather',
        story: "The wind carried more than air—stories from distant places, the planet breathing across continents. Yuto listened to its language."
    },
    {
        id: 271,
        text: "The soul would have no rainbow had the eyes no tears.",
        book: "Poems",
        author: "John Vance Cheney",
        year: 1892,
        category: 'emotions',
        story: "The hard years had broken something, but also opened something. Without the pain, Iris never would have found the colors now visible."
    },
    {
        id: 272,
        text: "The ocean stirs the heart, inspires the imagination, and brings eternal joy to the soul.",
        book: "Oceanography Essays",
        author: "Wyland",
        year: 2002,
        category: 'nature',
        story: "One look at the endless water and Kai's heart lifted. The ocean gave him something no landlocked place ever could."
    },
    {
        id: 273,
        text: "Time you enjoy wasting is not wasted time.",
        book: "Attributed",
        author: "Marthe Troly-Curtin",
        year: 1911,
        category: 'time',
        story: "'Unproductive,' people said of her afternoon reading. But Sana knew joy served no less purpose than labor."
    },
    {
        id: 274,
        text: "The most delicate of fragrances is that of mountain air after rainfall.",
        book: "Mountain Essays",
        author: "John Muir",
        year: 1911,
        category: 'senses',
        story: "Fresh, impossibly clean—the rain-scrubbed alpine air was the purest scent Javier had ever inhaled."
    },
    {
        id: 275,
        text: "Winter's cold embraces last longest, but spring always finds a way through.",
        book: "Seasonal Meditations",
        author: "Lucy Maud Montgomery",
        year: 1915,
        category: 'seasons',
        story: "February seemed endless. But the first crocus pushed through snow, insisting: spring always wins, eventually."
    },
    {
        id: 276,
        text: "Lightning writes messages across the sky in a script only the heart can read.",
        book: "Storm Poems",
        author: "Mary Elizabeth Counselman",
        year: 1943,
        category: 'weather',
        story: "The bolt flashed and something inside her answered. Lightning spoke directly to some ancient, preverbal part of her soul."
    },
    {
        id: 277,
        text: "In the sweetness of friendship let there be laughter, and sharing of pleasures.",
        book: "The Prophet",
        author: "Kahlil Gibran",
        year: 1923,
        category: 'emotions',
        story: "The deepest friendships weren't built on problems shared but on joys multiplied. Laughter was their true language."
    },
    {
        id: 278,
        text: "I could watch the water forever and never tire of its changing moods.",
        book: "Water Meditations",
        author: "Rachel Carson",
        year: 1955,
        category: 'nature',
        story: "Gray, blue, green, white—the water changed faces constantly. Hours passed, but Celine never grew bored."
    },
    {
        id: 279,
        text: "Yesterday is history, tomorrow is a mystery, today is a gift—that's why it's called the present.",
        book: "Attributed",
        author: "Alice Morse Earle",
        year: 1902,
        category: 'time',
        story: "Regret about the past, anxiety about the future—both evaporated when Hana focused on the gift wrapped in this moment."
    },
    {
        id: 280,
        text: "The sensation of soft rain on upturned faces is earth's gentle blessing.",
        book: "Rain Essays",
        author: "Cynthia Rylant",
        year: 1984,
        category: 'senses',
        story: "Face turned to the warm drizzle, Lenny felt blessed without religion. The rain was enough baptism."
    },
    {
        id: 281,
        text: "April showers bring May flowers, but also muddy boots and joyful children.",
        book: "Children's Garden",
        author: "Frances Hodgson Burnett",
        year: 1911,
        category: 'seasons',
        story: "The puddles were irresistible to small feet. Muddy shoes were a small price for so much springtime joy."
    },
    {
        id: 282,
        text: "The clouds are like cotton castles in the sky, inviting the imagination to wander.",
        book: "Sky Poems",
        author: "Vera Nazarian",
        year: 2007,
        category: 'weather',
        story: "Lying in the grass, looking up, she built kingdoms in the clouds. Imagination needed no building materials."
    },
    {
        id: 283,
        text: "Peace comes from within. Do not seek it without.",
        book: "Dhammapada",
        author: "Buddha",
        year: -500,
        category: 'emotions',
        story: "She'd searched the world for peace—retreats, travels, relationships. The day she stopped looking outward, she found it."
    },
    {
        id: 284,
        text: "The gentle rustling of bamboo is nature's most soothing lullaby.",
        book: "Garden Essays",
        author: "Sei Shōnagon",
        year: 1002,
        category: 'nature',
        story: "The bamboo grove whispered in the breeze. Settling into her hammock, Mika let the sound lull her to sleep."
    },
    {
        id: 285,
        text: "In the quiet hours before dawn, the soul speaks its truest words.",
        book: "Contemplations",
        author: "Thomas Merton",
        year: 1961,
        category: 'time',
        story: "Before the noise of day, in that hush, Emil heard his own quiet truth. Dawn was when the soul spoke."
    },
    {
        id: 286,
        text: "The warmth of fresh-baked cookies fills a home with love made edible.",
        book: "Kitchen Essays",
        author: "Laurie Colwin",
        year: 1988,
        category: 'senses',
        story: "The cookie scent spread through the house, warm and sweet. Guests arrived to an embrace before the first hug."
    },
    {
        id: 287,
        text: "July, the very swelling act of the summer pageant.",
        book: "Summer Essays",
        author: "Henry Beston",
        year: 1928,
        category: 'seasons',
        story: "July was summer's climax—heat thick, days long, life blooming extravagantly. The pageant was in full swing."
    },
    {
        id: 288,
        text: "Sunshine is delicious, rain is refreshing, wind braces us up, snow is exhilarating.",
        book: "Illustrated Letters",
        author: "John Ruskin",
        year: 1886,
        category: 'weather',
        story: "Every weather had its gift. Petra learned to receive them all instead of wishing for different ones."
    },
    {
        id: 289,
        text: "Do what you can, with what you have, where you are.",
        book: "Autobiography",
        author: "Theodore Roosevelt",
        year: 1913,
        category: 'emotions',
        story: "Resources were scarce, time was short. But instead of waiting for perfect conditions, Marcus started with what he had. It was enough."
    },
    {
        id: 290,
        text: "The forest floor is a tapestry woven by centuries of falling leaves.",
        book: "Forest Essays",
        author: "Peter Wohlleben",
        year: 2015,
        category: 'nature',
        story: "Layer upon layer, years upon years—the soft carpet beneath their feet was time made touchable. History underfoot."
    },
    {
        id: 291,
        text: "The golden hour before sunset turns the ordinary into the magical.",
        book: "Photography Essays",
        author: "Ansel Adams",
        year: 1976,
        category: 'time',
        story: "The same street looked transformed. Golden light turned mundane buildings into monuments. Timing is everything."
    },
    {
        id: 292,
        text: "The taste of honey from your own hive is the sweetest known.",
        book: "Beekeeping Essays",
        author: "Sue Hubbell",
        year: 1988,
        category: 'senses',
        story: "Store-bought honey was fine. But the jar from her own backyard—knowing every flower the bees had visited—tasted like accomplishment."
    },
    {
        id: 293,
        text: "October's fiery leaves are summer's golden memories.",
        book: "Autumn Poems",
        author: "John Burroughs",
        year: 1906,
        category: 'seasons',
        story: "The red and gold weren't dying. They were summer's memories, blazing brightly one last time before rest."
    },
    {
        id: 294,
        text: "The sound of distant thunder is the sky's heartbeat.",
        book: "Storm Essays",
        author: "Gretel Ehrlich",
        year: 1991,
        category: 'weather',
        story: "Miles away, the low rumble rolled across the plains. The sky had a pulse, strong and steady even from a distance."
    },
    {
        id: 295,
        text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.",
        book: "Meditations",
        author: "Marcus Aurelius",
        year: 180,
        category: 'emotions',
        story: "Instead of cataloguing complaints, she catalogued wonders. The shift from problems to beauty changed everything."
    },
    {
        id: 296,
        text: "Trees are sanctuaries. Whoever knows how to speak to them, whoever knows how to listen to them, can learn the truth.",
        book: "Wandering",
        author: "Hermann Hesse",
        year: 1917,
        category: 'nature',
        story: "The old oak had no words. But sitting beneath it, listening, Theo heard truths he couldn't find anywhere else."
    },
    {
        id: 297,
        text: "Twilight is the time for stories, when the edge between reality and imagination softens.",
        book: "Storytelling Essays",
        author: "Neil Gaiman",
        year: 2004,
        category: 'time',
        story: "In that purple hour, anything seemed possible. The line between what was and what could be blurred beautifully."
    },
    {
        id: 298,
        text: "The brush of velvet against skin is luxury speaking in textures.",
        book: "Fabric Essays",
        author: "Coco Chanel",
        year: 1936,
        category: 'senses',
        story: "Her fingers traced the dress fabric—soft, impossibly rich. Some luxuries are heard with the hands."
    },
    {
        id: 299,
        text: "December's snowflakes are winter's way of saying it's time to slow down.",
        book: "Winter Tales",
        author: "Rachel Field",
        year: 1929,
        category: 'seasons',
        story: "The roads grew slick, obligations cancelled. December's snow wasn't inconvenience—it was permission to rest."
    },
    {
        id: 300,
        text: "A gentle breeze is nature's way of breathing softly upon your face.",
        book: "Wind Essays",
        author: "Lydia Maria Child",
        year: 1856,
        category: 'weather',
        story: "Not the wind's roar but its whisper—that soft brush across her cheek felt like tenderness from the world itself."
    },
    {
        id: 301,
        text: "The heart that gives, gathers.",
        book: "Proverbs",
        author: "Tao Te Ching",
        year: -500,
        category: 'emotions',
        story: "He gave without expectation. But somehow, the more he gave, the more returned to him. Generosity's strange math."
    },
    {
        id: 302,
        text: "Every flower is a soul blossoming in nature.",
        book: "Contemplations",
        author: "Gérard de Nerval",
        year: 1855,
        category: 'nature',
        story: "Watching the rose unfold over days, Celia felt she was witnessing something alive and aware—a small soul expressing itself."
    },
    {
        id: 303,
        text: "The art of being happy lies in the power of extracting happiness from common things.",
        book: "Happiness Essays",
        author: "Henry Ward Beecher",
        year: 1870,
        category: 'emotions',
        story: "No lottery win required. Morning coffee, evening stars, a friend's laugh—happiness hid in the ordinary all along."
    },
    {
        id: 304,
        text: "Stars can't shine without darkness.",
        book: "Attributed",
        author: "D.H. Sidebottom",
        year: 2013,
        category: 'time',
        story: "The city's glow hid them. But in the blackout, stars emerged by thousands. Darkness wasn't the enemy—it was the canvas."
    },
    {
        id: 305,
        text: "The softness of morning mist on my face reminded me I was alive.",
        book: "Dawn Poems",
        author: "Billy Collins",
        year: 2001,
        category: 'senses',
        story: "That cool moisture woke her gently—not the alarm's violence but nature's soft hand. She felt her own aliveness."
    },
    {
        id: 306,
        text: "Spring unlocks the flowers to paint the laughing soil.",
        book: "Spring Poems",
        author: "Reginald Heber",
        year: 1812,
        category: 'seasons',
        story: "Winter's lock finally turned. Flowers spilled out, transforming brown to color. The earth was laughing again."
    },
    {
        id: 307,
        text: "The wind of heaven is that which blows between a horse's ears.",
        book: "Arabian Proverb",
        author: "Traditional",
        year: 1400,
        category: 'weather',
        story: "Riding full gallop, the wind roared past Layla's ears—pure exhilaration. This, she knew, was as close to heaven as earth allows."
    },
    {
        id: 308,
        text: "Be kind, for everyone you meet is fighting a hard battle.",
        book: "Attributed",
        author: "Ian Maclaren",
        year: 1897,
        category: 'emotions',
        story: "The rude cashier, the impatient driver—who knew what they carried? Kindness cost Marcus nothing but gave everything."
    },
    {
        id: 309,
        text: "The view from the mountain top is worth every step of the climb.",
        book: "Climbing Essays",
        author: "Edmund Hillary",
        year: 1955,
        category: 'nature',
        story: "Every aching muscle had screamed to turn back. But at the summit, looking out—worth it. Every single step justified."
    },
    {
        id: 310,
        text: "Sunsets are proof that endings can be beautiful too.",
        book: "Attributed",
        author: "Beau Taplin",
        year: 2015,
        category: 'time',
        story: "The day's end blazed with color. Endings, she realized, need not be sad. Some conclusions are gorgeous."
    },
    {
        id: 311,
        text: "The rustle of silk is like whispered secrets from the past.",
        book: "Fashion Essays",
        author: "Diana Vreeland",
        year: 1984,
        category: 'senses',
        story: "The vintage dress rustled when she walked, carrying echoes of dancers decades gone. Fabric holds stories."
    },
    {
        id: 312,
        text: "June brings tulips, lilies, roses, fills the children's hands with posies.",
        book: "Garden Calendar",
        author: "Sara Coleridge",
        year: 1834,
        category: 'seasons',
        story: "By June, the garden overflowed. Small hands gathered bouquets, summer's generosity impossible to contain."
    },
    {
        id: 313,
        text: "Gray skies are just clouds passing over.",
        book: "Weather Wisdom",
        author: "Duke Ellington",
        year: 1967,
        category: 'weather',
        story: "The gloom felt permanent. But Duke's words reminded Aaliyah—clouds move. This gray would pass."
    },
    {
        id: 314,
        text: "Imagination is the beginning of creation.",
        book: "Man and Superman",
        author: "George Bernard Shaw",
        year: 1903,
        category: 'emotions',
        story: "Before the painting existed, she imagined it. Before the business launched, he dreamed it. Creation always starts inside."
    },
    {
        id: 315,
        text: "The song of the river ends not at her banks but in the hearts of those who have loved her.",
        book: "River Essays",
        author: "Khalil Gibran",
        year: 1918,
        category: 'nature',
        story: "Miles from the river now, Nabil still heard its voice. The water lived on in memory, singing forever in his heart."
    },
    {
        id: 316,
        text: "Patience is bitter, but its fruit is sweet.",
        book: "Attributed",
        author: "Aristotle",
        year: -340,
        category: 'emotions',
        story: "Waiting was agony. But when the results finally came—success sweeter than any quick win. The bitter wait had ripened everything."
    },
    {
        id: 317,
        text: "The scent of lavender carries memories of sunny fields in Provence.",
        book: "Perfume Essays",
        author: "Jean-Claude Ellena",
        year: 2007,
        category: 'senses',
        story: "One whiff transported Claire to that summer—bees humming, purple waves, grandmother's hands. Lavender held all of it."
    },
    {
        id: 318,
        text: "In the spring I have counted 136 different kinds of weather inside of 24 hours.",
        book: "Writings",
        author: "Mark Twain",
        year: 1897,
        category: 'seasons',
        story: "Sun, then rain, then snow, then warmth—spring couldn't make up its mind. Its indecision was part of its charm."
    },
    {
        id: 319,
        text: "Snowflakes are one of nature's most fragile things, but look at what they can do when they stick together.",
        book: "Attributed",
        author: "Verna M. Kelly",
        year: 1980,
        category: 'weather',
        story: "Alone, each snowflake melted on her palm. Together, they stopped cities. Unity transforms the fragile into the powerful."
    },
    {
        id: 320,
        text: "The only journey is the one within.",
        book: "Letters",
        author: "Rainer Maria Rilke",
        year: 1905,
        category: 'emotions',
        story: "He'd traveled the world seeking answers. The real journey—into himself—he'd been avoiding the whole time."
    },
    {
        id: 321,
        text: "Between every two pines is a doorway to a new world.",
        book: "Nature Essays",
        author: "John Muir",
        year: 1908,
        category: 'nature',
        story: "The forest didn't repeat—each gap between trees opened into something different. A thousand entrances, a thousand worlds."
    },
    {
        id: 322,
        text: "Time is a dressmaker specializing in alterations.",
        book: "Writings",
        author: "Faith Baldwin",
        year: 1962,
        category: 'time',
        story: "What fit perfectly at twenty needed adjusting at forty. Time tailors everything—perspectives, relationships, even memories."
    },
    {
        id: 323,
        text: "The smell of coffee has become the smell of good mornings.",
        book: "Coffee Essays",
        author: "Anna Quindlen",
        year: 1998,
        category: 'senses',
        story: "Before the taste, the smell. That first whiff told Jordan's brain: the day has begun, and it will be okay."
    },
    {
        id: 324,
        text: "Autumn burned brightly, a running flame through the mountains.",
        book: "My Ántonia",
        author: "Willa Cather",
        year: 1918,
        category: 'seasons',
        story: "The hillsides caught fire—not destructive, but radiant. Autumn was showing off, and no one minded."
    },
    {
        id: 325,
        text: "The calm after the storm is the universe's way of saying it's going to be okay.",
        book: "Storm Wisdom",
        author: "Anonymous",
        year: 2000,
        category: 'weather',
        story: "The chaos had passed. In the stillness afterward, breath returned. The calm was the universe's quiet reassurance."
    },
    {
        id: 326,
        text: "Love is the whole thing. We are only pieces.",
        book: "Selected Poems",
        author: "Rumi",
        year: 1250,
        category: 'emotions',
        story: "She wasn't complete alone—and neither was he. But together, in love, they formed something whole."
    },
    {
        id: 327,
        text: "The woods are lovely, dark and deep, but I have promises to keep.",
        book: "Stopping by Woods on a Snowy Evening",
        author: "Robert Frost",
        year: 1923,
        category: 'nature',
        story: "The forest beckoned, quiet and inviting. But duty called louder. Maya turned back, the woods still lovely in memory."
    },
    {
        id: 328,
        text: "Dawn is the friend of the muses.",
        book: "Wisdom",
        author: "Greek Proverb",
        year: -400,
        category: 'time',
        story: "Ideas came clearest at first light. The muses woke with the sun, and so did Lucia's best writing."
    },
    {
        id: 329,
        text: "The touch of cool water on a summer day is nature's refreshment.",
        book: "Summer Essays",
        author: "E.B. White",
        year: 1941,
        category: 'senses',
        story: "Heat pressed down all day. But stepping into the stream—instant relief. Nature's own air conditioning."
    },
    {
        id: 330,
        text: "If winter comes, can spring be far behind?",
        book: "Ode to the West Wind",
        author: "Percy Bysshe Shelley",
        year: 1820,
        category: 'seasons',
        story: "January felt endless. But Shelley's question reminded Ana—spring was already on its way, just hidden in the cold."
    },
    {
        id: 331,
        text: "The haze of humidity softens the edges of summer days.",
        book: "Weather Essays",
        author: "Peter Matthiessen",
        year: 1987,
        category: 'weather',
        story: "Nothing was sharp in that heat. Edges blurred, time slowed. Summer's haze made everything dreamlike."
    },
    {
        id: 332,
        text: "We are all broken, that's how the light gets in.",
        book: "Anthem",
        author: "Leonard Cohen",
        year: 1992,
        category: 'emotions',
        story: "Her cracks weren't flaws—they were openings. Through the breaks, light finally found its way inside."
    },
    {
        id: 333,
        text: "Let the beauty of what you love be what you do.",
        book: "Selected Poems",
        author: "Rumi",
        year: 1260,
        category: 'emotions',
        story: "Work felt different when it aligned with love. What she adored became what she did—and it no longer felt like work."
    },
    {
        id: 334,
        text: "Moonlight drowns out all but the brightest stars.",
        book: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        year: 1954,
        category: 'time',
        story: "On full moon nights, only a few stars survived. The moon's brilliance reminded Lin that light can eclipse light."
    },
    {
        id: 335,
        text: "The fragrance of flowers spreads only in the direction of the wind. But the goodness of a person spreads in all directions.",
        book: "Tipitaka",
        author: "Chanakya",
        year: -300,
        category: 'senses',
        story: "Her kindness wasn't selective like a flower's scent. It reached everyone, regardless of which way the wind blew."
    },
    {
        id: 336,
        text: "There is a time for many words, and there is also a time for sleep.",
        book: "The Odyssey",
        author: "Homer",
        year: -800,
        category: 'time',
        story: "They'd talked for hours. But now silence invited rest. Words and sleep each had their hour."
    },
    {
        id: 337,
        text: "No winter lasts forever; no spring skips its turn.",
        book: "Proverbs",
        author: "Hal Borland",
        year: 1969,
        category: 'seasons',
        story: "The cold seemed permanent. But seasons are patient—spring was already packed, waiting for its turn at the door."
    },
    {
        id: 338,
        text: "The wind in the grass is the earth singing to itself.",
        book: "Prairie Essays",
        author: "Willa Cather",
        year: 1913,
        category: 'weather',
        story: "Waves rolled through the prairie grass—not water, but wind. The earth was singing its own quiet song."
    },
    {
        id: 339,
        text: "Not how long, but how well you have lived is the main thing.",
        book: "Letters",
        author: "Seneca",
        year: 50,
        category: 'emotions',
        story: "Her grandmother lived only seventy years but filled them completely. Quality, not quantity, was the measure."
    },
    {
        id: 340,
        text: "Climb the mountains and get their good tidings.",
        book: "Our National Parks",
        author: "John Muir",
        year: 1901,
        category: 'nature',
        story: "The mountain had news—peace, perspective, endurance. Kai had to climb to receive the message."
    },
    {
        id: 341,
        text: "The darkest nights produce the brightest stars.",
        book: "Attributed",
        author: "John Green",
        year: 2012,
        category: 'time',
        story: "Her worst year gave birth to her best self. From that darkness, she emerged shining brighter than before."
    },
    {
        id: 342,
        text: "The feel of warm sand between your toes is summer's signature sensation.",
        book: "Beach Essays",
        author: "Anne Morrow Lindbergh",
        year: 1955,
        category: 'senses',
        story: "Warm grains shifted beneath her feet—instantly, she was on vacation. That sensation meant summer had truly arrived."
    },
    {
        id: 343,
        text: "Every season brings its own miracles of change and renewal.",
        book: "Nature Essays",
        author: "Richard Jefferies",
        year: 1883,
        category: 'seasons',
        story: "Spring's buds, summer's bloom, autumn's color, winter's rest—each season performed its own miracle on schedule."
    },
    {
        id: 344,
        text: "The drizzle carried the scent of possibility.",
        book: "Rain Poems",
        author: "Ted Hughes",
        year: 1977,
        category: 'weather',
        story: "Not a storm, just soft rain. But in those drops, Dev smelled the seeds waking, the gardens beginning."
    },
    {
        id: 345,
        text: "Happiness radiates like the fragrance from a flower and draws all good things towards you.",
        book: "Autobiography",
        author: "Maharishi Mahesh Yogi",
        year: 1963,
        category: 'emotions',
        story: "Genuinely happy, Zara attracted people without trying. Her joy was magnetic, fragrant, impossible to ignore."
    },
    {
        id: 346,
        text: "The poetry of the earth is never dead.",
        book: "On the Grasshopper and Cricket",
        author: "John Keats",
        year: 1816,
        category: 'nature',
        story: "Even in winter, crickets sang. The earth never stopped its poetry—you just had to listen closer."
    },
    {
        id: 347,
        text: "Forever is composed of nows.",
        book: "Poems",
        author: "Emily Dickinson",
        year: 1865,
        category: 'time',
        story: "Eternity wasn't some distant future. It was made of this moment, and the next. Now was all that ever existed."
    },
    {
        id: 348,
        text: "Petrichor—the earthy scent after rain—is nature's most perfect perfume.",
        book: "Scent Essays",
        author: "Isabel Bear",
        year: 1964,
        category: 'senses',
        story: "Scientists named it petrichor. Isla just called it the smell of relief, of renewal, of rain's gift to the earth."
    },
    {
        id: 349,
        text: "Autumn carries more gold in its pocket than all the other seasons.",
        book: "Seasonal Essays",
        author: "Jim Bishop",
        year: 1961,
        category: 'seasons',
        story: "Spring had flowers, summer had sun. But autumn's pockets overflowed with gold—leaves like coins scattered everywhere."
    },
    {
        id: 350,
        text: "Clouds come and clouds go, but the sky remains forever.",
        book: "Sky Meditations",
        author: "Osho",
        year: 1985,
        category: 'weather',
        story: "Storms passed, clouds drifted. But the sky—unchanging, patient, eternal—remained through all of it."
    },
    {
        id: 351,
        text: "The greatest wealth is to live content with little.",
        book: "Republic",
        author: "Plato",
        year: -380,
        category: 'emotions',
        story: "She owned little but needed even less. That gap—between having and needing—was where her wealth lived."
    },
    {
        id: 352,
        text: "Nature never goes out of style.",
        book: "Attributed",
        author: "Anonymous",
        year: 1900,
        category: 'nature',
        story: "Trends came and went. But the mountains, the sea, the forest—always beautiful, never out of fashion."
    },
    {
        id: 353,
        text: "Each new day is a blank page in the diary of your life.",
        book: "New Day Essays",
        author: "Douglas Pagels",
        year: 1988,
        category: 'time',
        story: "Yesterday's pages were written. But today's was fresh, waiting for her to fill it with whatever she chose."
    },
    {
        id: 354,
        text: "The symphony of birdsong at dawn is nature's morning orchestra.",
        book: "Bird Essays",
        author: "Terry Tempest Williams",
        year: 1991,
        category: 'senses',
        story: "No alarm needed. The birds began their concert at first light—nature's orchestra, performing for anyone awake to hear."
    },
    {
        id: 355,
        text: "Summer friends will melt away like summer snows, but winter friends are friends forever.",
        book: "Friendship Essays",
        author: "George R.R. Martin",
        year: 1996,
        category: 'seasons',
        story: "Fair-weather friends vanished when times got hard. But those who stayed through winter—they were the real ones."
    },
    {
        id: 356,
        text: "There's no such thing as bad weather, only different kinds of good weather.",
        book: "Attributed",
        author: "John Ruskin",
        year: 1872,
        category: 'weather',
        story: "Rain, snow, sun—each had its gifts. Ruskin taught Janet to stop fighting weather and start receiving it."
    },
    {
        id: 357,
        text: "Act as if what you do makes a difference. It does.",
        book: "Psychology Essays",
        author: "William James",
        year: 1902,
        category: 'emotions',
        story: "Small actions felt pointless. But James's words reminded Suki—every drop fills the bucket. Her actions mattered."
    },
    {
        id: 358,
        text: "We don't inherit the earth from our ancestors, we borrow it from our children.",
        book: "Proverbs",
        author: "Native American Proverb",
        year: 1700,
        category: 'nature',
        story: "He thought of his grandkids. This earth wasn't his gift from the past but his loan to the future."
    },
    {
        id: 359,
        text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
        book: "Peace Writings",
        author: "Thich Nhat Hanh",
        year: 1987,
        category: 'time',
        story: "She'd been racing toward happiness. But slowing down, paying attention—the joy was already here, always had been."
    },
    {
        id: 360,
        text: "Close your eyes and I'll kiss you, tomorrow I'll miss you.",
        book: "All My Loving",
        author: "Paul McCartney",
        year: 1963,
        category: 'emotions',
        story: "Tonight was theirs. Tomorrow would bring separation. But this moment—eyes closed, lips meeting—was everything."
    },
    {
        id: 361,
        text: "Live in the sunshine, swim the sea, drink the wild air.",
        book: "Essays",
        author: "Ralph Waldo Emerson",
        year: 1836,
        category: 'senses',
        story: "She stopped waiting for vacation. Every day offered sun, water, air. Why save living for later?"
    },
    {
        id: 362,
        text: "There are always flowers for those who want to see them.",
        book: "Attributed",
        author: "Henri Matisse",
        year: 1953,
        category: 'nature',
        story: "Even in the city, flowers bloomed in sidewalk cracks. Matisse taught Rosa to find beauty by looking for it."
    },
    {
        id: 363,
        text: "Even the darkest night will end and the sun will rise.",
        book: "Les Misérables",
        author: "Victor Hugo",
        year: 1862,
        category: 'time',
        story: "The night felt endless. But Hugo's promise held true—dawn came, as it always does. Light always returns."
    },
    {
        id: 364,
        text: "March comes in like a lion and goes out like a lamb.",
        book: "Proverbs",
        author: "Thomas Fuller",
        year: 1732,
        category: 'seasons',
        story: "The month roared in with storms, then tiptoed out gently. March was the year's most dramatic transition."
    },
    {
        id: 365,
        text: "After all, tomorrow is another day.",
        book: "Gone with the Wind",
        author: "Margaret Mitchell",
        year: 1936,
        category: 'emotions',
        story: "Today was hard. But tomorrow waited, fresh and unmarked. That simple hope was enough to carry on."
    }
];

// ===================================
// App State
// ===================================

let currentQuoteIndex = 0;
let bookmarks = JSON.parse(localStorage.getItem('quotidian-bookmarks')) || [];
let selectedDayOfYear = null; // null means today, otherwise 1-365

// ===================================
// DOM Elements
// ===================================

const quoteText = document.getElementById('quoteText');
const bookTitle = document.getElementById('bookTitle');
const authorInfo = document.getElementById('authorInfo');
const currentDate = document.getElementById('currentDate');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const shareBtn = document.getElementById('shareBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const navDots = document.getElementById('navDots');
const quoteCard = document.getElementById('quoteCard');
const bookmarksPanel = document.getElementById('bookmarksPanel');
const bookmarksList = document.getElementById('bookmarksList');
const closeBookmarks = document.getElementById('closeBookmarks');
const explorePanel = document.getElementById('explorePanel');
const categoryGrid = document.getElementById('categoryGrid');
const closeExplore = document.getElementById('closeExplore');
const filteredPanel = document.getElementById('filteredPanel');
const filteredList = document.getElementById('filteredList');
const filteredTitle = document.getElementById('filteredTitle');
const closeFiltered = document.getElementById('closeFiltered');
const backToExplore = document.getElementById('backToExplore');
const toast = document.getElementById('toast');
const navTabs = document.querySelectorAll('.nav-tab');
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const dateLabel = document.getElementById('dateLabel');

// AI Chat Elements
const chatPanel = document.getElementById('chatPanel');
const closeChat = document.getElementById('closeChat');
const minimizeChat = document.getElementById('minimizeChat');
// minimizedAiBtn removed - now using aiActiveIndicator in navigation bar instead
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const discussQuoteBtn = document.getElementById('discussQuoteBtn');
const connectionStatus = document.getElementById('connectionStatus');
const typingIndicator = document.getElementById('typingIndicator');

// AI Instance
let aiPartner = null;

// ===================================
// Utility Functions
// ===================================

function formatDate(date) {
    const options = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getDailyQuoteIndex() {
    // Get a consistent quote for each day
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dayOfYear % quotes.length;
}

function getQuoteIndexForDay(dayOfYear) {
    // Get quote index for a specific day (1-365)
    return (dayOfYear - 1) % quotes.length;
}

function getTodayDayOfYear() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today - startOfYear;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDateForDayOfYear(dayOfYear) {
    const year = new Date().getFullYear();
    const date = new Date(year, 0, dayOfYear);
    return date;
}

function updateDateDisplay() {
    const todayDayOfYear = getTodayDayOfYear();

    if (selectedDayOfYear === null || selectedDayOfYear === todayDayOfYear) {
        dateLabel.textContent = 'Today';
        currentDate.textContent = formatDate(new Date());
    } else {
        const selectedDate = getDateForDayOfYear(selectedDayOfYear);
        const diff = selectedDayOfYear - todayDayOfYear;

        if (diff === -1) {
            dateLabel.textContent = 'Yesterday';
        } else if (diff === 1) {
            dateLabel.textContent = 'Tomorrow';
        } else if (diff < 0) {
            dateLabel.textContent = `${Math.abs(diff)} days ago`;
        } else {
            dateLabel.textContent = `In ${diff} days`;
        }
        currentDate.textContent = formatDate(selectedDate);
    }
}

function navigateDay(offset) {
    const todayDayOfYear = getTodayDayOfYear();

    if (selectedDayOfYear === null) {
        selectedDayOfYear = todayDayOfYear;
    }

    selectedDayOfYear += offset;

    // Wrap around for year (1-365)
    if (selectedDayOfYear < 1) {
        selectedDayOfYear = 365;
    } else if (selectedDayOfYear > 365) {
        selectedDayOfYear = 1;
    }

    // Update quote to match the selected day
    currentQuoteIndex = getQuoteIndexForDay(selectedDayOfYear);
    displayQuote(currentQuoteIndex);
    updateDateDisplay();
    createNavDots();
}

function goToToday() {
    selectedDayOfYear = null;
    currentQuoteIndex = getDailyQuoteIndex();
    displayQuote(currentQuoteIndex);
    updateDateDisplay();
    createNavDots();
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ===================================
// Quote Display Functions
// ===================================

function displayQuote(index, animate = true) {
    const quote = quotes[index];

    // Animation is handled by the navigation buttons, just update content
    updateQuoteContent(quote);

    updateNavDots(index);
    updateBookmarkButton(quote.id);

    // Notify AI about quote change (if connected)
    if (aiPartner && aiPartner.isConnected) {
        aiPartner.updateQuoteContext(quote);
    }

    // Update discussion panel quote preview if panel is open
    if (chatPanel && chatPanel.classList.contains('open')) {
        updateDiscussionQuotePreview();
    }
}

function updateQuoteContent(quote) {
    quoteText.textContent = quote.text;
    bookTitle.textContent = quote.book;
    authorInfo.textContent = `${quote.author}, ${quote.year}`;

    // Display story if available
    const storyEl = document.getElementById('quoteStory');
    if (storyEl && quote.story) {
        storyEl.textContent = quote.story;
        storyEl.style.display = 'block';
    } else if (storyEl) {
        storyEl.style.display = 'none';
    }
}

function updateNavDots(activeIndex) {
    const dots = navDots.querySelectorAll('.nav-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
    });
}

function createNavDots() {
    // Show only 5 dots centered around current quote
    navDots.innerHTML = '';
    const visibleDots = 5;
    const start = Math.max(0, currentQuoteIndex - Math.floor(visibleDots / 2));
    const end = Math.min(quotes.length, start + visibleDots);

    for (let i = start; i < end; i++) {
        const dot = document.createElement('span');
        dot.className = 'nav-dot' + (i === currentQuoteIndex ? ' active' : '');
        dot.dataset.index = i;
        dot.addEventListener('click', () => {
            currentQuoteIndex = i;
            displayQuote(currentQuoteIndex);
            createNavDots();
        });
        navDots.appendChild(dot);
    }
}

// ===================================
// Bookmark Functions
// ===================================

function isBookmarked(quoteId) {
    return bookmarks.includes(quoteId);
}

function toggleBookmark(quoteId) {
    if (isBookmarked(quoteId)) {
        bookmarks = bookmarks.filter(id => id !== quoteId);
        showToast('Removed from bookmarks');
    } else {
        bookmarks.push(quoteId);
        showToast('Added to bookmarks');
    }
    localStorage.setItem('quotidian-bookmarks', JSON.stringify(bookmarks));
    updateBookmarkButton(quoteId);
}

function updateBookmarkButton(quoteId) {
    bookmarkBtn.classList.toggle('active', isBookmarked(quoteId));
}

function renderBookmarks() {
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <p>No saved quotes yet</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">Tap the bookmark icon to save your favorite quotes</p>
            </div>
        `;
        return;
    }

    const bookmarkedQuotes = quotes.filter(q => bookmarks.includes(q.id));
    bookmarksList.innerHTML = bookmarkedQuotes.map(quote => `
        <div class="bookmark-item" data-id="${quote.id}">
            <p class="quote-preview">"${quote.text}"</p>
            <p class="source">${quote.book} — ${quote.author}</p>
        </div>
    `).join('');

    // Add click handlers
    bookmarksList.querySelectorAll('.bookmark-item').forEach(item => {
        item.addEventListener('click', () => {
            const quoteId = parseInt(item.dataset.id);
            currentQuoteIndex = quotes.findIndex(q => q.id === quoteId);
            displayQuote(currentQuoteIndex);
            createNavDots();
            closePanel();
            setActiveTab('today');
        });
    });
}

// ===================================
// Share Function
// ===================================

async function shareQuote() {
    const quote = quotes[currentQuoteIndex];
    const shareText = `"${quote.text}"\n\n— ${quote.author}, ${quote.book}\n\n📚 via Quotidian`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Quotidian Quote',
                text: shareText,
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                copyToClipboard(shareText);
            }
        }
    } else {
        copyToClipboard(shareText);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Quote copied to clipboard');
    }).catch(() => {
        showToast('Failed to copy');
    });
}

// ===================================
// Panel Functions
// ===================================

function openPanel(panel) {
    panel.classList.add('open');
}

function closePanel() {
    bookmarksPanel.classList.remove('open');
    explorePanel.classList.remove('open');
    filteredPanel.classList.remove('open');
    if (chatPanel) chatPanel.classList.remove('open');
}

function closeAllExceptFiltered() {
    bookmarksPanel.classList.remove('open');
    explorePanel.classList.remove('open');
}

function setActiveTab(tabName) {
    navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
}

// ===================================
// Explore Functions
// ===================================

function renderExplore() {
    const grid = document.createElement('div');
    grid.className = 'category-grid';

    categories.forEach(cat => {
        const count = quotes.filter(q => q.category === cat.id).length;
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.borderLeftColor = cat.color;
        card.innerHTML = `
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${cat.name}</span>
            <span class="category-count">${count}</span>
        `;
        card.addEventListener('click', () => openCategory(cat));
        grid.appendChild(card);
    });

    categoryGrid.innerHTML = '';

    // Add Special Collections header
    const special = document.createElement('div');
    special.className = 'special-collections';
    special.innerHTML = '<h3>Special Collections</h3>';
    categoryGrid.appendChild(special);
    categoryGrid.appendChild(grid);
}

function openCategory(category) {
    const filtered = quotes.filter(q => q.category === category.id);
    filteredTitle.textContent = category.name;

    if (filtered.length === 0) {
        filteredList.innerHTML = `
            <div class="empty-state">
                <p>No quotes in this category yet</p>
            </div>
        `;
    } else {
        filteredList.innerHTML = filtered.map(quote => `
            <div class="quote-card-mini" data-id="${quote.id}">
                <p class="quote-preview">${quote.text}</p>
                <div class="quote-meta">
                    <span class="source">${quote.book}</span>
                    <span class="author">${quote.author}</span>
                </div>
            </div>
        `).join('');

        // Add click handlers
        filteredList.querySelectorAll('.quote-card-mini').forEach(item => {
            item.addEventListener('click', () => {
                const quoteId = parseInt(item.dataset.id);
                currentQuoteIndex = quotes.findIndex(q => q.id === quoteId);
                displayQuote(currentQuoteIndex);
                createNavDots();
                closePanel();
                setActiveTab('today');
            });
        });
    }

    openPanel(filteredPanel);
}

// ===================================
// Event Listeners
// ===================================

function initEventListeners() {
    // Quote navigation with gentle fade & slide
    const cardInner = document.querySelector('.card-inner');

    prevBtn.addEventListener('click', () => {
        // Add page turn animation
        cardInner.classList.add('page-turn-prev');

        // Update content at the midpoint (50% = 350ms)
        setTimeout(() => {
            currentQuoteIndex = (currentQuoteIndex - 1 + quotes.length) % quotes.length;
            displayQuote(currentQuoteIndex);
            createNavDots();
        }, 350);

        // Remove animation class after completion (0.7s = 700ms)
        setTimeout(() => {
            cardInner.classList.remove('page-turn-prev');
        }, 700);
    });

    nextBtn.addEventListener('click', () => {
        // Add page turn animation
        cardInner.classList.add('page-turn-next');

        // Update content at the midpoint (50% = 350ms)
        setTimeout(() => {
            currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            displayQuote(currentQuoteIndex);
            createNavDots();
        }, 350);

        // Remove animation class after completion (0.7s = 700ms)
        setTimeout(() => {
            cardInner.classList.remove('page-turn-next');
        }, 700);
    });

    // Bookmark
    bookmarkBtn.addEventListener('click', () => {
        toggleBookmark(quotes[currentQuoteIndex].id);
    });

    // Share
    shareBtn.addEventListener('click', shareQuote);

    // Close bookmarks panel
    closeBookmarks.addEventListener('click', closePanel);

    // Close explore panel
    closeExplore.addEventListener('click', closePanel);

    // Close filtered panel
    closeFiltered.addEventListener('click', closePanel);

    // Back to explore from filtered
    backToExplore.addEventListener('click', () => {
        filteredPanel.classList.remove('open');
    });

    // Navigation tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            setActiveTab(tabName);

            if (tabName === 'bookmarks') {
                renderBookmarks();
                openPanel(bookmarksPanel);
            } else if (tabName === 'today') {
                closePanel();
                goToToday();
            } else if (tabName === 'explore') {
                renderExplore();
                openPanel(explorePanel);
            } else if (tabName === 'ai-partner') {
                openChatPanel();
            }
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        } else if (e.key === 'b') {
            bookmarkBtn.click();
        } else if (e.key === 's') {
            shareBtn.click();
        } else if (e.key === 'Escape') {
            closePanel();
        }
    });

    // Touch swipe for quote navigation
    let touchStartX = 0;
    let touchEndX = 0;

    quoteCard.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    quoteCard.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next quote
                nextBtn.click();
            } else {
                // Swipe right - previous quote
                prevBtn.click();
            }
        }
    }
}

// ===================================
// Initialize App
// ===================================

function init() {
    // Set current date
    currentDate.textContent = formatDate(new Date());

    // Get daily quote (or first quote for testing)
    currentQuoteIndex = getDailyQuoteIndex();

    // Display initial quote
    displayQuote(currentQuoteIndex, false);

    // Create navigation dots
    createNavDots();

    // Initialize event listeners
    initEventListeners();

    // Add day navigation listeners
    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', () => navigateDay(-1));
    }
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', () => navigateDay(1));
    }

    console.log('📖 Quotidian: Daily Literature initialized');
    console.log(`📚 Today's quote: #${currentQuoteIndex + 1} of ${quotes.length}`);

    // Initialize AI Chat
    initAIChat();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Register Service Worker for PWA/Offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('📱 Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// ===================================
// AI Voice Chat Functions
// ===================================

// Voice UI Elements
const micBtn = document.getElementById('micBtn');
const micLabel = document.getElementById('micLabel');
const voiceVisualizer = document.getElementById('voiceVisualizer');
const voiceWelcome = document.getElementById('voiceWelcome');
const visualizerBars = document.getElementById('visualizerBars');

function initAIChat() {
    if (!window.QuotidianAI) {
        console.warn('QuotidianAI not loaded');
        return;
    }

    aiPartner = new window.QuotidianAI();

    // Register callbacks
    aiPartner.onMessage((message) => {
        addMessageToChat(message);
        scrollChatToBottom();
    });

    aiPartner.onStatus((status) => {
        updateConnectionStatus(status);
        updateVoiceUI(status);
    });

    aiPartner.onError((error) => {
        showChatError(error);
    });

    aiPartner.onVolume((volume) => {
        updateVisualizer(volume);
    });

    // Microphone button handler
    if (micBtn) {
        micBtn.addEventListener('click', toggleVoiceConnection);
    }

    // Close chat handler - also disconnects voice
    if (closeChat) {
        closeChat.addEventListener('click', () => {
            if (aiPartner && aiPartner.isConnected) {
                aiPartner.disconnect();
            }
            // Also hide the AI active indicator when closing
            const aiIndicator = document.getElementById('aiActiveIndicator');
            if (aiIndicator) {
                aiIndicator.classList.remove('active');
            }
            closePanel();
            setActiveTab('today');
        });
    }

    // Minimize chat handler - hides panel but keeps connection
    if (minimizeChat) {
        minimizeChat.addEventListener('click', () => {
            closePanel();
            setActiveTab('today');
            // Show active indicator on Discuss tab if connected
            const aiIndicator = document.getElementById('aiActiveIndicator');
            if (aiPartner && aiPartner.isConnected && aiIndicator) {
                aiIndicator.classList.add('active');
            }
        });
    }

    // Note: Clicking the "Discuss" tab in the navigation directly opens the chat panel
    // and the openChatPanel() function handles hiding the AI active indicator

    console.log('🎙️ Voice AI Chat initialized');
}

async function toggleVoiceConnection() {
    if (!aiPartner) return;

    if (aiPartner.isConnected || aiPartner.isConnecting) {
        // Disconnect
        aiPartner.disconnect();
    } else {
        // Connect with current quote context
        const quote = quotes[currentQuoteIndex];
        await aiPartner.connect(quote);
    }
}

function updateVoiceUI(status) {
    if (!micBtn || !micLabel || !voiceVisualizer || !voiceWelcome) return;

    // Update microphone button
    micBtn.classList.remove('active', 'connecting');

    const labelMessages = {
        'disconnected': 'Tap to start',
        'connecting': 'Connecting...',
        'connected': 'Tap to end',
        'error': 'Tap to retry'
    };

    micLabel.textContent = labelMessages[status] || 'Tap to start';

    if (status === 'connecting') {
        micBtn.classList.add('connecting');
        voiceWelcome.style.display = 'none';
        voiceVisualizer.classList.add('active');
    } else if (status === 'connected') {
        micBtn.classList.add('active');
        voiceWelcome.style.display = 'none';
        voiceVisualizer.classList.add('active');
    } else {
        micBtn.classList.remove('active', 'connecting');
        voiceWelcome.style.display = 'block';
        voiceVisualizer.classList.remove('active');
        // Hide the active indicator when disconnected
        const aiIndicator = document.getElementById('aiActiveIndicator');
        if (aiIndicator) {
            aiIndicator.classList.remove('active');
        }
    }
}

function updateVisualizer(volume) {
    if (!visualizerBars) return;

    const bars = visualizerBars.querySelectorAll('.bar');
    const avgVolume = Math.max(volume.input, volume.output);

    bars.forEach((bar, index) => {
        // Create a wave effect across bars
        const offset = Math.abs(index - 3) * 0.1;
        const height = 20 + (avgVolume * 100 * (1 - offset));
        bar.style.height = `${Math.min(60, Math.max(10, height))}px`;
        bar.style.animationPlayState = avgVolume > 0.01 ? 'running' : 'paused';
    });
}

function openChatPanel() {
    if (chatPanel) {
        // Hide the active indicator since panel is now open
        const aiIndicator = document.getElementById('aiActiveIndicator');
        if (aiIndicator) {
            aiIndicator.classList.remove('active');
        }
        // Populate the quote preview with current quote
        updateDiscussionQuotePreview();
        openPanel(chatPanel);
    }
}

function updateDiscussionQuotePreview() {
    const quote = quotes[currentQuoteIndex];
    const previewQuoteText = document.getElementById('previewQuoteText');
    const previewBookTitle = document.getElementById('previewBookTitle');
    const previewAuthorInfo = document.getElementById('previewAuthorInfo');

    if (previewQuoteText && quote) {
        previewQuoteText.textContent = `"${quote.text}"`;
    }
    if (previewBookTitle && quote) {
        previewBookTitle.textContent = quote.book;
    }
    if (previewAuthorInfo && quote) {
        previewAuthorInfo.textContent = `${quote.author}, ${quote.year}`;
    }
}

function updateConnectionStatus(status) {
    if (!connectionStatus) return;

    connectionStatus.className = 'connection-status ' + status;
    const statusText = connectionStatus.querySelector('.status-text');

    const statusMessages = {
        'disconnected': 'Disconnected',
        'connecting': 'Connecting...',
        'connected': 'Listening',
        'error': 'Error'
    };

    if (statusText) {
        statusText.textContent = statusMessages[status] || status;
    }
}

function addMessageToChat(message) {
    if (!chatMessages) return;

    // Remove transcript header if it exists and add first message
    const header = chatMessages.querySelector('.transcript-header');

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${message.role === 'user' ? 'user' : 'ai'}`;
    messageEl.textContent = message.text;

    chatMessages.appendChild(messageEl);
}

function scrollChatToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function showChatError(error) {
    if (!chatMessages) return;

    const errorEl = document.createElement('div');
    errorEl.className = 'chat-error';
    errorEl.innerHTML = `
        <p>${error}</p>
        <button onclick="retryConnection()">Try Again</button>
    `;

    chatMessages.appendChild(errorEl);
    scrollChatToBottom();
}

function retryConnection() {
    if (!aiPartner) return;

    // Remove error messages
    const errors = chatMessages.querySelectorAll('.chat-error');
    errors.forEach(el => el.remove());

    // Try to reconnect
    const quote = quotes[currentQuoteIndex];
    aiPartner.connect(quote);
}

