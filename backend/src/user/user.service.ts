import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import UserRepository from './user.repository';
import { SignupDto } from 'src/auth/dto/signup.dto';
import { RoleUpdateDto } from './dto/role.update.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: UserRepository,
  ) {}

  
  async createUser(dto: SignupDto): Promise<User> {
    const isUser = await this.userRepository.findOneBy({ email: dto.email });
    if (isUser) {
      throw new BadRequestException('User already exists.');
    }
    

    const { firstName, lastName, email, password } = dto;

    const newUser = await this.userRepository.create({
      firstName,
      lastName,
      email,
      password,
    });
    console.log(newUser);
    const savedUser = await this.userRepository.save(newUser);
    delete savedUser.password;
    return savedUser;
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    await this.userRepository.save(user);

    delete user.password;

    return user;
  }

  async setUserRole(dto: RoleUpdateDto): Promise<User[]> {
    const response: User[] = [];
    
    for (const userId of dto.userIds) {
      const user = await this.userRepository.findOneBy({ id: Number(userId) });
      if (!user) {
        console.error(`User with ID ${userId} not found`);
        continue;
      }
      await this.userRepository.save(user);
      delete user.password;
      response.push(user);
    }
    return response;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOneBy({ email: email });
  }

 
  

  async saveUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async createUserWithoutPassword({
    email,
    firstName,
    lastName,
  }): Promise<User> {
    return this.userRepository.save({ email, firstName, lastName });
  }
}
