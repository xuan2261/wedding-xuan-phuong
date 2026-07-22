# Optimization review v12

- Loại request Apps Script khỏi initial load.
- Chỉ tải khi section gần viewport hoặc người dùng bấm Gửi lời chúc.
- Không polling, không requestIdleCallback làm giải pháp chính, không framework mới.
- Cache backend 300 giây; cache vẫn được xóa khi kiểm duyệt.
