import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { accountApi, transactionApi, genIdempotencyKey } from "../api/client"
import { Panel, Field, Input, Button, Banner, Amount } from "../components/ui"
import "./Send.css"

export default function Send() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [accounts, setAccounts] = useState([])
  const [fromAccount, setFromAccount] = useState("")
  const [toAccount, setToAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await accountApi.list(token)
        setAccounts(data.accounts || [])
        if (data.accounts?.length) setFromAccount(data.accounts[0]._id)
      } catch (err) {
        setError(err.message || "Could not load accounts")
      } finally {
        setLoadingAccounts(false)
      }
    }
    load()
  }, [token])

  useEffect(() => {
    async function loadBalance() {
      if (!fromAccount) return
      try {
        const b = await accountApi.balance(fromAccount, token)
        setBalance(b.balance)
      } catch {
        setBalance(null)
      }
    }
    loadBalance()
  }, [fromAccount, token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!fromAccount || !toAccount || !amount) {
      setError("Fill in all fields to continue")
      return
    }

    if (fromAccount === toAccount) {
      setError("From and to accounts must be different")
      return
    }

    const numericAmount = Number(amount)
    if (!(numericAmount > 0)) {
      setError("Enter an amount greater than zero")
      return
    }

    setSubmitting(true)
    try {
      const result = await transactionApi.create(
        {
          fromAccount,
          toAccount,
          amount: numericAmount,
          idempotencyKey: genIdempotencyKey(),
        },
        token
      )

      navigate("/transaction-complete", { state: { transaction: result.transaction } })
    } catch (err) {
      setError(err.message || "Transfer failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container send-container">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Move funds</span>
          <h1 className="page-title">Send</h1>
        </div>
      </div>

      <Panel className="send-panel">
        <Banner tone="error">{error}</Banner>

        {loadingAccounts ? (
          <p className="page-empty-note">Loading accounts…</p>
        ) : accounts.length < 2 ? (
          <p className="page-empty-note">
            You need at least two accounts (yours or someone else's) to send funds.
            Open another account first, or ask the recipient for their account ID.
          </p>
        ) : null}

        <form onSubmit={handleSubmit}>
          <Field label="From account">
            <select
              className="input"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              required
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc._id} ({acc.currency})
                </option>
              ))}
            </select>
          </Field>

          {balance != null && (
            <div className="send-balance-note">
              Available balance: <Amount value={balance} />
            </div>
          )}

          <Field label="To account (recipient's account ID)">
            <Input
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              placeholder="Paste account ID"
              required
            />
          </Field>

          <Field label="Amount (INR)">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </Field>

          <Button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send funds"}
          </Button>
        </form>
      </Panel>
    </div>
  )
}
