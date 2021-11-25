import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Observable } from 'rxjs';
import { HistoryEntity } from '../model/history.entity';
import { HistoryI } from '../model/history.interface';
import { HistoryService } from '../service/history.service';


@Controller('history')
export class HistoryController {

	constructor(
		private historyService: HistoryService,
	) { }

  	@Post()
	async create(@Body() match: HistoryI): Promise<HistoryI> {
		return this.historyService.createMatchHistory(match);
	}

	@Get()
	async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10): Promise<Pagination<HistoryEntity>> {
		limit = limit > 100 ? 100 : limit;
		return this.historyService.findAll({ page, limit, route: 'http://localhost:3000/api/history' });
  	}

	@Get('match/:id')
    async findHistoryById(@Param('id') id): Promise<Object> {
		return this.historyService.findAllByUserId(id);
    }

	@Get('matchType/:id')
    async findHistoryByIdAndType(@Param('id') id, @Query('type') type: string): Promise<Object> {
        if (type ) return this.historyService.findAllByUserIdAndType(id, type);
		return this.historyService.findAllByUserId(id);
	}
}
