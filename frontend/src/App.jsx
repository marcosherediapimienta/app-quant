import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import Macro from './pages/Macro/Macro';
import Portfolio from './pages/Portfolio/Portfolio';
import Risk from './pages/Risk/Risk';
import CAPM from './pages/CAPM/CAPM';
import Valuation from './pages/Valuation/Valuation';
import ChatPage from './pages/Chat/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="macro" element={<Macro />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="risk" element={<Risk />} />
          <Route path="capm" element={<CAPM />} />
          <Route path="valuation" element={<Valuation />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
