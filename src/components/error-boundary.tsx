'use client';

import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-state">
                    <div className="error-state__icon">🐾</div>
                    <h2 className="error-state__title">Something went wrong</h2>
                    <p className="error-state__text">
                        We hit a bump in the road. Please try refreshing the page.
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}
