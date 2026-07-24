from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
errors=[]
for name in ['index.html','styles.css','config.js','guest-utils.js','app.js','robots.txt','.nojekyll']:
    if not (DIST/name).exists(): errors.append(f'thiếu dist/{name}')
for forbidden in ['tests','tools','reports','README.md','MULTI-EVENT-SETUP.md']:
    if (DIST/forbidden).exists(): errors.append(f'dist không được chứa {forbidden}')
index=(DIST/'index.html').read_text(encoding='utf-8')
config=(DIST/'config.js').read_text(encoding='utf-8')
if 'v19.2.1-20260724' not in index: errors.append('dist sai build')
if 'id="invitationCover"' not in index: errors.append('dist thiếu opening cover')
if 'id="storyPlayer"' not in index or 'id="storyButton"' not in index: errors.append('dist thiếu story controls')
for event_id in ['bride','groom','nhatrang','saigon']:
    if f'{event_id}: {{' not in config: errors.append(f'dist thiếu event {event_id}')
if 'id="eventSwitcher"' not in index: errors.append('dist thiếu event switcher')
for forbidden_asset in ['assets/audio/README.txt','assets/qr/README.md','assets/qr/qr-nha-trai.svg','assets/qr/qr-nha-gai.svg','assets/images/google-forms-header-xuan-phuong-v2.jpg']:
    if (DIST/forbidden_asset).exists(): errors.append(f'dist chứa asset không dùng: {forbidden_asset}')
if errors:
    print('FAIL')
    for error in errors: print('-',error)
    sys.exit(1)
print('PASS: clean multi-event dist')
