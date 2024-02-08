import { Test, TestingModule } from '@nestjs/testing';
import { GoogleService } from './google.service';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

describe('GoogleService', () => {
  let googleService: GoogleService;
  const tempTokenPath = 'temp_token.json'; // Väliaikainen tiedostonimi

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleService],
    }).compile();

    googleService = module.get<GoogleService>(GoogleService);
    // Päivitä TOKEN_PATH oikeaksi testin alussa
    googleService['TOKEN_PATH'] = path.join(__dirname, 'token.json');
  });

  afterEach(async () => {
    // Poista väliaikainen tiedosto testin jälkeen
    await fsPromises.unlink(tempTokenPath).catch(() => {}); // Jos tiedostoa ei ole, jatka silti
  });

  it('should return true if token file does not exist', async () => {
    // Luo väliaikainen tiedosto testin ajaksi
    await fsPromises.writeFile(tempTokenPath, '');

    const existsSpy = jest
      .spyOn(fsPromises, 'access')
      .mockRejectedValue(new Error('File not found'));

    const result = await googleService.requiresAuthentication();

    expect(existsSpy).toHaveBeenCalledWith(googleService['TOKEN_PATH']);
    expect(result).toBe(true);
  });

  it('should return false if token file exists', async () => {
    const existsSpy = jest.spyOn(fsPromises, 'access').mockResolvedValue();

    const result = await googleService.requiresAuthentication();

    expect(existsSpy).toHaveBeenCalledWith(googleService['TOKEN_PATH']);
    expect(result).toBe(false);
  });
});
