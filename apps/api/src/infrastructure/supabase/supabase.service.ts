import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly client: SupabaseClient | null;
  readonly storageBucket: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.storageBucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET', 'attachments');

    if (url && serviceKey) {
      this.client = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      this.logger.log('Supabase client configured');
    } else {
      this.client = null;
      this.logger.warn('Supabase not configured — using local file storage fallback');
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async verifyAccessToken(accessToken: string) {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await this.client.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new Error(error?.message ?? 'Invalid Supabase token');
    }

    return data.user;
  }

  async createAuthUser(
    email: string,
    password: string,
    options?: { emailConfirm?: boolean },
  ) {
    if (!this.client) return null;

    const emailConfirm = options?.emailConfirm ?? false;

    const { data, error } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: emailConfirm,
    });

    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        const existing = await this.findAuthUserByEmail(email);
        if (existing && emailConfirm && !existing.email_confirmed_at) {
          return this.confirmAuthUser(existing.id);
        }
        return existing;
      }
      throw new Error(error.message);
    }

    return data.user;
  }

  async confirmAuthUser(userId: string) {
    if (!this.client) return null;

    const { data, error } = await this.client.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.user;
  }

  private async findAuthUserByEmail(email: string) {
    if (!this.client) return null;

    const normalized = email.toLowerCase();
    let page = 1;
    const perPage = 200;

    while (page <= 10) {
      const { data, error } = await this.client.auth.admin.listUsers({ page, perPage });
      if (error) {
        throw new Error(error.message);
      }

      const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
      if (match) return match;

      if (data.users.length < perPage) break;
      page += 1;
    }

    return null;
  }

  async uploadFile(params: {
    path: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<{ storagePath: string }> {
    if (!this.client) {
      throw new Error('Supabase Storage is not configured');
    }

    const { error } = await this.client.storage
      .from(this.storageBucket)
      .upload(params.path, params.buffer, {
        contentType: params.contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return { storagePath: params.path };
  }

  async createSignedUrl(path: string, expiresInSeconds = 300): Promise<string> {
    if (!this.client) {
      throw new Error('Supabase Storage is not configured');
    }

    const { data, error } = await this.client.storage
      .from(this.storageBucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? 'Impossible de générer une URL signée');
    }

    return data.signedUrl;
  }

  async removeFile(path: string): Promise<void> {
    if (!this.client) return;

    const { error } = await this.client.storage.from(this.storageBucket).remove([path]);
    if (error) {
      this.logger.warn(`Supabase delete failed for ${path}: ${error.message}`);
    }
  }
}
