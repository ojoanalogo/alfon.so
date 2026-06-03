import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SOCIAL_LINKS } from '@/config';
import { postDateFormatter, POST_DATE_MIN_WIDTH } from '@/config/postFormatting';
import {
  InfoRow,
  ExternalLink,
  Divider,
  SocialMediaIcons,
  PostListItem,
} from './parts';

describe('InfoRow', () => {
  it('renders the label and children', () => {
    render(<InfoRow label="Name">Alfonso</InfoRow>);
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Alfonso')).toBeTruthy();
  });

  it('styles label as muted and value as secondary', () => {
    render(<InfoRow label="Role">Dev</InfoRow>);
    expect(screen.getByText('Role').className).toContain('text-muted');
    expect(screen.getByText('Dev').className).toContain('text-secondary');
  });
});

describe('ExternalLink', () => {
  it('renders children inside an anchor pointing at href', () => {
    render(
      <ExternalLink href="https://example.com">Visit</ExternalLink>,
    );
    const link = screen.getByText('Visit') as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  it('opens in a new tab with safe rel attributes', () => {
    render(<ExternalLink href="https://example.com">x</ExternalLink>);
    const link = screen.getByText('x');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('applies the aria-label from the label prop', () => {
    render(
      <ExternalLink href="https://example.com" label="My site">
        x
      </ExternalLink>,
    );
    expect(screen.getByText('x').getAttribute('aria-label')).toBe('My site');
  });

  it('uses default classes when no className override is given', () => {
    render(<ExternalLink href="#">def</ExternalLink>);
    const link = screen.getByText('def');
    expect(link.className).toContain('text-primary');
    expect(link.className).toContain('hover:underline');
  });

  it('merges a custom className with hover/focus utilities (dropping defaults)', () => {
    render(
      <ExternalLink href="#" className="my-link">
        custom
      </ExternalLink>,
    );
    const link = screen.getByText('custom');
    expect(link.className).toContain('my-link');
    expect(link.className).toContain('hover:underline');
    expect(link.className).toContain('focus:outline-none');
    expect(link.className).not.toContain('text-primary');
  });
});

describe('Divider', () => {
  it('renders a separator role element', () => {
    const { container } = render(<Divider />);
    const sep = container.querySelector('[role="separator"]') as HTMLElement;
    expect(sep).toBeTruthy();
    expect(sep.className).toContain('border-b');
  });

  it('appends an extra className when provided', () => {
    const { container } = render(<Divider className="mt-4" />);
    const sep = container.querySelector('[role="separator"]') as HTMLElement;
    expect(sep.className).toContain('mt-4');
    expect(sep.className).toContain('border-b');
  });

  it('does not leak "undefined" into the class list when no className', () => {
    const { container } = render(<Divider />);
    const sep = container.querySelector('[role="separator"]') as HTMLElement;
    expect(sep.className).not.toContain('undefined');
  });
});

describe('SocialMediaIcons', () => {
  it('renders one list item per configured social link', () => {
    const { container } = render(<SocialMediaIcons />);
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(SOCIAL_LINKS.length);
  });

  it('renders each link with its url and accessible label', () => {
    const { container } = render(<SocialMediaIcons />);
    for (const link of SOCIAL_LINKS) {
      const anchor = container.querySelector(
        `a[href="${link.url}"]`,
      ) as HTMLAnchorElement;
      expect(anchor).toBeTruthy();
      expect(anchor.getAttribute('target')).toBe('_blank');
      expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
      // sr-only label text present
      expect(screen.getByText(link.label)).toBeTruthy();
    }
  });

  it('renders an svg icon for every link', () => {
    const { container } = render(<SocialMediaIcons />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(SOCIAL_LINKS.length);
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.querySelector('path')).toBeTruthy();
    });
  });
});

describe('PostListItem', () => {
  const baseProps = {
    title: 'Hello World',
    slug: 'hello-world',
    publishDate: '2024-01-15T00:00:00.000Z',
  };

  it('renders the title linking to the blog slug', () => {
    render(<PostListItem {...baseProps} />);
    const link = screen.getByText('Hello World') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/blog/hello-world/');
  });

  it('renders the formatted publish date with a datetime attribute', () => {
    const { container } = render(<PostListItem {...baseProps} />);
    const time = container.querySelector('time') as HTMLTimeElement;
    const date = new Date(baseProps.publishDate);
    expect(time.textContent).toBe(postDateFormatter.format(date));
    expect(time.getAttribute('datetime')).toBe(date.toISOString());
    expect(time.style.minWidth).toBe(`${POST_DATE_MIN_WIDTH}px`);
  });

  it('calls onOpen and prevents default on a plain left click', () => {
    const onOpen = vi.fn();
    render(<PostListItem {...baseProps} onOpen={onOpen} />);
    const link = screen.getByText('Hello World');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(event);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not intercept when onOpen is undefined', () => {
    render(<PostListItem {...baseProps} />);
    const link = screen.getByText('Hello World');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(event);
    // No handler to call; default should not be prevented by the component.
    expect(event.defaultPrevented).toBe(false);
  });

  it('lets modifier-clicks (meta/ctrl/shift) fall through to the browser', () => {
    const onOpen = vi.fn();
    render(<PostListItem {...baseProps} onOpen={onOpen} />);
    const link = screen.getByText('Hello World');

    const metaEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      metaKey: true,
    });
    link.dispatchEvent(metaEvent);
    expect(onOpen).not.toHaveBeenCalled();
    expect(metaEvent.defaultPrevented).toBe(false);
  });

  it('ignores non-primary mouse button clicks', () => {
    const onOpen = vi.fn();
    render(<PostListItem {...baseProps} onOpen={onOpen} />);
    const link = screen.getByText('Hello World');
    const middleClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 1,
    });
    link.dispatchEvent(middleClick);
    expect(onOpen).not.toHaveBeenCalled();
    expect(middleClick.defaultPrevented).toBe(false);
  });

  it('works through fireEvent.click for a plain primary click', () => {
    const onOpen = vi.fn();
    render(<PostListItem {...baseProps} onOpen={onOpen} />);
    fireEvent.click(screen.getByText('Hello World'), { button: 0 });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
