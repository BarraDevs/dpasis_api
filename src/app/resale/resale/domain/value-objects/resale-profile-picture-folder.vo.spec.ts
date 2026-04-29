import { ResaleProfilePictureFolder } from './resale-profile-picture-folder.vo';

describe('ResaleProfilePictureFolder', () => {
  it('should build folder path with resale id', () => {
    const randomNumber = Math.floor(Math.random() * 1000000);
    expect(new ResaleProfilePictureFolder(randomNumber).value).toBe(
      `resales/${randomNumber}/profile-picture`,
    );
  });
});
