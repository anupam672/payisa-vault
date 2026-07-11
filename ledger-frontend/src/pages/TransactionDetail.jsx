import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { transactionApi } from "../api/client"
import { Panel, Button, StatusPill, Amount, Banner } from "../components/ui"
import "./TransactionDetail.css"

export default function TransactionDetail() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await transactionApi.getById(id, token)
        if (!cancelled) setTransaction(data.transaction)
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load this transaction")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, token])

  return (
    <div className="page-container td-container">
      <button className="td-back" onClick={() => navigate("/history")}>
        ← Back to history
      </button>

      <Banner tone="error">{error}</Banner>

      {loading ? (
        <p className="page-empty-note">Loading transaction…</p>
      ) : !transaction ? (
        <Panel className="empty-panel">
          <p className="empty-desc">This transaction couldn't be found.</p>
          <Link to="/history">
            <Button variant="primary">Back to history</Button>
          </Link>
        </Panel>
      ) : (
        <Panel className="td-panel">
          <div className="td-head">
            <span className="page-eyebrow">Transaction</span>
            <div className="td-amount">
              <Amount value={transaction.amount} sign={transaction.type === "SENT" ? "debit" : "credit"} />
            </div>
            <StatusPill status={transaction.status} />
          </div>

          <div className="td-rows">
            <div className="td-row">
              <span className="td-row-label">Transaction ID</span>
              <span className="mono td-row-value">{transaction._id}</span>
            </div>
            <div className="td-row">
              <span className="td-row-label">Sender</span>
              <span className="td-row-value">{transaction.senderName}</span>
            </div>
            <div className="td-row">
              <span className="td-row-label">Receiver</span>
              <span className="td-row-value">{transaction.receiverName}</span>
            </div>
            <div className="td-row">
              <span className="td-row-label">From account</span>
              <span className="mono td-row-value">{transaction.fromAccount}</span>
            </div>
            <div className="td-row">
              <span className="td-row-label">To account</span>
              <span className="mono td-row-value">{transaction.toAccount}</span>
            </div>
            {transaction.reason && (
              <div className="td-row">
                <span className="td-row-label">Reason</span>
                <span className="td-row-value">{transaction.reason.replaceAll("_", " ")}</span>
              </div>
            )}
            {transaction.note && (
              <div className="td-row">
                <span className="td-row-label">Note</span>
                <span className="td-row-value">{transaction.note}</span>
              </div>
            )}
            <div className="td-row">
              <span className="td-row-label">Timestamp</span>
              <span className="mono td-row-value">
                {new Date(transaction.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}