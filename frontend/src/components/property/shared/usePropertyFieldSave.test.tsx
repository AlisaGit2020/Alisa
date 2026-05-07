import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import ApiClient from '@asset-lib/api-client';
import { AssetToastProvider } from '../../asset';
import { createMockProperty } from '@test-utils/test-data';
import { usePropertyFieldSave } from './usePropertyFieldSave';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AssetToastProvider>{children}</AssetToastProvider>
);

describe('usePropertyFieldSave', () => {
  let putSpy: jest.SpyInstance;

  beforeEach(() => {
    putSpy = jest.spyOn(ApiClient, 'put');
  });

  afterEach(() => {
    putSpy.mockRestore();
  });

  it('PUTs the full property merged with a top-level patch', async () => {
    const property = createMockProperty({ id: 7, name: 'Foo', size: 50, buildYear: 2010 });
    const onUpdated = jest.fn();
    const updated = { ...property, size: 75 };
    putSpy.mockResolvedValueOnce(updated);

    const { result } = renderHook(
      () => usePropertyFieldSave(property, onUpdated),
      { wrapper }
    );

    await act(async () => {
      await result.current({ size: 75 });
    });

    expect(putSpy).toHaveBeenCalledWith(
      'real-estate/property',
      7,
      expect.objectContaining({ name: 'Foo', size: 75, buildYear: 2010 })
    );
    expect(onUpdated).toHaveBeenCalledWith(updated);
  });

  it('merges nested address patches with existing address', async () => {
    const property = createMockProperty({
      id: 8,
      address: { id: 1, street: 'Old', city: 'Helsinki', postalCode: '00100' },
    });
    putSpy.mockResolvedValueOnce(property);

    const { result } = renderHook(
      () => usePropertyFieldSave(property, jest.fn()),
      { wrapper }
    );

    await act(async () => {
      await result.current({ address: { street: 'New' } as never });
    });

    expect(putSpy).toHaveBeenCalledWith(
      'real-estate/property',
      8,
      expect.objectContaining({
        address: expect.objectContaining({
          id: 1,
          street: 'New',
          city: 'Helsinki',
          postalCode: '00100',
        }),
      })
    );
  });

  it('rethrows on error and does not call onUpdated', async () => {
    const property = createMockProperty({ id: 9 });
    const onUpdated = jest.fn();
    putSpy.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(
      () => usePropertyFieldSave(property, onUpdated),
      { wrapper }
    );

    await expect(
      act(async () => {
        await result.current({ size: 60 });
      })
    ).rejects.toThrow('boom');

    expect(onUpdated).not.toHaveBeenCalled();
  });
});
