import { Component } from 'react';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import DesktopApp from './DesktopApp';
import type { BlogPostSummary, WallpaperOption } from './types';

interface DesktopClientGateProps {
  posts: BlogPostSummary[];
  wallpapers: WallpaperOption[];
  desktopIconUrls: DesktopIconUrls;
}

interface DesktopClientGateState {
  mounted: boolean;
}

export default class DesktopClientGate extends Component<
  DesktopClientGateProps,
  DesktopClientGateState
> {
  state: DesktopClientGateState = { mounted: false };

  componentDidMount() {
    this.setState({ mounted: true });
  }

  render() {
    return this.state.mounted ? <DesktopApp {...this.props} /> : null;
  }
}
