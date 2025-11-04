import { Injectable } from '@nestjs/common';
import { CreateLockDto } from './dto/create-lock.dto';
import { UpdateLockDto } from './dto/update-lock.dto';

@Injectable()
export class LockService {
  create(createLockDto: CreateLockDto) {
    return 'This action adds a new lock';
  }

  findAll() {
    return `This action returns all lock`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lock`;
  }

  update(id: number, updateLockDto: UpdateLockDto) {
    return `This action updates a #${id} lock`;
  }

  remove(id: number) {
    return `This action removes a #${id} lock`;
  }
}
