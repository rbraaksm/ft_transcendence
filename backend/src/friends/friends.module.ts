import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/model/user.entity';
import { UserModule } from 'src/user/user.module';
import { FriendsController } from './controller/friends.controller';
import { FriendRequestEntity } from './model/friends.entity';
import { FriendsService } from './service/friends.service';

@Module({
  imports: [UserModule,
    TypeOrmModule.forFeature([FriendRequestEntity, UserEntity]),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService]
})
export class FriendsModule {}
