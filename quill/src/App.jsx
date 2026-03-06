import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Article from './pages/Article';
import Write from './pages/Write';
import Apps from './pages/Apps';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/write" element={<Write />} />
        <Route path="/apps" element={<Apps />} />
        <Route path="/:slug" element={<Article />} />
      </Routes>
    </BrowserRouter>
  );
}
