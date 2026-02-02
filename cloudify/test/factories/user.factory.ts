// User test factory
let userIdCounter = 1;

export interface MockUser {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const id = `user-${userIdCounter++}`;
  return {
    id,
    email: `user${userIdCounter}@example.com`,
    name: `Test User ${userIdCounter}`,
    passwordHash: "$2b$12$mockedHashedPasswordValue123456789",
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as MockUser;
}

export function resetUserFactory() {
  userIdCounter = 1;
}
