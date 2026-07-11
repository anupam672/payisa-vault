import "./ui.css"

export function Panel({ children, className = "" }) {
  return <div className={`panel ${className}`}>{children}</div>
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}

export function Input(props) {
  return <input className="input" {...props} />
}

export function Button({ variant = "primary", children, ...props }) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  )
}

export function Amount({ value, currency = "INR", sign }) {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))

  const symbol = currency === "INR" ? "\u20B9" : currency

  return (
    <span className={`amount mono${sign ? ` amount-${sign}` : ""}`}>
      {sign === "credit" ? "+" : sign === "debit" ? "\u2212" : ""}
      {symbol}
      {formatted}
    </span>
  )
}

export function StatusPill({ status }) {
  const map = {
    ACTIVE: "pill-active",
    COMPLETED: "pill-active",
    FROZEN: "pill-warn",
    PENDING: "pill-warn",
    CLOSED: "pill-muted",
    FAILED: "pill-alert",
    REVERSED: "pill-alert",
  }
  return <span className={`pill ${map[status] || "pill-muted"}`}>{status}</span>
}

export function Banner({ tone = "error", children }) {
  if (!children) return null
  return <div className={`banner banner-${tone}`}>{children}</div>
}
