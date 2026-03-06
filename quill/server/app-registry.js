export const APP_REGISTRY = [
  { id: 'linguaflow', name: 'LinguaFlow', tagline: 'Master any language with AI-powered conversations', description: 'An AI language learning app with real-time voice conversation practice.', url: 'https://linguaflow.tranthachnguyen.com', category: 'ai', tags: ['ai', 'language-learning', 'education', 'nlp'], color: '#4F46E5' },
  { id: 'nanoedit-ai', name: 'NanoEdit AI', tagline: 'Professional photo editing powered by AI', description: 'AI photo editor for quick professional edits.', url: 'https://photoedit.tranthachnguyen.com', category: 'ai', tags: ['ai', 'photo-editing', 'image-processing', 'design'], color: '#7C3AED' },
  { id: 'passport-photo-ai', name: 'Passport Photo AI', tagline: 'Perfect passport photos in seconds', description: 'AI-powered passport and ID photo generator.', url: 'https://passportphoto.tranthachnguyen.com', category: 'ai', tags: ['ai', 'photo', 'passport', 'utility'], color: '#2563EB' },
  { id: 'illinois-driver-study', name: 'Illinois Driver Study', tagline: 'Ace your Illinois driving test', description: 'Interactive study guide for the Illinois driving exam.', url: 'https://illinoisdriverstudy.tranthachnguyen.com', category: 'education', tags: ['education', 'driving', 'illinois', 'study', 'practice-test'], color: '#059669' },
  { id: 'devops-study', name: 'DevOps Study', tagline: 'Master DevOps concepts and certifications', description: 'Flashcards and quizzes for DevOps certifications.', url: 'https://devopsstudy.tranthachnguyen.com', category: 'education', tags: ['education', 'devops', 'cloud', 'certification', 'kubernetes', 'docker'], color: '#0891B2' },
  { id: 'teachvault', name: 'TeachVault', tagline: 'Educational content marketplace', description: 'Marketplace for educational resources and teaching materials.', url: 'https://teachvault.tranthachnguyen.com', category: 'education', tags: ['education', 'marketplace', 'teaching', 'courses'], color: '#D97706' },
  { id: 'devops-defender', name: 'DevOps Defender', tagline: 'Defend your infrastructure in this space shooter', description: 'A space shooter game where you learn DevOps by defeating enemies.', url: 'https://devopsgame.tranthachnguyen.com', category: 'games', tags: ['games', 'devops', 'space-shooter', 'fun'], color: '#DC2626' },
  { id: 'pipeline-runner', name: 'Pipeline Runner', tagline: 'Run through CI/CD pipelines', description: 'An endless runner game themed around CI/CD pipelines.', url: 'https://pipelinerunner.tranthachnguyen.com', category: 'games', tags: ['games', 'devops', 'runner', 'arcade'], color: '#EA580C' },
  { id: 'comic-news', name: 'Comic News', tagline: 'Your daily dose of comics', description: 'Comic reader with bookmark and progress tracking.', url: 'https://comicnews.tranthachnguyen.com', category: 'content', tags: ['content', 'comics', 'entertainment', 'reading'], color: '#F59E0B' },
  { id: 'daily-quote', name: 'Daily Quote', tagline: 'Inspiring quotes every day', description: 'Curated inspiring quotes delivered daily.', url: 'https://dailyquote.tranthachnguyen.com', category: 'content', tags: ['content', 'quotes', 'inspiration', 'motivation'], color: '#8B5CF6' },
  { id: 'cloudify', name: 'Cloudify', tagline: 'Deploy web apps instantly', description: 'A full deployment platform — deploy from GitHub in seconds.', url: 'https://cloudify.tranthachnguyen.com', category: 'platform', tags: ['platform', 'deployment', 'devops', 'hosting', 'cloud', 'docker', 'kubernetes'], color: '#3B82F6' },
  { id: 'cloudify-docs', name: 'Cloudify Docs', tagline: 'Cloudify documentation and guides', description: 'Official documentation for the Cloudify platform.', url: 'https://docs.tranthachnguyen.com', category: 'platform', tags: ['platform', 'documentation', 'devops', 'guides'], color: '#3B82F6' },
  { id: 'pawconnect', name: 'PawConnect', tagline: 'Connect with local pet services', description: 'Marketplace connecting pet owners with local services.', url: 'https://pawconnect.tranthachnguyen.com', category: 'marketplace', tags: ['marketplace', 'pets', 'local', 'services'], color: '#F97316' },
  { id: 'pixelvault', name: 'PixelVault', tagline: 'Digital asset marketplace', description: 'Buy and sell digital art and creative assets.', url: 'https://pixelvault.tranthachnguyen.com', category: 'marketplace', tags: ['marketplace', 'digital-art', 'assets', 'design'], color: '#EC4899' },
  { id: 'neighborhands', name: 'NeighborHands', tagline: 'Local community help exchange', description: 'Connect with neighbors to exchange help and services.', url: 'https://neighborhands.tranthachnguyen.com', category: 'marketplace', tags: ['marketplace', 'community', 'local', 'services'], color: '#10B981' },
  { id: 'retrovault', name: 'RetroVault', tagline: 'Retro gaming marketplace', description: 'Buy, sell, and trade retro games and collectibles.', url: 'https://retrovault.tranthachnguyen.com', category: 'marketplace', tags: ['marketplace', 'retro', 'gaming', 'collectibles'], color: '#6366F1' },
  { id: 'talentforge', name: 'TalentForge', tagline: 'Freelance talent marketplace', description: 'Find and hire freelance talent for any project.', url: 'https://talentforge.tranthachnguyen.com', category: 'marketplace', tags: ['marketplace', 'freelance', 'hiring', 'talent'], color: '#0EA5E9' },
  { id: 'greenleaf', name: 'GreenLeaf', tagline: 'Sustainable products marketplace', description: 'Marketplace for eco-friendly and sustainable products.', url: 'https://greenleaf.tranthachnguyen.com', category: 'marketplace', tags: ['marketplace', 'sustainability', 'eco-friendly', 'green'], color: '#22C55E' },
  { id: 'modforge', name: 'ModForge', tagline: 'Game mod marketplace', description: 'Discover, share, and download game mods.', url: 'https://modforge.tranthachnguyen.com', category: 'marketplace', tags: ['marketplace', 'gaming', 'mods', 'modding'], color: '#A855F7' }
];

export const APP_CATEGORIES = {
  ai: { name: 'AI Tools', description: 'Artificial Intelligence powered applications' },
  education: { name: 'Education', description: 'Learning and study tools' },
  games: { name: 'Games', description: 'Fun games with a tech twist' },
  content: { name: 'Content', description: 'Content discovery and creation' },
  platform: { name: 'Platform', description: 'Developer tools and platforms' },
  marketplace: { name: 'Marketplaces', description: 'Buy, sell, and connect' }
};

export function getRelatedApps(articleTags, limit = 3) {
  if (!articleTags || articleTags.length === 0) return APP_REGISTRY.slice(0, limit);

  const scored = APP_REGISTRY.map(app => {
    const overlap = app.tags.filter(t =>
      articleTags.some(at => at.toLowerCase().includes(t) || t.includes(at.toLowerCase()))
    ).length;
    return { app, score: overlap };
  });

  scored.sort((a, b) => b.score - a.score);
  if (scored.length === 0 || scored[0].score === 0) {
    const shuffled = [...APP_REGISTRY].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }
  return scored.slice(0, limit).map(s => s.app);
}
