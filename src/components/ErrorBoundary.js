import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Error oluştuğunda state'i güncelle
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('ErrorBoundary yakaladığı hata:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Editor Hatası</h3>
            <p className="text-gray-600 mb-4">Editor yüklenirken bir hata oluştu.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 