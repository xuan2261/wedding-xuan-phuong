/**
 * CẤU HÌNH THIỆP CƯỚI
 * Chỉ cần sửa file này khi thay đổi thông tin.
 */
window.WEDDING_CONFIG = {
  couple: {
    groomFullName: "Bùi Thanh Xuân",
    groomDisplayName: "Thanh Xuân",
    brideFullName: "Trần Thị Phượng",
    brideDisplayName: "Thị Phượng"
  },

  event: {
    isoDateTime: "2026-07-30T08:30:00+07:00",
    weekday: "Thứ Năm",
    dateDisplay: "30.07.2026",
    guestTime: "08h00", // Dự kiến: đón khách trước giờ làm lễ 30 phút
    ceremonyTime: "08h30",
    lunarDate: "Ngày 17 tháng 6 năm Bính Ngọ",
    venueName: "Tư gia nhà trai",
    addressLine1: "346 Nguyễn Huệ",
    addressLine2: "Xã Bình Dương, Tỉnh Gia Lai",
    mapsUrl: "https://maps.app.goo.gl/zki7tKDUw8Ff8twA6"
  },

  invitation: {
    heading: "Trân trọng kính mời",
    message:
      "Thời gian đã đưa Thanh Xuân và Thị Phượng đến bên nhau, yêu thương đã dẫn lối để cùng xây dựng một mái ấm. Trong niềm hân hoan của hai gia đình, trân trọng kính mời Quý vị đến tham dự Lễ Thành Hôn của Bùi Thanh Xuân và Trần Thị Phượng. Sự hiện diện cùng lời chúc phúc của Quý vị là niềm vui và niềm vinh hạnh của hai gia đình trong ngày trọng đại."
  },

  contact: {
    groomPhone: "0374037026",
    bridePhone: "0906878461"
  },

  rsvp: {
    url: "https://docs.google.com/forms/d/e/1FAIpQLSdWjs5UUj2uHvNcDDpTYBWoiTZP6maOukXgVpoSq2bFh-pVew/viewform",
    deadline: "24.07.2026"
  },

  gifts: [
    {
      label: "Mừng cưới nhà trai",
      accountName: "BÙI THANH XUÂN",
      bankName: "MB Bank",
      accountNumber: "11111111",
      qrImage: "assets/qr/qr-nha-trai.svg"
    },
    {
      label: "Mừng cưới nhà gái",
      accountName: "TRẦN THỊ PHƯỢNG",
      bankName: "SHB Bank",
      accountNumber: "222222",
      qrImage: "assets/qr/qr-nha-gai.svg"
    }
  ],

  music: {
    enabled: true, // Giữ file assets/audio/music.mp3 hiện có trên GitHub
    file: "assets/audio/music.mp3",
    title: "Ngày Đầu Tiên — Đức Phúc",
    volume: 0.72
  },

  site: {
    domain: "https://xuan2261.github.io/wedding-xuan-phuong/",
    footer: "Thanh Xuân & Thị Phượng · 30.07.2026"
  }
};
