import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { mediaProviders } from './media.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  modules: [DatabaseModule],
  controllers: [MediaController],
  components: [
    MediaService,
    ...mediaProviders,
  ],
})
export class MediaModule {}
