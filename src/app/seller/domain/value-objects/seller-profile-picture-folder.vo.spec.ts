import { SellerProfilePictureFolder } from './seller-profile-picture-folder.vo';

describe('SellerProfilePictureFolder', () => {
  it('should build folder path with seller id', () => {
    const randomNumber = Math.floor(Math.random() * 1000000);
    expect(new SellerProfilePictureFolder(randomNumber).value).toBe(
      `sellers/${randomNumber}/profile-picture`,
    );
  });
});
