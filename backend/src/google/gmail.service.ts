import { Injectable } from '@nestjs/common';
import { google, gmail_v1 } from 'googleapis';
import { GoogleService } from './google.service';
import * as fs from 'fs/promises';
import path from 'path';

@Injectable()
export class GmailService {
  constructor(private readonly googleService: GoogleService) {}

  async listMessages(): Promise<gmail_v1.Schema$Message[]> {
    const code = '';
    const credentialsPath = path.resolve('src/google/gmail.credentials.json');
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
    const auth = await this.googleService.authenticate(credentials, code);
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `label:Airbnb/Maksut`,
    });

    return response.data.messages || [];
  }

  private async getCredentials() {
    const credentialsPath = path.resolve('src/google/gmail.credentials.json');
    return JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
  }
}
