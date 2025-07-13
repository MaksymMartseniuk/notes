import react from "react";
import UserContextProvider from "./contexts/UserContexts/UserContextsProvider.jsx";
import useAutoTokenRefresh from "./hooks/useAutoTokenRefresh.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/Notfound";
import ResetPassword from "./pages/ResetPassword";
import PasswordResetCondirm from "./pages/PasswordResetConfirm";
import ProtectedRoute from "./components/ProtectedRoute";
import EmailVerification from "./pages/EmailVerification";
import CheckEmail from "./pages/CheckEmail";
import Base from "./components/Base.jsx";
import Notes from "./pages/Notes";
import NotesCreate from "./pages/NotesCreate";


function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}
export default function App() {
  useAutoTokenRefresh();
  return (
    <UserContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/reset-password/:uid/:token"
            element={<PasswordResetCondirm />}
          />
          <Route
            path="/activate/:uid/:token"
            element={<EmailVerification />}
          ></Route>
          <Route path="/check-email" element={<CheckEmail />} />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <Base />
              </ProtectedRoute>
            }
          >
            <Route index element={<Notes />} />
            <Route path=":uuid" element={<NotesCreate />} />
            <Route path=":uuid/versions/:versionId" element={<NotesCreate  />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </UserContextProvider>
  );
}
