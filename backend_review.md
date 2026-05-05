# 🔍 Báo Cáo Kiểm Tra Toàn Diện Backend – Job Hunter

> **Branch đang review:** `auth-profile` (đã merge từ `master`)
> **Stack:** Spring Boot 3 · Spring Security (OAuth2 Resource Server) · MySQL (Docker) · MinIO (Docker) · JWT (HS512)

---

## 1. Cấu Hình Docker & Database

### ✅ Docker Compose (`docker-compose.yml`)
- MySQL 8.0 và MinIO đều được cấu hình đúng, có volumes persistent và chung network `jobhunter-network`.
- Port mapping chuẩn: MySQL `3306:3306`, MinIO `9000:9000` (API) + `9001:9001` (Console).

### 🔴 BUG NGHIÊM TRỌNG – Database URL Xung Đột (XAMPP vs Docker)

```properties
# application.properties - HIỆN TẠI (sai)
spring.datasource.url=jdbc:mysql://localhost:3306/jobhunter_demo
spring.datasource.username=root
spring.datasource.password=          # password rỗng (kiểu XAMPP)
```

```yaml
# docker-compose.yml - MySQL Docker
MYSQL_ROOT_PASSWORD: root
MYSQL_DATABASE: jobhunter             # tên DB khác!
```

**Có 2 xung đột:**
| Vấn đề | application.properties | Docker |
|---|---|---|
| Tên database | `jobhunter_demo` | `jobhunter` |
| Password | *(rỗng)* | `root` |

**→ Backend sẽ KHÔNG thể kết nối được MySQL khi chạy với Docker.**

**Cần sửa `application.properties`:**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/jobhunter
spring.datasource.username=root
spring.datasource.password=root
```

---

## 2. Luồng JWT & Authentication

### ✅ Cấu hình JWT

- Algorithm: **HS512** – đủ mạnh và nhất quán giữa `SecurityUtil` và `SecurityConfiguration`.
- Secret key lấy từ `application.properties` qua `@Value` – đúng.
- `JwtDecoder` và `JwtEncoder` đều dùng cùng `getSecretKey()` – nhất quán.
- `JwtAuthenticationConverter` set `authoritiesClaimName = "permission"` khớp với claim mà `SecurityUtil.createAccessToken()` tạo ra.

### ✅ Luồng Login/Logout/Refresh

| Endpoint | Mô tả | Đánh giá |
|---|---|---|
| `POST /auth/login` | Xác thực → trả Access Token + set Refresh Token cookie | ✅ |
| `GET /auth/refresh` | Validate refresh token → issue token mới | ✅ |
| `POST /auth/logout` | Xóa token khỏi DB + xóa cookie | ✅ |
| `POST /auth/register` | Tạo user mới, hash password | ✅ |
| `GET /auth/account` | Lấy thông tin user hiện tại | ✅ |

### ⚠️ Cảnh Báo – Access Token & Refresh Token Cùng Expiry

```properties
demo.jwt.access-token-validity-in-seconds=8640000   # 100 ngày
demo.jwt.refresh-token-validity-in-seconds=8640000  # 100 ngày
```

Việc **access token sống 100 ngày** là rủi ro bảo mật lớn. Nếu token bị lộ, không có cách thu hồi. Nên dùng:
- Access token: **3600s (1 giờ)**
- Refresh token: **604800s (7 ngày)**

### ⚠️ Cookie `secure=true` Sẽ Không Hoạt Động Khi Dev Local

```java
ResponseCookie.from("refresh_token", refresh_token)
    .secure(true)   // Chỉ gửi qua HTTPS!
    .build();
```

Khi test local bằng HTTP, browser sẽ không gửi cookie này. Trong môi trường dev, nên set `secure(false)` hoặc dùng biến môi trường.

---

## 3. Phân Quyền (Authorization)

### Kiến Trúc 2 Lớp

```
Request → Spring Security (JWT check) → PermissionInterceptor (Role/Permission check)
```

### ✅ Spring Security Filter Chain

- WhiteList đúng: login, refresh, register, swagger, `/api/v1/premium/packages`.
- `GET /companies/**`, `GET /jobs/**`, `GET /skills/**` – public đúng.
- Mọi endpoint còn lại yêu cầu auth.

### ⚠️ BUG – PermissionInterceptor Chặn Các Endpoint Public

`PermissionInterceptorConfiguration` chỉ bypass:
```java
"/", "/api/v1/auth/**", "/storage/**", "/v3/api-docs/**", "/swagger-ui/**"
```

**Bị thiếu:**
- `/api/v1/companies/**` (GET public)
- `/api/v1/jobs/**` (GET public)
- `/api/v1/skills/**` (GET public)
- `/api/v1/premium/packages`
- `/api/v1/email/**`

→ Người dùng **chưa đăng nhập** gọi `GET /api/v1/jobs` sẽ bị **403 Forbidden** từ interceptor dù Spring Security đã cho phép.

**Cần sửa `PermissionInterceptorConfiguration`:**
```java
String[] whiteList = {
    "/", "/api/v1/auth/**", "/storage/**",
    "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
    "/api/v1/companies", "/api/v1/companies/**",
    "/api/v1/jobs", "/api/v1/jobs/**",      // THÊM
    "/api/v1/skills", "/api/v1/skills/**",   // THÊM
    "/api/v1/premium/packages",              // THÊM
    "/api/v1/email/**"                       // THÊM
};
```

### ⚠️ BUG – `DELETE /users/{id}` và `PUT /users` Sẽ Bị Chặn Bởi PermissionInterceptor

`NORMAL_USER` không có permission `DELETE /api/v1/users/{id}` hoặc `PUT /api/v1/users` trong DB, nên interceptor sẽ throw `PermissionException` **trước khi** code ownership check trong controller chạy. Logic sở hữu trong `UserController` vô nghĩa với user thường.

**Giải pháp:** Thêm permission `PUT /api/v1/users` và `DELETE /api/v1/users/{id}` vào `NORMAL_USER` role trong `DatabaseInitializer`.

### ⚠️ BUG – `POST /users/avatar` và `POST /users/change-password` Thiếu Permission

Hai endpoint mới này **không có permission tương ứng** trong `DatabaseInitializer`, nên tất cả user (kể cả SUPER_ADMIN) đều bị chặn bởi PermissionInterceptor.

**Cần thêm vào `DatabaseInitializer`:**
```java
arr.add(new Permission("Upload avatar", "/api/v1/users/avatar", "POST", "USERS"));
arr.add(new Permission("Change password", "/api/v1/users/change-password", "POST", "USERS"));
```

Và thêm cả vào NORMAL_USER permissions.

### ⚠️ BUG – `GET /jobs/saved` Thiếu Permission

`SavedJobController.getSavedJobs()` map `GET /api/v1/jobs/saved` nhưng không có permission này trong DB.

### ⚠️ `POST /premium/subscribe/{tier}` Không Bị Chặn Đúng

Endpoint này có thể gọi bởi bất kỳ user đã đăng nhập nào (controller check `currentUser.getCompany() == null` nhưng không check Role). Không có permission trong DB tương ứng.

### 🔴 Duplicate Seeder – Hai `CommandLineRunner` Conflict

Có **cả hai** `DatabaseInitializer` và `InitDataSeeder` đều là `CommandLineRunner` và đều tạo Company + Job khi DB rỗng!

```
DatabaseInitializer → tạo FPT, VNG + 2 jobs
InitDataSeeder      → tạo FPT, Vietcombank, TopCV + 5 jobs
```

→ Mỗi lần start app sẽ bị chạy CẢ HAI, gây ra dữ liệu trùng lặp.

**Giải pháp:** Xóa phần tạo Company/Job trong `InitDataSeeder` (giữ lại chỉ `DatabaseInitializer` đã đủ đầy hơn), hoặc xóa hẳn `InitDataSeeder`.

---

## 4. MinIO – Kết Nối và Upload File

### ✅ MinIO Service Hoạt Động Đúng

- `MinioService` khởi tạo `MinioClient` đúng từ config.
- Tự động tạo bucket nếu chưa tồn tại – rất tốt.
- `uploadFile()` và `getFileUrl()` (presigned URL 1 giờ) – đúng.

### ✅ FileController

- Validate extension (pdf, jpg, jpeg, png, doc, docx) – đúng.
- Check role NORMAL_USER chỉ upload folder `resume` – đúng.
- `GET /files?fileName=...` trả presigned URL – đúng.

### ⚠️ MinIO URL Cần Kiểm Tra Khi Test

```properties
demo.minio.url=http://localhost:9000
```

Khi backend Spring Boot chạy trên host machine kết nối Docker MinIO qua `localhost:9000` → **ổn**.

Nhưng nếu Spring Boot cũng chạy trong Docker container (cùng compose), cần đổi thành `http://minio:9000` (tên service Docker). Hiện tại với `docker-compose.yml` chưa có service `backend` nên không bị lỗi này.

### ✅ Có Thể Test MinIO Ngay

MinIO Console: **http://localhost:9001** | User: `minioadmin` | Pass: `minioadmin`

Swagger test upload: **POST /api/v1/files** với `file` (multipart) + `folder=resume`.

---

## 5. Controllers – Đánh Giá Chi Tiết

| Controller | Vấn đề |
|---|---|
| `AuthController` | ✅ Tốt. Login/refresh/logout/register đầy đủ. |
| `UserController` | ⚠️ Ownership check bị bypass bởi interceptor (xem mục 3). `uploadAvatar` thiếu permission. |
| `FileController` | ✅ Tốt. Validate và role check. |
| `JobController` | ⚠️ `GET /jobs/recommend` trả `Pageable.unpaged()` – nguy hiểm nếu DB có 100k+ jobs. `GET /jobs/{id}` trả raw `Job` entity thay vì DTO (có thể lộ lazy fields). |
| `ResumeController` | ⚠️ `GET /resumes` filter theo company jobs nhưng nếu `arrJobIds = null` sẽ throw exception từ SpringFilter. |
| `CompanyController` | Cần xem thêm |
| `PremiumController` | ⚠️ `PremiumService.subscribePremium()` không được dùng – controller tự handle logic (duplicate code). |
| `SavedJobController` | ⚠️ Thiếu permission trong DB. |

---

## 6. Services – Đánh Giá

| Service | Vấn đề |
|---|---|
| `UserService` | ✅ Tốt, converter tách bạch. `handleChangePassword` không hash password – **BUG đã fix ở Controller**. |
| `ResumeService` | ⚠️ Mix `@Autowired` và constructor injection – nên dùng nhất quán constructor injection. |
| `PremiumService` | ⚠️ `subscribePremium()` không được gọi từ `PremiumController`. Logic bị duplicate. |
| `MatchScoreService` | ✅ Logic đơn giản, dùng được. Default score 50 khi job không có skill là OK. |
| `MinioService` | ✅ Tốt. |
| `FileService` | ✅ Đơn giản, tốt. |

---

## 7. Database Entities

### ✅ Tốt
- Tất cả entities dùng `@PrePersist` / `@PreUpdate` cho `createdAt/updatedAt/createdBy/updatedBy`.
- `@JsonIgnore` đúng chỗ trên các quan hệ 1-N để tránh infinite loop.
- `User.refreshToken` dùng `MEDIUMTEXT` – đúng cho JWT dài.
- Role ↔ Permission: `@ManyToMany` với join table `permission_role` – đúng.

### ⚠️ Lưu Ý
- `Company.active` default `false` (không active). Cần set `active = true` khi tạo công ty qua API.
- `Company.jobCount = 0` không được cập nhật tự động – cần maintain thủ công hoặc dùng `@Formula`.

---

## 8. Error Handling

### ✅ GlobalException
- Xử lý đầy đủ: `BadCredentials`, `UsernameNotFound`, `IdInvalid`, `Storage`, `Permission`, `MethodArgumentNotValid`.

### 🔴 BUG – `handleNotFoundException` Trả Sai HTTP Status

```java
@ExceptionHandler(NoResourceFoundException.class)
public ResponseEntity<...> handleNotFoundException(Exception ex) {
    // ...
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);  // ← SAI!
    // Phải là HttpStatus.NOT_FOUND (404)
}
```

---

## 9. CORS Configuration

```java
configuration.setAllowedOriginPatterns(
    Arrays.asList("http://localhost:*", "http://127.0.0.1:*"));
```

✅ Pattern wildcard port – phù hợp cho Expo/React Native dev.
✅ `setAllowCredentials(true)` – cần thiết cho cookie refresh token.

---

## 📋 Tổng Hợp – Danh Sách Bug Cần Fix Trước Frontend

### 🔴 Nghiêm Trọng (Phải Fix)

| # | File | Vấn đề |
|---|---|---|
| 1 | `application.properties` | URL DB `jobhunter_demo` ≠ Docker `jobhunter`, password rỗng ≠ `root` |
| 2 | `PermissionInterceptorConfiguration` | Thiếu bypass cho GET jobs/companies/skills/premium/email |
| 3 | `DatabaseInitializer` + `InitDataSeeder` | Hai seeder chạy song song, duplicate dữ liệu |

### ⚠️ Quan Trọng (Nên Fix)

| # | File | Vấn đề |
|---|---|---|
| 4 | `DatabaseInitializer` | Thiếu permission: `users/avatar`, `users/change-password`, `jobs/saved` |
| 5 | `GlobalException` | `handleNotFoundException` trả `400` thay vì `404` |
| 6 | `application.properties` | Access token sống 100 ngày – rủi ro bảo mật |
| 7 | `AuthController` | Cookie `secure=true` không hoạt động với HTTP dev |
| 8 | `PremiumController` | Không dùng `PremiumService` – logic bị duplicate |
| 9 | `ResumeService` | Mix `@Autowired` và constructor injection |

### 💡 Gợi Ý Cải Thiện (Tùy Chọn)

| # | Vấn đề |
|---|---|
| 10 | `GET /jobs/recommend` dùng `Pageable.unpaged()` – giới hạn top N jobs trước khi calculate |
| 11 | `GET /jobs/{id}` trả raw `Job` entity – nên dùng DTO |
| 12 | `Company.jobCount` không được auto-update |

---

## ✅ Kết Luận

Backend về cơ bản **được thiết kế tốt** – luồng JWT, cấu trúc phân lớp Controller/Service/Repository rõ ràng, phân quyền RBAC đầy đủ. MinIO đã sẵn sàng test.

**Để chạy được với Docker ngay bây giờ**, bắt buộc phải fix bug #1, #2, #3 trước. Sau đó chạy `docker compose up -d` và start backend là có thể test toàn bộ qua Swagger UI tại `http://localhost:8080/swagger-ui.html`.
