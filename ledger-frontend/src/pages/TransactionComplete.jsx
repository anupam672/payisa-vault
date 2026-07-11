import { useLocation, useNavigate, Link } from "react-router-dom"
import { Panel, Button, StatusPill, Amount } from "../components/ui"
import "./TransactionComplete.css"

export default function TransactionComplete() {
  const location = useLocation()
  const navigate = useNavigate()
  const transaction = location.state?.transaction

  if (!transaction) {
    return (
      <div className="page-container">
        <Panel className="tc-empty-panel">
          <p className="empty-desc">No recent transaction to show.</p>
          <Link to="/accounts">
            <Button variant="primary">Back to accounts</Button>
          </Link>
        </Panel>
      </div>
    )
  }

  const timestamp = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—"

  return (
    <div className="page-container tc-container">
      <div className="tc-check">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="25" stroke="var(--credit)" strokeWidth="2" />
          <path
            d="M15 27L22 34L37 18"
            stroke="var(--credit)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="tc-check-path"
          />
        </svg>
      </div>

      <h1 className="tc-title">Transfer complete</h1>
      <p className="tc-sub">The funds have been recorded to the ledger.</p>

      <Panel className="tc-panel">
        <div className="tc-amount-row">
          <Amount value={transaction.amount} sign="debit" />
        </div>

        <div className="tc-rows">
          <div className="tc-row">
            <span className="tc-row-label">Status</span>
            <StatusPill status={transaction.status} />
          </div>
          <div className="tc-row">
            <span className="tc-row-label">Transaction ID</span>
            <span className="mono tc-row-value">{transaction._id}</span>
          </div>
          <div className="tc-row">
            <span className="tc-row-label">From account</span>
            <span className="mono tc-row-value">{transaction.fromAccount}</span>
          </div>
          <div className="tc-row">
            <span className="tc-row-label">To account</span>
            <span className="mono tc-row-value">{transaction.toAccount}</span>
          </div>
          <div className="tc-row">
            <span className="tc-row-label">Timestamp</span>
            <span className="mono tc-row-value">{timestamp}</span>
          </div>
        </div>
      </Panel>

      <div className="tc-actions">
        <Button variant="ghost" onClick={() => navigate("/send")}>
          Send another
        </Button>
        <Button variant="primary" onClick={() => navigate("/accounts")}>
          Back to accounts
        </Button>
      </div>
    </div>
  )
}
