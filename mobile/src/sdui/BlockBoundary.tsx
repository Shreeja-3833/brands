import { Component, ReactNode } from "react";

type Props = { blockId: string; type: string; children: ReactNode };

export class BlockBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.log(`Block "${this.props.blockId}" (${this.props.type}) crashed:`, error.message);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}