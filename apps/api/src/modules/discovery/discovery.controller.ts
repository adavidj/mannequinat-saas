import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SearchModelsDto, searchModelsSchema } from './dto/search-models.dto';
import { DiscoveryService } from './discovery.service';

type AuthenticatedUser = { id: string };

@Controller('discovery/models')
@Roles(UserRole.AGENCE)
@EmailVerifiedRequired()
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get()
  async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(searchModelsSchema)) query: SearchModelsDto,
  ) {
    return this.discovery.searchForVerifiedOrganization(user.id, query);
  }
}
