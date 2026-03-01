import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderTaggedContent } from '../renderTaggedContent';

function renderWithRouter(nodes: React.ReactNode[]) {
  return render(
    <MemoryRouter>
      <div>{nodes}</div>
    </MemoryRouter>,
  );
}

describe('renderTaggedContent', () => {
  it('renders plain text without tags as a span', () => {
    const nodes = renderTaggedContent('hello world', 'tag-class');
    renderWithRouter(nodes);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('converts a single hashtag into a link', () => {
    const nodes = renderTaggedContent('check out #react', 'tag-class');
    renderWithRouter(nodes);
    const link = screen.getByText('#react');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/explore?tag=react');
  });

  it('converts multiple hashtags into links', () => {
    const nodes = renderTaggedContent('#react and #typescript are great', 'tag-class');
    renderWithRouter(nodes);
    expect(screen.getByText('#react')).toHaveAttribute('href', '/explore?tag=react');
    expect(screen.getByText('#typescript')).toHaveAttribute('href', '/explore?tag=typescript');
    expect(screen.getByText(/and/)).toBeInTheDocument();
    expect(screen.getByText(/are great/)).toBeInTheDocument();
  });

  it('lowercases the tag in the link href', () => {
    const nodes = renderTaggedContent('#JavaScript', 'tag-class');
    renderWithRouter(nodes);
    const link = screen.getByText('#JavaScript');
    expect(link).toHaveAttribute('href', '/explore?tag=javascript');
  });

  it('applies the provided className to tag links', () => {
    const nodes = renderTaggedContent('#test', 'my-tag-class');
    renderWithRouter(nodes);
    expect(screen.getByText('#test')).toHaveClass('my-tag-class');
  });
});
