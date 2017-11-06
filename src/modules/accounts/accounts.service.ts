import * as uuid from 'uuid';
import * as urlSafeBase64 from 'urlsafe-base64';
import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Account } from './interfaces/account.interface';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Component()
export class AccountsService {
  constructor(
    @Inject('AccountModelToken') private readonly accountModel: Model<Account>) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const createdAccount = new this.accountModel(createAccountDto);
    createdAccount._id = urlSafeBase64.encode(uuid.v4(null, new Buffer(16), 0));

    return await createdAccount.save();
  }

  async update(updateAccountDto: UpdateAccountDto): Promise<Account> {
    const updatedAccount = new this.accountModel(updateAccountDto);
    return await updatedAccount.save();
  }

  async remove(id: String): Promise<any> {
    return await this.accountModel.findByIdAndRemove(id).exec();
  }

  async findAll(): Promise<Account[]> {
    return await this.accountModel.find().exec();
  }

  async find(query: any): Promise<Account[]> {
    console.log(query);
    return await this.accountModel.find(query).exec();
  }

  async findById(id): Promise<Account> {
    return await this.accountModel.findById(id);
  }
}
