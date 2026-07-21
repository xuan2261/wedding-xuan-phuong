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
    "Thông tin của Quý khách chỉ được sử dụng để chuẩn bị đón tiếp trong ngày cưới.",
    "",
    contactBlock,
  ].join("\n");

  const confirmationMessage = [
    "Cảm ơn Quý khách đã xác nhận!",
    "",
    `${RSVP_UPDATE_CONFIG.groomName} và ${RSVP_UPDATE_CONFIG.brideName} đã ghi nhận phản hồi của Quý khách.`,
    "Sự hiện diện và lời chúc phúc của Quý khách là niềm vui lớn đối với chúng tôi.",
    "",
    contactBlock,
  ].join("\n");

  form
    .setDescription(description)
    .setConfirmationMessage(confirmationMessage);

  const result = {
    message: "Đã cập nhật mô tả và thông báo xác nhận thành công.",
    formEditUrl: form.getEditUrl(),
    formResponderUrl: form.getPublishedUrl(),
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
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
