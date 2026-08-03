/*
 * 
 */
import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in Dino\'s Mobile Tires UI:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-dark px-6 text-center text-white">
        <h1 className="font-display text-4xl">Something went wrong</h1>
        <p className="max-w-md text-neutral-400">
          Sorry — this page hit an error. Reloading usually clears it. If it
          keeps happening, give us a call and we'll get you booked.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="skew-brand bg-brand px-8 py-3 transition-colors hover:bg-brand-hover"
        >
          <span className="skew-fix block font-display text-white">Reload the page</span>
        </button>
        <p className="max-w-lg font-mono text-xs break-words text-neutral-600">{error.message}</p>
      </div>
    )
  }
}
