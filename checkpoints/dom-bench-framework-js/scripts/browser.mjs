import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
export async function browserSession() {
  let server;
  try { await fetch('http://127.0.0.1:4173').then(r => { if (!r.ok) throw new Error('Not ready'); }); }
  catch {
    server = spawn(process.execPath, ['scripts/server.mjs'], { stdio: 'ignore', windowsHide: true });
    for (let i = 0; i < 50; i++) { try { if ((await fetch('http://127.0.0.1:4173')).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  }
  const paths = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
  const executablePath = paths.find(existsSync);
  let browser;
  try { browser = await chromium.launch({ executablePath, headless: true, args: ['--enable-precise-memory-info'] }); }
  catch (error) { server?.kill(); throw new Error(`Browser launch failed. Install Chromium with npx playwright install chromium. ${error.message}`); }
  return { browser, async close() { await browser.close(); server?.kill(); } };
}
