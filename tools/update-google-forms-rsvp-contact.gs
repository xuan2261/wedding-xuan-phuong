/**
 * Cập nhật Google Forms RSVP đã tạo:
 * - Bổ sung thông tin liên hệ vào phần mô tả đầu Form.
 * - Bổ sung thông tin liên hệ vào thông báo sau khi gửi Form.
 *
 * Cách dùng:
 * Chạy hàm updateWeddingRsvpContactInfo() để áp dụng thông tin mới.
 */

const RSVP_UPDATE_CONFIG = Object.freeze({
  formId: "1_ei237lBMBctR5vm971a4GEN5Q2_xmPBr5D1sQSMM4E",

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
});


function updateWeddingRsvpContactInfo() {
  validateContactConfig_();

  const form = FormApp.openById(RSVP_UPDATE_CONFIG.formId);

  const contactBlock = [
    "Nếu cần thay đổi phản hồi sau khi gửi hoặc cần hỗ trợ chỉ đường,",
    "Quý khách vui lòng liên hệ:",
    "",
    `Chú rể ${RSVP_UPDATE_CONFIG.groomName}: ${RSVP_UPDATE_CONFIG.groomPhone}`,
    `Cô dâu ${RSVP_UPDATE_CONFIG.brideName}: ${RSVP_UPDATE_CONFIG.bridePhone}`,
  ].join("\n");

  const description = [
    "Trân trọng kính mời Quý khách xác nhận tham dự Lễ Thành Hôn của",
    `${RSVP_UPDATE_CONFIG.groomName} & ${RSVP_UPDATE_CONFIG.brideName}.`,
    "",
    `Thời gian đón khách: ${RSVP_UPDATE_CONFIG.guestTime}`,
    `Thời gian làm lễ: ${RSVP_UPDATE_CONFIG.ceremonyTime}`,
    `Ngày: ${RSVP_UPDATE_CONFIG.weddingDate}`,
    `Âm lịch: ${RSVP_UPDATE_CONFIG.lunarDate}`,
    `Địa điểm: ${RSVP_UPDATE_CONFIG.venueName}`,
    `Địa chỉ: ${RSVP_UPDATE_CONFIG.address}`,
    `Bản đồ: ${RSVP_UPDATE_CONFIG.mapsUrl}`,
    "",
    `Vui lòng phản hồi trước ngày ${RSVP_UPDATE_CONFIG.rsvpDeadline}.`,
    "Thông tin Quý khách cung cấp chỉ được sử dụng để chuẩn bị đón tiếp trong ngày cưới.",
    "",
    contactBlock,
  ].join("\n");

  const confirmationMessage = [
    "Cảm ơn Quý khách đã xác nhận!",
    "",
    `${RSVP_UPDATE_CONFIG.groomName} và ${RSVP_UPDATE_CONFIG.brideName} đã ghi nhận phản hồi của Quý khách.`,
    "Sự hiện diện và lời chúc phúc của Quý khách là niềm vui và niềm vinh hạnh của hai gia đình.",
    "",
    contactBlock,
  ].join("\n");

  form
    .setDescription(description)
    .setConfirmationMessage(confirmationMessage);

  updateGuestFacingWording_(form);

  const result = {
    message: "Đã cập nhật nội dung, cách xưng hô và thông tin liên hệ thành công.",
    formEditUrl: form.getEditUrl(),
    formResponderUrl: form.getPublishedUrl(),
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}


/**
 * Cập nhật cách xưng hô trong các câu hỏi của Google Form hiện có.
 *
 * Các chuỗi cách xưng hô cũ bên dưới chỉ dùng làm khóa đối chiếu để tìm và
 * thay nội dung cũ; chúng không phải nội dung sẽ hiển thị sau khi hàm chạy.
 */
function updateGuestFacingWording_(form) {
  const titleUpdates = Object.freeze({
    "Bạn là khách của": "Quý khách thuộc nhóm khách mời nào?",
    "Quý khách là khách của": "Quý khách thuộc nhóm khách mời nào?",
    "Bạn có thể đến chung vui cùng gia đình không?":
      "Quý khách có thể đến chung vui cùng gia đình không?",
    "Bạn có cần hỗ trợ thêm không?":
      "Quý khách có cần hỗ trợ thêm không?",
    "Cảm ơn bạn đã phản hồi":
      "Cảm ơn Quý khách đã phản hồi",
    "Bạn có lời nhắn nào dành cho cô dâu và chú rể không?":
      "Lời nhắn riêng dành cho cô dâu và chú rể",
    "Quý khách có lời nhắn nào dành cho cô dâu và chú rể không?":
      "Lời nhắn riêng dành cho cô dâu và chú rể",
    "Lời nhắn dành cho cô dâu và chú rể":
      "Lời nhắn riêng dành cho cô dâu và chú rể",
  });

  const helpTextUpdates = Object.freeze({
    "Bạn vui lòng cung cấp thông tin để gia đình chuẩn bị đón tiếp chu đáo.":
      "Quý khách vui lòng cung cấp thông tin để gia đình chuẩn bị đón tiếp chu đáo.",
    "Dù không thể hiện diện, tình cảm và lời chúc của bạn vẫn rất quý giá đối với chúng tôi.":
      "Dù không thể hiện diện, tình cảm và lời chúc của Quý khách vẫn là niềm trân quý đối với hai gia đình.",
    "Nội dung này không hiển thị công khai trên website.":
      "Nội dung này không hiển thị công khai trên website.",
  });

  form.getItems().forEach((item) => {
    const currentTitle = item.getTitle();
    const currentHelpText = item.getHelpText();

    if (titleUpdates[currentTitle]) {
      item.setTitle(titleUpdates[currentTitle]);
    }

    if (helpTextUpdates[currentHelpText]) {
      item.setHelpText(helpTextUpdates[currentHelpText]);
    }

    if (item.getTitle() === "Lời nhắn riêng dành cho cô dâu và chú rể") {
      item.setHelpText("Nội dung này không hiển thị công khai trên website.");
    }

    // Câu hỏi phân nhóm khách không dùng điều hướng theo câu trả lời.
    if (
      item.getType() === FormApp.ItemType.MULTIPLE_CHOICE &&
      item.getTitle() === "Quý khách thuộc nhóm khách mời nào?"
    ) {
      item.asMultipleChoiceItem()
        .setChoiceValues([
          "Nhà trai",
          "Nhà gái",
          "Khách mời chung của cô dâu và chú rể",
          "Đồng nghiệp",
        ])
        .showOtherOption(true);
    }
  });
}


function validateContactConfig_() {
  const phonePattern = /^(?:\+?84|0)\d{9}$/;

  if (
    !phonePattern.test(RSVP_UPDATE_CONFIG.groomPhone) ||
    !phonePattern.test(RSVP_UPDATE_CONFIG.bridePhone)
  ) {
    throw new Error(
      "Số điện thoại chú rể hoặc cô dâu không đúng định dạng Việt Nam."
    );
  }
}
