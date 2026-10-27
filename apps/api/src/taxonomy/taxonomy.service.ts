import { Injectable } from '@nestjs/common';
import {
  IndustrySector,
  StartupStage,
  BusinessModel,
  StartupNeed,
  OpportunityCategory,
  PerkBenefitType,
  GovernmentLevel,
  CommitmentPreference,
  WorkLocationPreference,
} from '@startup-radar/shared-types';

@Injectable()
export class TaxonomyService {
  getTaxonomy() {
    return {
      industries: Object.values(IndustrySector),
      stages: Object.values(StartupStage),
      businessModels: Object.values(BusinessModel),
      needs: Object.values(StartupNeed),
      opportunityCategories: Object.values(OpportunityCategory),
      perkBenefitTypes: Object.values(PerkBenefitType),
      governmentLevels: Object.values(GovernmentLevel),
      commitmentPreferences: Object.values(CommitmentPreference),
      workLocationPreferences: Object.values(WorkLocationPreference),
    };
  }
}
