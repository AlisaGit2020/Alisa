// alisa-alert.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlisaAlert from './AlisaAlert';

describe('AlisaAlert', () => {
  it('renders correctly with title and content', () => {

    render(<AlisaAlert severity='success' title='Test Title' content={'Test Content'} />);

    // Assert that the title and content are rendered correctly
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders correctly with an array of content', () => {

    render(<AlisaAlert severity='error' content={['Item 1', 'Item 2', 'Item 3']} />);

    // Assert that each item in the array is rendered correctly
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('does not render if content is undefined or empty', () => {

    render(<AlisaAlert severity='error' />);

    // Assert that the component does not render
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
