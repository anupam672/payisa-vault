import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { accountApi } from "../api/client"
import { Panel, Button, Banner, StatusPill, Amount } from "../components/ui"
import "./Accounts.css"

export default function Accounts() {
  const { token } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [bonusNotice, setBonusNotice] = useState("")

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await accountApi.list(token)
      setAccounts(data.accounts || [])

      const balanceEntries = await Promise.all(
        (data.accounts || []).map(async (acc) => {
          try {
            const b = await accountApi.balance(acc._id, token)
            return [acc._id, b.balance]
          } catch {
            return [acc._id, null]
          }
        })
      )
      setBalances(Object.fromEntries(balanceEntries))
    } catch (err) {
      setError(err.message || "Could not load accounts")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  async function handleCreate() {
    setCreating(true)
    setError("")
    setBonusNotice("")
    try {
      const result = await accountApi.create(token)
      if (result.signupBonus) {
        setBonusNotice(`New account credited ₹${result.signupBonus.amount}.00 welcome bonus.`)
      }
      await loadAccounts()
    } catch (err) {
      setError(err.message || "Could not create account")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Your accounts</span>
          <h1 className="page-title">Accounts</h1>
        </div>
        {accounts.length < 2 && (
  <Button variant="gold" onClick={handleCreate} disabled={creating}>
    {creating ? "Opening…" : "+ New account"}
  </Button>
)}
      </div>

      <Banner tone="error">{error}</Banner>
      <Banner tone="success">{bonusNotice}</Banner>

      {loading ? (
        <p className="page-empty-note">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <Panel className="empty-panel">
          <p className="empty-title">No accounts yet</p>
          <p className="empty-desc">
            Open your first account to receive a ₹1,000 welcome credit and start
            sending funds.
          </p>
          <Button variant="gold" onClick={handleCreate} disabled={creating}>
            {creating ? "Opening…" : "Open an account"}
          </Button>
        </Panel>
      ) : (
        <div className="account-grid">
          {accounts.map((acc) => (
            <Panel key={acc._id} className="account-card">
              <div className="account-card-top">
                <StatusPill status={acc.status} />
                <span className="account-card-currency mono">{acc.currency}</span>
              </div>

              <div className="account-card-balance">
                {balances[acc._id] != null ? (
                  <Amount value={balances[acc._id]} currency={acc.currency} />
                ) : (
                  <span className="mono account-card-balance-loading">—</span>
                )}
              </div>

              <div className="account-card-id">
                <span className="account-card-id-label">Account ID</span>
                <span className="mono account-card-id-value">{acc._id}</span>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {accounts.length > 0 && (
        <div className="page-cta-row">
          <Link to="/send">
            <Button variant="primary">Send money →</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
