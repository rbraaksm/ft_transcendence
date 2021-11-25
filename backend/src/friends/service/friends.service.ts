import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap, map, catchError} from 'rxjs/operators';
import { FriendRequestEntity } from 'src/friends/model/friends.entity';
import { UserEntity } from 'src/user/model/user.entity';
import { Not, Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus, FriendRequest_Status } from '../model/friends.interface';


@Injectable()
export class FriendsService {

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FriendRequestEntity)
    private readonly friendRequestRepository: Repository<FriendRequestEntity>,
  ) { }

  findUserById(id: number): Observable<UserEntity> {
    return from(
      this.userRepository.findOne({ id }),
    ).pipe(
      map((user: UserEntity) => {
        if (!user) {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        delete user.password;
        return user;
      }),
    );
  }

  hasRequestBeenSentOrReceived(
    creator: UserEntity,
    receiver: UserEntity,
  ): Observable<boolean> {
    return from(
      this.friendRequestRepository.findOne({
        where: [
          { creator, receiver },
          { creator: receiver, receiver: creator },
        ],
      }),
    ).pipe(
      switchMap((friendRequest: FriendRequest) => {
        if (!friendRequest) return of(false);
        return of(true);
      }),
    );
  }

  userIsBlockedOrNot(
    creator: UserEntity,
    receiver: UserEntity,
  ): Observable<boolean> {
    return from(
      this.friendRequestRepository.findOne({
        where: [
          { creator, receiver, status: 'blocked' },
        ],
      }),
    ).pipe(
      switchMap((friendRequest: FriendRequest) => {
        if (!friendRequest) return of(false);
        return of(true);
      }),
    );
  }

  sendFriendRequest(
    receiverId: number,
    creator: UserEntity,
  ): Observable<FriendRequest | { error: string }> {
    if (receiverId === creator.id)
      return of({ error: 'It is not possible to add yourself!' });

    return this.findUserById(receiverId).pipe(
      switchMap((receiver: UserEntity) => {
        return this.hasRequestBeenSentOrReceived(creator, receiver).pipe(
          switchMap((hasRequestBeenSentOrReceived: boolean) => {
            if (hasRequestBeenSentOrReceived)
              return of({
                error:
                  'A friend request has already been sent of received to your account!',
              });
            let friendRequest: FriendRequest = {
              creator,
              receiver,
              status: 'pending',
            };
			
            return from(this.friendRequestRepository.save(friendRequest));
          }),
        );
      }),
    );
  }

  getFriendRequestStatus(
    receiverId: number,
    currentUser: UserEntity,
  ): Observable<FriendRequestStatus> {
    return this.findUserById(receiverId).pipe(
      switchMap((receiver: UserEntity) => {
        return from(
          this.friendRequestRepository.findOne({
            where: [
              { creator: currentUser, receiver: receiver, status: Not("blocked") },
              { creator: receiver, receiver: currentUser },
            ],
            relations: ['creator', 'receiver'],
          }),
        );
      }),
      switchMap((friendRequest: FriendRequest) => {
        if (friendRequest?.receiver.id === currentUser.id && friendRequest.status == 'pending') {
          return of({
			id: friendRequest?.id,
            status: 'waiting-for-current-user-response' as FriendRequest_Status,
          });
        }
        return of({ id: friendRequest?.id, status: friendRequest?.status || 'not-sent' });
      }),
    );
  }

  getFriendRequestUserById(friendRequestId: number): Observable<FriendRequest> {
    return from(
      this.friendRequestRepository.findOne({
        where: [{ id: friendRequestId }],
      }),
    );
  }

  respondToFriendRequest(
    statusResponse: FriendRequest_Status,
    friendRequestId: number,
  ): Observable<FriendRequestStatus> {
    return this.getFriendRequestUserById(friendRequestId).pipe(
      switchMap((friendRequest: FriendRequest) => {
        return from(
          this.friendRequestRepository.save({
            ...friendRequest,
            status: statusResponse,
          }),
        );
      }),
    );
  }

  blockUnblockFriendRequest(
    receiverId: number,
    creator: UserEntity,
	): Observable<FriendRequest | { error: string }| { success: string }> {
		if (receiverId === creator.id)
		  	return of({ error: 'It is not possible to block yourself!' });
		return this.findUserById(receiverId).pipe(
			switchMap((receiver: UserEntity) => {
				return from(
				this.friendRequestRepository.findOne({
				where: [
					{ creator, receiver, status: 'blocked' }
				],
				}),
			).pipe(
				switchMap((friendRequest: FriendRequest) => {
				if (!friendRequest) {
					let friendRequest: FriendRequest = {
						creator,
						receiver,
						status: 'blocked',
					};
					return from(this.friendRequestRepository.save(friendRequest));
				}
				this.friendRequestRepository.delete(friendRequest);
				return of({ success: 'The user is now unblocked!' });
				}),
			);
		}));
	}

  getFriendRequestsFromRecipients(
    currentUser: UserEntity,
  ): Observable<FriendRequest[]> {
    return from(
      this.friendRequestRepository.find({
        where: [{ receiver: currentUser, status: 'pending' }],
        relations: ['receiver', 'creator'],
      }),
    );
  }

	getMyFriendRequests(
		currentUser: UserEntity,
	): Promise<FriendRequest[]  | undefined> {
		const query = this.friendRequestRepository
			.createQueryBuilder("f")
			.leftJoinAndSelect('f.creator', 'c')
			.leftJoinAndSelect('f.receiver', 'r')
			.where("c.id = :id AND f.status = 'accepted'")
			.orWhere("r.id = :id AND f.status = 'accepted'")
			.setParameters({ id : currentUser.id })
			.getMany();
		return query;
	}
		
	getMyBlockedUsersRequests(
	currentUser: UserEntity,
	): Promise<FriendRequest[]  | undefined> {
		const query = this.friendRequestRepository
			.createQueryBuilder("f")
			.leftJoin('f.creator', 'c')
			.leftJoinAndSelect('f.receiver', 'r')
			.where("c.id = :id")
			.andWhere("f.status = 'blocked'")
			.setParameters({ id : currentUser.id })
			.getMany();

		return query;
  	}

	removeFriendRequest(
	receiverId: number,
	creator: UserEntity,
	): Observable<{ error: string } | { success: string }> {
		if (receiverId === creator.id)
			return of({ error: 'It is not possible!' });
		return this.findUserById(receiverId).pipe(
			switchMap((receiver: UserEntity) => {
				return from(
				this.friendRequestRepository.findOne({
				where: [
					{ creator, receiver, status: Not("blocked") },
					{ creator: receiver, receiver: creator },
				],
				}),
			).pipe(
				switchMap((friendRequest: FriendRequest) => {
				if (!friendRequest) {
					return of({ error: 'No relation!' });
				}
				this.friendRequestRepository.delete(friendRequest);
				return of({ success: 'Relation deleted!' });
				}),
			);
		}));
	}

	boolUserIsBlocked(
		creator: number,
		id: number,
	  ): Promise<number> {
		  const query = this.friendRequestRepository
			.createQueryBuilder("f")
			.leftJoin('f.creator', 'c')
			.leftJoinAndSelect('f.receiver', 'r')
			.where("c.id = :cid")
			.andWhere("r.id = :rid", { rid: id })
			.andWhere("f.status = 'blocked'")
			.setParameters({ cid : creator })
			.getCount();
		
		return  (query);
	  }

}
