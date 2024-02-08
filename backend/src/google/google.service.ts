import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleService {
  private readonly SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
  private readonly TOKEN_PATH = path.join(__dirname, 'token.json');
  private readonly CREDENTIALS_PATH = path.resolve(
    'src/google/gmail.credentials.json',
  );

  async requiresAuthentication(): Promise<boolean> {
    try {
      // Tarkista, onko tokeni jo tallennettu
      await fs.promises.readFile(this.TOKEN_PATH, 'utf-8');
      return false; // Token löytyy, ei tarvita uutta autentikointia
    } catch (error) {
      return true; // Tokenia ei löydy, autentikointi tarvitaan
    }
  }

  async getAuthenticationUrl(): Promise<string> {
    const credentials = JSON.parse(
      await fs.promises.readFile(this.CREDENTIALS_PATH, 'utf-8'),
    );
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new OAuth2Client(
      client_id,
      client_secret,
      redirect_uris[0],
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    });
    return authUrl;
  }

  async authenticate(credentials, code: string): Promise<OAuth2Client> {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new OAuth2Client(
      client_id,
      client_secret,
      redirect_uris[0],
    );

    const token = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(token.tokens);

    await fs.promises.writeFile(this.TOKEN_PATH, JSON.stringify(token.tokens));

    return oAuth2Client;
  }
}
