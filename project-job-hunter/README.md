# Project Job Hunter

<div align="center">
  <p>Một nền tảng tìm kiếm việc làm hiện đại kết nối ứng viên và nhà tuyển dụng thông qua sức mạnh của AI, cung cấp trải nghiệm tuyệt vời cho cả hai bên.</p>
</div>

---

## Mục lục (Table of Contents)
- [Giới thiệu (Introduction)](#-giới-thiệu-introduction)
- [Danh sách tính năng (List of features)](#-danh-sách-tính-năng-list-of-features)
- [Công nghệ sử dụng (Technologies Used)](#-công-nghệ-sử-dụng-technologies-used)
- [Cài đặt (Install)](#-cài-đặt-install)
- [Cách sử dụng (Use)](#-cách-sử-dụng-use)
- [Ví dụ (Examples)](#-ví-dụ-examples)
- [Lời cảm ơn (Acknowledgments)](#-lời-cảm-ơn-acknowledgments)

---

## Giới thiệu (Introduction)
**Project Job Hunter** ra đời với mục tiêu giải quyết những khó khăn trong việc tìm kiếm việc làm và tuyển dụng truyền thống. Nền tảng kết hợp công nghệ trí tuệ nhân tạo (AI) giúp tự động gợi ý việc làm phù hợp cho ứng viên dựa trên CV, đồng thời tối ưu quá trình phân loại, tìm kiếm ứng viên của các nhà tuyển dụng.

Dự án bao gồm một hệ sinh thái đầy đủ từ Mobile App (Frontend) cho ứng viên và nhà tuyển dụng, Core Backend xử lý nghiệp vụ, Dịch vụ thanh toán riêng biệt, và một AI Service chuyên biệt cho việc phân tích CV và Job Matching.

## Danh sách tính năng (List of features)
- **Dành cho ứng viên:**
  - **CV Builder**: Tạo và quản lý CV chuyên nghiệp trực tiếp trên app.
  - **Nearby Jobs**: Tìm kiếm việc làm dựa trên vị trí hiện tại (Bản đồ).
  - **AI Match**: Gợi ý việc làm thông minh dựa trên kỹ năng và kinh nghiệm từ CV.
  - **Tax/Salary Calculator**: Công cụ tính lương Gross/Net và thuế thu nhập.
- **Dành cho nhà tuyển dụng:**
  - **Quản lý công ty**: Tạo hồ sơ công ty, đăng tin tuyển dụng.
  - **Quản lý ứng viên**: Theo dõi, sàng lọc và phân loại hồ sơ tự động nhờ AI.
- **Hệ thống thanh toán:** Tích hợp cổng thanh toán để nâng cấp gói tài khoản Premium/Pro.

## Công nghệ sử dụng (Technologies Used)

Hệ thống được thiết kế theo kiến trúc Microservices-like với các công nghệ:

- **Frontend (Mobile App)**
  - [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
  - **Expo Router** (Định tuyến)
  - **Zustand** (Quản lý trạng thái)
  - **TypeScript**
- **Backend (Core API)**
  - [Java Spring Boot](https://spring.io/projects/spring-boot) (RESTful API, JPA/Hibernate)
  - **Maven** (Quản lý thư viện)
- **AI Service**
  - **Python** (Phân tích ngôn ngữ tự nhiên NLP, Gợi ý tự động)
- **Payment Gateway (Cổng thanh toán)**
  - **Node.js & Express**
- **DevOps/Deployment**
  - **Docker & Docker Compose** (Containerization toàn bộ các dịch vụ)

## Cài đặt (Install)

Đảm bảo bạn đã cài đặt `Node.js`, `Java 17+`, `Python 3.x`, và `Docker` trên máy.

1. **Clone dự án:**
   ```bash
   git clone <repository_url>
   cd project-job-hunter
   ```

2. **Chạy qua Docker (Khuyên dùng cho Backend/Services):**
   ```bash
   docker-compose up --build -d
   ```

3. **Chạy Frontend (App Expo):**
   ```bash
   cd frontend
   npm install
   npx expo start
   ```

## Cách sử dụng (Use)
- Sau khi khởi chạy `npx expo start`, bạn có thể sử dụng ứng dụng **Expo Go** trên điện thoại iOS/Android để quét mã QR và trải nghiệm ứng dụng thật.
- **Backend API** sẽ chạy mặc định ở cổng `8080`.
- **AI Service** cung cấp các API để phân tích CV.

## Ví dụ (Examples)
*(Đang cập nhật - Bạn có thể thêm hình ảnh giao diện App, tính năng CV Builder tại đây)*
> Hình ảnh giao diện sẽ được bổ sung sau để minh họa các màn hình Tìm việc, CV Builder và Quản lý ứng viên.

## Lời cảm ơn (Acknowledgments)
- Cảm ơn cộng đồng **React Native** & **Spring Boot** vì những tài liệu tuyệt vời.
- Cảm ơn nền tảng **TopCV** đã truyền cảm hứng về một nền tảng tìm việc CNTT chất lượng, đặc biệt qua các bài viết về việc làm Java Developer hấp dẫn.
- Dự án có tham khảo các luồng nghiệp vụ trong thư mục tài liệu (`tai-lieu/`) để phân tích chức năng hoàn thiện nhất.
