import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    // Return as key-value pairs for easier frontend usage
    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  async updateSettings(data: Record<string, string>) {
    const updates = Object.entries(data).map(async ([key, value]) => {
      return this.prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });

    await Promise.all(updates);
    return this.getAllSettings();
  }
}
