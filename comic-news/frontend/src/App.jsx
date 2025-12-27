import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Library from './pages/Library';
import Bookmarks from './pages/Bookmarks';
import ComicDetail from './pages/ComicDetail';
import Reader from './pages/Reader';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-300">
        <Navbar />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/comic/:id" element={<ComicDetail />} />
            <Route path="/read/:id" element={<Reader />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
