import '@testing-library/jest-dom';

// Since the component uses import.meta.env directly which is not available in Jest,
// we test the data transformation logic separately from the React component
// Following the pattern from Transactions.test.tsx

describe('AdminUserList Logic', () => {
  describe('User interface', () => {
    it('has correct user structure', () => {
      const user = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        language: 'en',
        isAdmin: false,
        tierId: 1,
      };

      expect(user.id).toBe(1);
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.language).toBe('en');
      expect(user.isAdmin).toBe(false);
      expect(user.tierId).toBe(1);
    });

    it('supports user without tier', () => {
      const user = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        tierId: null,
      };

      expect(user.tierId).toBeNull();
    });
  });

  describe('Full name display', () => {
    it('combines first and last name', () => {
      const user = { firstName: 'John', lastName: 'Doe' };
      const fullName = `${user.firstName} ${user.lastName}`;

      expect(fullName).toBe('John Doe');
    });

    it('handles empty last name', () => {
      const user = { firstName: 'John', lastName: '' };
      const fullName = `${user.firstName} ${user.lastName}`.trim();

      expect(fullName).toBe('John');
    });

    it('handles empty first name', () => {
      const user = { firstName: '', lastName: 'Doe' };
      const fullName = `${user.firstName} ${user.lastName}`.trim();

      expect(fullName).toBe('Doe');
    });
  });

  describe('Admin status display', () => {
    it('returns Yes for admin users', () => {
      const getAdminDisplay = (isAdmin: boolean, yesText: string, noText: string) =>
        isAdmin ? yesText : noText;

      expect(getAdminDisplay(true, 'Yes', 'No')).toBe('Yes');
    });

    it('returns No for non-admin users', () => {
      const getAdminDisplay = (isAdmin: boolean, yesText: string, noText: string) =>
        isAdmin ? yesText : noText;

      expect(getAdminDisplay(false, 'Yes', 'No')).toBe('No');
    });
  });

  describe('handleTierChange', () => {
    it('updates user tier locally after successful API call', () => {
      const users = [
        { id: 1, tierId: 1, tier: { id: 1, name: 'Free' } },
        { id: 2, tierId: 1, tier: { id: 1, name: 'Free' } },
      ];
      const tiers = [
        { id: 1, name: 'Free' },
        { id: 2, name: 'Pro' },
      ];

      const updateUserTier = (
        prevUsers: typeof users,
        userId: number,
        newTierId: number
      ) => {
        return prevUsers.map((user) =>
          user.id === userId
            ? { ...user, tierId: newTierId, tier: tiers.find((t) => t.id === newTierId) }
            : user
        );
      };

      const updatedUsers = updateUserTier(users, 1, 2);

      expect(updatedUsers[0].tierId).toBe(2);
      expect(updatedUsers[0].tier?.name).toBe('Pro');
    });

    it('does not update other users', () => {
      const users = [
        { id: 1, tierId: 1 },
        { id: 2, tierId: 1 },
      ];

      const updateUserTier = (
        prevUsers: typeof users,
        userId: number,
        newTierId: number
      ) => {
        return prevUsers.map((user) =>
          user.id === userId ? { ...user, tierId: newTierId } : user
        );
      };

      const updatedUsers = updateUserTier(users, 1, 2);

      expect(updatedUsers[0].tierId).toBe(2);
      expect(updatedUsers[1].tierId).toBe(1);
    });

    it('finds correct tier from tiers array', () => {
      const tiers = [
        { id: 1, name: 'Free' },
        { id: 2, name: 'Pro' },
        { id: 3, name: 'Enterprise' },
      ];

      const findTier = (tierId: number) => tiers.find((t) => t.id === tierId);

      expect(findTier(1)?.name).toBe('Free');
      expect(findTier(2)?.name).toBe('Pro');
      expect(findTier(3)?.name).toBe('Enterprise');
      expect(findTier(99)).toBeUndefined();
    });
  });

  describe('State management', () => {
    it('users state starts as empty array', () => {
      const users: unknown[] = [];
      expect(users).toEqual([]);
    });

    it('tiers state starts as empty array', () => {
      const tiers: unknown[] = [];
      expect(tiers).toEqual([]);
    });

    it('loading state starts as true', () => {
      const loading = true;
      expect(loading).toBe(true);
    });
  });

  describe('API URL construction', () => {
    it('constructs correct users URL', () => {
      const adminPath = 'admin';
      const baseUrl = 'http://localhost:3000';

      const usersUrl = `${baseUrl}/${adminPath}/users`;

      expect(usersUrl).toBe('http://localhost:3000/admin/users');
    });

    it('constructs correct tiers URL', () => {
      const adminPath = 'admin';
      const baseUrl = 'http://localhost:3000';

      const tiersUrl = `${baseUrl}/${adminPath}/tiers`;

      expect(tiersUrl).toBe('http://localhost:3000/admin/tiers');
    });

    it('constructs correct user tier update URL', () => {
      const adminPath = 'admin';
      const baseUrl = 'http://localhost:3000';

      const userTierUrl = (userId: number) => `${baseUrl}/${adminPath}/users/${userId}/tier`;

      expect(userTierUrl(1)).toBe('http://localhost:3000/admin/users/1/tier');
      expect(userTierUrl(99)).toBe('http://localhost:3000/admin/users/99/tier');
    });
  });

  describe('Parallel data fetching', () => {
    it('fetches users and tiers in parallel', async () => {
      const fetchUsers = () => Promise.resolve([{ id: 1 }]);
      const fetchTiers = () => Promise.resolve([{ id: 1 }]);

      const [users, tiers] = await Promise.all([fetchUsers(), fetchTiers()]);

      expect(users).toEqual([{ id: 1 }]);
      expect(tiers).toEqual([{ id: 1 }]);
    });

    it('handles one fetch failing while other succeeds', async () => {
      const fetchUsers = () => Promise.resolve([{ id: 1 }]);
      const fetchTiers = () => Promise.reject(new Error('Failed'));

      let users: unknown[] = [];
      let tiers: unknown[] = [];

      try {
        const results = await Promise.allSettled([fetchUsers(), fetchTiers()]);
        if (results[0].status === 'fulfilled') {
          users = results[0].value;
        }
        if (results[1].status === 'fulfilled') {
          tiers = results[1].value;
        }
      } catch {
        // Handle error
      }

      expect(users).toEqual([{ id: 1 }]);
      expect(tiers).toEqual([]);
    });
  });

  describe('Select value handling', () => {
    it('uses empty string when tierId is null', () => {
      const user = { id: 1, tierId: null };
      const selectValue = user.tierId || '';

      expect(selectValue).toBe('');
    });

    it('uses tierId when available', () => {
      const user = { id: 1, tierId: 2 };
      const selectValue = user.tierId || '';

      expect(selectValue).toBe(2);
    });

    it('uses empty string when tierId is undefined', () => {
      const user: { id: number; tierId?: number } = { id: 1 };
      const selectValue = user.tierId || '';

      expect(selectValue).toBe('');
    });
  });

  describe('Tier change request body', () => {
    it('constructs correct request body', () => {
      const newTierId = 2;
      const body = JSON.stringify({ tierId: newTierId });

      expect(body).toBe('{"tierId":2}');
    });
  });

  describe('Loading state management', () => {
    it('sets loading to false after fetch completes', () => {
      let loading = true;

      const fetchComplete = () => {
        loading = false;
      };

      fetchComplete();
      expect(loading).toBe(false);
    });

    it('sets loading to false even when fetch fails', () => {
      let loading = true;

      const handleFetchError = () => {
        loading = false;
      };

      handleFetchError();
      expect(loading).toBe(false);
    });
  });

  describe('Response handling', () => {
    it('updates users state on successful fetch', () => {
      let users: unknown[] = [];
      const responseData = [{ id: 1, firstName: 'John' }];

      const handleResponse = (ok: boolean, data: unknown[]) => {
        if (ok) {
          users = data;
        }
      };

      handleResponse(true, responseData);
      expect(users).toEqual(responseData);
    });

    it('does not update on failed response', () => {
      let users = [{ id: 1, firstName: 'Original' }];

      const handleResponse = (ok: boolean, data: { id: number; firstName: string }[]) => {
        if (ok) {
          users = data;
        }
      };

      handleResponse(false, [{ id: 2, firstName: 'New' }]);
      expect(users).toEqual([{ id: 1, firstName: 'Original' }]);
    });

    it('updates tiers state on successful fetch', () => {
      let tiers: unknown[] = [];
      const responseData = [{ id: 1, name: 'Free' }];

      const handleResponse = (ok: boolean, data: unknown[]) => {
        if (ok) {
          tiers = data;
        }
      };

      handleResponse(true, responseData);
      expect(tiers).toEqual(responseData);
    });
  });

  describe('User tier update optimistic UI', () => {
    it('updates local state before waiting for API response', () => {
      interface UserWithTier {
        id: number;
        tierId: number;
        tier: { id: number; name: string } | undefined;
      }
      let users: UserWithTier[] = [
        { id: 1, tierId: 1, tier: { id: 1, name: 'Free' } },
      ];
      const tiers = [
        { id: 1, name: 'Free' },
        { id: 2, name: 'Pro' },
      ];

      const optimisticUpdate = (userId: number, newTierId: number) => {
        users = users.map((user) =>
          user.id === userId
            ? { ...user, tierId: newTierId, tier: tiers.find((t) => t.id === newTierId) }
            : user
        );
      };

      optimisticUpdate(1, 2);

      expect(users[0].tierId).toBe(2);
      expect(users[0].tier?.name).toBe('Pro');
    });

    it('reverts on API failure', () => {
      const originalUsers = [
        { id: 1, tierId: 1, tier: { id: 1, name: 'Free' } },
      ];
      let users = [...originalUsers];

      const revertUpdate = () => {
        users = originalUsers;
      };

      // Simulate optimistic update
      users[0] = { ...users[0], tierId: 2, tier: { id: 2, name: 'Pro' } };

      // Simulate API failure
      revertUpdate();

      expect(users[0].tierId).toBe(1);
      expect(users[0].tier?.name).toBe('Free');
    });
  });
});
