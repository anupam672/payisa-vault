import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Shell from "./components/Shell"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Accounts from "./pages/Accounts"
import Send from "./pages/Send"
import TransactionComplete from "./pages/TransactionComplete"
import History from "./pages/History"
import TransactionDetail from "./pages/TransactionDetail"

function RootRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? "/accounts" : "/login"} replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <Shell>
                  <Accounts />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/send"
            element={
              <ProtectedRoute>
                <Shell>
                  <Send />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transaction-complete"
            element={
              <ProtectedRoute>
                <Shell>
                  <TransactionComplete />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <Shell>
                  <History />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions/:id"
            element={
              <ProtectedRoute>
                <Shell>
                  <TransactionDetail />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App