/**
 * CẤU HÌNH THIỆP CƯỚI ĐA SỰ KIỆN — v19
 *
 * URL mẫu:
 *   #to=Gia%20đình%20cô%20Lan&event=bride
 *   #to=Anh%20Minh&event=groom
 *   #to=Chị%20Hương&event=nhatrang
 *   #to=Nhóm%20bạn&events=nhatrang,saigon&event=nhatrang
 */
(() => {
  "use strict";

  const SOURCE = {
    build: {
      buildId: "v19.2-20260724",
      release: "v19.2",
      status: "draft-multi-event-cinematic-v2"
    },

    couple: {
      groomFullName: "Bùi Thanh Xuân",
      groomDisplayName: "Thanh Xuân",
      brideFullName: "Trần Thị Phượng",
      brideDisplayName: "Thị Phượng"
    },

    defaultEventId: "groom",

    personalization: {
      enabled: true,
      parameter: "to",
      eventParameter: "event",
      eventsParameter: "events",
      fallbackName: "Quý vị",
      maxLength: 80,
      persistSession: false,
      sessionKey: "wedding-guest-name-v1"
    },

    families: {
      enabled: false,
      groom: { father: "", mother: "", location: "" },
      bride: { father: "", mother: "", location: "" }
    },

    contact: {
      groomPhone: "0374037026",
      bridePhone: "0906878461"
    },

    giftCatalog: {
      groom: {
        id: "groom",
        label: "Mừng cưới nhà trai",
        accountName: "BÙI THANH XUÂN",
        bankName: "MB Bank",
        accountNumber: "0374037026",
        qrImage: "assets/qr/qr-nha-trai.png"
      },
      bride: {
        id: "bride",
        label: "Mừng cưới nhà gái",
        accountName: "TRẦN THỊ PHƯỢNG",
        bankName: "SHB Bank",
        accountNumber: "0976699400",
        qrImage: "assets/qr/qr-nha-gai.png"
      }
    },

    rsvpDefaults: {
      mode: "dialog",
      lazyLoad: true,
      embedded: true,
      eventEntry: ""
    },

    sharingDefaults: {
      enabled: true,
      sharePersonalizedByDefault: false,
      personalizedCopyEnabled: true
    },

    events: {
      bride: {
        id: "bride",
        status: "confirmed-partial",
        title: "Tiệc cưới nhà gái",
        shortTitle: "Nhà gái · 29/07",
        heroKicker: "Tiệc cưới nhà gái",
        event: {
          isoDateTime: "2026-07-29T09:00:00+07:00",
          weekday: "Thứ Tư",
          dateDisplay: "29.07.2026",
          lunarDate: "Ngày 16 tháng 6 năm Bính Ngọ",
          timeline: [
            { time: "09h00", datetime: "2026-07-29T09:00:00+07:00", label: "Đón khách", note: "Gia đình nhà gái hân hạnh đón tiếp Quý vị." },
            { time: "09h30", datetime: "2026-07-29T09:30:00+07:00", label: "Làm lễ", note: "Nghi thức được cử hành tại tư gia nhà gái." },
            { time: "10h00", datetime: "2026-07-29T10:00:00+07:00", label: "Khai tiệc", note: "Kính mời Quý vị cùng chung vui trong tiệc cưới." }
          ],
          venueName: "Tư gia nhà gái",
          addressLine1: "Thôn Định Thiện Tây",
          addressLine2: "Xã Tuy Phước Bắc, Tỉnh Gia Lai",
          mapsUrl: "https://maps.app.goo.gl/6E3JzWf4MQboumNH7",
          mapEmbedUrl: "",
          mapsVerified: false,
          venueStatusNote: "Liên kết bản đồ đã được nhập nhưng chưa xác minh điểm ghim; popup bản đồ tạm ẩn.",
          landmarkNote: "",
          entranceNote: "",
          parkingNote: "",
          directionPhoneRole: "bride"
        },
        invitation: {
          heading: "Trân trọng kính mời",
          guestLead: "Đến tham dự",
          eventName: "Tiệc cưới tại nhà gái",
          message: "Trong niềm hân hoan của hai gia đình, Thanh Xuân và Thị Phượng trân trọng kính mời Quý vị đến chung vui trong Tiệc cưới tại nhà gái. Sự hiện diện và lời chúc phúc của Quý vị là niềm vui quý giá đối với cô dâu, chú rể và gia đình."
        },
        labels: {
          eventKicker: "Nhà gái",
          eventTitle: "Lịch trình tiệc cưới nhà gái",
          countdownKicker: "Đếm ngược",
          countdownTitle: "Chờ ngày chung vui tại nhà gái",
          actionsTitle: "Xác nhận tham dự tiệc nhà gái",
          actionsDescription: "Thông tin RSVP sẽ được bổ sung khi biểu mẫu đa sự kiện hoàn tất."
        },
        rsvp: { enabled: false, url: "", deadline: "", guestNameEntry: "", pendingMessage: "RSVP cho tiệc nhà gái sẽ được cập nhật sau." },
        calendar: { enabled: true, file: "assets/calendar/tiec-cuoi-nha-gai-2026-07-29.ics", label: "Thêm tiệc nhà gái vào lịch" },
        lifecycle: {
          enabled: true,
          rsvpClosesAt: "",
          weddingDayStartsAt: "2026-07-29T00:00:00+07:00",
          weddingDayEndsAt: "2026-07-29T23:59:59+07:00",
          giftsHideAt: "",
          weddingDayMessage: "Hôm nay là ngày chung vui tại nhà gái. Gia đình hân hạnh được đón tiếp Quý vị.",
          postWeddingMessage: "Thanh Xuân, Thị Phượng và gia đình nhà gái trân trọng cảm ơn Quý vị đã chung vui.",
          rsvpClosedMessage: "RSVP cho tiệc nhà gái đã khép lại. Quý vị vui lòng liên hệ trực tiếp cô dâu hoặc chú rể nếu cần hỗ trợ."
        },
        giftIds: ["bride"],
        sharing: {
          title: "Tiệc cưới nhà gái · Thanh Xuân & Thị Phượng",
          text: "Trân trọng kính mời Quý vị đến chung vui trong Tiệc cưới tại nhà gái của Thanh Xuân và Thị Phượng."
        }
      },

      groom: {
        id: "groom",
        status: "confirmed-partial",
        title: "Lễ Thành Hôn và tiệc nhà trai",
        shortTitle: "Nhà trai · 30/07",
        heroKicker: "Lễ Thành Hôn",
        event: {
          isoDateTime: "2026-07-30T08:30:00+07:00",
          weekday: "Thứ Năm",
          dateDisplay: "30.07.2026",
          lunarDate: "Ngày 17 tháng 6 năm Bính Ngọ",
          timeline: [
            { time: "08h30", datetime: "2026-07-30T08:30:00+07:00", label: "Lễ Thành Hôn", note: "Nghi thức được cử hành tại tư gia nhà trai." },
            { time: "10h00", datetime: "2026-07-30T10:00:00+07:00", label: "Đón khách và dùng tiệc", note: "Hân hạnh đón Quý vị đến chung vui cùng hai gia đình." }
          ],
          venueName: "Tư gia nhà trai",
          addressLine1: "346 Nguyễn Huệ",
          addressLine2: "Xã Bình Dương, Tỉnh Gia Lai",
          mapsUrl: "https://maps.app.goo.gl/zki7tKDUw8Ff8twA6",
          mapEmbedUrl: "https://www.google.com/maps?q=14.2869225,109.0786394&z=17&output=embed",
          mapsVerified: true,
          venueStatusNote: "",
          landmarkNote: "",
          entranceNote: "",
          parkingNote: "",
          directionPhoneRole: "groom"
        },
        invitation: {
          heading: "Trân trọng kính mời",
          guestLead: "Đến tham dự",
          eventName: "Lễ Thành Hôn",
          message: "Thời gian đã đưa Thanh Xuân và Thị Phượng đến bên nhau, yêu thương đã dẫn lối để cùng xây dựng một mái ấm. Trong niềm hân hoan của hai gia đình, trân trọng kính mời Quý vị đến tham dự Lễ Thành Hôn và chung vui trong tiệc cưới tại nhà trai."
        },
        labels: {
          eventKicker: "Nhà trai",
          eventTitle: "Lịch trình Lễ Thành Hôn",
          countdownKicker: "Đếm ngược",
          countdownTitle: "Chờ ngày chung đôi",
          actionsTitle: "Xác nhận tham dự lễ nhà trai",
          actionsDescription: "Thông tin RSVP đa sự kiện sẽ được bổ sung sau khi Google Form mới được tạo."
        },
        rsvp: { enabled: false, url: "", deadline: "", guestNameEntry: "", pendingMessage: "RSVP đa sự kiện đang được hoàn thiện. Quý vị cần xác nhận sớm vui lòng liên hệ cô dâu hoặc chú rể." },
        calendar: { enabled: true, file: "assets/calendar/le-thanh-hon-nha-trai-2026-07-30.ics", label: "Thêm lễ nhà trai vào lịch" },
        lifecycle: {
          enabled: true,
          rsvpClosesAt: "",
          weddingDayStartsAt: "2026-07-30T00:00:00+07:00",
          weddingDayEndsAt: "2026-07-30T23:59:59+07:00",
          giftsHideAt: "",
          weddingDayMessage: "Hôm nay là ngày chung đôi. Hai gia đình hân hạnh được đón tiếp Quý vị.",
          postWeddingMessage: "Thanh Xuân, Thị Phượng và hai gia đình trân trọng cảm ơn Quý vị đã hiện diện và gửi lời chúc phúc.",
          rsvpClosedMessage: "RSVP lễ nhà trai đã khép lại. Quý vị vui lòng liên hệ trực tiếp cô dâu hoặc chú rể nếu cần hỗ trợ."
        },
        giftIds: ["groom"],
        sharing: {
          title: "Lễ Thành Hôn · Thanh Xuân & Thị Phượng",
          text: "Trân trọng kính mời Quý vị đến chung vui trong Lễ Thành Hôn của Thanh Xuân và Thị Phượng."
        }
      },

      nhatrang: {
        id: "nhatrang",
        status: "draft",
        title: "Tiệc Báo Hỷ tại Nha Trang",
        shortTitle: "Nha Trang · 15/08",
        heroKicker: "Tiệc Báo Hỷ · Nha Trang",
        event: {
          isoDateTime: "2026-08-15T17:00:00+07:00",
          weekday: "Thứ Bảy",
          dateDisplay: "15.08.2026",
          lunarDate: "",
          timeline: [
            { time: "17h00", datetime: "2026-08-15T17:00:00+07:00", label: "Đón khách", note: "Thanh Xuân và Thị Phượng hân hạnh đón tiếp Quý vị." },
            { time: "18h00", datetime: "2026-08-15T18:00:00+07:00", label: "Bắt đầu Tiệc Báo Hỷ", note: "Kính mời Quý vị cùng chung vui trong buổi tiệc thân mật." }
          ],
          venueName: "Nhà hàng Nha Trang",
          addressLine1: "Nha Trang",
          addressLine2: "Địa chỉ cụ thể sẽ cập nhật",
          mapsUrl: "",
          mapEmbedUrl: "",
          draftMapsUrl: "https://maps.app.goo.gl/6E3JzWf4MQboumNH7",
          mapsVerified: false,
          venueStatusNote: "Tên nhà hàng, địa chỉ chi tiết và bản đồ đang chờ xác nhận. Liên kết đã cung cấp trùng với sự kiện nhà gái nên chưa được sử dụng.",
          landmarkNote: "",
          entranceNote: "",
          parkingNote: "",
          directionPhoneRole: "groom"
        },
        invitation: {
          heading: "Trân trọng báo tin vui",
          guestLead: "Đến chung vui trong",
          eventName: "Tiệc Báo Hỷ tại Nha Trang",
          message: "Sau ngày chung đôi, Thanh Xuân và Thị Phượng trân trọng thông báo tin vui và kính mời Quý vị đến chung vui trong buổi Tiệc Báo Hỷ thân mật tại Nha Trang. Sự hiện diện của Quý vị là niềm vui quý giá đối với hai vợ chồng."
        },
        labels: {
          eventKicker: "Nha Trang",
          eventTitle: "Lịch trình Tiệc Báo Hỷ",
          countdownKicker: "Hẹn gặp tại Nha Trang",
          countdownTitle: "Đếm ngược đến Tiệc Báo Hỷ",
          actionsTitle: "Xác nhận tham dự Báo Hỷ Nha Trang",
          actionsDescription: "Biểu mẫu RSVP sẽ được bật sau khi địa điểm và danh sách khách được chốt."
        },
        rsvp: { enabled: false, url: "", deadline: "", guestNameEntry: "", pendingMessage: "RSVP Tiệc Báo Hỷ Nha Trang sẽ cập nhật sau." },
        calendar: { enabled: true, file: "assets/calendar/bao-hy-nha-trang-2026-08-15.ics", label: "Thêm Báo Hỷ Nha Trang vào lịch" },
        lifecycle: {
          enabled: true,
          rsvpClosesAt: "",
          weddingDayStartsAt: "2026-08-15T00:00:00+07:00",
          weddingDayEndsAt: "2026-08-15T23:59:59+07:00",
          giftsHideAt: "",
          weddingDayMessage: "Hôm nay là Tiệc Báo Hỷ tại Nha Trang. Thanh Xuân và Thị Phượng hân hạnh được đón tiếp Quý vị.",
          postWeddingMessage: "Thanh Xuân và Thị Phượng trân trọng cảm ơn Quý vị đã đến chung vui tại Nha Trang.",
          rsvpClosedMessage: "RSVP Tiệc Báo Hỷ Nha Trang đã khép lại. Quý vị vui lòng liên hệ trực tiếp nếu cần hỗ trợ."
        },
        giftIds: ["groom", "bride"],
        sharing: {
          title: "Tiệc Báo Hỷ Nha Trang · Thanh Xuân & Thị Phượng",
          text: "Trân trọng kính mời Quý vị đến chung vui trong Tiệc Báo Hỷ tại Nha Trang của Thanh Xuân và Thị Phượng."
        }
      },

      saigon: {
        id: "saigon",
        status: "draft",
        title: "Tiệc Báo Hỷ tại Sài Gòn",
        shortTitle: "Sài Gòn · 22/08",
        heroKicker: "Tiệc Báo Hỷ · Sài Gòn",
        event: {
          isoDateTime: "2026-08-22T17:00:00+07:00",
          weekday: "Thứ Bảy",
          dateDisplay: "22.08.2026",
          lunarDate: "",
          timeline: [
            { time: "17h00", datetime: "2026-08-22T17:00:00+07:00", label: "Đón khách", note: "Thanh Xuân và Thị Phượng hân hạnh đón tiếp Quý vị." },
            { time: "18h00", datetime: "2026-08-22T18:00:00+07:00", label: "Bắt đầu Tiệc Báo Hỷ", note: "Kính mời Quý vị cùng chung vui trong buổi tiệc thân mật." }
          ],
          venueName: "Nhà hàng hải sản Seasan",
          addressLine1: "Sài Gòn",
          addressLine2: "Địa chỉ cụ thể sẽ cập nhật",
          mapsUrl: "",
          mapEmbedUrl: "",
          draftMapsUrl: "https://maps.app.goo.gl/6E3JzWf4MQboumNH7",
          mapsVerified: false,
          venueStatusNote: "Địa chỉ chi tiết và bản đồ đang chờ xác nhận. Liên kết đã cung cấp trùng với sự kiện nhà gái nên chưa được sử dụng.",
          landmarkNote: "",
          entranceNote: "",
          parkingNote: "",
          directionPhoneRole: "groom"
        },
        invitation: {
          heading: "Trân trọng báo tin vui",
          guestLead: "Đến chung vui trong",
          eventName: "Tiệc Báo Hỷ tại Sài Gòn",
          message: "Sau ngày chung đôi, Thanh Xuân và Thị Phượng trân trọng thông báo tin vui và kính mời Quý vị đến chung vui trong buổi Tiệc Báo Hỷ thân mật tại Sài Gòn. Sự hiện diện của Quý vị là niềm vui quý giá đối với hai vợ chồng."
        },
        labels: {
          eventKicker: "Sài Gòn",
          eventTitle: "Lịch trình Tiệc Báo Hỷ",
          countdownKicker: "Hẹn gặp tại Sài Gòn",
          countdownTitle: "Đếm ngược đến Tiệc Báo Hỷ",
          actionsTitle: "Xác nhận tham dự Báo Hỷ Sài Gòn",
          actionsDescription: "Biểu mẫu RSVP sẽ được bật sau khi địa chỉ và danh sách khách được chốt."
        },
        rsvp: { enabled: false, url: "", deadline: "", guestNameEntry: "", pendingMessage: "RSVP Tiệc Báo Hỷ Sài Gòn sẽ cập nhật sau." },
        calendar: { enabled: true, file: "assets/calendar/bao-hy-sai-gon-2026-08-22.ics", label: "Thêm Báo Hỷ Sài Gòn vào lịch" },
        lifecycle: {
          enabled: true,
          rsvpClosesAt: "",
          weddingDayStartsAt: "2026-08-22T00:00:00+07:00",
          weddingDayEndsAt: "2026-08-22T23:59:59+07:00",
          giftsHideAt: "",
          weddingDayMessage: "Hôm nay là Tiệc Báo Hỷ tại Sài Gòn. Thanh Xuân và Thị Phượng hân hạnh được đón tiếp Quý vị.",
          postWeddingMessage: "Thanh Xuân và Thị Phượng trân trọng cảm ơn Quý vị đã đến chung vui tại Sài Gòn.",
          rsvpClosedMessage: "RSVP Tiệc Báo Hỷ Sài Gòn đã khép lại. Quý vị vui lòng liên hệ trực tiếp nếu cần hỗ trợ."
        },
        giftIds: ["groom", "bride"],
        sharing: {
          title: "Tiệc Báo Hỷ Sài Gòn · Thanh Xuân & Thị Phượng",
          text: "Trân trọng kính mời Quý vị đến chung vui trong Tiệc Báo Hỷ tại Sài Gòn của Thanh Xuân và Thị Phượng."
        }
      }
    },

    wishes: {
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
      volume: 0.35,
      sources: [
        { src: "assets/audio/music.mp3", type: "audio/mpeg" },
        { src: "https://statics.pancake.vn/web-media-262/80/79/16/63/c3d171f86975dc7197c9c2031c739b0ef172a024b237d6156af08760-w:0-h:0-l:3821592-t:audio/mpeg.mp3", type: "audio/mpeg", role: "fallback" }
      ]
    },


    openingExperience: {
      enabled: true,
      rememberSession: false,
      autoStoryDefault: true,
      simpleModeEnabled: true,
      openingDurationMs: 1580,
      storyStartDelayMs: 4400,
      storyHoldMs: 6500,
      pauseOnInteraction: true,
      pauseOnDialogs: true,
      sealPulseIterations: 2
    },

    motion: {
      enabled: true,
      revealOnce: true,
      staggerMs: 70,
      dialogDurationMs: 260
    },

    site: {
      domain: "https://xuan2261.github.io/wedding-xuan-phuong/"
    }
  };

  const validIds = Object.keys(SOURCE.events);
  const hashParams = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));
  const requestedMany = String(hashParams.get(SOURCE.personalization.eventsParameter) || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value, index, values) => validIds.includes(value) && values.indexOf(value) === index);
  const requestedOne = String(hashParams.get(SOURCE.personalization.eventParameter) || "")
    .trim()
    .toLowerCase();

  const invitedEventIds = requestedMany.length
    ? requestedMany
    : validIds.includes(requestedOne)
      ? [requestedOne]
      : [SOURCE.defaultEventId];
  const activeEventId = invitedEventIds.includes(requestedOne)
    ? requestedOne
    : invitedEventIds[0];
  const profile = SOURCE.events[activeEventId] || SOURCE.events[SOURCE.defaultEventId];
  const directionPhone = profile.event.directionPhoneRole === "bride"
    ? SOURCE.contact.bridePhone
    : SOURCE.contact.groomPhone;

  window.WEDDING_CONFIG = Object.freeze({
    build: SOURCE.build,
    couple: SOURCE.couple,
    personalization: SOURCE.personalization,
    families: SOURCE.families,
    contact: { ...SOURCE.contact, directionPhone },
    eventCatalog: Object.freeze(validIds.map((id) => ({
      id,
      title: SOURCE.events[id].title,
      shortTitle: SOURCE.events[id].shortTitle,
      status: SOURCE.events[id].status
    }))),
    eventContext: Object.freeze({
      activeEventId,
      invitedEventIds: Object.freeze([...invitedEventIds])
    }),
    event: Object.freeze({
      ...profile.event,
      id: profile.id,
      title: profile.title,
      shortTitle: profile.shortTitle,
      status: profile.status,
      heroKicker: profile.heroKicker
    }),
    invitation: Object.freeze(profile.invitation),
    labels: Object.freeze(profile.labels),
    rsvp: Object.freeze({ ...SOURCE.rsvpDefaults, ...profile.rsvp }),
    calendar: Object.freeze(profile.calendar),
    lifecycle: Object.freeze(profile.lifecycle),
    sharing: Object.freeze({ ...SOURCE.sharingDefaults, ...profile.sharing }),
    gifts: Object.freeze(profile.giftIds.map((id) => SOURCE.giftCatalog[id]).filter(Boolean)),
    wishes: Object.freeze(SOURCE.wishes),
    music: Object.freeze(SOURCE.music),
    motion: Object.freeze(SOURCE.motion),
    openingExperience: Object.freeze(SOURCE.openingExperience),
    site: Object.freeze({
      ...SOURCE.site,
      footer: `Thanh Xuân & Thị Phượng · ${profile.shortTitle}`
    })
  });
})();
