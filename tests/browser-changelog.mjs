// Branch switching fixtures are intercepted only in these pages.
// Production snapshots and external endpoints are never modified.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {fixtureRuntime} from './runtime-fixtures.mjs';

const load=name=>JSON.parse(readFileSync(new URL(`../public/doc-data/${name}.json`,import.meta.url)));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||chromium.executablePath(),headless:true,args:['--no-sandbox']});
try {
  for (const mode of ['race','missing','error','no-baseline','different-provider']) {
    const page=await browser.newPage({viewport:{width:390,height:900}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const baseline=load('image-11.1-x86_64');
    const p11=load('p11-x86_64'), sisyphus=load('sisyphus-x86_64');
    baseline.packages.cups={...baseline.packages.cups,evr:'2.4.16-alt2',epochKnown:true};
    p11.packages.cups={...p11.packages.cups,evr:'2.4.19-alt2',source:'fixture-p11-cups'};
    sisyphus.packages.cups={...sisyphus.packages.cups,evr:'2.4.19-alt3',source:'fixture-sisy-cups'};
    if (mode==='no-baseline') {
      delete baseline.packages.cups;
      baseline.providers['cups-ppd']={candidates:[],complete:false,source:'fixture:incomplete'};
    }
    if (mode==='missing') {
      delete sisyphus.packages.cups;
      sisyphus.providers['cups-ppd']={candidates:[],complete:true,source:'fixture:missing'};
    }
    if (mode==='different-provider') {
      sisyphus.packages['fixture-replacement']=sisyphus.packages.cups;
      sisyphus.providers['cups-ppd']={candidates:['fixture-replacement'],complete:true,source:'fixture:replacement'};
    }
    await fixtureRuntime(page,{arch:'x86_64',image:baseline,p11,sisyphus});
    const names=[];
    await page.route('**/api/site/source_package_versions?*',route=>{
      const name=new URL(route.request().url()).searchParams.get('name');
      if(name==='alt-components-base')return route.fallback();
      names.push(name);
      const branch=name==='fixture-p11-cups'?'p11':'sisyphus';
      return route.fulfill({json:{request_args:{name},versions:[
        {branch,version:'2.4.19',release:branch==='p11'?'alt2':'alt3',pkghash:`fixture-${branch}-log`},
      ]}});
    });
    let startFirst, releaseFirst, finishFirst;
    const firstStarted=new Promise(resolve=>{startFirst=resolve;});
    const firstReleased=new Promise(resolve=>{releaseFirst=resolve;});
    const firstFinished=new Promise(resolve=>{finishFirst=resolve;});
    let delayed=false;
    await page.route('**/api/site/package_changelog/fixture-*-log?*',async route=>{
      const hash=new URL(route.request().url()).pathname.split('/').at(-1);
      const isP11=hash==='fixture-p11-log';
      if (mode==='race' && isP11 && !delayed) {
        delayed=true;
        startFirst();
        await firstReleased;
        try {await route.fulfill({json:{pkghash:hash,changelog:[{evr:'2.4.19-alt2',message:'Fixture: stale p11 response'}]}});}
        catch { /* The browser may already have cancelled the old request. */ }
        finally {finishFirst();}
        return;
      }
      if (!isP11 && mode==='error') return route.fulfill({status:503,body:'Fixture: unavailable'});
      return route.fulfill({json:{pkghash:hash,changelog:[
        {evr:isP11?'2.4.19-alt2':'2.4.19-alt3',message:`Fixture: selected ${isP11?'p11':'sisyphus'} branch`},
        {evr:'2.4.16-alt2',message:'Fixture: baseline'},
      ]}});
    });
    await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:5173/');
    await page.getByRole('button',{name:'Компоненты и пакеты',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.doc-count')||document.querySelector('.doc-error'));
    assert.equal(await page.locator('.doc-error').count(),0,`${mode}: ${await page.locator('.doc-error').allInnerTexts()}`);
    if (mode !== 'race') await page.locator('.doc-shell[aria-busy="false"]').waitFor();
    await page.getByRole('textbox',{name:'Поиск компонентов и пакетов'}).fill('cups-ppd');
    await page.locator('.doc-card-head').first().click();
    await page.getByRole('button',{name:'cups-ppd',exact:true}).click();
    const panel=page.getByRole('complementary',{name:'Пакет',exact:true});
    if (mode==='race') await firstStarted;
    else await panel.getByText('Fixture: selected p11 branch').waitFor();
    const sisyButton=panel.getByRole('button',{name:'Changelog Sisyphus',exact:true});
    const p11Button=panel.getByRole('button',{name:'Changelog p11',exact:true});
    await sisyButton.click();
    if (mode==='missing') {
      await panel.getByText(/Пакет не найден в снимке Sisyphus/).waitFor();
      assert.ok(!names.includes('fixture-sisy-cups'));
    } else if (mode==='error') {
      await panel.getByText(/Changelog Sisyphus недоступен.*HTTP 503/).waitFor();
    } else {
      await panel.getByText('Fixture: selected sisyphus branch').waitFor();
      assert.match(await panel.innerText(),/Исходный пакет Sisyphus: fixture-sisy-cups/);
      assert.match(await panel.getByRole('link',{name:'Полный источник ↗'}).getAttribute('href'),/\/sisyphus\/srpms\/fixture-sisy-cups\//);
      if (mode==='race') {
        releaseFirst();
        await firstFinished;
        await page.waitForTimeout(100);
        assert.equal(await panel.getByText('Fixture: stale p11 response').count(),0);
      }
      if (mode==='no-baseline' || mode==='different-provider') {
        assert.match(await panel.locator('.doc-changelog-range').innerText(),/История RPM в Sisyphus/);
        assert.equal(await panel.getByText('Fixture: baseline',{exact:true}).count(),1);
      }
      if (mode==='different-provider') assert.match(await panel.innerText(),/cups.*→.*fixture-replacement/);
    }
    assert.equal(await panel.getByText('Fixture: selected p11 branch').count(),0);
    assert.equal(await sisyButton.getAttribute('aria-pressed'),'true');
    // Native buttons also switch correctly through the keyboard.
    await p11Button.focus();
    await p11Button.press('Enter');
    await panel.getByText('Fixture: selected p11 branch').waitFor();
    assert.equal(await p11Button.getAttribute('aria-pressed'),'true');
    assert.equal(await panel.getByText('Fixture: selected sisyphus branch').count(),0);
    assert.equal(await panel.evaluate(element=>element.scrollWidth>element.clientWidth),false);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({fixture:'changelog branch switching',mode,result:'passed'}));
    await page.close();
  }
} finally {await browser.close();}
