import { UsersService } from './users.service';

const createRepositoryMock = (user: any) => {
  const findOne = jest.fn().mockResolvedValue(user);
  const save = jest
    .fn()
    .mockImplementation(async (payload: any) => payload);
  return {
    findOne,
    save,
    manager: {
      transaction: (cb: (manager: any) => Promise<any>) =>
        cb({
          getRepository: () => ({
            findOne,
            save,
          }),
        }),
    },
  };
};

describe('UsersService handleLoginSuccess', () => {
  it('increments streak for consecutive day logins', async () => {
    const user = {
      id: 'user-1',
      loginStreak: 2,
      lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    };
    const usersRepository = createRepositoryMock(user);
    const service = new UsersService(
      usersRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await service.handleLoginSuccess(user.id);
    expect(usersRepository.save).toHaveBeenCalled();
    const savedUser = usersRepository.save.mock.calls[0][0];
    expect(savedUser.loginStreak).toBe(3);
  });

  it('resets streak when last login is beyond a day', async () => {
    const user = {
      id: 'user-2',
      loginStreak: 5,
      lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    };
    const usersRepository = createRepositoryMock(user);
    const service = new UsersService(
      usersRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await service.handleLoginSuccess(user.id);
    const savedUser = usersRepository.save.mock.calls[0][0];
    expect(savedUser.loginStreak).toBe(1);
  });
});

