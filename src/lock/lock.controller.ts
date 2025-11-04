import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LockService } from './lock.service';
import { CreateLockDto } from './dto/create-lock.dto';
import { UpdateLockDto } from './dto/update-lock.dto';

@Controller('lock')
export class LockController {
  constructor(private readonly lockService: LockService) {}

  @Post()
  create(@Body() createLockDto: CreateLockDto) {
    return this.lockService.create(createLockDto);
  }

  @Get()
  findAll() {
    return this.lockService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lockService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLockDto: UpdateLockDto) {
    return this.lockService.update(+id, updateLockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lockService.remove(+id);
  }
}
