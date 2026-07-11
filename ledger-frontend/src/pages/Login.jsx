import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Field, Input, Button, Banner } from "../components/ui"
import "./Auth.css"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate("/accounts")
    } catch (err) {
      setError(err.message || "Could not sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-showcase">
        <div className="auth-showcase-brand">
          <span className="auth-showcase-mark">§</span>
          <span className="auth-showcase-name">Payisa Vault</span>
        </div>

        <div className="auth-showcase-body">
          <span className="auth-showcase-eyebrow">Double-entry, always</span>
          <h1 className="auth-showcase-title">
            Every rupee is <em>accounted</em> for.
          </h1>
          <p className="auth-showcase-desc">
            Balances aren't stored — they're derived from an immutable trail of
            credits and debits. Nothing is ever overwritten, only appended.
          </p>
        </div>

        <div className="auth-ledger-strip">
          <div className="auth-ledger-row">
            <span className="auth-ledger-row-label">Opening balance</span>
            <span className="mono">₹0.00</span>
          </div>
          <div className="auth-ledger-row">
            <span className="auth-ledger-row-label">Signup credit</span>
            <span className="mono" style={{ color: "var(--credit)" }}>+ ₹1,000.00</span>
          </div>
          <div className="auth-ledger-row">
            <span className="auth-ledger-row-label">Running balance</span>
            <span className="mono">₹1,000.00</span>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card">
          <h2 className="auth-form-title">Sign in</h2>
          <p className="auth-form-sub">
            New here? <Link to="/register">Create an account</Link>
          </p>

          <Banner tone="error">{error}</Banner>

          <form onSubmit={handleSubmit}>
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Password">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>

            <Button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
