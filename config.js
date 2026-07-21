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
      "Thời gian đã cho chúng tôi gặp nhau, yêu thương đã đưa chúng tôi về chung một nhà. Trong niềm vui của hai gia đình, chúng tôi trân trọng kính mời bạn đến dự Lễ Thành Hôn của Bùi Thanh Xuân và Trần Thị Phượng. Sự hiện diện và lời chúc phúc của bạn là niềm hạnh phúc quý giá trong ngày trọng đại của chúng tôi."
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
    enabled: true, // Đổi thành true sau khi thêm assets/audio/music.mp3
    file: "assets/audio/music.mp3",
    title: "Ngày Đầu Tiên — Đức Phúc"
  },

  site: {
    domain: "", // Ví dụ: xuanphuong.id.vn
    footer: "Thanh Xuân & Thị Phượng · 30.07.2026"
  }
};
