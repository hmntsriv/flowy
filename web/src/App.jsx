import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Notes from "./pages/notes";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <div className="flowy-app">

        <div className="flowy-background">
          <div className="flowy-orb flowy-orb-one" />
          <div className="flowy-orb flowy-orb-two" />
          <div className="flowy-orb flowy-orb-three" />
        </div>

        <Routes>
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;