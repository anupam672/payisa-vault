import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./Shell.css"

export default function Shell({ children }) {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  const navItems = [
    { to: "/accounts", label: "Accounts" },
    { to: "/send", label: "Send" },
    { to: "/history", label: "History" },
  ]

  return (
    <div className="shell">
      <header className="shell-header">
        <Link to="/accounts" className="shell-brand">
          <span className="shell-brand-mark">§</span>
          <span className="shell-brand-name">Payisa Vault</span>
        </Link>

        {isAuthenticated && (
          <nav className="shell-nav">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.to ||
                (item.to === "/history" && location.pathname.startsWith("/transactions/"))
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`shell-nav-link${isActive ? " is-active" : ""}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}

        {isAuthenticated && (
          <div className="shell-user">
            <span className="shell-user-name">{user?.name}</span>
            <button className="shell-logout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        )}
      </header>

      <main className="shell-main">{children}</main>
    </div>
  )
}