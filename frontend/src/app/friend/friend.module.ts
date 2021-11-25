import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendEntity } from './models/friend.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([FriendEntity])
  ]
})
export class FriendModule {}
