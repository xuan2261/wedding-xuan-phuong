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
    guestTime: "10h00",
    ceremonyTime: "08h30",
    ceremonyLabel: "Lễ Thành Hôn",
    ceremonyNote: "Nghi thức được cử hành tại tư gia nhà trai.",
    receptionLabel: "Đón khách và dùng tiệc",
    receptionNote: "Hân hạnh đón Quý vị đến chung vui cùng hai gia đình.",
    lunarDate: "Ngày 17 tháng 6 năm Bính Ngọ",
    venueName: "Tư gia nhà trai",
    addressLine1: "346 Nguyễn Huệ",
    addressLine2: "Xã Bình Dương, Tỉnh Gia Lai",
    mapsUrl: "https://maps.app.goo.gl/zki7tKDUw8Ff8twA6",
    mapEmbedUrl: "https://www.google.com/maps?q=346%20Nguy%E1%BB%85n%20Hu%E1%BB%87%2C%20X%C3%A3%20B%C3%ACnh%20D%C6%B0%C6%A1ng%2C%20T%E1%BB%89nh%20Gia%20Lai&output=embed",

    // Các ghi chú này chỉ hiển thị khi có nội dung thật.
    landmarkNote: "",
    entranceNote: "",
    parkingNote: ""
  },

  personalization: {
    enabled: true,
    parameter: "to",
    fallbackName: "Quý vị",
    maxLength: 80,
    persistSession: false,
    sessionKey: "wedding-guest-name-v1"
  },

  invitation: {
    heading: "Trân trọng kính mời",
    message:
      "Thời gian đã đưa Thanh Xuân và Thị Phượng đến bên nhau, yêu thương đã dẫn lối để cùng xây dựng một mái ấm. Trong niềm hân hoan của hai gia đình, trân trọng kính mời Quý vị đến tham dự Lễ Thành Hôn của Bùi Thanh Xuân và Trần Thị Phượng. Sự hiện diện cùng lời chúc phúc của Quý vị là niềm vui và niềm vinh hạnh của hai gia đình trong ngày trọng đại."
  },

  // Khối gia đình tự ẩn cho đến khi có dữ liệu thật.
  families: {
    enabled: false,
    groom: {
      father: "",
      mother: "",
      location: ""
    },
    bride: {
      father: "",
      mother: "",
      location: ""
    }
  },

  contact: {
    groomPhone: "0374037026",
    bridePhone: "0906878461"
  },

  rsvp: {
    url: "https://docs.google.com/forms/d/e/1FAIpQLSdWjs5UUj2uHvNcDDpTYBWoiTZP6maOukXgVpoSq2bFh-pVew/viewform",
    deadline: "28.07.2026",
    mode: "dialog",
    lazyLoad: true,
    embedded: true,

    // Điền entry ID của câu hỏi tên khách để bật prefill.
    // Ví dụ: "entry.123456789". Để trống vẫn mở Form bình thường.
    guestNameEntry: ""
  },

  calendar: {
    enabled: true,
    file: "assets/calendar/thanh-xuan-thi-phuong.ics"
  },

  sharing: {
    enabled: true,
    title: "Lễ Thành Hôn · Thanh Xuân & Thị Phượng",
    text: "Trân trọng kính mời Quý vị đến chung vui trong Lễ Thành Hôn của Thanh Xuân và Thị Phượng.",
    sharePersonalizedByDefault: false,
    personalizedCopyEnabled: true
  },

  gifts: [
    {
      label: "Mừng cưới nhà trai",
      accountName: "BÙI THANH XUÂN",
      bankName: "MB Bank",
      accountNumber: "0374037026",
      qrImage: "assets/qr/qr-nha-trai.png"
    },
    {
      label: "Mừng cưới nhà gái",
      accountName: "TRẦN THỊ PHƯỢNG",
      bankName: "SHB Bank",
      accountNumber: "0976699400",
      qrImage: "assets/qr/qr-nha-gai.png"
    }
  ],

  wishes: {
    // Backend production: tools/wedding-wishes-webapp.gs.
    // Khi đổi deployment, cập nhật URL /exec bên dưới và giữ enabled: true.
    enabled: true,
    apiUrl: "https://script.google.com/macros/s/AKfycbzQN36EPuVLINaK4FPeQzJYFqf-iqob_FN5Ov0eUMmMZ2Yuxbw8YiW8L64pT3AjFT5o/exec",
    initialDisplayLimit: 6,
    pageSize: 6,
    maxNameLength: 50,
    maxRelationshipLength: 40,
    minMessageLength: 5,
    maxMessageLength: 280,
    cooldownSeconds: 180,
    requestTimeoutMs: 15000,
    preloadRootMargin: "1200px 0px",
    fallbackCheckThrottleMs: 180
  },

  music: {
    enabled: true,
    title: "Váy Cưới — Erik",
    volume: 0.8,

    // MP3 local là nguồn chính; URL Pancake chỉ dùng khi nguồn local lỗi.
    sources: [
      {
        src: "assets/audio/music.mp3",
        type: "audio/mpeg"
      },
      {
        src: "https://statics.pancake.vn/web-media-262/80/79/16/63/c3d171f86975dc7197c9c2031c739b0ef172a024b237d6156af08760-w:0-h:0-l:3821592-t:audio/mpeg.mp3",
        type: "audio/mpeg",
        role: "fallback"
      }
    ]
  },

  motion: {
    enabled: true,
    revealOnce: true,
    staggerMs: 70,
    dialogDurationMs: 260
  },

  site: {
    domain: "https://xuan2261.github.io/wedding-xuan-phuong/",
    footer: "Thanh Xuân & Thị Phượng · 30.07.2026"
  }
};
