# Danh sách màn hình — `design.pen`

> File: `/Users/cg/Desktop/me/learn/docs/design/design.pen`
> Mục đích: tra cứu nhanh nodeId của từng màn để chuyển sang Claude Code.

## Components dùng chung

| nodeId | Tên | Ghi chú |
|---|---|---|
| `v0nSM` | StatusBar | reusable — thanh giờ/pin |
| `saexg` | PhoneShell | reusable — khung điện thoại 372×780 |
| `xzXcl` | TabBar | reusable — 4 tab: Học · Tạo · Thử thách · Hồ sơ |

## 01 — Onboarding · `EuQIR`

| nodeId | Màn | Mô tả |
|---|---|---|
| `v0Vkv` | 01 Welcome | Màn chào |
| `e6t3i` | 02a Chọn chủ đề — trống | Chưa chọn chủ đề |
| `myPdm` | 02b Chọn chủ đề — đã chọn | Đã chọn chủ đề |
| `MHhZf` | 03 Level Đọc | Chọn cấp độ đọc |
| `N5NT6Z` | 05 Kết quả + Daily Goal | Kết quả & mục tiêu ngày |
| `a21pD` | 06 Đăng ký | |
| `NoJf8` | 06b Đăng nhập | |
| `JvIDh` | 07 Push priming | Xin quyền thông báo |

## 02 — Vòng lặp lõi · `tmq80`

| nodeId | Màn | Mô tả |
|---|---|---|
| `RW9TL` | 08 Home — tab Học | Trang chủ |
| `y5RJTT` | 08b Thư viện của tôi | |

## 10 — Lesson Player ✦ · `LGoq4`

> Luồng: Cover → Làm nóng → Đắm chìm đọc → Xem·Nghe → Hiểu bài → Hoàn thành.

| nodeId | Màn | Mô tả |
|---|---|---|
| `ZeE5Q` | LP1 · Cover bài học | |
| `oFKYA` | LP2 · Làm nóng | |
| `L8QvdJ` | LP2b · Làm nóng — danh sách | |
| `ZVzfM` | LP3 · Đắm chìm đọc | |
| `edu17` | LP3b · Đọc — trang 3/5 | |
| `oyotO` | LP3c · Đọc — trang cuối 5/5 | |
| `rak7A` | LP4 · Xem & Nghe | |
| `SwjYj` | LP5 · Kiểm tra nhanh | |
| `WFyG7` | LP5b · Sai → Thử lại | |
| `Z90VA2` | LP6 · Hoàn thành | |
| `LvMs5` | LP1 · Cover (Article) | Biến thể nguồn |
| `tiWTV` | LP1 · Cover (Podcast) | Biến thể nguồn |
| `fvpcK` | LP1 · Cover (Raw text) | Biến thể nguồn |
| `vPf0d` | LP4 · Nghe (Podcast) | |

## 04 — Tạo Lesson · `YIOTF`

| nodeId | Màn | Mô tả |
|---|---|---|
| `fQ8zW` | 13a Tạo — trống (disabled) | |
| `Hgzg7` | 13b Tạo — đã dán link (enabled) | |
| `kzp5K` | 13c Tạo — đính file (đang tải) | |
| `K3Z9I` | 13d Tạo — dán text (enabled) | |
| `ReiP8` | 13e Processing | |

## 05 — Hồ sơ & Series · `sBjQE`

| nodeId | Màn | Mô tả |
|---|---|---|
| `VEvmj` | 14 Hồ sơ / Stats | |
| `sHZlk` | 14b Lên Level — A2 → B1 | |
| `j2fWf` | 14c Mục tiêu ngày — Streak | |
| `rl7cV` | 17a Series — Browse | |
| `e4eYZ` | 17b Series — Detail | |

## 06 — Paywall & Thử thách · `at034`

| nodeId | Màn | Mô tả |
|---|---|---|
| `VakHP` | 15 Paywall — soft | |
| `OstYx` | 15b Xác nhận nâng cấp | |
| `A1BGx` | 15c Đang xử lý | |
| `a1liLn` | 15d Đã nâng cấp Paid | |
| `f9BHDt` | 16 Challenge Feed — Thử thách | |

## 07 — Cài đặt · `CdWCT`

| nodeId | Màn | Mô tả |
|---|---|---|
| `xaF0g` | 18 Settings | |
| `JGKtg` | 18a Ngôn ngữ | |
| `llqIW` | 18d Mục tiêu ngày | |
| `zMHcX` | 18e Level Đọc | |
| `fZvPN` | 18f Level Nghe | |

## 08 — Tài khoản · `s03Si5`

| nodeId | Màn | Mô tả |
|---|---|---|
| `t82Ds` | 18b Chỉnh sửa tài khoản | |
| `l82oyo` | 18c Xác nhận xoá tài khoản | |
| `deVxN` | 18g Đổi email | |
| `njX1d` | 18h Đổi mật khẩu | |
| `iy1Gx` | 18i Mật khẩu đã đổi | |
| `JpWvQ` | 18j Thiết bị đăng nhập | |
| `ddZxO` | 18k Ảnh đại diện | |
| `eIQ0b` | 18l Đã xoá tài khoản | |

## 09 — Edge states · `k9NSFt`

| nodeId | Màn | Mô tả |
|---|---|---|
| `Vy0Yf` | 19a Tạo lỗi | |
| `tdh2r` | 19b Mất sóng (Free) | |
| `e5ogyU` | 19c Nội dung bị từ chối | |

---

## Ghi chú

- **Bản trùng:** Trong các section 01, 02, 04, 05, 06, 07, 08, mỗi màn xuất hiện **2 lần** (hai dải instance trùng nhau trong cùng một Row). Bảng trên chỉ liệt kê **bộ đầu tiên** — bộ còn lại là bản nhân đôi, có thể bỏ qua khi chuyển sang code.
- Các nodeId của bản trùng (không cần dùng): `sHhab, DDsFP, ct4pb, L283Bo, xDLFl, aQElS, y0Ije` (01) · `A1Sp3, ZeyLz` (02) · `uDyxE, L7VDtb, hgrPM, Wecma, Zbq5H` (04) · `aScLe, aftks, DvreB, hFz0W` (05) · `o8nad, OKJRc, C8VBO2, b2y6l, HTBGD` (06) · `s4W5sl, cdutt, b0exE, bAOmy, E2EFWM` (07) · `AqJL6, zZsnz, wg2EM, j1gFmB, EAi6L, a46s1, OaClJ, E4XsaF` (08).
