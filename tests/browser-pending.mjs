import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {fixtureRuntime} from './runtime-fixtures.mjs';

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||chromium.executablePath(),headless:true,args:['--no-sandbox']});
try {
  // Open the panel while the provider is still being verified. Existing
  // browser scenarios primarily open it after the table has settled.
  for(const mode of ['p11','sisyphus','sisyphus-error']) {
    const branch=mode==='p11'?'p11':'sisyphus';
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await fixtureRuntime(page,{realTimers:true});
    let release;
    const gate=new Promise(resolve=>{release=resolve;});
    await page.route('**/dependencies/packages_by_dependency?*',async route=>{
      const query=new URL(route.request().url()).searchParams;
      if(mode!=='sisyphus-error'&&query.get('branch')===branch&&query.get('dp_name')==='cups-ppd')await gate;
      await route.fallback();
    });
    if(mode==='sisyphus-error')await page.route('**/export/branch_binary_packages/sisyphus?*',async route=>{
      await gate;
      await route.fulfill({status:503,body:'Fixture: supplementary source failed'});
    });
    let changelogCalls=0;
    await page.route('**/site/source_package_versions?name=cups',route=>{
      changelogCalls++;
      return route.fulfill({json:{request_args:{name:'cups'},versions:[
        {branch:'p11',version:'2.4.19',release:'alt2',pkghash:'fixture-p11'},
        {branch:'sisyphus',version:'2.4.19',release:'alt3',pkghash:'fixture-sisyphus'},
      ]}});
    });
    await page.route('**/site/package_changelog/fixture-*?*',route=>{
      const pkghash=new URL(route.request().url()).pathname.split('/').at(-1);
      return route.fulfill({json:{pkghash,changelog:[
        {evr:pkghash==='fixture-p11'?'2.4.19-alt2':'2.4.19-alt3',message:'Fixture: provider became ready'},
        {evr:'2.4.16-alt2',message:'Fixture: baseline'},
      ]}});
    });
    await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:5173/');
    await page.getByRole('button',{name:'Компоненты и пакеты',exact:true}).click();
    await page.locator('.doc-count').waitFor();
    await page.getByRole('textbox',{name:'Поиск компонентов и пакетов'}).fill('cups-ppd');
    await page.locator('.doc-card-head').first().click();
    await page.getByRole('button',{name:'cups-ppd',exact:true}).first().click();
    const panel=page.getByRole('complementary',{name:'Пакет',exact:true});
    const label=branch==='p11'?'p11':'Sisyphus';
    const button=panel.getByRole('button',{name:`Changelog ${label}`,exact:true});
    if(branch==='sisyphus')await button.click();
    assert.match(await button.innerText(),/проверяется RPM-поставщик/);
    await panel.getByRole('status').filter({hasText:'changelog загрузится после проверки'}).waitFor();
    release();
    if(mode==='sisyphus-error')await panel.getByRole('status').filter({hasText:'Нельзя загрузить changelog Sisyphus'}).waitFor();
    else await panel.getByText('Fixture: provider became ready',{exact:true}).waitFor();
    await page.locator('.doc-shell[aria-busy="false"]').waitFor();
    const row=page.locator('tbody tr').filter({has:page.getByRole('button',{name:'cups-ppd',exact:true})}).first();
    const version=branch==='p11'?'2.4.19-alt2':'2.4.19-alt3';
    if(mode==='sisyphus-error')assert.match(await button.innerText(),/RPM-поставщик не определён/);
    else {
      assert.ok((await row.locator('td').nth(branch==='p11'?2:3).innerText()).includes(version));
      assert.ok((await button.innerText()).includes(version));
    }
    assert.doesNotMatch(await panel.innerText(),/Пакет не найден|проверяется RPM-поставщик/);
    assert.ok(changelogCalls<=2,'unrelated verification updates must not reload the changelog');
    await panel.getByRole('button',{name:'Закрыть ×'}).click();
    await page.getByRole('button',{name:'cups-ppd',exact:true}).first().click();
    await panel.getByText('Fixture: provider became ready',{exact:true}).waitFor();
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({fixture:'panel opened during provider verification',mode,result:'passed'}));
    await page.close();
  }
} finally {await browser.close();}
