import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Field, Input, Button, Banner } from "../components/ui"
import "./Auth.css"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(name, email, password)
      navigate("/accounts")
    } catch (err) {
      setError(err.message || "Could not create account")
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
          <span className="auth-showcase-eyebrow">Welcome credit</span>
          <h1 className="auth-showcase-title">
            Start with <em>₹1,000</em>, on us.
          </h1>
          <p className="auth-showcase-desc">
            Every new account opens with a signup credit so you can send and
            receive right away — no card required.
          </p>
        </div>

        <div className="auth-ledger-strip">
          <div className="auth-ledger-row">
            <span className="auth-ledger-row-label">Account status</span>
            <span className="mono">ACTIVE</span>
          </div>
          <div className="auth-ledger-row">
            <span className="auth-ledger-row-label">Currency</span>
            <span className="mono">INR</span>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card">
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-sub">
            Already have one? <Link to="/login">Sign in</Link>
          </p>

          <Banner tone="error">{error}</Banner>

          <form onSubmit={handleSubmit}>
            <Field label="Full name">
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </Field>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </Field>

            <Button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
