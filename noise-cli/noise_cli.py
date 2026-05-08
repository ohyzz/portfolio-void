#!/usr/bin/env python3
"""
noise-cli — ASCII noise texture generator
https://github.com/ohyzz/portfolio-void

usage:
  noise gen perlin
  noise gen fractal --width 120 --height 40 --color
  noise gen cellular --palette dots --seed 1337 --color
  noise gen warp --animate --fps 12 --color
  noise gen white --output texture.txt
  noise palettes
"""

import argparse
import math
import os
import random
import sys
import time


# ── Noise math ─────────────────────────────────────────────────────────────────

def _hash(ix, iy, seed):
    h = int(seed ^ (ix * 374761393) ^ (iy * 668265263)) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((h ^ (h >> 16)) & 0xFFFFFFFF) / 0x100000000


def _smooth(t):
    return t * t * (3.0 - 2.0 * t)


def _lerp(a, b, t):
    return a + (b - a) * t


def value_noise(x, y, seed):
    ix, iy = int(math.floor(x)), int(math.floor(y))
    ux = _smooth(x - ix)
    uy = _smooth(y - iy)
    return _lerp(
        _lerp(_hash(ix,     iy,     seed), _hash(ix + 1, iy,     seed), ux),
        _lerp(_hash(ix,     iy + 1, seed), _hash(ix + 1, iy + 1, seed), ux),
        uy,
    )


def fbm(x, y, octaves, seed):
    v, amp, freq, total = 0.0, 0.5, 1.0, 0.0
    for i in range(octaves):
        s = (seed + i * 127) & 0xFFFF
        v     += value_noise(x * freq, y * freq, s) * amp
        total += amp
        amp   *= 0.5
        freq  *= 2.0
    return v / total


def cellular(x, y, seed):
    ix, iy = int(math.floor(x)), int(math.floor(y))
    d = 9.0
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            cx, cy = ix + dx, iy + dy
            px = cx + _hash(cx, cy, seed)
            py = cy + _hash(cx, cy, seed ^ 0xDEAD)
            dist = math.hypot(x - px, y - py)
            if dist < d:
                d = dist
    return min(d, 1.0)


def domain_warp(x, y, seed):
    qx = fbm(x,       y,       4, seed)
    qy = fbm(x + 5.2, y + 1.3, 4, seed)
    return fbm(x + 4.0 * qx, y + 4.0 * qy, 4, (seed + 100) & 0xFFFF)


NOISE_FNS = {
    'perlin':   lambda x, y, sc, seed: fbm(x * sc, y * sc, 4, seed),
    'smooth':   lambda x, y, sc, seed: value_noise(x * sc, y * sc, seed),
    'fractal':  lambda x, y, sc, seed: fbm(x * sc, y * sc, 6, seed),
    'cellular': lambda x, y, sc, seed: 1.0 - cellular(x * sc * 2, y * sc * 2, seed),
    'warp':     lambda x, y, sc, seed: domain_warp(x * sc, y * sc, seed),
    'white':    lambda x, y, sc, seed: _hash(int(x * 9999), int(y * 9999), seed),
}

NOISE_TYPES = list(NOISE_FNS.keys())


# ── Palettes ───────────────────────────────────────────────────────────────────

PALETTES = {
    'void':   ' ░▒▓█',
    'binary': '  01 ',
    'dots':   ' .·:;#',
    'matrix': ' .-+*#@',
    'block':  ' ▁▂▃▄▅▆▇█',
    'blood':  ' .+*#▓█',
    'ascii':  ' .,`-~:;=!*#$@',
    'safe':   ' .:+*#@',     # ASCII-only fallback
}

PALETTE_NAMES = list(PALETTES.keys())


def val_to_char(v, palette):
    chars = PALETTES.get(palette, PALETTES['void'])
    idx   = min(int(v * len(chars)), len(chars) - 1)
    return chars[idx]


# ── ANSI color ─────────────────────────────────────────────────────────────────

# 256-color green phosphor ramp (dark → bright)
_GREEN_RAMP = [22, 28, 34, 40, 46, 82, 118, 154, 190]
_RESET      = '\033[0m'


def _ansi_green(v):
    idx = min(int(v * len(_GREEN_RAMP)), len(_GREEN_RAMP) - 1)
    return f'\033[38;5;{_GREEN_RAMP[idx]}m'


def _supports_color():
    if not hasattr(sys.stdout, 'isatty') or not sys.stdout.isatty():
        return False
    if os.name == 'nt':
        return bool(
            os.environ.get('COLORTERM')
            or os.environ.get('WT_SESSION')
            or 'ANSICON' in os.environ
        )
    return True


def _supports_unicode():
    try:
        '░▒▓█▁▂▃▄▅▆▇'.encode(sys.stdout.encoding or 'ascii')
        return True
    except (UnicodeEncodeError, LookupError):
        return False


# ── Render ─────────────────────────────────────────────────────────────────────

def render_frame(noise_type, width, height, scale, palette, seed, color):
    fn  = NOISE_FNS[noise_type]
    out = []
    for row in range(height):
        line = ''
        y = row / height
        for col in range(width):
            x  = col / width
            v  = max(0.0, min(1.0, fn(x, y, scale, seed)))
            ch = val_to_char(v, palette)
            if color:
                line += _ansi_green(v) + ch
            else:
                line += ch
        if color:
            line += _RESET
        out.append(line)
    return '\n'.join(out)


# ── Status line ────────────────────────────────────────────────────────────────

def _status(seed, noise_type, palette, scale, extra=''):
    dim = '\033[38;5;240m'
    return (
        f'{dim}  seed:{seed:<6} type:{noise_type:<10} '
        f'palette:{palette:<8} scale:{scale}{extra}{_RESET}'
    )


# ── Commands ───────────────────────────────────────────────────────────────────

def cmd_gen(args):
    seed      = args.seed if args.seed is not None else random.randint(0, 99999)
    use_color = args.color and _supports_color()
    palette   = args.palette

    if not _supports_unicode() and palette not in ('safe', 'ascii', 'binary', 'dots', 'matrix'):
        print(
            '[warn] ваш терминал не поддерживает unicode. '
            'используй --palette safe',
            file=sys.stderr,
        )
        palette = 'safe'

    if args.animate:
        interval = 1.0 / max(1, args.fps)
        s        = seed
        # clear screen + hide cursor
        sys.stdout.write('\033[2J\033[?25l')
        sys.stdout.flush()
        try:
            while True:
                frame  = render_frame(args.type, args.width, args.height,
                                      args.scale, palette, s, use_color)
                status = _status(s, args.type, palette, args.scale,
                                 '  ctrl+c → стоп')
                sys.stdout.write('\033[H' + frame + '\n' + status + '\033[K')
                sys.stdout.flush()
                time.sleep(interval)
                s = (s + 1) % 99999
        except KeyboardInterrupt:
            pass
        finally:
            sys.stdout.write(_RESET + '\033[?25h\n')
            sys.stdout.flush()
        return

    frame = render_frame(args.type, args.width, args.height,
                         args.scale, palette, seed, use_color)

    if args.output:
        plain = render_frame(args.type, args.width, args.height,
                             args.scale, palette, seed, color=False)
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(plain + '\n')
        print(f'saved → {args.output}')
    else:
        print(frame)
        if use_color:
            print(_RESET, end='')
        print(_status(seed, args.type, palette, args.scale))


def cmd_palettes(_args):
    print()
    for name, chars in PALETTES.items():
        sample = ''.join(
            val_to_char(i / max(len(chars) - 1, 1), name)
            for i in range(len(chars))
        ) * 6
        print(f'  {name:<10} {sample}')
    print()


# ── Entry point ────────────────────────────────────────────────────────────────

def build_parser():
    p = argparse.ArgumentParser(
        prog='noise',
        description='ASCII noise texture generator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  noise gen perlin
  noise gen fractal --width 120 --height 40 --color
  noise gen cellular --palette dots --seed 1337 --color
  noise gen warp --animate --fps 12 --color
  noise gen white --output texture.txt
  noise palettes
""",
    )
    sub = p.add_subparsers(dest='command')

    # ── gen ──────────────────────────────────────────────────────────────────
    g = sub.add_parser('gen', help='generate noise texture')
    g.add_argument(
        'type', nargs='?', default='perlin',
        choices=NOISE_TYPES, metavar='type',
        help=f'тип шума: {", ".join(NOISE_TYPES)}  (default: perlin)',
    )
    g.add_argument('-W', '--width',   type=int,   default=80,    metavar='N')
    g.add_argument('-H', '--height',  type=int,   default=40,    metavar='N')
    g.add_argument('-s', '--scale',   type=float, default=4.0,   metavar='F',
                   help='масштаб шума (default: 4.0)')
    g.add_argument('-p', '--palette', default='void',
                   choices=PALETTE_NAMES, metavar='NAME',
                   help=f'палитра символов (default: void)')
    g.add_argument('--seed',    type=int,  default=None,
                   help='зерно генератора (default: random)')
    g.add_argument('--color',   action='store_true',
                   help='ANSI-цвет (зелёный фосфор)')
    g.add_argument('--animate', action='store_true',
                   help='анимация — инкрементирует seed в цикле')
    g.add_argument('--fps',     type=int, default=10, metavar='N',
                   help='кадров в секунду при --animate (default: 10)')
    g.add_argument('-o', '--output', default=None, metavar='FILE',
                   help='сохранить в файл (без ANSI-кодов)')

    # ── palettes ─────────────────────────────────────────────────────────────
    sub.add_parser('palettes', help='показать доступные палитры')

    return p


def main():
    parser = build_parser()
    args   = parser.parse_args()

    if args.command == 'gen':
        cmd_gen(args)
    elif args.command == 'palettes':
        cmd_palettes(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
