/**
 * TẠO GOOGLE FORM RSVP ĐA SỰ KIỆN — v19
 *
 * Chạy createMultiEventWeddingRsvpForm() một lần. Script tạo Form và Sheet mới,
 * không ghi đè Form RSVP một sự kiện cũ.
 */
const MULTI_EVENT_RSVP = Object.freeze({
  groomName: "Bùi Thanh Xuân",
  brideName: "Trần Thị Phượng",
  groomPhone: "0374037026",
  bridePhone: "0906878461",
  formTitle: "RSVP ĐA SỰ KIỆN | THANH XUÂN & THỊ PHƯỢNG",
  sheetTitle: "RSVP đa sự kiện - Thanh Xuân & Thị Phượng",
  events: [
    {
      id: "bride",
      label: "Tiệc cưới nhà gái — 29/07/2026",
      detail: "Đón khách 09h00 · Làm lễ 09h30 · Khai tiệc 10h00\nTư gia nhà gái · Thôn Định Thiện Tây, Xã Tuy Phước Bắc, Tỉnh Gia Lai"
    },
    {
      id: "groom",
      label: "Lễ và tiệc nhà trai — 30/07/2026",
      detail: "Lễ Thành Hôn 08h30 · Đón khách và dùng tiệc 10h00\nTư gia nhà trai · 346 Nguyễn Huệ, Xã Bình Dương, Tỉnh Gia Lai"
    },
    {
      id: "nhatrang",
      label: "Tiệc Báo Hỷ Nha Trang — 15/08/2026",
      detail: "Đón khách 17h00 · Bắt đầu tiệc 18h00\nNhà hàng Nha Trang · địa chỉ cụ thể sẽ cập nhật"
    },
    {
      id: "saigon",
      label: "Tiệc Báo Hỷ Sài Gòn — 22/08/2026",
      detail: "Đón khách 17h00 · Bắt đầu tiệc 18h00\nNhà hàng hải sản Seasan · địa chỉ cụ thể sẽ cập nhật"
    }
  ]
});

function createMultiEventWeddingRsvpForm() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty("WEDDING_MULTI_EVENT_RSVP_FORM_ID");
  if (existingId) {
    const existing = FormApp.openById(existingId);
    const sheetId = properties.getProperty("WEDDING_MULTI_EVENT_RSVP_SHEET_ID");
    const result = {
      message: "Form đa sự kiện đã được tạo trước đó.",
      formEditUrl: existing.getEditUrl(),
      formResponderUrl: existing.getPublishedUrl(),
      spreadsheetUrl: sheetId ? SpreadsheetApp.openById(sheetId).getUrl() : ""
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  const form = FormApp.create(MULTI_EVENT_RSVP.formTitle);
  const contactBlock = [
    "Nếu cần thay đổi phản hồi hoặc cần hỗ trợ, Quý vị vui lòng liên hệ:",
    `Chú rể ${MULTI_EVENT_RSVP.groomName}: ${MULTI_EVENT_RSVP.groomPhone}`,
    `Cô dâu ${MULTI_EVENT_RSVP.brideName}: ${MULTI_EVENT_RSVP.bridePhone}`
  ].join("\n");

  form
    .setDescription([
      "Thanh Xuân và Thị Phượng trân trọng cảm ơn Quý vị đã phản hồi lời mời.",
      "Biểu mẫu này phục vụ bốn sự kiện trong tháng 7 và tháng 8 năm 2026.",
      "Quý vị vui lòng chọn đúng sự kiện ghi trong link thiệp được gửi.",
      "",
      contactBlock
    ].join("\n"))
    .setConfirmationMessage([
      "Cảm ơn Quý vị đã xác nhận!",
      "Phản hồi đã được ghi nhận để gia đình chuẩn bị đón tiếp chu đáo.",
      "",
      contactBlock
    ].join("\n"))
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(true)
    .setShowLinkToRespondAgain(false)
    .setPublishingSummary(false)
    .setProgressBar(true)
    .setShuffleQuestions(false);

  const sheet = SpreadsheetApp.create(MULTI_EVENT_RSVP.sheetTitle);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  form.addSectionHeaderItem()
    .setTitle("Thông tin khách mời")
    .setHelpText("Quý vị vui lòng cung cấp thông tin để gia đình chuẩn bị đón tiếp.");

  const guestNameItem = form.addTextItem()
    .setTitle("Họ và tên người đại diện")
    .setRequired(true);

  form.addTextItem()
    .setTitle("Số điện thoại liên hệ")
    .setHelpText("Chỉ sử dụng khi cần xác nhận lại thông tin tham dự.")
    .setRequired(true);

  form.addTextItem()
    .setTitle("Mã lời mời")
    .setHelpText("Có thể bỏ trống trong giai đoạn chưa phân nhóm khách.")
    .setRequired(false);

  const selector = form.addMultipleChoiceItem()
    .setTitle("Sự kiện Quý vị xác nhận")
    .setHelpText("Vui lòng giữ nguyên sự kiện đã được điền sẵn trong link thiệp.")
    .setRequired(true);

  const pages = {};
  MULTI_EVENT_RSVP.events.forEach((event) => {
    const eventPage = form.addPageBreakItem()
      .setTitle(event.label)
      .setHelpText(event.detail);

    const attendance = form.addMultipleChoiceItem()
      .setTitle(`[${event.id}] Quý vị có thể tham dự không?`)
      .setRequired(true);

    const attendingPage = form.addPageBreakItem()
      .setTitle(`Thông tin tham dự · ${event.label}`)
      .setHelpText("Thông tin này giúp gia đình chuẩn bị bàn tiệc và chỗ ngồi phù hợp.");

    form.addListItem()
      .setTitle(`[${event.id}] Số người lớn tham dự`)
      .setChoiceValues(["1 người", "2 người", "3 người", "4 người", "5 người", "6 người", "7 người", "8 người", "9 người", "10 người"])
      .setRequired(true);

    form.addListItem()
      .setTitle(`[${event.id}] Số trẻ em cần ghế hoặc suất ăn riêng`)
      .setChoiceValues(["Không có", "1 trẻ em", "2 trẻ em", "3 trẻ em", "4 trẻ em", "5 trẻ em trở lên"])
      .setRequired(true);

    form.addParagraphTextItem()
      .setTitle(`[${event.id}] Tên những người đi cùng`)
      .setRequired(false);

    form.addMultipleChoiceItem()
      .setTitle(`[${event.id}] Yêu cầu về suất ăn`)
      .setChoiceValues(["Không có yêu cầu đặc biệt", "Cần suất ăn chay", "Cần trao đổi thêm"])
      .setRequired(true);

    form.addParagraphTextItem()
      .setTitle(`[${event.id}] Dị ứng, thực phẩm cần kiêng hoặc hỗ trợ khác`)
      .setRequired(false);

    form.addParagraphTextItem()
      .setTitle(`[${event.id}] Lời nhắn riêng`)
      .setRequired(false);

    attendingPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

    const decliningPage = form.addPageBreakItem()
      .setTitle(`Cảm ơn Quý vị đã phản hồi · ${event.label}`)
      .setHelpText("Dù không thể hiện diện, tình cảm và lời chúc của Quý vị vẫn là niềm trân quý.");

    form.addParagraphTextItem()
      .setTitle(`[${event.id}] Lời nhắn khi không thể tham dự`)
      .setRequired(false);

    decliningPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
    attendance.setChoices([
      attendance.createChoice("Có, tôi sẽ tham dự", attendingPage),
      attendance.createChoice("Rất tiếc, tôi không thể tham dự", decliningPage)
    ]);

    pages[event.id] = { event, eventPage };
  });

  selector.setChoices(MULTI_EVENT_RSVP.events.map((event) =>
    selector.createChoice(event.label, pages[event.id].eventPage)
  ));

  if (form.supportsAdvancedResponderPermissions()) form.setPublished(true);
  form.setAcceptingResponses(true);

  const prefilledUrls = {};
  MULTI_EVENT_RSVP.events.forEach((event) => {
    prefilledUrls[event.id] = form.createResponse()
      .withItemResponse(selector.createResponse(event.label))
      .toPrefilledUrl();
  });

  const probeUrl = form.createResponse()
    .withItemResponse(guestNameItem.createResponse("__GUEST_NAME__"))
    .withItemResponse(selector.createResponse(MULTI_EVENT_RSVP.events[0].label))
    .toPrefilledUrl();
  const guestNameEntry = extractEntryKeyByValue_(probeUrl, "__GUEST_NAME__");

  properties.setProperties({
    WEDDING_MULTI_EVENT_RSVP_FORM_ID: form.getId(),
    WEDDING_MULTI_EVENT_RSVP_SHEET_ID: sheet.getId()
  });

  const result = {
    formId: form.getId(),
    formEditUrl: form.getEditUrl(),
    formResponderUrl: form.getPublishedUrl(),
    spreadsheetUrl: sheet.getUrl(),
    guestNameEntry,
    prefilledUrls
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function extractEntryKeyByValue_(url, expectedValue) {
  const query = String(url).split("?", 2)[1] || "";
  const pairs = query.split("&");
  for (const pair of pairs) {
    const parts = pair.split("=", 2);
    if (parts.length !== 2) continue;
    if (decodeURIComponent(parts[1].replace(/\+/g, " ")) === expectedValue) {
      return decodeURIComponent(parts[0]);
    }
  }
  return "";
}

function closeMultiEventWeddingRsvp() {
  const formId = PropertiesService.getScriptProperties()
    .getProperty("WEDDING_MULTI_EVENT_RSVP_FORM_ID");
  if (!formId) throw new Error("Chưa tạo Form RSVP đa sự kiện.");
  FormApp.openById(formId)
    .setAcceptingResponses(false)
    .setCustomClosedFormMessage("Biểu mẫu RSVP đã được đóng. Quý vị vui lòng liên hệ trực tiếp cô dâu hoặc chú rể nếu cần hỗ trợ.");
}
