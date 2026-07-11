import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { transactionApi } from "../api/client"
import { Panel, Banner, StatusPill, Amount } from "../components/ui"
import "./History.css"

function formatDateTime(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function History() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadPage = useCallback(async (pageNum) => {
    setLoading(true)
    setError("")
    try {
      const data = await transactionApi.list(token, { page: pageNum, limit: 15 })
      setTransactions(data.transactions || [])
      setTotalPages(data.totalPages || 1)
      setPage(data.page || pageNum)
    } catch (err) {
      setError(err.message || "Could not load transaction history")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadPage(1)
  }, [loadPage])

  return (
    <div className="page-container history-container">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Ledger</span>
          <h1 className="page-title">Transaction history</h1>
        </div>
      </div>

      <Banner tone="error">{error}</Banner>

      {loading ? (
        <p className="page-empty-note">Loading transactions…</p>
      ) : transactions.length === 0 ? (
        <Panel className="empty-panel">
          <p className="empty-title">No transactions yet</p>
          <p className="empty-desc">Once you send or receive funds, they'll show up here.</p>
        </Panel>
      ) : (
        <>
          <Panel className="history-panel">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Party</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Date &amp; time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className="history-row"
                    onClick={() => navigate(`/transactions/${tx._id}`)}
                  >
                    <td>
                      <div className="history-party">
                        <span className="history-party-name">
                          {tx.type === "SENT" ? tx.receiverName : tx.senderName}
                        </span>
                        <span className="history-party-sub">
                          {tx.type === "SENT" ? "to" : "from"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Amount value={tx.amount} sign={tx.type === "SENT" ? "debit" : "credit"} />
                    </td>
                    <td>
                      <span className={`history-type history-type-${tx.type.toLowerCase()}`}>
                        {tx.type === "SENT" ? "Sent" : "Received"}
                      </span>
                    </td>
                    <td className="history-date">{formatDateTime(tx.createdAt)}</td>
                    <td>
                      <StatusPill status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {totalPages > 1 && (
            <div className="history-pagination">
              <button
                className="history-page-btn"
                disabled={page <= 1}
                onClick={() => loadPage(page - 1)}
              >
                ← Previous
              </button>
              <span className="history-page-note">
                Page {page} of {totalPages}
              </span>
              <button
                className="history-page-btn"
                disabled={page >= totalPages}
                onClick={() => loadPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}