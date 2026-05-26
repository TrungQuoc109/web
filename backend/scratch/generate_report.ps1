# PowerShell script to generate a premium MS Word document using COM Automation
$reportPath = "e:\project\web\project-management\web\report.docx"

try {
    # Initialize Word
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    # Create new Document
    $doc = $word.Documents.Add()

    # Set page margins (1 inch = 72 points)
    $doc.PageSetup.TopMargin = 72
    $doc.PageSetup.BottomMargin = 72
    $doc.PageSetup.LeftMargin = 72
    $doc.PageSetup.RightMargin = 72

    # Helper function to reset font properties
    function Reset-Formatting {
        $selection = $word.Selection
        $selection.Font.Reset()
        $selection.Font.Name = "Segoe UI"
        $selection.Font.Size = 11
        $selection.Font.Bold = $false
        $selection.Font.Italic = $false
        $selection.Font.Color = 0x2D3748 # Charcoal (BGR: 0x48372D)
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.SpaceBefore = 0
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.ParagraphFormat.LineSpacingRule = 5 # Multiple
        $selection.ParagraphFormat.LineSpacing = 13.8 # 1.15
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.FirstLineIndent = 0
    }

    # Add Title
    function Add-Title {
        param([string]$text)
        Reset-Formatting
        $selection = $word.Selection
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.Font.Size = 24
        $selection.Font.Bold = $true
        $selection.Font.Color = 0x5D361B # Navy Blue (BGR of #1B365D is 0x5D361B)
        $selection.ParagraphFormat.SpaceBefore = 24
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.TypeText($text)
        $selection.TypeParagraph()
        Reset-Formatting
    }

    # Add Subtitle
    function Add-Subtitle {
        param([string]$text)
        Reset-Formatting
        $selection = $word.Selection
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.Font.Size = 12
        $selection.Font.Italic = $true
        $selection.Font.Color = 0x718096 # Gray (BGR: 0x968071)
        $selection.ParagraphFormat.SpaceAfter = 24
        $selection.TypeText($text)
        $selection.TypeParagraph()
        Reset-Formatting
    }

    # Add Heading 1
    function Add-Heading1 {
        param([string]$text)
        Reset-Formatting
        $selection = $word.Selection
        $selection.Font.Size = 16
        $selection.Font.Bold = $true
        $selection.Font.Color = 0x5D361B # Navy Blue
        $selection.ParagraphFormat.SpaceBefore = 18
        $selection.ParagraphFormat.SpaceAfter = 8
        $selection.TypeText($text)
        $selection.TypeParagraph()
        Reset-Formatting
    }

    # Add Heading 2
    function Add-Heading2 {
        param([string]$text)
        Reset-Formatting
        $selection = $word.Selection
        $selection.Font.Size = 13
        $selection.Font.Bold = $true
        $selection.Font.Color = 0x68554A # Slate Gray (BGR of #4A5568)
        $selection.ParagraphFormat.SpaceBefore = 12
        $selection.ParagraphFormat.SpaceAfter = 4
        $selection.TypeText($text)
        $selection.TypeParagraph()
        Reset-Formatting
    }

    # Add Paragraph
    function Add-Paragraph {
        param([string]$text)
        Reset-Formatting
        $selection = $word.Selection
        $selection.TypeText($text)
        $selection.TypeParagraph()
    }

    # Add Bullet Point
    function Add-Bullet {
        param([string]$text)
        Reset-Formatting
        $selection = $word.Selection
        $selection.ParagraphFormat.LeftIndent = 18
        $selection.ParagraphFormat.FirstLineIndent = -18
        $selection.ParagraphFormat.SpaceAfter = 4
        $selection.TypeText([char]0x2022 + "`t" + $text)
        $selection.TypeParagraph()
        Reset-Formatting
    }

    # Add Code Block
    function Add-CodeBlock {
        param([string]$text)
        Reset-Formatting
        $selection = $word.Selection
        
        # We wrap in a single cell light-gray background table for beautiful code block borders!
        $table = $doc.Tables.Add($selection.Range, 1, 1)
        $cell = $table.Cell(1, 1)
        $cell.Shading.BackgroundPatternColor = 16119285 # #F7FAFC light gray (BGR: 245 * 65536 + 250 * 256 + 247 = 16119285)
        
        # Border
        $cell.Borders.Item(-1).LineStyle = 1 # Top border (thin gray)
        $cell.Borders.Item(-1).Color = 0xE2E8F0
        $cell.Borders.Item(-3).LineStyle = 1 # Bottom border (thin gray)
        $cell.Borders.Item(-3).Color = 0xE2E8F0
        $cell.Borders.Item(-4).LineStyle = 1 # Right border (thin gray)
        $cell.Borders.Item(-4).Color = 0xE2E8F0
        
        # Left border: thick slate border
        $leftBorder = $cell.Borders.Item(-2)
        $leftBorder.LineStyle = 1
        $leftBorder.LineWidth = 24 # 3pt
        $leftBorder.Color = 0xCBD5E0 # Gray border BGR
        
        # Padding
        $cell.TopPadding = 6
        $cell.BottomPadding = 6
        $cell.LeftPadding = 12
        $cell.RightPadding = 12

        # Content
        $cellRange = $cell.Range
        $cellRange.Font.Name = "Consolas"
        $cellRange.Font.Size = 9.0
        $cellRange.Font.Color = 0x803010 # Dark slate blue
        
        # Convert raw newlines `n to carriage return `r for Word paragraphs inside a cell
        $cleanText = $text.Replace("`r`n", "`n").Replace("`n", "`r")
        $cellRange.Text = $cleanText

        # Move cursor past table
        $selection.Start = $table.Range.End + 1
        $selection.TypeParagraph()
        Reset-Formatting
    }

    # Add Callout Issue Card
    function Add-Issue {
        param(
            [string]$severity,
            [string]$title,
            [string]$file,
            [string]$reason,
            [string]$solution
        )
        
        $selection = $word.Selection
        $table = $doc.Tables.Add($selection.Range, 1, 1)
        $cell = $table.Cell(1, 1)

        $bgCol = 14874082 # Suggestion (Soft Green)
        $borderCol = 0x008000 # Green
        $tag = "[SUGGESTION]"

        if ($severity -eq "CRITICAL") {
            $bgCol = 15395066 # Soft Pink (BGR)
            $borderCol = 0x0000C0 # Dark Red
            $tag = "[CRITICAL]"
        } elseif ($severity -eq "WARNING") {
            $bgCol = 14811903 # Soft Yellow (BGR)
            $borderCol = 0x0080FF # Dark Orange
            $tag = "[WARNING]"
        }

        $cell.Shading.BackgroundPatternColor = $bgCol

        # Remove borders except Left
        $cell.Borders.Item(-1).LineStyle = 0
        $cell.Borders.Item(-3).LineStyle = 0
        $cell.Borders.Item(-4).LineStyle = 0

        # Left border: thick colored
        $leftBorder = $cell.Borders.Item(-2)
        $leftBorder.LineStyle = 1
        $leftBorder.LineWidth = 36 # 4.5pt
        $leftBorder.Color = $borderCol

        $cell.TopPadding = 8
        $cell.BottomPadding = 8
        $cell.LeftPadding = 12
        $cell.RightPadding = 12

        # Insert styled text block inside cell
        $cellRange = $cell.Range
        $cellRange.Text = "" # Clear default
        
        # Build contents via document paragraphs
        # Word COM Range manipulation inside Table Cell:
        # Note: Cells end with a special end-of-cell marker, so we must insert content before the end.
        $startRange = $cell.Range.Start
        
        # Write Tag + Title
        $r1 = $doc.Range($startRange, $startRange)
        $r1.Text = "$tag $title`n"
        $r1.Font.Name = "Segoe UI"
        $r1.Font.Size = 11.5
        $r1.Font.Bold = $true
        $r1.Font.Color = $borderCol
        
        # Write File name
        $nextStart = $r1.End
        $r2 = $doc.Range($nextStart, $nextStart)
        $r2.Text = "Tệp tin: $file`n"
        $r2.Font.Name = "Segoe UI"
        $r2.Font.Size = 9.5
        $r2.Font.Bold = $true
        $r2.Font.Color = 0x68554A # Slate Gray
        
        # Write Reason
        $nextStart2 = $r2.End
        $r3 = $doc.Range($nextStart2, $nextStart2)
        $r3.Text = "Nguyên nhân: $reason`n"
        $r3.Font.Name = "Segoe UI"
        $r3.Font.Size = 10
        $r3.Font.Bold = $false
        $r3.Font.Color = 0x2D3748
        
        # Write Solution
        $nextStart3 = $r3.End
        $r4 = $doc.Range($nextStart3, $nextStart3)
        $r4.Text = "Giải pháp khắc phục: $solution"
        $r4.Font.Name = "Segoe UI"
        $r4.Font.Size = 10
        $r4.Font.Bold = $false
        $r4.Font.Color = 0x2D3748

        # Move selection past table
        $selection.Start = $table.Range.End + 1
        $selection.TypeParagraph()
        Reset-Formatting
    }

    # ==================== BUILD DOCUMENT CONTENT ====================

    # Title & Header
    Add-Title "BÁO CÁO KIỂM TRA TOÀN DIỆN KIẾN TRÚC HỆ THỐNG"
    Add-Subtitle "Real-time Collaborative Project Management System Backend Audit"

    Add-Paragraph "Báo cáo này được thực hiện bởi Chuyên gia Đánh giá Kiến trúc Hệ thống (Principal Backend Architect). Nội dung bao gồm việc kiểm toán toàn diện mã nguồn hiện tại chạy trên Stack công nghệ: TypeScript, NestJS, PostgreSQL, Prisma ORM và Socket.io. Báo cáo đánh giá sâu sắc trên 4 phương diện chính: cấu trúc thư mục (Architecture & Design), chất lượng code (Code Review & Quality), bảo mật hệ thống (Security Auditing) và tối ưu hóa hiệu năng (Performance Optimization); đồng thời đề xuất Lộ trình mở rộng quy mô lớn cho tương lai."

    # ==================== PHẦN 1 ====================
    Add-Heading1 "PHẦN 1: ĐÁNH GIÁ TỔNG THỂ & TOÀN DIỆN MÃ NGUỒN"
    Add-Paragraph "Qua quá trình rà soát trực tiếp mã nguồn ứng dụng, các vấn đề phát hiện được hệ thống hóa chi tiết theo các mức độ nghiêm trọng [CRITICAL] (Lỗi nghiêm trọng), [WARNING] (Cảnh báo rủi ro), và [SUGGESTION] (Gợi ý tối ưu) dưới đây:"

    # Issue 1: Missing Redis in Docker-Compose
    $sol1 = @'
Bổ sung container dịch vụ redis vào docker-compose.yml và khai báo biến môi trường REDIS_HOST cho container auth-service để liên kết hạ tầng.
'@
    Add-Issue -severity "CRITICAL" `
              -title "Thiếu cấu hình dịch vụ Redis trong Docker-Compose" `
              -file "backend/docker-compose.yml" `
              -reason "auth-service sử dụng RedisService (ioredis) để đồng bộ trạng thái trực tuyến (PresenceService) và kiểm soát giới hạn tần suất (RateLimitGuard), nhưng docker-compose.yml hoàn toàn không định nghĩa container chạy Redis. Ứng dụng khi triển khai thông qua Docker sẽ lập tức gặp sự cố kết nối tới Redis (127.0.0.1)." `
              -solution $sol1

    # Issue 2: Default in-memory socket.io adapter
    $sol2 = @'
Tích hợp bộ chuyển đổi `@socket.io/redis-adapter` vào NestJS và liên kết với Client Redis để đồng bộ hóa luồng truyền phát sự kiện (Rooms & Broadcasts) chéo cụm.
'@
    Add-Issue -severity "WARNING" `
              -title "Sử dụng bộ chuyển đổi Socket.io mặc định trong bộ nhớ (In-Memory Adapter)" `
              -file "backend/src/realtime/realtime.module.ts / realtime.gateway.ts" `
              -reason "Cấu hình hiện tại đang sử dụng bộ chuyển đổi in-memory mặc định của Socket.io. Khi mở rộng quy mô ngang ứng dụng (Horizontal Scaling) phía sau Load Balancer, các client kết nối chéo server instance sẽ bị cô lập và không đồng bộ được các sự kiện real-time cập nhật task hay tin nhắn." `
              -solution $sol2

    # Issue 3: SOLID SRP Violation in ProjectService
    $sol3 = @'
Phân rã ProjectService thành các dịch vụ độc lập: ProjectService chuyên CRUD dự án, ProjectMemberService quản lý thành viên/vai trò, và ProjectOwnershipService quản lý chuyển giao quyền sở hữu.
'@
    Add-Issue -severity "WARNING" `
              -title "Vi phạm nguyên lý đơn nhiệm SOLID (SRP) trong ProjectService" `
              -file "backend/src/project/project.service.ts" `
              -reason "ProjectService đang chịu trách nhiệm quá nhiều nghiệp vụ không cùng miền ngữ cảnh: CRUD dự án, quản lý thành viên, xử lý phê duyệt lời mời dự án, chuyển giao quyền sở hữu và tính toán chỉ số thống kê ở mức cơ sở dữ liệu. File phình to trên 1.260 dòng gây khó khăn lớn cho việc bảo trì." `
              -solution $sol3

    # Issue 4: Tight Coupling in RealtimeGateway
    $sol4 = @'
Chuyển đổi sang kiến trúc hướng sự kiện (Event-Driven Gateway). RealtimeGateway chỉ chịu trách nhiệm quản lý kết nối socket và định hướng phòng, các nghiệp vụ sâu sẽ được tương tác bất đồng bộ qua hệ thống EventEmitter.
'@
    Add-Issue -severity "WARNING" `
              -title "Sự gắn kết kiến trúc quá chặt (Heavy Coupling) trong RealtimeGateway" `
              -file "backend/src/realtime/realtime.gateway.ts" `
              -reason "RealtimeGateway tiêm trực tiếp 7 dịch vụ nghiệp vụ thuộc nhiều domain khác nhau (AuthService, JwtService, MessageService, TaskService, v.v.). Việc này kết hợp chặt chẽ tầng truyền thông và tầng nghiệp vụ, làm tăng rủi ro lỗi phụ thuộc vòng chéo và gây khó khăn khi viết unit test." `
              -solution $sol4

    # Issue 5: RateLimitGuard Fail-Closed
    $sol5 = @'
Chuyển sang cơ chế Fail-Open bằng cách bọc toàn bộ giao dịch Redis của RateLimitGuard trong khối lệnh try...catch. Nếu Redis gặp sự cố, hệ thống sẽ ghi log cảnh báo và cho phép request đi qua bình thường.
'@
    Add-Issue -severity "SUGGESTION" `
              -title "RateLimitGuard gặp lỗi Fail-Closed khi mất kết nối Redis" `
              -file "backend/src/shared/guards/rate-limit.guard.ts" `
              -reason "Các lệnh pipelined Redis (multi) được gọi trực tiếp không có try...catch. Khi hạ tầng Redis bị crash hoặc mất kết nối, bộ lọc RateLimitGuard sẽ chặn đứng toàn bộ các HTTP API có rate limit và trả về lỗi 500 mặc dù Database PostgreSQL vẫn hoạt động bình thường." `
              -solution $sol5

    # Issue 6: Hardcoded CORS Origins in RealtimeGateway
    $sol6 = @'
Sử dụng ConfigService được tiêm vào RealtimeGateway để đọc cấu hình CORS động từ môi trường (.env) thay vì định nghĩa tĩnh mảng defaultCorsOrigins trong code.
'@
    Add-Issue -severity "SUGGESTION" `
              -title "Khai báo cứng các cổng nguồn gốc CORS trong RealtimeGateway" `
              -file "backend/src/realtime/realtime.gateway.ts" `
              -reason "Mảng nguồn gốc cho phép kết nối WebSocket (defaultCorsOrigins) được viết cứng ngay trong mã nguồn, vi phạm tính đóng gói cấu hình và phân tách môi trường hoạt động trong NestJS." `
              -solution $sol6


    # ==================== PHẦN 2 ====================
    Add-Heading1 "PHẦN 2: PHÂN TÍCH ƯU ĐIỂM & NHƯỢC ĐIỂM (PROS & CONS)"

    Add-Heading2 "1. Ưu điểm (Pros)"
    Add-Bullet "Thiết kế Hướng sự kiện không đồng bộ: Hệ thống sử dụng cực kỳ xuất sắc mô hình sự kiện bất đồng bộ (@nestjs/event-emitter) để loại bỏ hoàn toàn các lỗi phụ thuộc vòng chéo (Circular Dependency) nguy hiểm giữa các module."
    Add-Bullet "Tối ưu hóa Truy vấn Triệt để loại bỏ N+1: Việc áp dụng song song Prisma `$transaction` kết hợp với các hàm tổng hợp gốc của PostgreSQL (groupBy, count) giúp chuyển dịch toàn bộ tính toán số liệu và phân trang từ bộ nhớ RAM xuống mức Database, mang lại hiệu năng tối đa."
    Add-Bullet "An toàn Bảo mật Phiên làm việc: Phiên hoạt động sử dụng mã khóa ngẫu nhiên (Opaque Refresh Token) băm SHA-256 đảm bảo an toàn tuyệt đối ngay cả khi cơ sở dữ liệu bị rò rỉ."
    Add-Bullet "Phòng chống Tải tệp độc hại tối tân: Kiểm tra kép (Double-layer validation) kết hợp chéo giữa phần mở rộng của file và MimeType thực tế giúp chặn đứng hoàn toàn các hình thức giả mạo đuôi ảnh để tải tệp script độc hại lên máy chủ."
    Add-Bullet "Chỉ mục GIN thông minh: Việc sử dụng trigram GIN indexes (pg_trgm) trên bảng công việc loại bỏ triệt để Full Table Scan khi tìm kiếm chuỗi ký tự không hoàn chỉnh."

    Add-Heading2 "2. Nhược điểm (Cons)"
    Add-Bullet "Thiếu khả năng mở rộng ngang WebSocket: Hệ thống vẫn phụ thuộc vào in-memory adapter của Socket.io, gây mất đồng bộ sự kiện khi mở rộng số lượng máy chủ chạy song song."
    Add-Bullet "Vi phạm nguyên lý đơn nhiệm (SRP): Lớp ProjectService bị phình to (hơn 1.260 dòng) tích tụ nhiều nghiệp vụ hỗn hợp từ CRUD đến quản lý thành viên và chuyển quyền sở hữu."
    Add-Bullet "Thiếu tầng Caching: Các API tải dữ liệu nặng từ Database (như bảng điều khiển Dashboard, thư mục dự án) chưa có lớp lưu đệm khiến PostgreSQL dễ bị quá tải kết nối."
    Add-Bullet "Rate limit dễ gây tắc nghẽn hệ thống: Thiết kế Fail-Closed của RateLimitGuard biến lỗi hạ tầng phụ trợ (Redis) thành lỗi nghiêm trọng gây sập toàn bộ luồng API nghiệp vụ chính."

    # ==================== PHẦN 3 ====================
    Add-Heading1 "PHẦN 3: HƯỚNG PHÁT TRIỂN VÀ NÂNG CẤP HỆ THỐNG"

    Add-Heading2 "1. Horizontal Scaling cho Socket.io bằng Redis Adapter"
    Add-Paragraph "Để cho phép ứng dụng mở rộng ngang thành nhiều server instance chạy song song phía sau Load Balancer, chúng tôi tích hợp bộ chuyển đổi `@socket.io/redis-adapter`. Mẫu thiết kế phân phối này sử dụng cơ chế Pub/Sub của Redis để truyền phát chéo các sự kiện WebSocket giữa các node máy chủ khác nhau."

    $code1 = @'
// backend/src/main.ts - Cấu hình tích hợp Redis Adapter cho Socket.io
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { ServerOptions } from 'socket.io';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(
    app: NestExpressApplication,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST') ?? '127.0.0.1';
    const port = this.configService.get<number>('REDIS_PORT') ?? 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD');
    
    const redisUrl = password 
      ? `redis://:${password}@${host}:${port}` 
      : `redis://${host}:${port}`;

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => this.logger.error('Redis Pub Client Error:', err));
    subClient.on('error', (err) => this.logger.error('Redis Sub Client Error:', err));

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.logger.log(`Socket.io Redis Adapter successfully connected to Redis at ${host}:${port}`);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
'@
    Add-CodeBlock $code1

    Add-Heading2 "2. Áp dụng Caching (Redis) cho các API truy vấn nặng"
    Add-Paragraph "Để bảo vệ cơ sở dữ liệu PostgreSQL khỏi tình trạng cạn kiệt pool kết nối do lượng truy vấn GET trùng lặp lớn từ nhiều người dùng đồng thời, chúng tôi xây dựng một Decorator `@CacheRedis` và một Interceptor chuyên dụng để tự động hóa hoạt động ghi đệm vào Redis với thời gian sống (TTL) định trước."

    $code2 = @'
// backend/src/shared/decorators/cache-redis.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REDIS_CACHE_METADATA_KEY = 'redis_cache_options';

export interface RedisCacheOptions {
  ttlSeconds: number;
  keyPrefix: string;
  useUserScope?: boolean; // Tách biệt cache theo từng User
}

export const CacheRedis = (options: RedisCacheOptions) =>
  SetMetadata(REDIS_CACHE_METADATA_KEY, options);
'@
    Add-CodeBlock $code2

    $code3 = @'
// backend/src/shared/interceptors/redis-cache.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../redis/redis.service';
import { REDIS_CACHE_METADATA_KEY, RedisCacheOptions } from '../decorators/cache-redis.decorator';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RedisCacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const options = this.reflector.get<RedisCacheOptions | null>(
      REDIS_CACHE_METADATA_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const url = request.originalUrl;
    
    const cacheKey = options.useUserScope && userId
      ? `cache:${options.keyPrefix}:user:${userId}:${url}`
      : `cache:${options.keyPrefix}:global:${url}`;

    try {
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        this.logger.debug(`Cache Hit for key: ${cacheKey}`);
        return of(JSON.parse(cachedData));
      }
    } catch (err) {
      this.logger.error('Failed to read from Redis cache:', err);
    }

    return next.handle().pipe(
      tap(async (responseBody) => {
        if (responseBody) {
          try {
            await this.redisService.set(
              cacheKey,
              JSON.stringify(responseBody),
              'EX',
              options.ttlSeconds,
            );
          } catch (err) {
            this.logger.error('Failed to write to Redis cache:', err);
          }
        }
      }),
    );
  }
}
'@
    Add-CodeBlock $code3

    Add-Heading2 "3. Triển khai Background Jobs (BullMQ) cho các tác vụ nặng"
    Add-Paragraph "Để giải phóng hoàn toàn luồng xử lý HTTP chính, các tác vụ tốn tài nguyên như gửi email mời thành viên, kết xuất PDF báo cáo hoạt động dự án được đưa vào hàng đợi BullMQ chạy ngầm trên nền tảng cơ sở Redis."

    $code4 = @'
// backend/src/notification/queues/email.queue.ts - Producer đưa Job vào hàng đợi
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface SendEmailJobData {
  to: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue('email-delivery') private readonly emailQueue: Queue) {}

  async enqueueInvitationEmail(to: string, projectName: string, token: string): Promise<void> {
    const data: SendEmailJobData = {
      to,
      template: 'project-invitation',
      context: { projectName, link: `https://ourproject.com/invite?token=${token}` },
    };

    await this.emailQueue.add('send-invitation', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });
  }
}
'@
    Add-CodeBlock $code4

    $code5 = @'
// backend/src/notification/processors/email.processor.ts - Worker xử lý Email ngầm
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SendEmailJobData } from '../queues/email.queue';

@Processor('email-delivery')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<SendEmailJobData, any, string>): Promise<any> {
    this.logger.log(`Processing Job ID ${job.id} of type ${job.name} for ${job.data.to}`);
    
    switch (job.name) {
      case 'send-invitation':
        await this.sendMailViaSMTP(job.data);
        break;
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
    
    return { success: true };
  }

  private async sendMailViaSMTP(data: SendEmailJobData): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2500)); // SMTP Network delay
    this.logger.log(`Email successfully delivered to ${data.to}`);
  }
}
'@
    Add-CodeBlock $code5

    Add-Heading2 "4. Cải thiện giám sát hệ thống (Monitoring & APM)"
    Add-Paragraph "Để đảm bảo hệ thống có khả năng tự phục hồi và cảnh báo sớm lỗi phát sinh, chúng tôi đề xuất thiết lập Winston Logger cấu trúc để ghi log dưới dạng JSON ở môi trường production, kết hợp thu thập số liệu thông qua Prometheus và hiển thị trực quan hóa trên Grafana."

    $code6 = @'
// backend/src/shared/logger/winston.config.ts
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              nestWinstonModuleUtilities.format.nestLike('RealtimePM', {
                colors: true,
                prettyPrint: true,
              }),
            ),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
};
'@
    Add-CodeBlock $code6

    # Save document
    $doc.SaveAs([ref]$reportPath)
    $doc.Close()
    Write-Output "Successfully generated report.docx at $reportPath"

} catch {
    Write-Output "Error generating report.docx: $_"
} finally {
    if ($word) {
        $word.Quit()
    }
}
