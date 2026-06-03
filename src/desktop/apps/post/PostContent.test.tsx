import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makeBlogPost } from '@test/factories';
import { postLongDateFormatter } from '@/config/postFormatting';
import PostContent from './PostContent';

describe('PostContent', () => {
  it('renders the title heading and the formatted publish date', () => {
    const post = makeBlogPost({ title: 'My Great Post', publishDate: '2024-03-15T00:00:00.000Z' });
    render(<PostContent post={post} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('My Great Post');

    const expectedDate = postLongDateFormatter.format(new Date(post.publishDate));
    expect(screen.getByText(expectedDate)).toBeTruthy();
  });

  it('sets the <time> dateTime to the ISO publish date', () => {
    const post = makeBlogPost({ publishDate: '2024-03-15T00:00:00.000Z' });
    const { container } = render(<PostContent post={post} />);
    const time = container.querySelector('time');
    expect(time?.getAttribute('dateTime')).toBe(new Date(post.publishDate).toISOString());
  });

  it('renders the pre-rendered HTML body', () => {
    const post = makeBlogPost({ html: '<p>hello body content</p>' });
    render(<PostContent post={post} />);
    expect(screen.getByText('hello body content')).toBeTruthy();
  });

  it('renders a permalink pointing at the post slug', () => {
    const post = makeBlogPost({ slug: 'my-cool-post' });
    render(<PostContent post={post} />);
    const link = screen.getByText(/abrir permalink/i).closest('a');
    expect(link?.getAttribute('href')).toBe('/blog/my-cool-post/');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link?.getAttribute('target')).toBe('_blank');
  });

  it('renders reading time when provided', () => {
    const post = makeBlogPost({ readingTime: '5 min' });
    render(<PostContent post={post} />);
    expect(screen.getByText(/5 min/)).toBeTruthy();
  });

  it('omits the reading-time span when not provided', () => {
    const post = makeBlogPost({ readingTime: undefined });
    render(<PostContent post={post} />);
    expect(screen.queryByText(/min$/)).toBeNull();
  });

  it('renders a tag chip per tag', () => {
    const post = makeBlogPost({ tags: ['astro', 'react'] });
    render(<PostContent post={post} />);
    expect(screen.getByText('#astro')).toBeTruthy();
    expect(screen.getByText('#react')).toBeTruthy();
  });

  it('renders no tag chips when tags is empty', () => {
    const post = makeBlogPost({ tags: [] });
    render(<PostContent post={post} />);
    expect(screen.queryByText(/^#/)).toBeNull();
  });

  it('renders the hero image with src and alt when heroImageSrc is set', () => {
    const post = makeBlogPost({
      heroImageSrc: '/hero.jpg',
      heroImageAlt: 'A nice hero',
      title: 'Titled',
    });
    const { container } = render(<PostContent post={post} />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/hero.jpg');
    expect(img?.getAttribute('alt')).toBe('A nice hero');
  });

  it('falls back to the title for hero alt when heroImageAlt is missing', () => {
    const post = makeBlogPost({ heroImageSrc: '/hero.jpg', heroImageAlt: undefined, title: 'Fallback Title' });
    const { container } = render(<PostContent post={post} />);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Fallback Title');
  });

  it('renders no hero image when heroImageSrc is absent', () => {
    const post = makeBlogPost({ heroImageSrc: undefined });
    const { container } = render(<PostContent post={post} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
