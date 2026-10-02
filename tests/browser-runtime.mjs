import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {fixtureRuntime} from './runtime-fixtures.mjs';

const live=process.env.LIVE_RUNTIME==='1';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||chromium.executablePath(),headless:true,args:['--no-sandbox']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
try {
  for(const width of live?[390]:[1280,390]){
    // Representative regular-browser UA for online CORS verification. The
    // production app does not set UA, change authentication or bypass Anubis.
    const page=await browser.newPage({viewport:{width,height:900},...(live?{
      userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    }:{})});
    const errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>requests.push(r.url()));
    const fixtures=live?null:await fixtureRuntime(page);
    await page.goto(base);
    await page.getByRole('button',{name:'Компоненты и пакеты',exact:true}).click();
    async function reopen(){
      await page.getByRole('button',{name:'Сравнение веток',exact:true}).click();
      await page.getByRole('button',{name:'Компоненты и пакеты',exact:true}).click();
    }
    const sourceURLs=()=>page.locator('.doc-sources a').evaluateAll(links=>links.map(link=>link.href));
    async function ready(){
      await page.locator('.doc-count').waitFor({timeout:180000});
      await page.locator('.doc-shell[aria-busy="false"]').waitFor({timeout:180000});
      assert.equal(await page.locator('.doc-error').count(),0,(await page.locator('.doc-error').allInnerTexts()).join('\n'));
      // The compact mobile layout can render fewer cards at once; the
      // important contract is that the runtime table is present and populated.
      assert.ok(await page.locator('.doc-card').count()>0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.equal(await page.getByRole('button',{name:'Обновить из источников',exact:true}).count(),0);
      assert.equal(await page.getByRole('button',{name:'Очистить кеш',exact:true}).count(),0);
      assert.equal(await page.locator('.doc-runtime, .doc-cache-note, .doc-provenance').count(),0);
      assert.equal(requests.filter(url=>url.includes('/doc-data/')).length,0);
    }
    await ready();
    assert.ok(requests.some(url=>url.includes('/releases/11.1/manifest.json')));
    assert.equal(requests.filter(url=>url.includes('/api/image/')).length,0);
    console.log(JSON.stringify({mode:live?'live':'fixture',width,arch:'x86_64',baseline:'static',technicalControls:'removed'}));
    await page.getByRole('textbox',{name:'Поиск компонентов и пакетов'}).fill('p7zip');
    await page.locator('.doc-card-head').first().click();
    const zipRow=page.locator('tbody tr').filter({has:page.getByRole('button',{name:'p7zip',exact:true})});
    assert.match(await zipRow.innerText(),/7-zip.*изменился поставщик RPM/s);
    await page.getByRole('button',{name:'p7zip',exact:true}).click();
    const panel=page.getByRole('complementary',{name:'Пакет',exact:true});
    await panel.getByRole('button',{name:'Changelog Sisyphus',exact:true}).click();
    assert.equal(await panel.getByRole('button',{name:'Changelog Sisyphus',exact:true}).getAttribute('aria-pressed'),'true');
    await panel.getByRole('button',{name:'Закрыть ×'}).click();
    await page.getByRole('textbox',{name:'Поиск компонентов и пакетов'}).fill('');
    if(!live){
      const count=await page.locator('.doc-count').innerText();
      const before=fixtures.observed.filter(url=>url.includes('/branch_binary_packages/p11?arch=x86_64')).length;
      await reopen();
      await ready();
      assert.equal(fixtures.observed.filter(url=>url.includes('/branch_binary_packages/p11?arch=x86_64')).length,before+1);
      assert.equal(fixtures.observed.filter(url=>url.includes('/api/image/')).length,0);
      assert.equal(await page.locator('.doc-count').innerText(),count);
      const previous=await sourceURLs();
      await page.route('**/export/branch_binary_packages/p11?arch=x86_64',route=>route.fulfill({status:503,body:'Fixture: unavailable'}));
      await reopen();
      await page.getByRole('alert').waitFor();
      await page.locator('.doc-shell[aria-busy="false"]').waitFor();
      assert.match(await page.getByRole('alert').innerText(),/HTTP 503.*предыдущий успешный результат/s);
      assert.equal(await page.locator('.doc-count').innerText(),count);
      assert.deepEqual(await sourceURLs(),previous);
      await page.unroute('**/export/branch_binary_packages/p11?arch=x86_64');
      await page.route('**/releases/11.1/x86_64-*.json',route=>route.fulfill({json:{invalid:'fixture'}}));
      await reopen();
      await page.getByRole('alert').waitFor();
      assert.match(await page.getByRole('alert').innerText(),/База сравнения.*Контрольная сумма/s);
      assert.deepEqual(await sourceURLs(),previous);
      await page.unroute('**/releases/11.1/x86_64-*.json');
      // Clear only the isolated test browser's IndexedDB through its normal
      // API; production intentionally has no cache-control button.
      await page.evaluate(()=>new Promise((resolve,reject)=>{
        const request=indexedDB.deleteDatabase('alt-components-runtime-v1');
        request.onsuccess=()=>resolve(); request.onerror=()=>reject(request.error);
      }));
      await reopen();
      await ready();
      assert.equal((await sourceURLs())[0],previous[0]);
    }
    await page.getByRole('combobox',{name:'Архитектура'}).selectOption('aarch64');
    await ready();
    console.log(JSON.stringify({mode:live?'live':'fixture',width,arch:'aarch64',reloadAndErrors:!live?'passed':'not mocked'}));
    assert.deepEqual(errors,[]);
    assert.equal(requests.filter(url=>url.includes('/api/image/')).length,0);
    await page.close();
  }
}finally{await browser.close();}
