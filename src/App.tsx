import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Find from './pages/Find';
import Library from './pages/Library';
import GameForm from './pages/GameForm';
import GameDetail from './pages/GameDetail';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<Find />} />
        <Route path="/library" element={<Library />} />
        <Route path="/games/new" element={<GameForm mode="create" />} />
        <Route path="/games/:id/edit" element={<GameForm mode="edit" />} />
        <Route path="/games/:id" element={<GameDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
