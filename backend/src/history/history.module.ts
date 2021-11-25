import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/model/user.entity';
import { UserModule } from 'src/user/user.module';
import { HistoryController } from './controller/history.controller';
import { HistoryEntity } from './model/history.entity';
import { HistoryService } from './service/history.service';

@Module({
  imports: [UserModule,
    TypeOrmModule.forFeature([HistoryEntity, UserEntity]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService]
})
export class HistoryModule {}
