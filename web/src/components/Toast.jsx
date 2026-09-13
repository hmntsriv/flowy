function Toast({ message, type = "success", onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`flowy-toast flowy-toast-${type}`}>
      <span className="flowy-toast-icon">
        {type === "error" ? "!" : "✓"}
      </span>

      <span className="flowy-toast-message">
        {message}
      </span>

      <button
        type="button"
        className="flowy-toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;