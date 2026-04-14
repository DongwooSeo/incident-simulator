import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page" role="alert">
          <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>오류가 발생했습니다</h1>
            <p style={{ color: 'var(--sec)', marginBottom: 20 }}>
              {this.state.error.message || '알 수 없는 오류'}
            </p>
            <button
              className="btn btn--primary"
              onClick={() => {
                this.setState({ error: null });
                window.location.href = '/';
              }}
            >
              홈으로 돌아가기
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
