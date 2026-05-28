import db from '../config/db';
import { GoogleDeviceTrait } from '@prisma/client';

export type GoogleTraitTypeEntity = GoogleDeviceTrait;

class GoogleTraitsRepository {
  async getById(traitId: number): Promise<GoogleTraitTypeEntity | null> {
    return db.googleDeviceTrait.findUnique({ where: { id: traitId } });
  }

  async getAll(): Promise<GoogleTraitTypeEntity[]> {
    return db.googleDeviceTrait.findMany();
  }
}

export const googleTraitsRepository = new GoogleTraitsRepository();
