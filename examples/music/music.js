/* Music example. Picking an album re-themes the app from its cover colour,
   using the same engine as the theme builder (Material Color Utilities + src/theme-core.js). */
import * as mcu from 'https://cdn.jsdelivr.net/npm/@material/material-color-utilities@0.3.0/+esm';
import { makeTheme, themeToCss } from '../../src/theme-core.js';

const $ = (id) => document.getElementById(id);
const html = document.documentElement;

const ALBUMS = [
  { title: 'Slow Light', artist: 'Hollow Tide', year: 2026, seed: '#5B7FD6', b: '#E89AC7' },
  { title: 'Night Drive', artist: 'Prism Radio', year: 2025, seed: '#1F8A70', b: '#F2C14E' },
  { title: 'Glasswork', artist: 'Mira Vale', year: 2026, seed: '#C2410C', b: '#FDBA74' },
  { title: 'Tonal', artist: 'The Lows', year: 2024, seed: '#7C3AED', b: '#22D3EE' },
  { title: 'Seed 40', artist: 'Ana Kiri', year: 2025, seed: '#BE185D', b: '#FDE68A' },
  { title: 'Refract', artist: 'Dana North', year: 2023, seed: '#0E7490', b: '#A7F3D0' },
  { title: 'Paper Moon', artist: 'Sand & Sea', year: 2026, seed: '#A16207', b: '#BFDBFE' },
  { title: 'Monochrome', artist: 'Grey Hours', year: 2022, seed: '#52525B', b: '#E4E4E7' }
];
const TRACKS = ['Opening', 'Glass in the Morning', 'Forty to Ninety', 'Bend at the Edges', 'Surface Container', 'Specular', 'Seed', 'Closing Light'];
let current = 0;
let track = 1;
let playing = true;

function applyTheme(album) {
  const theme = makeTheme(mcu, { seed: album.seed, variant: 'vibrant' });
  $('album-theme').textContent = themeToCss('album', theme);
  html.setAttribute('data-mg-theme', 'album');
  document.querySelectorAll('[data-theme-name]').forEach((el) => { el.textContent = album.title; });
  requestAnimationFrame(() => MaterialGlass.refresh());
}

const art = (el, a) => { el.style.setProperty('--a', a.seed); el.style.setProperty('--b', a.b); };

function renderAlbums() {
  const host = $('albums');
  host.textContent = '';
  ALBUMS.forEach((a, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mu-album';
    b.setAttribute('aria-pressed', String(i === current));
    b.innerHTML = `<span class="mu-album__art" aria-hidden="true"></span><b></b><span></span>`;
    art(b.querySelector('.mu-album__art'), a);
    b.querySelector('b').textContent = a.title;
    b.querySelectorAll('span')[1].textContent = `${a.artist} · ${a.year}`;
    b.addEventListener('click', () => play(i));
    host.appendChild(b);
  });
}

function renderTracks() {
  const a = ALBUMS[current];
  const list = (id, from) => {
    const ol = $(id);
    ol.textContent = '';
    TRACKS.slice(from).forEach((t, k) => {
      const i = k + from;
      const li = document.createElement('li');
      li.className = 'mg-list-item mg-list-item--interactive';
      li.tabIndex = 0;
      if (i === track) li.setAttribute('aria-current', 'true');
      li.innerHTML = `<span class="mu-num">${i === track ? '<span class="mg-eq" aria-hidden="true"><span></span><span></span><span></span></span>' : i + 1}</span><span class="mg-list-item__text"><span class="mg-list-item__headline"></span><span class="mg-list-item__supporting"></span></span><span class="mu-num">${2 + (i % 3)}:${String(10 + i * 7).slice(-2)}</span>`;
      li.querySelector('.mg-list-item__headline').textContent = t;
      li.querySelector('.mg-list-item__supporting').textContent = a.artist;
      li.addEventListener('click', () => { track = i; update(); });
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter') { track = i; update(); } });
      ol.appendChild(li);
    });
  };
  list('tracks', 0);
  list('queue-list', track + 1);
}

function update() {
  const a = ALBUMS[current];
  $('np-title').textContent = a.title;
  $('np-artist').textContent = `${a.artist} · ${a.year}`;
  $('np-seed').textContent = a.seed;
  $('mini-title').textContent = TRACKS[track];
  $('mini-artist').textContent = `${a.artist} · ${a.title}`;
  art($('np-art'), a);
  art($('mini-art'), a);
  renderAlbums();
  renderTracks();
}

function play(i) {
  current = i;
  track = 0;
  applyTheme(ALBUMS[i]);
  update();
  setPlaying(true);
  MaterialGlass.toast(`Playing ${ALBUMS[i].title} · theme from ${ALBUMS[i].seed}`);
}

function setPlaying(p) {
  playing = p;
  const icon = p ? 'i-pause' : 'i-play';
  $('play').setAttribute('aria-label', p ? 'Pause' : 'Play');
  $('play').querySelector('use').setAttribute('href', '#' + icon);
  $('play-big').innerHTML = `<svg aria-hidden="true"><use href="#${icon}"/></svg>${p ? 'Pause' : 'Play'}`;
  document.querySelector('.mu-player__art').style.setProperty('--spin', p ? 'running' : 'paused');
}

$('play').addEventListener('click', () => setPlaying(!playing));
$('play-big').addEventListener('click', () => setPlaying(!playing));
document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { track = (track + +b.dataset.step + TRACKS.length) % TRACKS.length; update(); }));
document.querySelector('[data-open-queue]').addEventListener('click', () => $('queue').showModal());
document.addEventListener('click', (e) => { const t = e.target.closest('[data-toggle]'); if (t) t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true')); });
const seek = $('seek');
seek.addEventListener('input', () => { const s = +seek.value; $('pos').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; });
setInterval(() => {
  if (!playing || document.hidden) return;
  seek.value = (+seek.value + 1) % +seek.max;
  seek.dispatchEvent(new Event('input'));
}, 1000);

// The demo's theme menu still works: picking a theme there leaves album mode.
if (window.MGDemo) MGDemo.onChange(() => {
  if (html.getAttribute('data-mg-theme') !== 'album') document.querySelectorAll('.mu-album').forEach((b) => b.setAttribute('aria-pressed', 'false'));
});

applyTheme(ALBUMS[current]);
update();
