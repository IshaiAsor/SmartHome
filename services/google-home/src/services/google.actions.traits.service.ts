import { actionTypeTraitRepository } from '../dal/action.type.traits.repository';
import { googleTraitsRepository } from '../dal/google.action.traits.repository';

export interface GoogleActionTraitView {
  id: number;
  name: string;
  value: string;
}

class GoogleActionsTraitsService {
  async GetActionDefinitionTraits(actionId: number): Promise<GoogleActionTraitView[]> {
    const [traits, actionTraits] = await Promise.all([
      googleTraitsRepository.getAll(),
      actionTypeTraitRepository.GetByActionId(actionId),
    ]);
    return actionTraits.map((actionTrait) => {
      const traitDef = traits.find((t) => t.id === actionTrait.google_trait_id);
      return {
        id: actionTrait.id,
        name: traitDef?.name ?? '',
        value: traitDef?.value ?? '',
      };
    });
  }
}

export const googleActionsTraitsService = new GoogleActionsTraitsService();
