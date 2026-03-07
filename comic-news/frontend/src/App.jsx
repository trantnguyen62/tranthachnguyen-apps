import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

const Home = lazy(() => import('./pages/Home'));
const Library = lazy(() => import('./pages/Library'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const ComicDetail = lazy(() => import('./pages/ComicDetail'));
const Reader = lazy(() => import('./pages/Reader'));

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-300">
        <Navbar />
        <main className="pt-16">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
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
