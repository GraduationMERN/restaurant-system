import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <pre className="whitespace-pre-wrap text-sm text-red-600">{String(this.state.error)}</pre>
          <details className="mt-4 text-xs text-gray-600">{this.state.info?.componentStack}</details>
        </div>
      );
    }
    return this.props.children;
  }
}
