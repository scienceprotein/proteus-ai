import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Arena from './pages/Arena';
import Science from './pages/Science';
import Token from './pages/Token';
import Generator from './pages/Generator';
import Lab from './pages/Lab';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/science" element={<Science />} />
          <Route path="/token" element={<Token />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
