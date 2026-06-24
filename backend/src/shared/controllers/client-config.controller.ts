import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NoHttpCache } from '@shared/decorators/http-cache.decorator';
import { ClientConfigDto } from '@shared/dtos/client-config.dto';

/**
 * Runtime client configuration. Authenticated like the rest of the API (the
 * client fetches it on launch). Lets ops tune client-side behaviour from the
 * server without shipping an app build. Grows as more knobs are needed.
 */
@ApiTags('Config')
@Controller('config')
export class ClientConfigController {
  @Get()
  @NoHttpCache()
  @ApiOperation({ summary: 'Get runtime client configuration (feature flags, future knobs).' })
  @ApiResponse({ status: 200, description: 'Client configuration', type: ClientConfigDto })
  async getConfig(): Promise<ClientConfigDto> {
    return {};
  }
}
