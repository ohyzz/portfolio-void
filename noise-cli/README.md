# noise-cli

ASCII noise texture generator for the terminal. No dependencies — pure Python 3.7+.

```
░░░▒▒▒▓▓▓████▓▓▒▒░░░░░▒▒▒▒▒░░░
░░▒▒▒▓▓████████▓▒▒░░░░▒▒▒▒▒▒░░
▒▒▒▓▓████████████▓▒░░░▒▒▓▓▒▒▒░
▒▓▓████████████████▓░░▒▓████▓▒░
```

## install

```bash
# run directly
python noise_cli.py gen perlin --color

# or install globally
pip install .
noise gen perlin --color
```

## usage

```
noise gen [type] [options]

types:   perlin  smooth  fractal  cellular  warp  white

options:
  -W, --width    N     ширина в символах  (default: 80)
  -H, --height   N     высота в строках   (default: 40)
  -s, --scale    F     масштаб шума       (default: 4.0)
  -p, --palette  NAME  палитра символов   (default: void)
      --seed     N     зерно генератора   (default: random)
      --color          ANSI-цвет (зелёный фосфор)
      --animate        анимация — инкрементирует seed
      --fps      N     кадров/сек при animate (default: 10)
  -o, --output   FILE  сохранить в .txt файл
```

## examples

```bash
noise gen perlin --color
noise gen fractal --width 120 --height 50 --color
noise gen cellular --palette dots --seed 1337 --color
noise gen warp --scale 6 --color
noise gen white --palette binary
noise gen fractal --animate --fps 15 --color
noise gen perlin --output texture.txt
noise palettes
```

## palettes

| name    | chars               |
|---------|---------------------|
| void    | ` ░▒▓█`             |
| binary  | ` 01`               |
| dots    | ` .·:;#`            |
| matrix  | ` .-+*#@`           |
| block   | ` ▁▂▃▄▅▆▇█`         |
| blood   | ` .+*#▓█`           |
| ascii   | ` .,\`-~:;=!*#$@`   |
| safe    | ` .:+*#@` (ASCII-only) |

## noise types

- **perlin** — fractional brownian motion, 4 октавы
- **smooth** — value noise со smoothstep
- **fractal** — fbm с 6 октавами, детализированный
- **cellular** — Worley noise, органические ячейки
- **warp** — domain warping, закрученные формы
- **white** — чистый случайный шум

## license

MIT
