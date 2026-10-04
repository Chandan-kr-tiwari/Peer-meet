import { BrowserRouter,Route,Routes } from "react-router-dom";

import Lobby from "./pages/lobby";
import Meeting from "./pages/meeting";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Meeting />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
