import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: "fixed", inset: 0, background: "#0a0a0a",
          color: "#ff6b6b", display: "flex", alignItems: "center",
          justifyContent: "center", flexDirection: "column", gap: 16,
          fontFamily: "monospace", padding: 32, zIndex: 9999
        }}>
          <h2>Scene Error</h2>
          <pre style={{ background: "#111", padding: 16, borderRadius: 8, maxWidth: "80vw", overflow: "auto", fontSize: 12 }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
