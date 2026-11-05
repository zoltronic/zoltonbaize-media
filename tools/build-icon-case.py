#!/usr/bin/env python3
"""Builds iconography/zb-icon-case.js from zb-icon-case.src.js plus the Figma exports in iconography/src/.
Icon colours become currentColor so the visuals follow light and dark mode. Phosphor SVGs come from
@phosphor-icons/core (MIT), path given as the first argument (the package's assets/regular folder)."""
import json, re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'iconography', 'src')
PH_DIR = sys.argv[1]

INK = re.compile(r'(stroke|fill)="(black|#000000|#141414|#3B3331|#3b3331|#050505|#231F20|#343330)"')

def norm(svg):
    """-> {'v': viewBox, 'b': inner markup} with colours as currentColor and no dangling clip refs."""
    if not svg: return None
    m = re.search(r'viewBox="([^"]+)"', svg)
    v = m.group(1) if m else '0 0 32 32'
    inner = re.sub(r'^<svg[^>]*>|</svg>$', '', svg.strip())
    inner = re.sub(r'<defs>.*?</defs>', '', inner)
    inner = re.sub(r' clip-path="[^"]*"', '', inner)
    inner = re.sub(r'<rect width="32" height="32" fill="white"/>', '', inner)
    inner = INK.sub(r'\1="currentColor"', inner)
    # stroked paths exported without caps/joins (we stripped them to save space): put round back
    inner = inner.replace('<path ', '<path stroke-linecap="round" stroke-linejoin="round" ') if 'stroke-linecap' not in inner else inner
    return {'v': v, 'b': inner}

def load(name): return json.load(open(os.path.join(SRC, name + '.json')))

pack = [dict(n=x['n'], **norm(x['s'])) for x in load('pack1') + load('pack2')]
# keep the non-banking pictures first in the hero field (roses, ships, vials, tickets...), then the rest
std = [dict(n=x['n'].replace('\n', ''), **norm(x['s'])) for x in load('std')]

# non-standard strokes: pair Light and Regular, group by the stroke the sheet labels (by x position on the sheet)
non = load('non'); by = {}
for x in non:
    base = x['n'].replace('_light', ''); light = x['n'].endswith('_light')
    d = by.setdefault(base, {'n': base, 'x': x['x']}); d['light' if light else 'reg'] = norm(x['s']); d['x'] = min(d['x'], x['x'])
groups = [{'w': '1.85', 'items': []}, {'w': '1.75', 'items': []}, {'w': '1.5', 'items': []}]
for d in sorted(by.values(), key=lambda d: d['x']):
    g = groups[0] if d['x'] < 250 else groups[1] if d['x'] < 760 else groups[2]
    g['items'].append({'n': d['n'], 'light': d.get('light'), 'reg': d.get('reg')})

PH_NAME = {'AirplaneTilt': 'airplane-tilt', 'Alarm': 'alarm', 'AppleLogo': 'apple-logo', 'Question': 'question', 'ChartPieSlice': 'chart-pie-slice',
           'Receipt': 'receipt', 'Paperclip': 'paperclip', 'ArrowDown': 'arrow-down', 'ArrowLeft': 'arrow-left', 'ArrowRight': 'arrow-right',
           'ArrowUp': 'arrow-up', 'binoculars': 'binoculars'}
audit = []
for r in load('audit'):
    raw = r['one']; parts = raw.split('/'); nm = parts[1] if len(parts) > 1 else parts[0]; nm = re.sub(r'^UI-', '', nm)
    audit.append({'oneRaw': raw, 'one': nm, 'oneS': norm(r['oneS']), 'two': r['two'], 'twoS': norm(r['twoS']), 'ph': PH_NAME.get(r['ph'], '')})
for a in audit:
    if a['one'] == 'atm': a['one'] = 'UI-atm'

renames = [{'old': a['one'], 'neu': a['two'], 'ic': a['twoS']} for a in audit if a['two'] and re.sub(r'[-_ ]','',a['two'].lower()) != re.sub(r'[-_ ]','',a['one'].lower()) and a['twoS']]

def find(lst, n): return next(x for x in lst if x['n'] == n)
ben = next(a for a in audit if a['one'] == 'benefits')
def ic(n): x = find(std, n); return {'v': x['v'], 'b': x['b']}
gaps = [{'oldName': 'benefits', 'old': ben['oneS'], 'parts': ['hand-coins', 'sparkle'], 'neuName': 'hand_sparkles', 'neu': ic('hand_sparkles')},
        {'oldName': 'house deed', 'old': None, 'parts': ['file-text', 'seal-check'], 'neuName': 'document_certification', 'neu': ic('document_certification')}]
# more equations from Zolton's intake cards (Icon Audit swim lane): parts are Phosphor names, or his own Fusion icons as {'n','ic'}
g2 = load('gaps2')
def raw(x):  # keep defs (the 1.0 shield only exists as a bitmap in the file)
    m = re.search(r'viewBox="([^"]+)"', x['s']); return {'v': m.group(1), 'b': re.sub(r'^<svg[^>]*>|</svg>$', '', x['s'].strip())}
fus = lambda n, k: {'n': n, 'ic': norm(g2[k]['s'])}
gaps += [
    {'oldName': 'UI-dismiss-reminder', 'old': norm(g2['old_dismiss']['s']), 'parts': ['alarm', 'x-circle'], 'neuName': 'alarm_dismiss', 'neu': norm(g2['neu_dismiss']['s'])},
    {'oldName': 'price-tag', 'old': norm(g2['old_price']['s']), 'parts': [fus('currency_arrow_up', 'p_currency'), 'tag'], 'neuName': 'tag_dollar', 'neu': norm(g2['neu_price']['s'])},
    {'oldName': 'shield gear', 'old': raw(g2['old_shield']), 'parts': ['shield', 'user-gear'], 'neuName': 'shield_user_gear', 'neu': norm(g2['neu_shield_user']['s'])},
    {'oldName': 'shield gear', 'old': raw(g2['old_shield']), 'parts': ['shield', 'gear-six'], 'neuName': 'shield_gear', 'neu': norm(g2['neu_shield_gear']['s'])},
    {'oldName': 'shield gear', 'old': raw(g2['old_shield']), 'parts': ['shield-plus', 'user-gear'], 'neuName': 'shield_gear_flat_top', 'neu': norm(g2['neu_shieldplus_user']['s'])},
    {'oldName': 'zelle', 'old': norm(g2['old_zelle']['s']), 'parts': ['arrow-fat-left', fus('recurring', 'p_recurring')], 'neuName': 'send_receive', 'neu': norm(g2['neu_zelle']['s'])}]

need = set(['clock', 'globe', 'compass', 'target', 'smiley', 'check-circle', 'calendar-blank', 'note-blank', 'grid-four', 'frame-corners', 'lock-simple', 'gift',
            'credit-card', 'envelope-simple', 'monitor', 'wallet', 'ticket', 'folder', 'hands-clapping', 'bird', 'leaf', 'feather', 'butterfly', 'lightning',
            'cube', 'package', 'stack', 'database', 'cylinder', 'hand', 'hand-palm', 'hand-pointing', 'hand-grabbing', 'hand-heart', 'hand-coins',
            'bank', 'house', 'bell', 'user', 'sparkle', 'file', 'device-mobile', 'clipboard-text', 'door', 'receipt', 'bookmark-simple', 'warning', 'triangle', 'play', 'mountains', 'tent', 'users', 'user-circle', 'users-three', 'user-plus', 'identification-badge', 'arrow-right', 'arrow-up-right', 'arrows-clockwise', 'arrow-bend-up-right', 'caret-right', 'arrows-out', 'file-text', 'seal-check', 'flower-tulip', 'boat', 'tooth', 'alarm', 'x-circle', 'tag', 'shield', 'user-gear', 'gear-six', 'shield-plus', 'arrow-fat-left'] + [a['ph'] for a in audit if a['ph']])
ph = {}
for n in sorted(need):
    s = open(os.path.join(PH_DIR, n + '.svg')).read()
    inner = re.sub(r'^<svg[^>]*>|</svg>$', '', s.strip())
    ph[n] = {'v': '0 0 256 256', 'b': '<g fill="currentColor">' + inner + '</g>'}

data = {'pack': pack, 'std': std, 'strokes': groups, 'audit': audit, 'renames': renames, 'gaps': gaps, 'ph': ph}
src = open(os.path.join(ROOT, 'iconography', 'zb-icon-case.src.js')).read()
out = src.replace('/*DATA*/null', json.dumps(data, separators=(',', ':')))
open(os.path.join(ROOT, 'iconography', 'zb-icon-case.js'), 'w').write(out)
print('ok', len(out), 'bytes;', len(pack), 'pack,', len(std), 'std,', sum(len(g['items']) for g in groups), 'pairs,', len(audit), 'audit rows,', len(renames), 'renames,', len(ph), 'phosphor')
