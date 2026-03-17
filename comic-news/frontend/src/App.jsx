import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

function FocusReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

const Home = lazy(() => import('./pages/Home'));
const Library = lazy(() => import('./pages/Library'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const ComicDetail = lazy(() => import('./pages/ComicDetail'));
const Reader = lazy(() => import('./pages/Reader'));

function App() {
  return (
    <Router>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="min-h-screen bg-dark-300">
        <Navbar />
        <main id="main-content" tabIndex="-1" className="pt-16 outline-none">
          <FocusReset />
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading page">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/comic/:id" element={<ComicDetail />} />
              <Route path="/read/:id" element={<Reader />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
