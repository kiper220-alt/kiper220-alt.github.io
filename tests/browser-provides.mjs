// Run with a local Vite server. Synthetic ambiguity and changelog responses are
// intercepted in this browser only and never written into working snapshots.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {fixtureRuntime} from './runtime-fixtures.mjs';

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
const aliases={'gvfs-utils':'libgio','alterator-browser-qt':'alterator-browser-qt6','alterator-pkg':'installer-alterator-pkg','kea-shell':'kea-admin','gtk-update-icon-cache':'gtk4-update-icon-cache','gtk2-theme-breeze':'gtk-theme-breeze','gtk3-theme-breeze':'gtk-theme-breeze','cups-ppd':'cups','tftp-server':'tftp-server-xinetd'};
const components={'gvfs-utils':'gvfs','alterator-browser-qt':'alt-server-gnome-environment','alterator-pkg':'alt-server-gnome-environment','kea-shell':'dhcp-kea','gtk-update-icon-cache':'themes-gtk','gtk2-theme-breeze':'themes-gtk','gtk3-theme-breeze':'themes-gtk','cups-ppd':'cups','tftp-server':'tftp-server'};
const load=name=>JSON.parse(readFileSync(new URL(`../public/doc-data/${name}.json`,import.meta.url)));
const imageVersions=new Map(['x86_64','aarch64'].flatMap(arch=>
  Object.values(load(`image-11.1-${arch}`).packages).map(pkg=>[pkg.hash,pkg.evr])));

try {
  for (const width of [1280,390]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    const errors=[];
    await fixtureRuntime(page);
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/site/package_changelog/*?changelog_last=1',route=>{
      const hash=new URL(route.request().url()).pathname.split('/').at(-1);
      return route.fulfill({json:{pkghash:hash,changelog:[{evr:imageVersions.get(hash)}]}});
    });
    await page.route('**/api/site/source_package_versions?*',route=>{
      const name=new URL(route.request().url()).searchParams.get('name');
      if(name==='alt-components-base')return route.fallback();
      const zip=name==='7-zip';
      return route.fulfill({json:{request_args:{name},versions:[
        {branch:'p11',version:zip?'26.02':'2.4.19',release:zip?'alt1':'alt2',pkghash:zip?'fixture-zip-p11':'fixture-log'},
        {branch:'sisyphus',version:zip?'26.03':'2.4.19',release:zip?'alt1':'alt3',pkghash:zip?'fixture-zip-sisyphus':'fixture-sisy-log'},
      ]}});
    });
    await page.route('**/api/site/package_changelog/fixture-log?*',route=>route.fulfill({json:{pkghash:'fixture-log',changelog:[
      {evr:'2.4.19-alt2',message:'Fixture: confirmed provider changelog'},
      {evr:'2.4.16-alt2',message:'Fixture: baseline'},
      ...Array.from({length:8},()=>({evr:'',message:'Fixture: old unversioned record'})),
    ]}}));
    await page.route('**/api/site/package_changelog/fixture-sisy-log?*',route=>route.fulfill({json:{pkghash:'fixture-sisy-log',changelog:[
      {evr:'2.4.19-alt3',message:'Fixture: Sisyphus provider changelog'},
      {evr:'2.4.16-alt2',message:'Fixture: baseline'},
    ]}}));
    for (const branch of ['p11','sisyphus']) {
      await page.route(`**/api/site/package_changelog/fixture-zip-${branch}?*`,route=>route.fulfill({json:{pkghash:`fixture-zip-${branch}`,changelog:[
        {evr:branch==='p11'?'26.02-alt1':'26.03-alt1',message:`Fixture: replacement history ${branch}`},
      ]}}));
    }
    await page.goto(base);
    await page.getByRole('button',{name:'Компоненты и пакеты',exact:true}).click();
    await page.locator('.doc-count').waitFor();
    await page.locator('.doc-shell[aria-busy="false"]').waitFor();
    const search=page.getByRole('textbox',{name:'Поиск компонентов и пакетов'});
    assert.equal(await page.getByText('Дополнительные фильтры',{exact:true}).count(),0);
    assert.equal(await page.getByRole('combobox',{name:'Изменения компонентов'}).count(),0);
    assert.equal(await page.getByRole('combobox',{name:'Состояние данных'}).count(),0);
    for (const arch of ['x86_64','aarch64']) {
      await search.fill('');
      if (arch==='aarch64') {
        await page.getByRole('combobox',{name:'Архитектура'}).selectOption(arch);
        await page.locator('.doc-count').waitFor();
        await page.locator('.doc-shell[aria-busy="false"]').waitFor();
      }
      for (const edition of ['edition_server','edition_domain']) {
        await page.getByRole('combobox',{name:'Редакция'}).selectOption(edition);
        for(const [alias,actual] of Object.entries(aliases)) {
          await search.fill(alias);
          const card=page.locator('.doc-card').filter({has:page.locator('.doc-card-head small').filter({hasText:components[alias]+' ·'})});
          const head=card.locator('.doc-card-head');
          if(await head.getAttribute('aria-expanded')==='false')await head.click();
          const row=card.locator('tbody tr').filter({has:page.getByRole('button',{name:alias,exact:true})});
          assert.equal(await row.count(),1,alias);
          assert.match(await row.locator('td').nth(1).innerText(),new RegExp(actual));
          assert.match(await row.locator('td').nth(2).innerText(),new RegExp(actual));
          assert.doesNotMatch(await row.locator('td').nth(4).innerText(),/нет в образе|нет данных|отсутствует/);
        }
      }
    }
    await search.fill('cups-ppd');
    const cupsHead=page.locator('.doc-card-head').first();
    if(await cupsHead.getAttribute('aria-expanded')==='false')await cupsHead.click();
    const cups=page.getByRole('button',{name:'cups-ppd',exact:true});
    await cups.click();
    const panel=page.getByRole('complementary',{name:'Пакет',exact:true});
    assert.equal(await panel.getByRole('link',{name:/Подтверждение Provides в RPM/}).count(),3);
    await panel.getByText('Fixture: confirmed provider changelog').waitFor();
    assert.match(await panel.innerText(),/Исходный пакет p11: cups/);
    assert.doesNotMatch(await panel.innerText(),/предварительн|epoch.*не подтверждён/i);
    assert.equal(await panel.locator('.doc-warning-text').count(),0);
    assert.equal(await panel.getByRole('link',{name:/Источник epoch версии 11.1/}).count(),1);
    const sisyButton=panel.getByRole('button',{name:'Changelog Sisyphus',exact:true});
    const p11Button=panel.getByRole('button',{name:'Changelog p11',exact:true});
    await sisyButton.click();
    await panel.getByText('Fixture: Sisyphus provider changelog').waitFor();
    assert.equal(await sisyButton.getAttribute('aria-pressed'),'true');
    assert.equal(await p11Button.getAttribute('aria-pressed'),'false');
    assert.match(await panel.getByRole('link',{name:'Полный источник ↗'}).getAttribute('href'),/\/sisyphus\/srpms\/cups\//);
    assert.equal(await panel.getByText('Fixture: confirmed provider changelog').count(),0);
    assert.equal(await panel.evaluate(element=>element.scrollWidth>element.clientWidth),false);
    await p11Button.click();
    await panel.getByText('Fixture: confirmed provider changelog').waitFor();
    assert.equal(await p11Button.getAttribute('aria-pressed'),'true');
    await panel.getByRole('button',{name:'Закрыть ×'}).click();
    const filter=page.getByRole('combobox',{name:'Тип изменения'});
    assert.equal(await filter.locator('option').count(),6);
    await filter.selectOption('updated');
    assert.ok(await page.locator('.doc-card').count()>0);
    await filter.selectOption('');
    await search.fill('gtkhash-caja');
    const gtkHead=page.locator('.doc-card-head').first();
    if(await gtkHead.getAttribute('aria-expanded')==='false')await gtkHead.click();
    const gtkRow=page.locator('tbody tr').filter({has:page.getByRole('button',{name:'gtkhash-caja',exact:true})});
    assert.equal((await gtkRow.locator('td').nth(1).innerText()).trim(),'нет в образе');
    await search.fill('p7zip');
    await filter.selectOption('provider-changed');
    assert.equal(await page.locator('.doc-card').count(),1);
    const zipHead=page.locator('.doc-card-head').first();
    if(await zipHead.getAttribute('aria-expanded')==='false')await zipHead.click();
    await page.getByRole('button',{name:'p7zip',exact:true}).click();
    await panel.getByText('Fixture: replacement history p11').waitFor();
    assert.match(await panel.innerText(),/p7zip.*→.*7-zip/);
    assert.match(await panel.innerText(),/Общий диапазон changelog разных RPM/);
    await sisyButton.click();
    await panel.getByText('Fixture: replacement history sisyphus').waitFor();
    assert.match(await panel.locator('.doc-changelog-range').innerText(),/История RPM в Sisyphus/);
    await panel.getByRole('button',{name:'Закрыть ×'}).click();
    assert.equal(await filter.locator('option[value="missing-p11"]').count(),0);
    assert.equal(await filter.locator('option[value="downgraded"]').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({width,editions:2,architectures:2,aliases:9,filters:'passed',providerChangelog:'passed',p7zipReplacement:'passed',overflow:false,errors}));
    await page.close();
  }
  const page=await browser.newPage();
  const p11=load('p11-x86_64'), image=load('image-11.1-x86_64');
  // Controlled fixture: no arbitrary choice when two providers are present.
  p11.packages['fixture-provider']={evr:'9.0-alt1',source:'fixture',arch:'x86_64'};
  p11.providers['gvfs-utils']={candidates:['libgio','fixture-provider'],complete:true,source:'fixture:lookup'};
  image.providers['gvfs-utils']={candidates:[],complete:false,source:'fixture:incomplete'};
  // A distinct historical hash prevents the real, unchanged p11 RPM from
  // correctly confirming Provides in this deliberately incomplete fixture.
  image.packages.libgio.hash='fixture-unconfirmed-historical-libgio';
  await fixtureRuntime(page,{arch:'x86_64',p11,image});
  await page.goto(base);
  await page.getByRole('button',{name:'Компоненты и пакеты',exact:true}).click();
  await page.locator('.doc-count').waitFor();
  await page.locator('.doc-shell[aria-busy="false"]').waitFor();
  await page.getByRole('textbox',{name:'Поиск компонентов и пакетов'}).fill('gvfs-utils');
  await page.locator('.doc-card-head').first().click();
  const row=page.locator('tbody tr').filter({has:page.getByRole('button',{name:'gvfs-utils',exact:true})});
  assert.match(await row.locator('td').nth(1).innerText(),/RPM-поставщик не определён/);
  assert.match(await row.locator('td').nth(2).innerText(),/несколько RPM-поставщиков/);
  assert.doesNotMatch(await row.locator('td').nth(2).innerText(),/9\.0-alt1/);
  await page.getByRole('button',{name:'gvfs-utils',exact:true}).click();
  assert.match(await page.getByRole('complementary',{name:'Пакет'}).innerText(),/fixture-provider: 9\.0-alt1/);
  console.log(JSON.stringify({fixture:'ambiguity and incomplete data',result:'passed'}));
  await page.close();

  for (const verification of ['confirmed','wrong-hash','wrong-version','unavailable']) {
    const page=await browser.newPage();
    const baseline=load('image-11.1-x86_64'), current=load('p11-x86_64');
    baseline.packages.cups={...baseline.packages.cups,evr:verification==='confirmed'?'1:2.4.16-alt2':'2.4.16-alt2',hash:'fixture-baseline',epochKnown:verification==='confirmed'};
    delete baseline.packages.cups.epochSource;
    current.packages.cups={...current.packages.cups,evr:'1:2.4.19-alt2'};
    await fixtureRuntime(page,{arch:'x86_64',image:baseline,p11:current});
    // Static baseline fixtures encode the preparation outcome. The browser
    // must never repair/fetch historical epochs while showing a package.
    let historicalRequests=0;
    await page.route('**/api/site/package_changelog/fixture-baseline?changelog_last=1',route=>{
      historicalRequests++; return route.fulfill({status:503});
    });
    await page.route('**/api/site/source_package_versions?*',route=>new URL(route.request().url()).searchParams.get('name')==='alt-components-base'?route.fallback():route.fulfill({json:{request_args:{name:'cups'},versions:[{branch:'p11',version:'2.4.19',release:'alt2',pkghash:'fixture-log'}]}}));
    await page.route('**/api/site/package_changelog/fixture-log?*',route=>route.fulfill({json:{pkghash:'fixture-log',changelog:[
      {evr:'1:2.4.19-alt2',message:'Fixture: update after verified baseline'},
      {evr:'1:2.4.16-alt2',message:'Fixture: baseline'},
    ]}}));
    await page.goto(base);
    await page.getByRole('button',{name:'Компоненты и пакеты',exact:true}).click();
    await page.locator('.doc-count').waitFor();
    await page.locator('.doc-shell[aria-busy="false"]').waitFor();
    await page.getByRole('textbox',{name:'Поиск компонентов и пакетов'}).fill('cups-ppd');
    await page.locator('.doc-card-head').first().click();
    await page.getByRole('button',{name:'cups-ppd',exact:true}).click();
    const panel=page.getByRole('complementary',{name:'Пакет',exact:true});
    await panel.getByText('Fixture: update after verified baseline').waitFor();
    if (verification==='confirmed') {
      assert.match(await panel.locator('.doc-versions').innerText(),/1:2\.4\.16-alt2/);
      assert.doesNotMatch(await panel.innerText(),/предварительн|epoch.*не подтверждён/i);
      const row=page.locator('tbody tr').filter({has:page.getByRole('button',{name:'cups-ppd',exact:true})});
      assert.match(await row.locator('td').nth(1).innerText(),/1:2\.4\.16-alt2/);
      assert.equal((await row.locator('td').nth(4).innerText()).trim(),'обновлён');
    } else {
      assert.match(await panel.innerText(),/Границы changelog предварительные/);
      assert.doesNotMatch(await panel.locator('.doc-versions').innerText(),/1:2\.4\.16-alt2/);
      assert.equal(await panel.getByRole('link',{name:/Источник epoch версии 11.1/}).count(),0);
    }
    console.log(JSON.stringify({fixture:'ISO epoch verification',verification,result:'passed'}));
    assert.equal(historicalRequests,0);
    await page.close();
  }
  // A future p11 catalogue and its definitions are synthetic in this page only.
  for (const mismatch of [false,true]) {
    const page=await browser.newPage({viewport:{width:390,height:900}});
    const future=load('p11-x86_64');
    future.packages['alt-components-base'].evr='0.10.9-alt1';
    future.definitions.tag=mismatch?'0.10.12-alt1':'0.10.9-alt1';
    future.definitions.package={name:'alt-components-base',evr:'0.10.9-alt1',branch:'p11',sourceHash:'fixture-new-source',metadataSource:'fixture:API'};
    delete future.definitions.components.gvfs.packages['gvfs-utils'];
    await fixtureRuntime(page,{arch:'x86_64',p11:future});
    await page.goto(base);
    await page.getByRole('button',{name:'Компоненты и пакеты',exact:true}).click();
    if (mismatch) {
      await page.getByRole('alert').waitFor();
      assert.match(await page.getByRole('alert').innerText(),/Не подтверждён Git-тег/);
      assert.equal(await page.locator('.doc-card').count(),0);
    } else {
      await page.locator('.doc-count').waitFor();
      assert.match(await page.locator('.doc-top').innerText(),/alt-components-base 0\.10\.9-alt1 из снимка p11/);
      const link=page.getByRole('link',{name:'Компоненты 0.10.9-alt1',exact:true});
      assert.match(await link.getAttribute('href'),/\/src\/tag\/0\.10\.9-alt1$/);
      await page.getByRole('textbox',{name:'Поиск компонентов и пакетов'}).fill('gvfs-utils');
      await page.locator('.doc-card-head').first().click();
      const row=page.locator('tbody tr').filter({has:page.getByRole('button',{name:'gvfs-utils',exact:true})});
      assert.match(await row.locator('td').nth(4).innerText(),/исключён из компонента/);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    console.log(JSON.stringify({fixture:'automatic catalogue version',mismatch,result:'passed'}));
    await page.close();
  }
} finally {
  await browser.close();
}
