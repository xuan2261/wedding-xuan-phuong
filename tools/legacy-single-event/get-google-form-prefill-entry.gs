/**
 * Tìm entry ID của câu hỏi “Họ và tên người đại diện” và tạo URL điền sẵn.
 *
 * Cách dùng:
 * 1. Dán file này vào cùng dự án Apps Script quản lý Google Form RSVP.
 * 2. Chạy getWeddingRsvpPrefillInfo().
 * 3. Sao chép guestNameEntry (entry.xxxxx) vào config.js và wedding-data.json.
 */
const RSVP_PREFILL_FORM_ID = "1_ei237lBMBctR5vm971a4GEN5Q2_xmPBr5D1sQSMM4E";

function getWeddingRsvpPrefillInfo() {
  const form = FormApp.openById(RSVP_PREFILL_FORM_ID);
  const nameItem = form.getItems(FormApp.ItemType.TEXT)
    .map((item) => item.asTextItem())
    .find((item) => item.getTitle() === "Họ và tên người đại diện");

  if (!nameItem) {
    throw new Error("Không tìm thấy câu hỏi Họ và tên người đại diện.");
  }

  const sampleName = "Gia đình cô Lan";
  const response = form.createResponse()
    .withItemResponse(nameItem.createResponse(sampleName));
  const prefilledUrl = response.toPrefilledUrl();
  const match = prefilledUrl.match(/[?&](entry\.\d+)=/);

  if (!match) {
    throw new Error("Không trích xuất được entry ID từ URL điền sẵn.");
  }

  const result = {
    questionTitle: nameItem.getTitle(),
    itemId: String(nameItem.getId()),
    guestNameEntry: match[1],
    prefilledUrl,
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}
