import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser, LoginResponse } from './auth.types';
import { AuthenticatedUserResponseDto } from './dto/authenticated-user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';


@ApiTags('Xác thực')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiCreatedResponse({
    description: 'Tài khoản được tạo thành công',
    type: AuthenticatedUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu đăng ký không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực yêu cầu' })
  @ApiForbiddenResponse({ description: 'Không có quyền tạo tài khoản' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tài nguyên liên quan' })
  register(@Body() registerDto: RegisterDto): Promise<AuthenticatedUser> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập và nhận access token' })
  @ApiOkResponse({
    description: 'Đăng nhập thành công',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu đăng nhập không đúng' })
  @ApiUnauthorizedResponse({ description: 'Email hoặc mật khẩu không đúng' })
  @ApiForbiddenResponse({ description: 'Tài khoản bị khóa hoặc bị cấm' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tài khoản' })
  login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiOkResponse({
    description: 'Thông tin tài khoản đang đăng nhập',
    type: AuthenticatedUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Yêu cầu không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập thông tin này' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy người dùng hiện tại' })
  getProfile(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Cập nhật hồ sơ người dùng hiện tại' })
  @ApiOkResponse({
    description: 'Hồ sơ người dùng đã được cập nhật',
    type: AuthenticatedUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu hồ sơ không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền cập nhật hồ sơ này' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy người dùng hiện tại' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthenticatedUser> {
    return this.authService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Đổi mật khẩu của người dùng hiện tại' })
  @ApiOkResponse({
    description: 'Mật khẩu đã được cập nhật thành công',
    type: ChangePasswordResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Mật khẩu mới không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Mật khẩu hiện tại không chính xác hoặc thiếu token hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền đổi mật khẩu cho tài khoản này' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy người dùng hiện tại' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, dto);
  }
}
