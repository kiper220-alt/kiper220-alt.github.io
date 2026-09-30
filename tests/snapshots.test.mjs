import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareImageSnapshot, resolvePackage, validP11Definitions } from '../src/doc/model.ts';

const read = (name) => JSON.parse(readFileSync(new URL(`../public/doc-data/${name}.json`, import.meta.url)));

for (const arch of ['x86_64', 'aarch64']) {
  test(`published snapshots are compatible for ${arch}`, () => {
    const image = read(`image-11.1-${arch}`);
    const p11 = read(`p11-${arch}`);
    const sisyphus = read(`sisyphus-${arch}`);
    assert.equal(image.inventoryKind, 'image');
    assert.equal(image.release, '11.1');
    assert.equal(image.definitions.tag, '0.10.3-alt1');
    assert.equal(image.packages['alt-editions-server'].evr, '0.10.3-alt1');
    assert.equal(validP11Definitions(p11),true);
    assert.equal(p11.definitions.tag,p11.packages['alt-components-base'].evr.replace(/^[0-9]+:/,''));
    assert.equal(image.packages['hplip-gui'].evr, '1:3.25.8-alt3');
    assert.equal(image.packages['hplip-gui'].epochKnown, true);
    assert.equal(image.packages['branding-alt-server-gnome-settings'].epochKnown, true);
    assert.equal(sisyphus.branch, 'sisyphus');
    assert.ok(Object.keys(image.packages).length > 3000);
    for (const edition of ['edition_server', 'edition_domain']) {
      const rows = compareImageSnapshot(image, p11, edition);
      assert.ok(rows.length > 100);
      assert.ok(rows.some(row => row.rows.some(pkg => pkg.before && pkg.after)));
      assert.ok(rows.some(row => row.rows.some(pkg => pkg.change === 'нет в образе 11.1')));
      const p7zip = rows.find(row => row.name === 'p7zip');
      assert.equal(p7zip.reason, 'Изменился поставщик RPM');
      assert.equal(p7zip.rows[0].beforeResolution.name, 'p7zip');
      assert.equal(p7zip.rows[0].afterResolution.name, '7-zip');
      assert.equal(p7zip.rows[0].providerChanged, true);
      const hplip = rows.find(row => row.name === 'hplip-gui');
      assert.equal(hplip.rows.find(pkg => pkg.name === 'hplip-gui').change, 'обновлён');
      assert.equal(rows.flatMap(row => row.rows).some(pkg => pkg.name === 'kernel-modules-tripso'), false);
      assert.ok(rows.find(row => row.name === 'kernel-modules-tripso').kernelModules.includes('kernel-modules-tripso'));
      const aliases = {
        'gvfs-utils':'libgio', 'alterator-browser-qt':'alterator-browser-qt6',
        'alterator-pkg':'installer-alterator-pkg', 'kea-shell':'kea-admin',
        'gtk-update-icon-cache':'gtk4-update-icon-cache',
        'gtk2-theme-breeze':'gtk-theme-breeze', 'gtk3-theme-breeze':'gtk-theme-breeze',
        'cups-ppd':'cups', 'tftp-server':'tftp-server-xinetd',
      };
      for (const [alias, actual] of Object.entries(aliases)) {
        assert.equal(image.packages[alias], undefined, `${alias} must not become a fictional ISO binary`);
        const matches = rows.flatMap(row=>row.rows).filter(pkg=>pkg.name===alias);
        assert.ok(matches.length,alias);
        for (const pkg of matches) {
          assert.equal(pkg.beforeResolution.kind,'provided',alias);
          assert.equal(pkg.beforeResolution.name,actual,alias);
          assert.equal(pkg.afterResolution.name,actual,alias);
          assert.equal(pkg.before.evr,image.packages[actual].evr,alias);
          assert.ok(['обновлён','без изменений','исключён из компонента'].includes(pkg.change),alias);
        }
        assert.notEqual(resolvePackage(sisyphus,alias).kind,'missing',alias);
      }
    }
  });
}
