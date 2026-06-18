import { db, GoogleDeviceTrait } from '@lattice/prisma-client';

export type GoogleTraitTypeEntity = GoogleDeviceTrait;

class GoogleTraitsRepository {
  async getAll(): Promise<GoogleTraitTypeEntity[]> {
    return db.googleDeviceTrait.findMany();
  }
}

export const googleTraitsRepository = new GoogleTraitsRepository();
