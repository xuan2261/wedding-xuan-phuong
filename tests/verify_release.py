from pathlib import Path
import re, sys, json

# Thông báo lỗi có tiếng Việt; console Windows mặc định cp1252 sẽ ném
# UnicodeEncodeError và giấu mất lỗi thật.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
errors=[]
def require(value,message):
    if not value: errors.append(message)
index=(ROOT/'index.html').read_text(encoding='utf-8')
config=(ROOT/'config.js').read_text(encoding='utf-8')
app=(ROOT/'app.js').read_text(encoding='utf-8')
guest=(ROOT/'guest-utils.js').read_text(encoding='utf-8')
backend=(ROOT/'tools/wedding-wishes-webapp.gs').read_text(encoding='utf-8')
package=json.loads((ROOT/'package.json').read_text(encoding='utf-8'))
lock=json.loads((ROOT/'package-lock.json').read_text(encoding='utf-8'))
require('v20.4-20260804' in index,'sai build marker')
require(package['version'] == lock['version'] == lock['packages']['']['version'],'package-lock lệch package.json')
for event_id in ['bride','groom','nhatrang','saigon']:
    require(f'{event_id}: {{' in config,f'thiếu event {event_id}')
require('eventContext' in config,'thiếu event context')
require('eventsParameter: "events"' in config,'thiếu events parameter')
require('buildInvitationUrl' in guest,'thiếu URL helper đa sự kiện')
require('buildEventEntryUrl' in guest,'thiếu event share entry helper')
require('setupEventSwitcher' in app,'thiếu event switcher logic')
require('renderEventTimeline' in app,'thiếu dynamic timeline')
require('id="eventSwitcher"' in index,'thiếu event switcher DOM')
require('id="eventTimeline"' in index,'thiếu timeline DOM')
require('id="invitationCover"' in index,'thiếu cover dialog')
require('id="coverOpenButton"' in index,'thiếu nút mở cover')
require('story-player' not in index,'thanh điều khiển theo chương quay lại DOM')
require('setupOpeningExperience' in app,'thiếu opening experience logic')
require('setupAttendanceContactDialog' in app,'thiếu RSVP contact fallback')
require('getAdaptiveDataState' in app,'thiếu adaptive data mode')
require('id="attendanceContactDialog"' in index,'thiếu attendance contact dialog')
require('id="coverDataHint"' in index,'thiếu data saver hint')
require((ROOT/'tools/guest-list-template.csv').exists(),'thiếu guest CSV template')
require('setupAutoScroll' in app,'thiếu logic tự cuộn')
require('autoScrollSpeedPxPerSecond' in config,'thiếu cấu hình tốc độ tự cuộn')
require('pausedByVisibility' in app,'thiếu pause audio khi tab ẩn')
require('id="coverSimpleButton"' not in index,'nút simple mode phải được loại khỏi màn mở thiệp')
require('openInvitation({ simpleMode: true })' in app,'thiếu fallback simple mode khi đóng cover bằng phím Esc')
require('is-auto-scrolling' in app,'thiếu cờ tắt smooth scroll khi tự cuộn')
require('sharing: {\n          title: "Tiệc Báo Hỷ Nha Trang' in config,'sharing Nha Trang bị lồng sai')
require('openingExperience:' in config,'thiếu opening config')
require('prefers-reduced-motion: reduce' in (ROOT/'assets/css/wedding-motion.css').read_text(encoding='utf-8'),'thiếu reduced motion')
require('guestLead' in config and 'eventName' in config,'thiếu copy theo event')
# Trước đây dòng này khẳng định "phải còn ít nhất một map bị tắt", tức là khoá
# cứng trạng thái dở dang. Bất biến thật cần giữ là: không bao giờ chỉ khách tới
# một điểm ghim chưa ai mở ra kiểm.
_nl = chr(10)
_events_src = config[config.index(_nl + '    events: {'):]
for _eid in ('bride', 'groom', 'nhatrang', 'saigon'):
    _start = _events_src.index(_nl + '      ' + _eid + ': {')
    _block = _events_src[_start:_events_src.index(_nl + '        sharing: {', _start)]
    _has_map = bool(re.search(r'map(?:s|Embed)Url: "[^"]+"', _block))
    _verified = 'mapsVerified: true' in _block
    require(not _has_map or _verified, f'{_eid}: có bản đồ nhưng chưa xác minh điểm ghim')
require('rsvp: { enabled: false' in config,'RSVP cũ chưa bị vô hiệu hóa an toàn')
require((ROOT/'tools/create-google-forms-rsvp-multi-event.gs').exists(),'thiếu Form builder')
require((ROOT/'MULTI-EVENT-SETUP.md').exists(),'thiếu setup doc')
require((ROOT/'event-entry.js').exists(),'thiếu event-entry.js')
require('events/${encodeURIComponent(activeEventId)}/' in (ROOT/'tools/create-guest-links.html').read_text(encoding='utf-8'),'guest link generator chưa dùng event entry page')
require('payload.ok && payload.stored === true' in app,'wishes contract bị mất')
require('duplicateWindowSeconds: 21600' in backend,'cache TTL sai')
require('innerHTML' not in app,'app.js không được dùng innerHTML')
require('innerHTML' not in guest,'guest-utils không được dùng innerHTML')
require(len(re.findall(r'\bid="([^"]+)"',index))==len(set(re.findall(r'\bid="([^"]+)"',index))),'HTML ID trùng')
for path in ['tiec-cuoi-nha-gai-2026-07-29.ics','le-thanh-hon-nha-trai-2026-07-30.ics','bao-hy-nha-trang-2026-08-15.ics','bao-hy-sai-gon-2026-08-22.ics']:
    require((ROOT/'assets/calendar'/path).exists(),f'thiếu {path}')
if errors:
    print('FAIL')
    for error in errors: print('-',error)
    sys.exit(1)
print('PASS: v20.1 multi-event release checks')
