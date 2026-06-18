import { db, GoogleActionType } from '@lattice/prisma-client';

export type GoogleActionTypeEntity = GoogleActionType;

class GoogleActionTypesRepository {
  async getAll(): Promise<GoogleActionTypeEntity[]> {
    return db.googleActionType.findMany();
  }
}

export const googleActionTypesRepository = new GoogleActionTypesRepository();
