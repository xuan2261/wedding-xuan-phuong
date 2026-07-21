/**
 * Tạo Google Forms RSVP và Google Sheet lưu phản hồi.
 * Chạy createWeddingRsvpForm() một lần.
 */
const RSVP_CONFIG = Object.freeze({
  groomName: "Bùi Thanh Xuân",
  brideName: "Trần Thị Phượng",
  groomPhone: "0374037026",
  bridePhone: "0906878461",
  weddingDate: "Thứ Năm, ngày 30/07/2026",
  lunarDate: "Ngày 17 tháng 6 năm Bính Ngọ",
  guestTime: "08h00",
  ceremonyTime: "08h30",
  venueName: "Tư gia nhà trai",
  address: "Xã Bình Dương, Tỉnh Gia Lai",
  mapsUrl: "https://maps.app.goo.gl/zki7tKDUw8Ff8twA6",
  rsvpDeadline: "24/07/2026",
  formTitle: "XÁC NHẬN THAM DỰ LỄ CƯỚI | THANH XUÂN & THỊ PHƯỢNG",
  sheetTitle: "Danh sách RSVP - Thanh Xuân & Thị Phượng",
});

function createWeddingRsvpForm() {
  const properties = PropertiesService.getScriptProperties();
  const existingFormId = properties.getProperty("WEDDING_RSVP_FORM_ID");

  if (existingFormId) {
    const existingForm = FormApp.openById(existingFormId);
    const sheetId = properties.getProperty("WEDDING_RSVP_SHEET_ID");
    const result = {
      message: "Google Form đã được tạo trước đó.",
      formEditUrl: existingForm.getEditUrl(),
      formResponderUrl: existingForm.getPublishedUrl(),
      spreadsheetUrl: sheetId ? SpreadsheetApp.openById(sheetId).getUrl() : "",
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  const form = FormApp.create(RSVP_CONFIG.formTitle);
  const contactBlock = [
    "Nếu cần thay đổi phản hồi sau khi gửi hoặc cần hỗ trợ chỉ đường,",
    "Quý khách vui lòng liên hệ:",
    "",
    `Chú rể ${RSVP_CONFIG.groomName}: ${RSVP_CONFIG.groomPhone}`,
    `Cô dâu ${RSVP_CONFIG.brideName}: ${RSVP_CONFIG.bridePhone}`,
  ].join("\n");

  form
    .setDescription([
      "Trân trọng kính mời Quý khách xác nhận tham dự Lễ Thành Hôn của",
      `${RSVP_CONFIG.groomName} & ${RSVP_CONFIG.brideName}.`,
      "",
      `Thời gian đón khách: ${RSVP_CONFIG.guestTime}`,
      `Thời gian làm lễ: ${RSVP_CONFIG.ceremonyTime}`,
      `Ngày: ${RSVP_CONFIG.weddingDate}`,
      `Âm lịch: ${RSVP_CONFIG.lunarDate}`,
      `Địa điểm: ${RSVP_CONFIG.venueName}`,
      `Địa chỉ: ${RSVP_CONFIG.address}`,
      `Bản đồ: ${RSVP_CONFIG.mapsUrl}`,
      "",
      `Vui lòng phản hồi trước ngày ${RSVP_CONFIG.rsvpDeadline}.`,
      "Thông tin Quý khách cung cấp chỉ được sử dụng để chuẩn bị đón tiếp trong ngày cưới.",
      "",
      contactBlock,
    ].join("\n"))
    .setConfirmationMessage([
      "Cảm ơn Quý khách đã xác nhận!",
      "",
      `${RSVP_CONFIG.groomName} và ${RSVP_CONFIG.brideName} đã ghi nhận phản hồi của Quý khách.`,
      "Sự hiện diện và lời chúc phúc của Quý khách là niềm vui và niềm vinh hạnh của hai gia đình.",
      "",
      contactBlock,
    ].join("\n"))
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(true)
    .setShowLinkToRespondAgain(false)
    .setPublishingSummary(false)
    .setProgressBar(true)
    .setShuffleQuestions(false);

  const spreadsheet = SpreadsheetApp.create(RSVP_CONFIG.sheetTitle);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());

  form.addSectionHeaderItem()
    .setTitle("Thông tin khách mời")
    .setHelpText("Quý khách vui lòng cung cấp thông tin để gia đình chuẩn bị đón tiếp chu đáo.");

  form.addTextItem()
    .setTitle("Họ và tên người đại diện")
    .setHelpText("Ví dụ: Nguyễn Văn An")
    .setRequired(true);

  const phoneValidation = FormApp.createTextValidation()
    .requireTextMatchesPattern("^(\\+?84|0)([ .-]?[0-9]){9,10}$")
    .setHelpText("Vui lòng nhập số điện thoại Việt Nam, ví dụ 0912345678.")
    .build();

  form.addTextItem()
    .setTitle("Số điện thoại liên hệ")
    .setHelpText("Số điện thoại chỉ dùng khi cần xác nhận lại thông tin tham dự.")
    .setValidation(phoneValidation)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Quý khách thuộc nhóm khách mời nào?")
    .setChoiceValues([
      "Nhà trai",
      "Nhà gái",
      "Khách mời chung của cô dâu và chú rể",
      "Đồng nghiệp",
    ])
    .showOtherOption(true)
    .setRequired(true);

  const attendanceItem = form.addMultipleChoiceItem()
    .setTitle("Quý khách có thể đến chung vui cùng gia đình không?")
    .setRequired(true);

  const attendingPage = form.addPageBreakItem()
    .setTitle("Thông tin tham dự")
    .setHelpText("Thông tin này giúp gia đình chuẩn bị bàn tiệc và chỗ ngồi phù hợp.");

  form.addListItem()
    .setTitle("Số người lớn tham dự")
    .setHelpText("Vui lòng tính cả người đang điền biểu mẫu.")
    .setChoiceValues([
      "1 người", "2 người", "3 người", "4 người", "5 người",
      "6 người", "7 người", "8 người", "9 người", "10 người",
    ])
    .setRequired(true);

  form.addListItem()
    .setTitle("Số trẻ em cần ghế hoặc suất ăn riêng")
    .setChoiceValues([
      "Không có", "1 trẻ em", "2 trẻ em",
      "3 trẻ em", "4 trẻ em", "5 trẻ em trở lên",
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("Tên những người đi cùng")
    .setHelpText("Có thể bỏ trống nếu đi một mình.")
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle("Yêu cầu về suất ăn")
    .setChoiceValues([
      "Không có yêu cầu đặc biệt",
      "Cần suất ăn chay",
      "Cần trao đổi thêm với cô dâu/chú rể",
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("Dị ứng hoặc thực phẩm cần kiêng")
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle("Quý khách có cần hỗ trợ thêm không?")
    .setChoiceValues([
      "Cần ghế dành cho em bé",
      "Cần hỗ trợ chỉ đường hoặc phương tiện di chuyển",
      "Cần gợi ý chỗ nghỉ gần địa điểm tổ chức",
      "Cần cô dâu/chú rể liên hệ lại",
    ])
    .showOtherOption(true)
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle("Lời nhắn dành cho cô dâu và chú rể")
    .setRequired(false);

  const decliningPage = form.addPageBreakItem()
    .setTitle("Cảm ơn Quý khách đã phản hồi")
    .setHelpText("Dù không thể hiện diện, tình cảm và lời chúc của Quý khách vẫn là niềm trân quý đối với hai gia đình.");

  decliningPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  form.addParagraphTextItem()
    .setTitle("Quý khách có lời nhắn nào dành cho cô dâu và chú rể không?")
    .setRequired(false);

  attendanceItem.setChoices([
    attendanceItem.createChoice("Có, tôi sẽ đến tham dự", attendingPage),
    attendanceItem.createChoice("Rất tiếc, tôi không thể tham dự", decliningPage),
  ]);

  if (form.supportsAdvancedResponderPermissions()) {
    form.setPublished(true);
  }
  form.setAcceptingResponses(true);

  properties.setProperties({
    WEDDING_RSVP_FORM_ID: form.getId(),
    WEDDING_RSVP_SHEET_ID: spreadsheet.getId(),
  });

  const result = {
    formEditUrl: form.getEditUrl(),
    formResponderUrl: form.getPublishedUrl(),
    spreadsheetUrl: spreadsheet.getUrl(),
    formId: form.getId(),
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function closeWeddingRsvp() {
  const formId = PropertiesService.getScriptProperties()
    .getProperty("WEDDING_RSVP_FORM_ID");
  if (!formId) throw new Error("Không tìm thấy Google Form RSVP.");

  FormApp.openById(formId)
    .setAcceptingResponses(false)
    .setCustomClosedFormMessage([
      "Biểu mẫu xác nhận tham dự đã được đóng.",
      "Gia đình đã tiến hành chốt số lượng khách.",
      "Vui lòng liên hệ trực tiếp với cô dâu hoặc chú rể nếu cần thay đổi thông tin.",
    ].join("\n"));
}
